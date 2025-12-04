import { Summary, QuestionResult, LearningResource, RadarData } from '../types/question.js';
import { callGeminiAPI, parseLLMJSON, callGeminiAPIWithGrounding } from './llmService.js';
import { getSummaryTemplate } from './promptTemplates.js';
import { getLearningResourcesForConcepts } from './resourceLibrary.js';

/**
 * 根据概念名称生成友好的类别名称
 */
function getCategoryName(concept: string): string {
  // 提取主要概念名称（去掉后缀）
  const mainConcept = concept.split('_')[0];
  
  // 将概念名称转换为友好的显示名称
  const nameMap: Record<string, string> = {
    'LLM': 'LLM Basics',
    'prompt': 'Prompt Engineering',
    'deep': 'Deep Learning',
    'neural': 'Neural Networks',
    'machine': 'Machine Learning',
    'RAG': 'RAG',
    'embedding': 'Embeddings',
    'vector': 'Vector DB',
    'semantic': 'Semantic Search',
    'transformer': 'Transformer',
    'self': 'Self-Attention',
    'context': 'Context Window',
    'token': 'Tokenization',
    'finetuning': 'Fine-tuning',
    'fine': 'Fine-tuning',
    'responsible': 'Responsible AI',
    'AI': 'AI Safety',
  };
  
  // 查找匹配的名称
  for (const [key, value] of Object.entries(nameMap)) {
    if (mainConcept.toLowerCase().startsWith(key.toLowerCase())) {
      return value;
    }
  }
  
  // 如果没有匹配，使用概念名称的首字母大写形式
  return mainConcept.charAt(0).toUpperCase() + mainConcept.slice(1).replace(/_/g, ' ');
}

/**
 * 生成雷达图数据 - 根据实际答题情况动态生成维度（最多6个）
 */
function generateRadarData(results: QuestionResult[]): RadarData {
  if (results.length === 0) {
    return { categories: [], scores: [] };
  }
  
  // 按概念分组结果
  const conceptScores: Record<string, { correct: number; total: number; concepts: string[] }> = {};
  
  results.forEach(result => {
    const concept = result.concept;
    if (!conceptScores[concept]) {
      conceptScores[concept] = { correct: 0, total: 0, concepts: [] };
    }
    conceptScores[concept].total++;
    conceptScores[concept].concepts.push(concept);
    
    // 计算得分：correct=100, partial=50, incorrect=0
    if (result.result === 'correct') {
      conceptScores[concept].correct += 100;
    } else if (result.result === 'partial') {
      conceptScores[concept].correct += 50;
    }
  });
  
  // 计算每个概念的平均得分
  const conceptData = Object.entries(conceptScores).map(([concept, data]) => ({
    concept,
    score: data.total > 0 ? Math.round(data.correct / data.total) : 0,
    total: data.total,
  }));
  
  // 按得分排序，选择最重要的概念（最多6个）
  // 优先选择有答题记录的概念，然后按得分排序
  const sortedConcepts = conceptData
    .sort((a, b) => {
      // 首先按答题数量排序（答题多的优先）
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      // 然后按得分排序
      return b.score - a.score;
    })
    .slice(0, 6); // 最多6个维度
  
  // 生成类别名称和得分
  const categories: string[] = [];
  const scores: number[] = [];
  
  sortedConcepts.forEach(item => {
    const categoryName = getCategoryName(item.concept);
    categories.push(categoryName);
    scores.push(item.score);
  });
  
  return { categories, scores };
}

/**
 * 使用LLM批量评估所有题目的掌握程度（0-100分）- 优化版本：一次调用评估所有题目
 */
async function evaluateAllQuestionsMastery(results: QuestionResult[], questions: any[]): Promise<number[]> {
  if (results.length === 0) return [];
  
  // 创建question map以便快速查找
  const questionMap = new Map<string, any>();
  questions.forEach(q => {
    questionMap.set(q.concept, q);
  });
  
  // 准备所有题目的评估数据
  const evaluationData = results.map((result, index) => {
    const question = questionMap.get(result.concept);
    return {
      index: index + 1,
      concept: result.concept,
      type: result.type,
      question: question || null,
      userAnswer: result.userAnswer,
      correctAnswer: result.correctAnswer,
      initialAssessment: result.result,
    };
  });
  
  // 构建批量评估prompt
  const batchEvaluationPrompt = `
You are an AI literacy education expert. Please evaluate the user's mastery level for ALL questions based on their answers.

**TASK**: Evaluate each question and provide a mastery score (0-100) for each one.

Questions to evaluate:
${evaluationData.map((item, i) => `
Question ${item.index}:
- Concept: ${item.concept}
- Type: ${item.type}
- Question: ${JSON.stringify(item.question, null, 2)}
- User's Answer: ${JSON.stringify(item.userAnswer, null, 2)}
- Correct Answer: ${JSON.stringify(item.correctAnswer, null, 2)}
- Initial Assessment: ${item.initialAssessment} (correct/partial/incorrect)
`).join('\n---\n')}

**CRITICAL**: You must provide a nuanced, concept-based evaluation for EACH question that considers:
1. The depth of understanding demonstrated (not just correctness)
2. The quality of reasoning and explanation (for short answers)
3. The completeness of matching/categorization (for match/bucket questions)
4. The accuracy of conceptual understanding (for all question types)

For different question types:
- **Short Answer**: Evaluate based on how well key points are covered, depth of explanation, and conceptual accuracy
- **Match/Bucket**: Evaluate based on accuracy and completeness of associations
- **MCQ/Discernment**: Evaluate based on correctness and reasoning quality

**OUTPUT FORMAT**: Output ONLY a JSON object with an array of mastery scores:
{
  "masteryScores": [
    <number between 0 and 100 for Question 1>,
    <number between 0 and 100 for Question 2>,
    ...
  ]
}

Where each masteryScore represents:
- 0-30: Poor understanding, major misconceptions
- 31-50: Partial understanding, some gaps
- 51-70: Good understanding, minor gaps
- 71-85: Strong understanding, solid grasp
- 86-100: Excellent understanding, comprehensive mastery

**IMPORTANT**: 
- The array must have exactly ${results.length} scores, one for each question
- Scores must be in the same order as the questions listed above
- Output only JSON, no other text
`;

  try {
    console.log(`🧠 Batch evaluating mastery for ${results.length} questions using single LLM call...`);
    const response = await callGeminiAPI({
      prompt: batchEvaluationPrompt,
      temperature: 0.3,
      maxTokens: 2048, // 增加token限制以支持批量评估
    });

    if (response.error || !response.content) {
      console.warn(`⚠️ Batch evaluation failed, will fallback to individual evaluation`);
      throw new Error('Batch evaluation failed');
    }

    const evaluation = parseLLMJSON<{ masteryScores: number[] }>(response.content);
    if (evaluation && Array.isArray(evaluation.masteryScores) && evaluation.masteryScores.length === results.length) {
      // 验证并修正分数范围
      const scores = evaluation.masteryScores.map(score => Math.max(0, Math.min(100, score)));
      console.log(`✅ Batch evaluation successful! Scores: ${scores.map(s => s.toFixed(0)).join(', ')}`);
      return scores;
    }

    console.warn(`⚠️ Batch evaluation returned invalid format, will fallback to individual evaluation`);
    throw new Error('Invalid batch evaluation format');
  } catch (error: any) {
    console.warn(`⚠️ Batch evaluation failed: ${error.message}, falling back to individual evaluation`);
    // Fallback: 返回null，让调用者使用逐个评估
    throw error;
  }
}

/**
 * 使用LLM评估每道题的掌握程度（0-100分）- 单个题目版本（作为fallback）
 */
async function evaluateQuestionMastery(questionResult: QuestionResult, question: any): Promise<number> {
  const { concept, type, userAnswer, correctAnswer, result } = questionResult;
  
  // 构建评估prompt
  const evaluationPrompt = `
You are an AI literacy education expert. Please evaluate the user's mastery level for a specific question based on their answer.

Question Type: ${type}
Concept: ${concept}
Question: ${JSON.stringify(question, null, 2)}
User's Answer: ${JSON.stringify(userAnswer, null, 2)}
Correct Answer: ${JSON.stringify(correctAnswer, null, 2)}
Initial Assessment: ${result} (correct/partial/incorrect)

**CRITICAL**: You must provide a nuanced, concept-based evaluation that considers:
1. The depth of understanding demonstrated (not just correctness)
2. The quality of reasoning and explanation (for short answers)
3. The completeness of matching/categorization (for match/bucket questions)
4. The accuracy of conceptual understanding (for all question types)

For different question types:
- **Short Answer**: Evaluate based on how well key points are covered, depth of explanation, and conceptual accuracy
- **Match/Bucket**: Evaluate based on accuracy and completeness of associations
- **MCQ/Discernment**: Evaluate based on correctness and reasoning quality

Output ONLY a JSON object with a single field:
{
  "masteryScore": <number between 0 and 100>
}

Where masteryScore represents:
- 0-30: Poor understanding, major misconceptions
- 31-50: Partial understanding, some gaps
- 51-70: Good understanding, minor gaps
- 71-85: Strong understanding, solid grasp
- 86-100: Excellent understanding, comprehensive mastery

Output only JSON, no other text.
`;

  try {
    const response = await callGeminiAPI({
      prompt: evaluationPrompt,
      temperature: 0.3,
      maxTokens: 512,
    });

    if (response.error || !response.content) {
      console.warn(`⚠️ Failed to evaluate mastery for question ${concept}, using fallback based on result`);
      // Fallback: 基于result映射
      if (result === 'correct') return 80;
      if (result === 'partial') return 50;
      return 20;
    }

    const evaluation = parseLLMJSON<{ masteryScore: number }>(response.content);
    if (evaluation && typeof evaluation.masteryScore === 'number') {
      // 确保分数在0-100范围内
      const score = Math.max(0, Math.min(100, evaluation.masteryScore));
      console.log(`📊 Question ${concept} mastery score: ${score}`);
      return score;
    }

    // Fallback
    console.warn(`⚠️ Failed to parse mastery evaluation for ${concept}, using fallback`);
    if (result === 'correct') return 80;
    if (result === 'partial') return 50;
    return 20;
  } catch (error: any) {
    console.error(`❌ Error evaluating mastery for ${concept}:`, error.message);
    // Fallback
    if (result === 'correct') return 80;
    if (result === 'partial') return 50;
    return 20;
  }
}

/**
 * 计算systemLevel（1-5）基于LLM评估的掌握程度
 * 优化：优先使用批量评估（一次LLM调用），失败时fallback到逐个评估
 */
async function calculateSystemLevel(results: QuestionResult[], questions: any[] = []): Promise<number> {
  if (results.length === 0) return 1;
  
  // 创建question map以便快速查找
  const questionMap = new Map<string, any>();
  questions.forEach(q => {
    questionMap.set(q.concept, q);
  });
  
  let masteryScores: number[] = [];
  
  // 优先尝试批量评估（一次LLM调用评估所有题目）
  try {
    masteryScores = await evaluateAllQuestionsMastery(results, questions);
    console.log(`✅ Successfully used batch evaluation (1 LLM call for ${results.length} questions)`);
  } catch (error: any) {
    // 批量评估失败，fallback到逐个评估
    console.log(`⚠️ Batch evaluation failed, falling back to individual evaluation (${results.length} LLM calls)...`);
    masteryScores = [];
    
    for (const result of results) {
      const question = questionMap.get(result.concept);
      if (question) {
        const score = await evaluateQuestionMastery(result, question);
        masteryScores.push(score);
      } else {
        // 如果没有找到题目，使用fallback
        console.warn(`⚠️ Question not found for concept ${result.concept}, using fallback`);
        if (result.result === 'correct') masteryScores.push(80);
        else if (result.result === 'partial') masteryScores.push(50);
        else masteryScores.push(20);
      }
    }
  }
  
  // 确保scores数组长度正确
  if (masteryScores.length !== results.length) {
    console.warn(`⚠️ Mastery scores count mismatch (${masteryScores.length} vs ${results.length}), using fallback`);
    masteryScores = results.map(r => {
      if (r.result === 'correct') return 80;
      if (r.result === 'partial') return 50;
      return 20;
    });
  }
  
  // 计算平均掌握程度
  const averageMastery = masteryScores.reduce((sum, score) => sum + score, 0) / masteryScores.length;
  console.log(`📊 Average mastery score: ${averageMastery.toFixed(1)}/100`);
  console.log(`📊 Individual scores: ${masteryScores.map(s => s.toFixed(0)).join(', ')}`);
  
  // 映射到1-5级别（基于平均掌握程度）
  if (averageMastery <= 20) return 1;
  if (averageMastery <= 40) return 2;
  if (averageMastery <= 65) return 3;
  if (averageMastery <= 85) return 4;
  return 5;
}

/**
 * 生成最终总结（带检索功能）
 */
export async function generateSummary(results: QuestionResult[], selfRating?: number, questions: any[] = []): Promise<Summary> {
  // 准备详细的结果数据
  const summaryData = results.map(r => ({
    concept: r.concept,
    type: r.type,
    result: r.result,
    userAnswer: r.userAnswer,
    correctAnswer: r.correctAnswer,
  }));
  
  const prompt = getSummaryTemplate(summaryData);
  
  // 使用thinking模式或Pro模型生成总结（更深入的分析）
  console.log('🧠 Generating comprehensive diagnostic report...');
  console.log('📊 Results to analyze:', results.length, 'questions');
  console.log('📊 Prompt length:', prompt.length, 'characters');
  
  let llmResponse;
  let modelUsed = 'gemini-2.0-flash';
  
  // 统一使用 Gemini 2.0 Flash 模型
  try {
    console.log('📊 Using Gemini 2.0 Flash for analysis...');
    llmResponse = await callGeminiAPI({
      prompt,
      temperature: 0.7,
      maxTokens: 8192,
    });
    console.log('✅ Gemini 2.0 Flash response received, length:', llmResponse.content?.length || 0);
  } catch (flashError: any) {
    console.warn('⚠️ Gemini 2.0 Flash failed, trying Flash with grounding...', flashError.message);
    try {
      // 降级到带检索的Flash（至少能引用网络资源）
      console.log('📊 Using Flash model with grounding for analysis...');
      llmResponse = await callGeminiAPIWithGrounding({
        prompt,
        temperature: 0.7,
        maxTokens: 8192,
      });
      modelUsed = 'flash-with-grounding';
      console.log('✅ Flash model with grounding response received, length:', llmResponse.content?.length || 0);
    } catch (groundingError: any) {
      console.error('❌ All models failed:', groundingError.message);
      throw new Error(`Failed to generate summary: All model attempts failed. Last error: ${groundingError.message}`);
    }
  }
  
  console.log(`✅ Summary generated using ${modelUsed} model`);
  
  if (llmResponse.error || !llmResponse.content) {
    console.error('❌ LLM调用失败:', llmResponse.error);
    console.error('LLM响应内容:', llmResponse.content?.substring(0, 500));
    // NO FALLBACK - throw error
    throw new Error(`Failed to generate summary: ${llmResponse.error || 'LLM did not return content'}`);
  }
  
  console.log('📄 LLM返回内容预览:', llmResponse.content.substring(0, 300));
  
  const summary = parseLLMJSON<Summary>(llmResponse.content);
  
  if (!summary) {
    console.error('❌ 解析LLM返回的JSON失败');
    console.error('原始内容:', llmResponse.content.substring(0, 1000));
    // NO FALLBACK - throw error
    throw new Error('Failed to parse LLM summary response. LLM did not return valid JSON.');
  }
  
  console.log('✅ LLM总结解析成功');
  console.log('总结内容预览:', {
    overall: summary.overall?.substring(0, 100),
    highlightsType: Array.isArray(summary.highlights) ? 'array' : typeof summary.highlights,
    highlightsCount: Array.isArray(summary.highlights) ? summary.highlights.length : 'N/A',
    highlightsSample: Array.isArray(summary.highlights) && summary.highlights.length > 0 
      ? (typeof summary.highlights[0] === 'string' ? summary.highlights[0].substring(0, 50) : JSON.stringify(summary.highlights[0]).substring(0, 50))
      : 'N/A',
    blindspotsType: Array.isArray(summary.blindspots) ? 'array' : typeof summary.blindspots,
    blindspotsCount: Array.isArray(summary.blindspots) ? summary.blindspots.length : 'N/A',
    blindspotsSample: Array.isArray(summary.blindspots) && summary.blindspots.length > 0
      ? (typeof summary.blindspots[0] === 'string' ? summary.blindspots[0].substring(0, 50) : JSON.stringify(summary.blindspots[0]).substring(0, 50))
      : 'N/A',
    hasDetailedAnalysis: !!summary.detailedAnalysis,
  });
  
  // 确保highlights和blindspots是字符串数组
  if (summary.highlights && Array.isArray(summary.highlights)) {
    summary.highlights = summary.highlights.map((item: any) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        // 如果是对象，尝试提取title或text字段，或者转换为字符串
        return item.title || item.text || item.message || JSON.stringify(item);
      }
      return String(item);
    });
  }
  
  if (summary.blindspots && Array.isArray(summary.blindspots)) {
    summary.blindspots = summary.blindspots.map((item: any) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        // 如果是对象，尝试提取title或text字段，或者转换为字符串
        return item.title || item.text || item.message || JSON.stringify(item);
      }
      return String(item);
    });
  }
  
  if (summary.suggestions && Array.isArray(summary.suggestions)) {
    summary.suggestions = summary.suggestions.map((item: any) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        return item.title || item.text || item.message || JSON.stringify(item);
      }
      return String(item);
    });
  }
  
  // 总是从资源库中获取学习资源（覆盖LLM返回的，因为资源库更可靠）
  console.log('📚 从资源库中获取学习资源...');
  try {
    const weakConcepts = results
      .filter(r => r.result === 'incorrect' || r.result === 'partial')
      .map(r => r.concept);
    
    console.log(`薄弱概念: ${weakConcepts.join(', ')}`);
    
    if (weakConcepts.length > 0) {
      summary.learningResources = getLearningResourcesForConcepts(weakConcepts);
      console.log(`✅ 学习资源获取完成，共 ${summary.learningResources.length} 个`);
      summary.learningResources.forEach((r, i) => {
        console.log(`  资源 ${i + 1}: ${r.title} - ${r.url}`);
      });
    } else {
      console.log('⚠️ 没有薄弱概念，不生成学习资源');
      summary.learningResources = [];
    }
  } catch (err) {
    console.error('❌ 获取学习资源失败:', err);
    summary.learningResources = [];
  }
  
  // 雷达图数据应该由LLM生成，但如果LLM没有生成，则计算一个
  if (!summary.radarData || !summary.radarData.categories || summary.radarData.categories.length === 0) {
    console.warn('⚠️ LLM did not generate radarData, calculating from results...');
    summary.radarData = generateRadarData(results);
  } else {
    console.log('✅ Using LLM-generated radarData:', summary.radarData);
  }
  
  // 计算systemLevel并添加到summary
  const systemLevel = await calculateSystemLevel(results, questions);
  summary.systemLevel = systemLevel;
  
  // 如果有selfRating，也添加到summary
  if (selfRating !== undefined) {
    summary.selfRating = selfRating;
  }
  
  return validateAndEnhanceSummary(summary, results);
}

/**
 * 验证并增强总结
 */
function validateAndEnhanceSummary(summary: Summary, results: QuestionResult[]): Summary {
  // 校验基本字段 - 如果缺失，抛出错误而不是fallback
  if (!summary.overall || !Array.isArray(summary.highlights) || !Array.isArray(summary.blindspots)) {
    throw new Error('LLM summary is missing required fields (overall, highlights, or blindspots)');
  }
  
  // 确保有详细分析 - 如果缺失，抛出错误
  if (!summary.detailedAnalysis || summary.detailedAnalysis.trim().length < 100) {
    throw new Error('LLM summary detailedAnalysis is missing or too short');
  }
  
  return summary;
}

/**
 * 生成学习资源推荐（使用检索功能）
 * 导出以便在路由中使用
 */
export async function generateLearningResources(results: QuestionResult[]): Promise<LearningResource[]> {
  const incorrectConcepts = results
    .filter(r => r.result === 'incorrect' || r.result === 'partial')
    .map(r => r.concept);
  
  if (incorrectConcepts.length === 0) {
    return [];
  }
  
  // 构建更详细的搜索提示
  const conceptDetails = results
    .filter(r => r.result === 'incorrect' || r.result === 'partial')
    .map(r => {
      let detail = `Concept: ${r.concept}`;
      if (r.result === 'partial') {
        detail += ' (partial understanding, needs deepening)';
      } else {
        detail += ' (complete misunderstanding, needs systematic learning)';
      }
      return detail;
    })
    .join('\n');
  
  const prompt = `
You are a learning resource recommendation expert. The user needs to learn the following AI literacy concepts:

${conceptDetails}

**IMPORTANT TASK**: Use web search functionality to find 3-5 specific, real, high-quality learning resources.

**Search Priority (MUST FOLLOW)**:
1. **Prioritize YouTube videos**: Search for specific YouTube videos, must be youtube.com/watch?v=VIDEO_ID format
2. **Prioritize English professional blogs**: Medium, Towards Data Science, Distill, Google AI Blog, OpenAI Blog, etc.
3. Secondary options: Bilibili videos, Zhihu articles (only if English resources are not available)

**Key Requirements**:
1. Must use web search to find real, specific resource links
2. Cannot return search links (e.g., youtube.com/results?search_query=xxx)
3. Must return specific resource links:
   - YouTube videos: Must be youtube.com/watch?v=VIDEO_ID format (priority)
   - English blogs: Must be specific article URLs, e.g., medium.com/@author/article-title or towardsdatascience.com/article-title
   - Bilibili videos: Must be bilibili.com/video/BVxxx format
   - Zhihu articles: Must be zhuanlan.zhihu.com/p/xxx format
4. Each resource must include: title, specific URL, type, detailed description

**Output Format (STRICTLY FOLLOW)**:
Output only JSON format, no other text. Direct output:

{
  "resources": [
    {
      "title": "Specific title of the resource (real title from search results)",
      "url": "Complete resource link (must use real URL from search results, cannot use redirect links like vertexaisearch.cloud.google.com/grounding-api-redirect)",
      "type": "article|blog|video|course",
      "description": "What this resource covers and why it's recommended for the user (3-4 sentences, specifically explain: 1. Main content of the resource 2. Why it fits the user's current level 3. What the user can learn from it)"
    }
  ]
}

**Important**:
- Must use real URLs returned by search functionality, cannot use redirect links
- YouTube video URLs must be complete youtube.com/watch?v=VIDEO_ID format, VIDEO_ID must be 11 characters
- All URLs must be real and accessible, cannot be placeholders or example links

**Prohibited**:
- Do not return search links
- Do not return website homepages
- Do not return non-existent links
- Do not use placeholders (e.g., xxx)
- Do not add any text before or after JSON
- Do not use Chinese websites as primary resources (unless no English resources available)

**Search Strategy**:
1. For each concept, prioritize searching for specific videos on YouTube
2. Search for specific articles on English professional blogs (Medium, Towards Data Science, etc.)
3. Select the most relevant and specific resource links from search results
4. Ensure each link is a directly accessible specific resource

Start searching now, output only JSON format, no other text.
`;
  
  try {
    // 使用检索功能搜索学习资源
    console.log('🔍 使用检索功能搜索具体的学习资源...');
    const response = await callGeminiAPIWithGrounding({
      prompt,
      temperature: 0.7,
      maxTokens: 4096,
    });
    
    if (response.error || !response.content) {
      console.warn('⚠️ 检索功能失败，无法生成学习资源');
      return [];
    }
    
    // 从grounding chunks中提取真实URL（优先使用）
    const realUrls = new Map<string, string>(); // url -> title
    const resourcesFromChunks: LearningResource[] = [];
    
    if (response.groundingChunks && response.groundingChunks.length > 0) {
      for (const chunk of response.groundingChunks) {
        if (chunk.web?.uri) {
          const url = chunk.web.uri;
          const title = chunk.web.title || '';
          // 过滤掉重定向链接
          if (!url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')) {
            realUrls.set(url, title);
            
            // 直接从chunks构建资源（如果URL有效）
            try {
              const urlObj = new URL(url);
              const pathname = urlObj.pathname;
              
              // 确保不是首页
              if (pathname !== '/' && pathname !== '') {
                // 判断资源类型
                let resourceType: 'article' | 'blog' | 'video' | 'course' = 'article';
                if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                  // 验证YouTube视频ID
                  let videoId = '';
                  if (urlObj.hostname.includes('youtu.be')) {
                    videoId = urlObj.pathname.substring(1);
                  } else {
                    videoId = urlObj.searchParams.get('v') || '';
                  }
                  if (videoId.length === 11) {
                    resourceType = 'video';
                  } else {
                    continue; // 跳过不完整的YouTube链接
                  }
                } else if (urlObj.hostname.includes('bilibili.com')) {
                  resourceType = 'video';
                } else if (urlObj.hostname.includes('medium.com') || 
                          urlObj.hostname.includes('towardsdatascience.com') ||
                          urlObj.hostname.includes('blog') ||
                          urlObj.hostname.includes('zhuanlan.zhihu.com')) {
                  resourceType = 'blog';
                }
                
                resourcesFromChunks.push({
                  title: title || 'Learning Resource',
                  url: url,
                  type: resourceType,
                  description: `Learning resource about ${title || 'related topic'}`,
                });
              }
            } catch {
              // 跳过无效URL
            }
          }
        }
      }
      console.log(`🔗 从检索结果中提取到 ${realUrls.size} 个真实URL`);
      console.log(`📚 从chunks直接构建了 ${resourcesFromChunks.length} 个资源`);
    }
    
    const data = parseLLMJSON<{ resources: LearningResource[] }>(response.content);
    let resourcesFromLLM: LearningResource[] = [];
    
    if (data && data.resources && Array.isArray(data.resources) && data.resources.length > 0) {
      // 验证资源格式，并过滤掉无效链接
      resourcesFromLLM = data.resources
        .filter(r => {
          if (!r.title || !r.url || !r.type || !r.description) {
            console.warn(`⚠️ 资源格式不完整:`, r);
            return false;
          }
          
          // 过滤掉重定向链接
          if (r.url.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')) {
            console.warn(`⚠️ 过滤掉重定向链接: ${r.url}`);
            return false;
          }
          
          // 严格过滤掉搜索链接和无效链接
          const urlLower = r.url.toLowerCase();
          if (
            urlLower.includes('search?') || 
            urlLower.includes('results?search_query') ||
            urlLower.includes('search_query') ||
            urlLower.includes('/search') ||
            urlLower.includes('google.com/search') ||
            urlLower.includes('youtube.com/results')
          ) {
            console.warn(`⚠️ 过滤掉搜索链接: ${r.url}`);
            return false;
          }
          
          // 验证URL格式
          try {
            const urlObj = new URL(r.url);
            
            // 确保是具体的资源链接，不是首页
            const pathname = urlObj.pathname;
            if (pathname === '/' || pathname === '') {
              console.warn(`⚠️ 过滤掉首页链接: ${r.url}`);
              return false;
            }
            
            // 验证YouTube视频ID（必须是11个字符）
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
              let videoId = '';
              if (urlObj.hostname.includes('youtu.be')) {
                videoId = urlObj.pathname.substring(1);
              } else {
                videoId = urlObj.searchParams.get('v') || '';
              }
              if (videoId.length !== 11) {
                console.warn(`⚠️ YouTube视频ID不完整（${videoId.length}个字符）: ${r.url}`);
                return false;
              }
            }
            
            return true;
          } catch {
            console.warn(`⚠️ 无效的URL格式: ${r.url}`);
            return false;
          }
        })
        .map(r => {
          // 如果grounding chunks中有这个URL，使用真实的标题
          const realTitle = realUrls.get(r.url);
          return {
            ...r,
            title: realTitle || r.title,
            description: r.description || `Learning resource about ${r.title}`,
          };
        });
    }
    
    // 合并资源：优先使用从chunks直接提取的资源，然后添加LLM返回的有效资源
    const allResources: LearningResource[] = [];
    const addedUrls = new Set<string>();
    
    // 先添加从chunks直接提取的资源（这些是真实可访问的）
    for (const resource of resourcesFromChunks) {
      if (!addedUrls.has(resource.url)) {
        allResources.push(resource);
        addedUrls.add(resource.url);
      }
    }
    
    // 然后添加LLM返回的有效资源（如果URL不重复）
    for (const resource of resourcesFromLLM) {
      if (!addedUrls.has(resource.url)) {
        allResources.push(resource);
        addedUrls.add(resource.url);
      }
    }
    
    if (allResources.length > 0) {
      console.log(`✅ 成功生成 ${allResources.length} 个有效的学习资源`);
      console.log('资源列表:', allResources.map(r => `${r.title}: ${r.url}`).join('\n'));
      return allResources.slice(0, 5); // 最多返回5个
    } else {
      console.warn('⚠️ 无法生成任何有效资源');
      if (response.content) {
        console.warn('LLM返回内容:', response.content.substring(0, 500));
      }
    }
  } catch (error) {
    console.error('生成学习资源失败:', error);
  }
  
  // 检索失败，直接返回空数组（不使用预设资源库）
  console.warn('⚠️ 检索功能无法生成有效资源，返回空数组');
  return [];
}


/**
 * 生成默认分析（英文）
 */
function generateDefaultAnalysis(results: QuestionResult[]): string {
  const correctCount = results.filter(r => r.result === 'correct').length;
  const total = results.length;
  const correctRate = correctCount / total;
  
  const incorrectConcepts = results
    .filter(r => r.result === 'incorrect')
    .map(r => r.concept);
  
  let analysis = '';
  
  if (correctRate >= 0.8) {
    analysis = `Your AI literacy foundation is solid, with good understanding of core concepts.`;
  } else if (correctRate >= 0.5) {
    analysis = `You have some understanding of AI-related concepts, but need to strengthen certain areas.`;
  } else {
    analysis = `It is recommended that you systematically learn AI-related fundamental concepts, starting from core terminology.`;
  }
  
  if (incorrectConcepts.length > 0) {
    const conceptNames = incorrectConcepts.map(c => getCategoryName(c)).join(', ');
    analysis += ` Concepts that require special attention include: ${conceptNames}. These concepts are very important in practical applications and should be studied thoroughly.`;
  }
  
  return analysis;
}

/**
 * 降级总结（当LLM调用失败时）- 全英文
 */
export function generateFallbackSummary(results: QuestionResult[]): Summary {
  const correctCount = results.filter(r => r.result === 'correct').length;
  const total = results.length;
  const correctRate = correctCount / total;
  
  const correctConcepts = results
    .filter(r => r.result === 'correct')
    .map(r => getCategoryName(r.concept));
  const incorrectConcepts = results
    .filter(r => r.result === 'incorrect')
    .map(r => getCategoryName(r.concept));
  
  let overall = '';
  if (correctRate >= 0.8) {
    overall = 'You have a solid foundation in AI concepts with good understanding of key terminology.';
  } else if (correctRate >= 0.5) {
    overall = 'You have some understanding but need to clarify core concepts and their relationships.';
  } else {
    overall = 'A systematic review of fundamental AI concepts is needed. Start with core terminology and basic principles.';
  }
  
  return {
    overall,
    highlights: correctConcepts.length > 0 
      ? [`You have mastered: ${correctConcepts.slice(0, 2).join(', ')}`]
      : ['Keep up the good work!'],
    blindspots: incorrectConcepts.length > 0
      ? [`Need to strengthen: ${incorrectConcepts.slice(0, 2).join(', ')}`]
      : ['More practice recommended'],
    suggestions: [
      'Review visual diagrams explaining the differences between related concepts',
      'Try applying these concepts in practical scenarios to deepen understanding',
    ],
    detailedAnalysis: generateDefaultAnalysis(results),
    learningResources: (() => {
      // 确保fallback也有学习资源
      const weakConcepts = results
        .filter(r => r.result === 'incorrect' || r.result === 'partial')
        .map(r => r.concept);
      if (weakConcepts.length > 0) {
        return getLearningResourcesForConcepts(weakConcepts);
      }
      return [];
    })(),
    radarData: generateRadarData(results),
  };
}
