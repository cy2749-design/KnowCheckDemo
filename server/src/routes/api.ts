import express from 'express';
import { createSession, getSession, updateSession, getNextQuestion, preloadNextQuestion } from '../services/sessionService.js';
import { generateQuestion, evaluateAnswer, generateFeedback } from '../services/questionService.js';
import { generateSummary, generateLearningResources } from '../services/summaryService.js';
import { QuestionResult, UserAnswer, Question } from '../types/question.js';
import { UserInfo } from '../types/session.js';
import { APP_CONFIG } from '../config/api.js';

const router = express.Router();

/**
 * 开始测试 - 创建Session并返回第一题
 */
router.post('/start', async (req, res) => {
  try {
    const { age, role, selfRating } = req.body; // { age, role, selfRating }
    
    console.log('收到启动请求，用户信息:', { age, role, selfRating });
    
    // 验证selfRating（必须存在且为1-5）
    if (typeof selfRating !== 'number' || selfRating < 1 || selfRating > 5) {
      console.error('selfRating无效:', selfRating);
      return res.status(400).json({ error: 'Missing or invalid selfRating. Must be a number between 1 and 5' });
    }
    
    // 验证用户信息
    if (!age && age !== 0) {
      console.error('缺少用户信息对象');
      return res.status(400).json({ error: 'Missing user information (age, role, test level)' });
    }
    
    // 转换age为数字（如果它是字符串）
    const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
    
    if (typeof ageNum !== 'number' || isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      console.error('年龄无效:', age);
      return res.status(400).json({ error: 'Age must be a number between 13 and 100' });
    }
    
    if (!role || typeof role !== 'string') {
      console.error('身份无效:', role);
      return res.status(400).json({ error: 'Missing or invalid role information' });
    }
    
    // 验证并转换 role 类型
    const validRoles: UserInfo['role'][] = ['student', 'professional', 'educator', 'researcher', 'entrepreneur', 'other'];
    const validatedRole = validRoles.includes(role as UserInfo['role']) 
      ? (role as UserInfo['role'])
      : 'other';
    
    if (!validRoles.includes(role as UserInfo['role'])) {
      console.warn(`角色 "${role}" 不在有效列表中，使用默认值 "other"`);
    }
    
    const validatedUserInfo: UserInfo = {
      age: ageNum,
      role: validatedRole,
      selfRating,
    };
    
    console.log('验证后的用户信息:', validatedUserInfo);
    console.log('Self rating:', selfRating);
    
    const session = createSession(validatedUserInfo);
    // 存储selfRating到session
    session.selfRating = selfRating;
    
    // 立即预加载第一题（使用题型分配策略，传入用户信息）
    console.log('开始生成第一题...', { userInfo: validatedUserInfo });
    const firstQuestion = await generateQuestion(
      undefined, 
      undefined, 
      0, 
      APP_CONFIG.totalQuestions, 
      session.sessionId,
      validatedUserInfo
    );
    if (!firstQuestion) {
      console.error('生成题目失败: 返回 null');
      return res.status(500).json({ error: 'Failed to generate question: LLM did not return a valid question. Please check API Key configuration' });
    }
    
    session.questions.push(firstQuestion);
    session.currentQuestionIndex = 0;
    
    // 异步预加载第二题
    preloadNextQuestion(session.sessionId, () => 
      generateQuestion(undefined, undefined, 1, APP_CONFIG.totalQuestions, session.sessionId, validatedUserInfo)
    );
    
    console.log('第一题生成成功，类型:', firstQuestion.type);
    res.json({
      sessionId: session.sessionId,
      question: firstQuestion,
    });
  } catch (error: any) {
    console.error('启动测试失败:', error);
    const errorMessage = error.message || '未知错误';
    res.status(500).json({ 
      error: `Failed to start test: ${errorMessage}. Please check backend logs or API Key configuration.` 
    });
  }
});

/**
 * 获取下一题
 */
router.post('/next-question', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // 检查当前应该获取第几题（基于已答题数量）
    const nextQuestionIndex = session.results.length; // 已答了几题，下一题就是第几题
    
    // 详细日志
    console.log('='.repeat(50));
    console.log(`📥 获取下一题请求`);
    console.log(`   Session ID: ${sessionId.substring(0, 8)}...`);
    console.log(`   已答题数: ${session.results.length}`);
    console.log(`   已生成题目数: ${session.questions.length}`);
    console.log(`   需要题目索引: ${nextQuestionIndex} (第 ${nextQuestionIndex + 1} 题)`);
    console.log(`   预加载题目: ${session.preloadedQuestion ? '有' : '无'}`);
    console.log('='.repeat(50));
    
    if (nextQuestionIndex >= APP_CONFIG.totalQuestions) {
      console.log(`✅ 已完成所有题目 (${nextQuestionIndex} >= ${APP_CONFIG.totalQuestions})`);
      // 返回友好的提示，而不是错误（200状态码）
      return res.json({ 
        question: null,
        message: '已完成所有题目',
        isComplete: true
      });
    }
    
    // 检查是否已经生成该题目
    if (nextQuestionIndex < session.questions.length) {
      // 题目已生成，直接返回
      const question = session.questions[nextQuestionIndex];
      if (!question) {
        console.error(`❌ 题目数组索引 ${nextQuestionIndex} 处为 null 或 undefined`);
        return res.status(500).json({ error: 'Question data error, please try again' });
      }
      session.currentQuestionIndex = nextQuestionIndex;
      console.log(`✅ 返回已生成的第 ${nextQuestionIndex + 1} 题，类型: ${question.type}`);
      return res.json({ question });
    }
    
    // 题目未生成，需要生成（优先使用预加载）
    let question: Question | null = null;
    const userInfo = session.userInfo;
    
    // 先检查预加载的题目
    if (session.preloadedQuestion) {
      question = session.preloadedQuestion;
      session.questions.push(question);
      session.preloadedQuestion = null; // 清空预加载
      session.currentQuestionIndex = session.questions.length - 1;
      console.log(`✅ 使用预加载的第 ${session.questions.length} 题，类型: ${question.type}`);
    }
    
    // 如果没有预加载的题目，同步生成
    if (!question) {
      console.log(`⏳ 预加载未就绪，同步生成第 ${nextQuestionIndex + 1} 题...`);
      try {
        question = await generateQuestion(undefined, undefined, nextQuestionIndex, APP_CONFIG.totalQuestions, sessionId, userInfo);
        if (!question) {
          console.error('❌ 生成题目失败: 返回 null');
          return res.status(500).json({ 
            error: 'Failed to generate question, possibly an API call issue. Please check backend logs for details.' 
          });
        }
        session.questions.push(question);
        session.currentQuestionIndex = session.questions.length - 1;
        console.log(`✅ 第 ${session.questions.length} 题生成成功，类型: ${question.type}`);
      } catch (error: any) {
        console.error('❌ 生成题目异常:', error);
        return res.status(500).json({ 
          error: `Error occurred while generating question: ${error.message}` 
        });
      }
    }
    
    // 验证题目是否成功生成
    if (!question) {
      console.error('❌ 严重错误: 题目生成后仍为 null');
      return res.status(500).json({ error: 'Question generation failed, please try again' });
    }
    
    // 异步预加载再下一题（如果还没到最后一题）
    const nextQuestionCount = session.questions.length;
    if (nextQuestionCount < APP_CONFIG.totalQuestions) {
      console.log(`🔄 预加载第 ${nextQuestionCount + 1} 题...`);
      preloadNextQuestion(sessionId, () => generateQuestion(undefined, undefined, nextQuestionCount, APP_CONFIG.totalQuestions, sessionId, userInfo));
    } else {
      console.log('✅ 已生成所有题目，无需预加载');
    }
    
    console.log(`📤 返回第 ${nextQuestionIndex + 1} 题给前端`);
    res.json({ question });
  } catch (error: any) {
    console.error('获取下一题失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 提交答案
 */
router.post('/submit-answer', async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    
    if (!sessionId || !answer) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session不存在' });
    }
    
    // 当前题目索引：已答了几题，当前就是第几题（0-based）
    // 例如：答完第0题后，results.length=1，当前应该是在做第1题（索引1）
    // 但实际上，如果已经答了1题，那么当前应该是在做第1题（索引0），因为索引从0开始
    // 所以：已答了 results.length 题，当前应该在做第 results.length 题（索引 results.length - 1）
    // 但更准确的是：如果 results.length = 1，说明已经答了第0题，当前应该在做第1题（索引1）
    // 不对，应该是：results.length 表示已答题数，当前题目索引应该是 results.length - 1（如果已经答了1题，当前是第0题）
    // 等等，让我重新理解：
    // - 答完第0题后，results.length = 1，此时应该在做第1题（索引1）
    // - 答完第1题后，results.length = 2，此时应该在做第2题（索引2）
    // 所以 currentQuestionIndex = results.length 是对的
    // 但问题是：如果 results.length = 2，questions.length = 2，那么索引2会超出范围
    // 实际上，如果只有2题，索引应该是0和1，不应该有索引2
    // 所以问题可能是：当答完最后一题时，不应该再提交答案
    
    // 检查是否已经答完所有题目
    if (session.results.length >= APP_CONFIG.totalQuestions) {
      console.log('⚠️ 已经答完所有题目，不应该再提交答案');
      return res.status(400).json({ 
        error: 'All questions completed, please view summary' 
      });
    }
    
    // 当前题目索引应该是已答题数（因为答完第0题后，results.length=1，当前应该在做第1题，索引1）
    const currentQuestionIndex = session.results.length;
    
    console.log(`提交答案 - 已答题数: ${session.results.length}, 已生成题目数: ${session.questions.length}, 当前题目索引: ${currentQuestionIndex}`);
    
    if (currentQuestionIndex >= session.questions.length) {
      console.error(`题目未生成: 需要索引 ${currentQuestionIndex}, 但只有 ${session.questions.length} 题`);
      return res.status(400).json({ 
        error: `Question not yet generated (Question ${currentQuestionIndex + 1}), please get question first` 
      });
    }
    
    const currentQuestion = session.questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error(`题目不存在: 索引 ${currentQuestionIndex}, 总题目数 ${session.questions.length}`);
      return res.status(400).json({ error: 'No current question, please get question first' });
    }
    
    // 评估答案
    const userAnswer: UserAnswer = {
      questionId: currentQuestion.concept,
      type: currentQuestion.type,
      answer,
    };
    
    const result = evaluateAnswer(currentQuestion, userAnswer);
    
    // 记录结果
    const questionResult: QuestionResult = {
      questionId: currentQuestion.concept,
      type: currentQuestion.type,
      concept: currentQuestion.concept,
      result,
      userAnswer: answer,
      correctAnswer: getCorrectAnswer(currentQuestion),
    };
    
    session.results.push(questionResult);
    updateSession(sessionId, { results: session.results });
    
    // 生成即时反馈（传入用户答案和正确答案）
    const feedback = await generateFeedback(
      currentQuestion, 
      result,
      answer,
      getCorrectAnswer(currentQuestion)
    );
    
    // 判断是否完成：已答题数量 >= 总题数
    const answeredCount = session.results.length;
    const isComplete = answeredCount >= APP_CONFIG.totalQuestions;
    
    console.log(`答题进度: ${answeredCount}/${APP_CONFIG.totalQuestions}, 完成: ${isComplete}`);
    
    // 如果还没完成，立即预加载下一题（不等待）
    if (!isComplete) {
      const nextQuestionIndex = session.results.length;
      if (nextQuestionIndex < APP_CONFIG.totalQuestions) {
        console.log(`🔄 提交答案后立即预加载第 ${nextQuestionIndex + 1} 题...`);
        const userInfo = session.userInfo;
        // 立即触发预加载，不等待
        preloadNextQuestion(sessionId, () => 
          generateQuestion(undefined, undefined, nextQuestionIndex, APP_CONFIG.totalQuestions, sessionId, userInfo)
        ).catch(err => {
          console.error('预加载失败，将在获取时同步生成:', err);
        });
      }
    } else {
      console.log('🎉 所有题目已完成！');
    }
    
    res.json({
      result,
      feedback,
      isComplete,
    });
  } catch (error: any) {
    console.error('提交答案失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 获取最终总结
 */
router.post('/summary', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }
    
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.results.length === 0) {
      return res.status(400).json({ error: 'No answer records yet' });
    }
    
    // 标记完成
    updateSession(sessionId, { completedAt: Date.now() });
    
    console.log('📊 开始生成诊断报告...');
    console.log('📊 Session results count:', session.results.length);
    console.log('📊 Results:', session.results.map(r => ({
      concept: r.concept,
      type: r.type,
      result: r.result,
    })));
    
    // 生成总结（包含学习资源，会在generateSummary中生成）
    const summary = await generateSummary(session.results, session.selfRating, session.questions || []);
    
    console.log('✅ 诊断报告生成完成');
    console.log('✅ Summary structure:', {
      hasOverall: !!summary.overall,
      highlightsCount: summary.highlights?.length || 0,
      blindspotsCount: summary.blindspots?.length || 0,
      hasRadarData: !!summary.radarData,
      radarCategories: summary.radarData?.categories?.length || 0,
      resourcesCount: summary.learningResources?.length || 0,
    });
    
    res.json({ summary });
  } catch (error: any) {
    console.error('❌ 生成总结失败:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to generate summary. Please check backend logs for details.' 
    });
  }
});

/**
 * 辅助函数：获取正确答案（用于记录）
 */
function getCorrectAnswer(question: any): any {
  if (question.type === 'short_answer') {
    return {
      answer: question.key_points?.join('、') || '',
      key_points: question.key_points || []
    };
  }
  switch (question.type) {
    case 'match':
      return { matches: question.answer_key };
    case 'bucket':
      return { assignments: question.answer_key };
    case 'mcq':
      return { selected: question.correct_options };
    case 'discernment':
      return { answer: question.correct_answer };
    default:
      return null;
  }
}

export default router;

