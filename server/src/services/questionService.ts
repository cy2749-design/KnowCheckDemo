import { Question, QuestionType, AnswerResult, QuestionResult, UserAnswer, Feedback } from '../types/question.js';
import { callGeminiAPI, parseLLMJSON } from './llmService.js';
import { getQuestionTemplate, getFeedbackTemplate } from './promptTemplates.js';
import { getFallbackQuestion } from './fallbackQuestions.js';

// 概念池 - 基于用户提供的11个方向
const CONCEPT_POOL: Array<{ concept: string; types: QuestionType[]; description?: string }> = [
  // 1. LLM基础概念
  { concept: 'LLM', types: ['match', 'mcq', 'discernment', 'short_answer'], description: '什么是大语言模型、LLM的结构、训练方式、应用场景、如"next word prediction"等原理' },
  { concept: 'LLM_structure', types: ['match', 'mcq'], description: 'LLM的结构' },
  { concept: 'LLM_training', types: ['match', 'mcq'], description: 'LLM的训练方式' },
  { concept: 'LLM_application', types: ['bucket', 'mcq'], description: 'LLM的应用场景' },
  
  // 2. 提示词工程（Prompt Engineering）
  { concept: 'prompt', types: ['match', 'discernment', 'mcq', 'short_answer'], description: '如何构建有效的提示词、典型提示模式、提示词实例与模板' },
  { concept: 'prompt_engineering', types: ['match', 'mcq'], description: '提示词工程' },
  { concept: 'prompt_patterns', types: ['match', 'mcq'], description: '典型提示模式' },
  
  // 3. 深度学习基础
  { concept: 'deep_learning', types: ['match', 'mcq', 'discernment'], description: '深度学习是什么、神经网络基本结构、激活、层、训练过程等入门知识' },
  { concept: 'neural_network', types: ['match', 'discernment', 'mcq'], description: '神经网络基本结构' },
  { concept: 'activation', types: ['match', 'mcq'], description: '激活函数' },
  { concept: 'neural_layers', types: ['match', 'mcq'], description: '神经网络层' },
  
  // 4. 机器学习基础
  { concept: 'machine_learning', types: ['match', 'mcq', 'discernment'], description: '监督学习与无监督学习区别、标注数据与模型学习流程、机器学习和深度学习的关系' },
  { concept: 'supervised_learning', types: ['match', 'mcq'], description: '监督学习' },
  { concept: 'unsupervised_learning', types: ['match', 'mcq'], description: '无监督学习' },
  { concept: 'labeled_data', types: ['match', 'mcq'], description: '标注数据' },
  
  // 5. AI/ML/深度学习关系梳理
  { concept: 'AI_ML_DL_relation', types: ['match', 'mcq', 'bucket'], description: '帮助初学者理解AI、机器学习、深度学习、神经网络之间的区别与联系' },
  
  // 6. 检索增强生成（RAG）
  { concept: 'RAG', types: ['match', 'mcq', 'discernment'], description: '什么是RAG、RAG的简要原理和工作流程、使用场景' },
  { concept: 'RAG_workflow', types: ['match', 'mcq'], description: 'RAG的工作流程' },
  
  // 7. 向量和嵌入（Embeddings）
  { concept: 'embedding', types: ['match', 'mcq', 'discernment'], description: '什么是embedding、向量数据库和语义检索的基础概念' },
  { concept: 'vector_database', types: ['match', 'mcq'], description: '向量数据库' },
  { concept: 'semantic_search', types: ['match', 'mcq'], description: '语义检索' },
  
  // 8. Transformer模型原理
  { concept: 'transformer', types: ['match', 'mcq', 'discernment'], description: '自注意力机制、Transformer架构在LLM中的作用' },
  { concept: 'self_attention', types: ['match', 'mcq'], description: '自注意力机制' },
  
  // 9. 上下文窗口与token
  { concept: 'context_window', types: ['match', 'mcq', 'discernment'], description: 'LLM的context window、token化原理、如何影响输出与理解' },
  { concept: 'token', types: ['match', 'mcq'], description: 'Token化原理' },
  { concept: 'tokenization', types: ['match', 'mcq'], description: 'Token化' },
  
  // 10. 微调（Fine-Tuning）方法
  { concept: 'finetuning', types: ['match', 'mcq', 'discernment'], description: '什么是微调、为什么需要微调大模型、基础流程' },
  { concept: 'fine_tuning_reason', types: ['match', 'mcq'], description: '为什么需要微调大模型' },
  { concept: 'fine_tuning_process', types: ['match', 'mcq'], description: '微调的基础流程' },
  
  // 11. 责任和安全使用
  { concept: 'responsible_AI', types: ['bucket', 'mcq', 'discernment', 'short_answer'], description: '生成式AI的合规、隐私、安全、输出质量检查与评估、企业和教学场景下的使用规范' },
  { concept: 'AI_safety', types: ['bucket', 'mcq'], description: 'AI安全使用' },
  { concept: 'AI_quality_check', types: ['bucket', 'mcq'], description: '输出质量检查与评估' },
];

// 题型分配策略：前5题包含所有4种基础题型，第6题固定为简答题
const QUESTION_TYPES: QuestionType[] = ['match', 'bucket', 'mcq', 'discernment'];
const SHORT_ANSWER_TYPE: QuestionType = 'short_answer';

// 每个session的题型队列（sessionId -> 题型数组）
const sessionTypeQueues = new Map<string, QuestionType[]>();
// 每个session已使用的概念（sessionId -> Set<concept>）
const sessionUsedConcepts = new Map<string, Set<string>>();

/**
 * 获取下一个应该使用的题型（确保均匀分布）
 */
function getNextQuestionType(sessionId: string, questionIndex: number, totalQuestions: number): QuestionType {
  // 第6题（索引5）固定为简答题
  if (questionIndex === 5) {
    return SHORT_ANSWER_TYPE;
  }
  
  // 获取或初始化该session的题型队列
  if (!sessionTypeQueues.has(sessionId)) {
    // 确保前4题包含所有基础题型
    const types = [...QUESTION_TYPES];
    // 随机打乱
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    const queue = [...types];
    // 第5题随机选择基础题型
    if (totalQuestions > 4) {
      queue.push(QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)]);
    }
    sessionTypeQueues.set(sessionId, queue);
  }
  
  const queue = sessionTypeQueues.get(sessionId)!;
  return queue[questionIndex] || QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
}

/**
 * 生成题目
 */
export async function generateQuestion(
  concept?: string,
  type?: QuestionType,
  questionIndex?: number,
  totalQuestions?: number,
  sessionId?: string,
  userInfo?: { age: number; role: 'student' | 'professional' | 'educator' | 'researcher' | 'entrepreneur' | 'other'; selfRating?: number }
): Promise<Question | null> {
  // 如果指定了题型，直接使用
  let selectedType: QuestionType;
  if (type) {
    selectedType = type;
  } else if (questionIndex !== undefined && totalQuestions !== undefined && sessionId) {
    // 使用题型分配策略
    selectedType = getNextQuestionType(sessionId, questionIndex, totalQuestions);
  } else {
    // 随机选择
    selectedType = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
  }
  
  // 记录题型，用于降级方案
  const targetType = selectedType;
  
  // 获取该session已使用的概念
  const usedConcepts = sessionId 
    ? (sessionUsedConcepts.get(sessionId) || new Set<string>())
    : new Set<string>();
  
  // 选择概念：优先选择支持该题型的、未使用的概念
  let selected;
  if (concept) {
    selected = CONCEPT_POOL.find(c => c.concept === concept);
  } else {
    // 筛选支持该题型的概念
    const availableConcepts = CONCEPT_POOL.filter(c => c.types.includes(selectedType));
    // 优先选择未使用的概念
    const unusedConcepts = availableConcepts.filter(c => !usedConcepts.has(c.concept));
    const candidates = unusedConcepts.length > 0 ? unusedConcepts : availableConcepts;
    selected = candidates[Math.floor(Math.random() * candidates.length)];
  }
  
  if (!selected) {
    selected = CONCEPT_POOL[0];
  }
  
  // 标记概念已使用（如果有sessionId）
  if (sessionId && (concept || questionIndex !== undefined)) {
    if (!sessionUsedConcepts.has(sessionId)) {
      sessionUsedConcepts.set(sessionId, new Set());
    }
    sessionUsedConcepts.get(sessionId)!.add(selected.concept);
  }
  
  const prompt = getQuestionTemplate(selectedType, selected.concept, selected.description, userInfo);
  
  const userLabel = userInfo ? `${userInfo.role}-L${userInfo.selfRating ?? 'N/A'}` : 'N/A';
  console.log(`生成题目 - Session: ${sessionId || 'N/A'}, 索引: ${questionIndex ?? 'N/A'}, 题型: ${selectedType}, 概念: ${selected.concept}, 用户: ${userLabel}`);
  
  try {
    const llmResponse = await callGeminiAPI({
      prompt,
      temperature: 0.8,
      maxTokens: 4096, // 增加token限制，避免MAX_TOKENS错误
    });
    
    if (llmResponse.error || !llmResponse.content) {
      console.error('❌ Failed to generate question - API error:', llmResponse.error);
      console.error('LLM response content:', llmResponse.content?.substring(0, 500));
      
      // 如果是MAX_TOKENS错误，尝试增加token限制重试
      if (llmResponse.error?.includes('MAX_TOKENS')) {
        console.warn('⚠️ MAX_TOKENS error, retrying with higher token limit...');
        try {
          const retryResponse = await callGeminiAPI({
            prompt,
            temperature: 0.8,
            maxTokens: 8192, // 大幅增加token限制
          });
          if (retryResponse.content) {
            console.log('✅ Retry successful with higher token limit');
            const question = parseLLMJSON<Question>(retryResponse.content);
            if (question && validateQuestion(question)) {
              console.log('✅ Question generated successfully after retry');
              return question;
            }
          }
        } catch (retryError: any) {
          console.error('❌ Retry also failed:', retryError);
        }
      }
      
      // 如果是配额超限或其他严重错误，使用降级方案
      if (llmResponse.error?.includes('429') || llmResponse.error?.includes('quota')) {
        console.warn('⚠️ API quota exceeded, using fallback question');
        const fallbackQuestion = getFallbackQuestion(targetType, questionIndex ?? 0);
        if (fallbackQuestion) {
          console.log('✅ Using fallback question, type:', fallbackQuestion.type, 'concept:', fallbackQuestion.concept);
          // 确保概念标记正确
          if (sessionId && questionIndex !== undefined) {
            if (!sessionUsedConcepts.has(sessionId)) {
              sessionUsedConcepts.set(sessionId, new Set());
            }
            sessionUsedConcepts.get(sessionId)!.add(fallbackQuestion.concept);
          }
          return fallbackQuestion;
        }
      }
      
      return null;
    }
    
    console.log('📄 LLM返回内容预览:', llmResponse.content.substring(0, 200));
    
    const question = parseLLMJSON<Question>(llmResponse.content);
    
    if (!question) {
      console.error('❌ 解析题目JSON失败');
      console.error('原始内容前500字符:', llmResponse.content.substring(0, 500));
      return null;
    }
    
    // 校验题目格式
    if (!validateQuestion(question)) {
      console.error('❌ 题目格式校验失败');
      console.error('题目内容:', JSON.stringify(question, null, 2));
      return null;
    }
    
    console.log('✅ 题目生成成功 - 类型:', question.type, '概念:', question.concept);
    return question;
  } catch (error: any) {
    console.error('❌ 生成题目时发生异常:', error);
    console.error('异常堆栈:', error.stack);
    return null;
  }
}

/**
 * 清理session的题目生成相关数据
 */
export function clearSessionQuestionData(sessionId: string): void {
  sessionTypeQueues.delete(sessionId);
  sessionUsedConcepts.delete(sessionId);
}

/**
 * 校验题目格式
 */
function validateQuestion(question: Question): boolean {
  if (!question.type || !question.question_text || !question.short_explanation) {
    return false;
  }
  
  switch (question.type) {
    case 'match':
      const match = question as any;
      return !!(
        match.options_left?.length &&
        match.options_right?.length &&
        match.answer_key?.length &&
        match.options_left.length === match.answer_key.length
      );
    
    case 'bucket':
      const bucket = question as any;
      return !!(
        bucket.cards?.length &&
        bucket.buckets?.length &&
        bucket.answer_key &&
        Object.keys(bucket.answer_key).length === bucket.cards.length
      );
    
    case 'mcq':
      const mcq = question as any;
      return !!(
        mcq.options?.length &&
        mcq.correct_options?.length
      );
    
    case 'discernment':
      const disc = question as any;
      return !!(disc.statement && typeof disc.correct_answer === 'boolean');
    
    case 'short_answer':
      const shortAnswer = question as any;
      return !!(
        shortAnswer.scenario &&
        shortAnswer.key_points &&
        Array.isArray(shortAnswer.key_points) &&
        shortAnswer.key_points.length > 0
      );
    
    default:
      return false;
  }
}

/**
 * 评估答案
 */
export function evaluateAnswer(question: Question, userAnswer: UserAnswer): AnswerResult {
  switch (question.type) {
    case 'match': {
      const matchQ = question as any;
      const userMatches = userAnswer.answer.matches || [];
      const correctMatches = matchQ.answer_key;
      
      // 检查匹配数量
      if (userMatches.length !== correctMatches.length) {
        return 'incorrect';
      }
      
      // 检查每个匹配是否正确
      const correctCount = userMatches.filter(([left, right]: [string, string]) => {
        return correctMatches.some(([cLeft, cRight]: [string, string]) => 
          cLeft === left && cRight === right
        );
      }).length;
      
      if (correctCount === correctMatches.length) return 'correct';
      if (correctCount > 0) return 'partial';
      return 'incorrect';
    }
    
    case 'bucket': {
      const bucketQ = question as any;
      const userAssignments = userAnswer.answer.assignments || {};
      const correctAssignments = bucketQ.answer_key;
      
      const total = Object.keys(correctAssignments).length;
      let correctCount = 0;
      
      for (const [cardId, bucketId] of Object.entries(correctAssignments)) {
        if (userAssignments[cardId] === bucketId) {
          correctCount++;
        }
      }
      
      if (correctCount === total) return 'correct';
      if (correctCount > 0) return 'partial';
      return 'incorrect';
    }
    
    case 'mcq': {
      const mcqQ = question as any;
      const userSelected = userAnswer.answer.selected || [];
      const correctOptions = mcqQ.correct_options;
      
      if (userSelected.length !== correctOptions.length) {
        return 'incorrect';
      }
      
      const allCorrect = userSelected.every((id: string) => 
        correctOptions.includes(id)
      ) && correctOptions.every((id: string) => 
        userSelected.includes(id)
      );
      
      return allCorrect ? 'correct' : 'incorrect';
    }
    
    case 'discernment': {
      const discQ = question as any;
      return userAnswer.answer.answer === discQ.correct_answer ? 'correct' : 'incorrect';
    }
    
    case 'short_answer': {
      // 简答题使用LLM评估答案质量
      const userAnswerText = userAnswer.answer.answer || '';
      if (!userAnswerText.trim()) {
        return 'incorrect';
      }
      // 简答题的评估需要分析答案内容，这里先返回'partial'
      // 实际评估会在generateFeedback中通过LLM进行更详细的判断
      // 但为了保持一致性，我们先用一个简单的启发式评估
      const shortAnswerQ = question as any;
      const keyPoints = shortAnswerQ.key_points || [];
      const answerLower = userAnswerText.toLowerCase();
      
      // 简单检查：如果答案长度太短，可能不完整
      if (userAnswerText.length < 20) {
        return 'incorrect';
      }
      
      // 检查是否提到了关键要点（简单关键词匹配）
      const mentionedPoints = keyPoints.filter((point: string) => {
        const pointKeywords = point.toLowerCase().split(/[\s，,。、]/).filter(k => k.length > 1);
        return pointKeywords.some(keyword => answerLower.includes(keyword));
      });
      
      if (mentionedPoints.length === keyPoints.length) {
        return 'correct';
      } else if (mentionedPoints.length > 0) {
        return 'partial';
      }
      
      return 'partial'; // 默认返回partial，让LLM在反馈中详细评估
    }
    
    default:
      return 'incorrect';
  }
}

/**
 * 生成即时反馈（根据用户具体答案）
 */
export async function generateFeedback(
  question: Question,
  result: AnswerResult,
  userAnswer: any,
  correctAnswer: any
): Promise<Feedback> {
  // 对于简答题，需要先通过LLM评估答案质量，然后生成反馈
  let finalResult = result;
  let isCorrect = result === 'correct';
  
  if (question.type === 'short_answer') {
    const userAnswerText = userAnswer.answer || '';
    const shortAnswerQ = question as any;
    const keyPoints = shortAnswerQ.key_points || [];
    
    // 使用LLM评估简答题答案质量 - 必须成功，不允许fallback
    const evaluationPrompt = `
You are an AI literacy education expert. Please evaluate the quality of the user's answer to a short answer question.

Question scenario: ${shortAnswerQ.scenario || shortAnswerQ.question_text}

Key points (that need to be covered):
${keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n')}

User's answer: "${userAnswerText}"

**CRITICAL**: You MUST carefully read and analyze the user's actual answer content. Do not make assumptions. Base your evaluation on what the user actually wrote.

Please evaluate the quality of the user's answer and output in JSON format:
{
  "result": "correct" | "partial" | "incorrect",
  "reason": "Brief explanation of the evaluation (1-2 sentences) based on the user's actual answer"
}

Evaluation criteria:
- correct: The answer fully covers all key points with accurate understanding
- partial: The answer covers some points but is incomplete or has understanding deviations
- incorrect: The answer basically does not cover the key points, or has serious understanding errors

Output only JSON, no other text.
`;
    
    let evalResponse = await callGeminiAPI({
      prompt: evaluationPrompt,
      temperature: 0.3,
      maxTokens: 1024, // 增加token限制以支持思考过程
    });
    
    // 如果遇到MAX_TOKENS错误，自动重试
    if (evalResponse.error?.includes('MAX_TOKENS')) {
      console.warn('⚠️ Short answer evaluation hit MAX_TOKENS, retrying with higher limit...');
      try {
        evalResponse = await callGeminiAPI({
          prompt: evaluationPrompt,
          temperature: 0.3,
          maxTokens: 2048, // 大幅增加token限制
        });
        if (evalResponse.content) {
          console.log('✅ Short answer evaluation retry successful with higher token limit');
        }
      } catch (retryError: any) {
        console.error('❌ Short answer evaluation retry also failed:', retryError);
      }
    }
    
    if (evalResponse.error || !evalResponse.content) {
      throw new Error(`Failed to evaluate short answer: ${evalResponse.error || 'LLM did not return content'}`);
    }
    
    const evalResult = parseLLMJSON<{ result: AnswerResult; reason?: string }>(evalResponse.content);
    if (!evalResult || !evalResult.result) {
      throw new Error('Failed to parse short answer evaluation result');
    }
    
    finalResult = evalResult.result;
    isCorrect = finalResult === 'correct';
    console.log(`📝 Short answer evaluation result: ${finalResult}${evalResult.reason ? ` - ${evalResult.reason}` : ''}`);
  }
  
  const prompt = getFeedbackTemplate(
    question.type,
    question.concept,
    finalResult,
    question.short_explanation,
    question,
    userAnswer,
    correctAnswer
  );
  
  let llmResponse = await callGeminiAPI({
    prompt,
    temperature: 0.7,
    maxTokens: 2048, // 增加token以支持更详细的反馈
  });
  
  // 如果遇到MAX_TOKENS错误，自动重试
  if (llmResponse.error?.includes('MAX_TOKENS')) {
    console.warn('⚠️ Feedback generation hit MAX_TOKENS, retrying with higher limit...');
    try {
      llmResponse = await callGeminiAPI({
        prompt,
        temperature: 0.7,
        maxTokens: 4096, // 大幅增加token限制
      });
      if (llmResponse.content) {
        console.log('✅ Feedback retry successful with higher token limit');
      }
    } catch (retryError: any) {
      console.error('❌ Feedback retry also failed:', retryError);
    }
  }
  
  if (llmResponse.error || !llmResponse.content) {
    // NO FALLBACK - throw error if LLM fails
    console.error('❌ LLM feedback generation failed:', llmResponse.error);
    throw new Error(`Failed to generate feedback: ${llmResponse.error || 'LLM did not return content'}`);
  }
  
  // 对于简答题，isCorrect始终设为true，因为简答题是评析而不是判断对错
  const finalIsCorrect = question.type === 'short_answer' ? true : isCorrect;
  
  return {
    message: llmResponse.content.trim(),
    isCorrect: finalIsCorrect,
  };
}

