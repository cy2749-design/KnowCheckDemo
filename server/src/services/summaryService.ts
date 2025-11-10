import { Summary, QuestionResult, LearningResource } from '../types/question.js';
import { callGeminiAPI, parseLLMJSON, callGeminiAPIWithGrounding } from './llmService.js';
import { getSummaryTemplate } from './promptTemplates.js';
import { getLearningResourcesForConcepts } from './resourceLibrary.js';

/**
 * 生成最终总结（带检索功能）
 */
export async function generateSummary(results: QuestionResult[]): Promise<Summary> {
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
  console.log('🧠 使用思考模式生成诊断报告...');
  let llmResponse;
  try {
    // 优先尝试thinking模式
    llmResponse = await callGeminiAPI({
      prompt,
      temperature: 0.7,
      maxTokens: 4096, // 增加token数以支持更详细的总结
      useThinking: true,
      model: 'thinking',
    });
  } catch (error) {
    console.warn('⚠️ Thinking模式不可用，尝试Pro模型...', error);
    try {
      // 降级到Pro模型
      llmResponse = await callGeminiAPI({
        prompt,
        temperature: 0.7,
        maxTokens: 4096,
        model: 'pro',
      });
    } catch (proError) {
      console.warn('⚠️ Pro模型不可用，使用带检索的Flash模型...', proError);
      // 最后降级到带检索的Flash
      llmResponse = await callGeminiAPIWithGrounding({
        prompt,
        temperature: 0.7,
        maxTokens: 4096,
      });
    }
  }
  
  if (llmResponse.error || !llmResponse.content) {
    return generateFallbackSummary(results);
  }
  
  const summary = parseLLMJSON<Summary>(llmResponse.content);
  
  if (!summary) {
    return generateFallbackSummary(results);
  }
  
  // 生成学习资源（从资源库中获取）
  if (!summary.learningResources || summary.learningResources.length === 0) {
    console.log('📚 从资源库中获取学习资源...');
    try {
      const weakConcepts = results
        .filter(r => r.result === 'incorrect' || r.result === 'partial')
        .map(r => r.concept);
      
      if (weakConcepts.length > 0) {
        summary.learningResources = getLearningResourcesForConcepts(weakConcepts);
        console.log(`✅ 学习资源获取完成，共 ${summary.learningResources.length} 个`);
      } else {
        summary.learningResources = [];
      }
    } catch (err) {
      console.error('获取学习资源失败:', err);
      summary.learningResources = [];
    }
  }
  
  return validateAndEnhanceSummary(summary, results);
}

/**
 * 验证并增强总结
 */
function validateAndEnhanceSummary(summary: Summary, results: QuestionResult[]): Summary {
  // 校验基本字段
  if (!summary.overall || !Array.isArray(summary.highlights) || !Array.isArray(summary.blindspots)) {
    return generateFallbackSummary(results);
  }
  
  // 确保有详细分析
  if (!summary.detailedAnalysis) {
    summary.detailedAnalysis = generateDefaultAnalysis(results);
  }
  
  // 学习资源必须从检索中获取，不设置默认值
  
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
      let detail = `概念：${r.concept}`;
      if (r.result === 'partial') {
        detail += '（部分理解，需要加深）';
      } else {
        detail += '（完全误解，需要系统学习）';
      }
      return detail;
    })
    .join('\n');
  
  const prompt = `
你是一个学习资源推荐专家。用户需要学习以下AI素养概念：

${conceptDetails}

**重要任务**：使用网络搜索功能，找到3-5个具体、真实、高质量的学习资源。

**搜索优先级（必须遵守）**：
1. **优先搜索YouTube视频**：搜索具体的YouTube视频，必须是 youtube.com/watch?v=VIDEO_ID 格式
2. **优先搜索英文专业博客**：如 Medium、Towards Data Science、Distill、Google AI Blog、OpenAI Blog 等
3. 其次可以考虑：B站视频、知乎文章（如果中文资源更适合）

**关键要求**：
1. 必须使用网络搜索找到真实的、具体的资源链接
2. 不能返回搜索链接（如 youtube.com/results?search_query=xxx）
3. 必须返回具体的资源链接：
   - YouTube视频：必须是 youtube.com/watch?v=VIDEO_ID 格式（优先）
   - 英文博客：必须是具体的文章URL，如 medium.com/@author/article-title 或 towardsdatascience.com/article-title
   - B站视频：必须是 bilibili.com/video/BVxxx 格式
   - 知乎文章：必须是 zhuanlan.zhihu.com/p/xxx 格式
4. 每个资源必须包含：标题、具体URL、类型、详细说明

**输出格式（必须严格遵守）**：
只输出JSON格式，不要有任何其他文字说明。直接输出：

{
  "resources": [
    {
      "title": "资源的具体标题（从检索结果中获取的真实标题）",
      "url": "完整的资源链接（必须使用检索结果中的真实URL，不能使用重定向链接如vertexaisearch.cloud.google.com/grounding-api-redirect）",
      "type": "article|blog|video|course",
      "description": "这个资源讲什么内容，为什么推荐给用户（3-4句话，要具体说明：1. 资源的主要内容 2. 为什么适合用户当前的水平 3. 用户能从中学到什么）"
    }
  ]
}

**重要**：
- 必须使用检索功能返回的真实URL，不能使用重定向链接
- YouTube视频URL必须是完整的 youtube.com/watch?v=VIDEO_ID 格式，VIDEO_ID必须是11个字符
- 所有URL必须是真实可访问的，不能是占位符或示例链接

**禁止事项**：
- 禁止返回搜索链接
- 禁止返回网站首页
- 禁止返回不存在的链接
- 禁止使用占位符（如 xxx）
- 禁止在JSON前后添加任何文字说明
- 禁止使用中文网站作为主要资源（除非确实没有英文资源）

**搜索策略**：
1. 针对每个概念，优先搜索YouTube上的具体视频
2. 搜索英文专业博客（Medium、Towards Data Science等）上的具体文章
3. 从搜索结果中选择最相关、最具体的资源链接
4. 确保每个链接都是可以直接访问的具体资源

现在开始搜索，只输出JSON格式，不要有任何其他文字。
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
                  title: title || '学习资源',
                  url: url,
                  type: resourceType,
                  description: `关于${title || '相关主题'}的学习资源`,
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
            description: r.description || `关于${r.title}的学习资源`,
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
 * 生成默认分析
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
    analysis = `你的AI素养基础扎实，对核心概念有较好的理解。`;
  } else if (correctRate >= 0.5) {
    analysis = `你对AI相关概念有一定了解，但在某些方面还需要加强。`;
  } else {
    analysis = `建议你系统学习AI相关的基础概念，从核心术语开始。`;
  }
  
  if (incorrectConcepts.length > 0) {
    analysis += ` 特别需要关注的概念包括：${incorrectConcepts.join('、')}。这些概念在实际应用中非常重要，建议重点学习。`;
  }
  
  return analysis;
}

/**
 * 降级总结（当LLM调用失败时）
 */
export function generateFallbackSummary(results: QuestionResult[]): Summary {
  const correctCount = results.filter(r => r.result === 'correct').length;
  const total = results.length;
  const correctRate = correctCount / total;
  
  const correctConcepts = results
    .filter(r => r.result === 'correct')
    .map(r => r.concept);
  const incorrectConcepts = results
    .filter(r => r.result === 'incorrect')
    .map(r => r.concept);
  
  let overall = '';
  if (correctRate >= 0.8) {
    overall = '你已具备基础概念，对AI相关术语有较好的理解。';
  } else if (correctRate >= 0.5) {
    overall = '有些术语容易混，建议再梳理一下核心概念。';
  } else {
    overall = '很需要一轮系统扫盲，建议从基础概念开始学习。';
  }
  
  return {
    overall,
    highlights: correctConcepts.length > 0 
      ? [`你掌握了：${correctConcepts.slice(0, 2).join('、')}`]
      : ['继续加油！'],
    blindspots: incorrectConcepts.length > 0
      ? [`需要加强：${incorrectConcepts.slice(0, 2).join('、')}`]
      : ['建议多练习'],
    suggestions: [
      '建议你再看看相关概念的区别图示',
      '可以尝试在实际场景中应用这些概念',
    ],
    detailedAnalysis: generateDefaultAnalysis(results),
    learningResources: [],
  };
}
