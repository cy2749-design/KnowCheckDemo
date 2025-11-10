import { useState, useEffect } from 'react';
import { getNextQuestion, submitAnswer, getSummary } from '../api';
import { Question, Summary } from '../types';
import MatchQuestion from './questions/MatchQuestion';
import BucketQuestion from './questions/BucketQuestion';
import MCQQuestion from './questions/MCQQuestion';
import DiscernmentQuestion from './questions/DiscernmentQuestion';
import ShortAnswerQuestion from './questions/ShortAnswerQuestion';
import FeedbackDisplay from './FeedbackDisplay';

interface QuestionPageProps {
  sessionId: string;
  initialQuestion: Question | null;
  onQuestionChange: (question: Question | null) => void;
  onComplete: (summary: Summary | null) => void;
}

const TOTAL_QUESTIONS = 6;

export default function QuestionPage({
  sessionId,
  initialQuestion,
  onQuestionChange,
  onComplete,
}: QuestionPageProps) {
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  // 使用 answeredCount 来追踪当前是第几题（从1开始）
  // 这样更直观，也避免了索引混乱
  const [answeredCount, setAnsweredCount] = useState(0); // 已答题数量
  
  // 当前题目编号 = 已答题数 + 1
  // 例如：已答0题，当前是第1题；已答1题，当前是第2题
  const currentQuestionNumber = answeredCount + 1;
  
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 初始化时设置第一题
  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
      setAnsweredCount(0); // 重置为0，表示还没答题
      console.log('🎯 Initialized: Question 1, answeredCount=0');
    }
  }, []); // 空依赖数组，只在组件挂载时执行一次
  
  // 当 initialQuestion 变化时，同步更新 question（但不重置 answeredCount）
  useEffect(() => {
    if (initialQuestion && initialQuestion !== question) {
      setQuestion(initialQuestion);
      console.log('📝 Question updated from parent');
    }
  }, [initialQuestion]);
  
  // 调试：监控状态变化
  useEffect(() => {
    console.log(`📊 State Update: answeredCount=${answeredCount}, currentQuestionNumber=${currentQuestionNumber}, progress=${Math.round((currentQuestionNumber / TOTAL_QUESTIONS) * 100)}%`);
  }, [answeredCount, currentQuestionNumber]);

  const handleAnswer = (answer: any) => {
    setUserAnswer(answer);
  };

  const handleSubmit = async () => {
    if (!question || !userAnswer) return;

    setSubmitting(true);
    try {
      const { feedback: fb, isComplete } = await submitAnswer(sessionId, userAnswer);
      setFeedback(fb);
      console.log(`✅ Submit successful: Question ${currentQuestionNumber}`);
      // 不在这里更新 answeredCount，而是在点击"下一题"时更新
      // 这样进度条会在切换题目时才更新
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    // 先更新已答题数（这会触发进度条更新）
    const newAnsweredCount = answeredCount + 1;
    console.log(`🔄 handleNext: Updating answeredCount from ${answeredCount} to ${newAnsweredCount}`);
    setAnsweredCount(newAnsweredCount);
    
    // 检查是否已完成所有题目
    if (newAnsweredCount >= TOTAL_QUESTIONS) {
      console.log('⚠️ All questions completed');
      return;
    }

    setLoading(true);
    setFeedback(null);
    setUserAnswer(null);

    try {
      const nextQuestionNumber = newAnsweredCount + 1;
      console.log(`📥 Requesting question ${nextQuestionNumber}...`);
      const nextQuestion = await getNextQuestion(sessionId);
      if (!nextQuestion) {
        throw new Error('Failed to get question');
      }
      console.log(`✅ Successfully got question ${nextQuestionNumber}, type: ${nextQuestion.type}`);
      setQuestion(nextQuestion);
      onQuestionChange(nextQuestion);
      setLoading(false);
      
      console.log(`📊 Progress updated: ${nextQuestionNumber}/${TOTAL_QUESTIONS} (${Math.round((nextQuestionNumber / TOTAL_QUESTIONS) * 100)}%)`);
    } catch (err: any) {
      console.error('❌ 获取下一题失败:', err);
      
      // 如果是"已完成所有题目"的错误，静默处理（可能是竞态条件）
      if (err.message?.includes('All questions completed') || err.message?.includes('已完成所有题目')) {
        console.log('ℹ️ All questions completed, generating report...');
        onComplete(null as any); // 传递null表示正在生成
        try {
          const summary = await getSummary(sessionId);
          onComplete(summary);
          return;
        } catch (summaryErr: any) {
          console.error('Failed to get summary:', summaryErr);
          alert('Failed to generate report: ' + summaryErr.message);
        }
      }
      
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        sessionId,
        currentQuestionNumber,
        answeredCount
      });
      
      // 更友好的错误提示
      const errorMsg = err.message || 'Unknown error';
      alert(`Failed to get next question\n\nError: ${errorMsg}\n\nPlease check browser console (F12) and backend logs for details.`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-muted-foreground">Loading next question...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">No question available</div>
      </div>
    );
  }

  const canSubmit = userAnswer !== null;
  const isLastQuestion = currentQuestionNumber >= TOTAL_QUESTIONS;
  // 如果是最后一题且已提交，不显示"下一题"按钮
  const showNext = feedback !== null && !isLastQuestion;

  return (
    <div className="min-h-screen py-8 px-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-baseline mb-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="ml-3 text-2xl font-semibold text-foreground">
                {currentQuestionNumber}
                <span className="text-lg text-muted-foreground">/{TOTAL_QUESTIONS}</span>
              </span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round((currentQuestionNumber / TOTAL_QUESTIONS) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${(currentQuestionNumber / TOTAL_QUESTIONS) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Question header */}
          <div className="px-8 pt-8 pb-6 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">{currentQuestionNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold text-foreground leading-relaxed text-balance">
                  {question.question_text}
                </h2>
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="px-8 py-8">

          {/* 根据题型渲染不同组件 */}
          {question.type === 'match' && (
            <MatchQuestion
              question={question}
              onAnswer={handleAnswer}
              disabled={feedback !== null}
              userAnswer={feedback ? userAnswer : undefined}
              showFeedback={feedback !== null}
            />
          )}
          {question.type === 'bucket' && (
            <BucketQuestion
              question={question}
              onAnswer={handleAnswer}
              disabled={feedback !== null}
              userAnswer={feedback ? userAnswer : undefined}
              showFeedback={feedback !== null}
            />
          )}
          {question.type === 'mcq' && (
            <MCQQuestion
              question={question}
              onAnswer={handleAnswer}
              disabled={feedback !== null}
            />
          )}
          {question.type === 'discernment' && (
            <DiscernmentQuestion
              question={question}
              onAnswer={handleAnswer}
              disabled={feedback !== null}
            />
          )}
          {question.type === 'short_answer' && (
            <ShortAnswerQuestion
              question={question}
              onAnswer={handleAnswer}
              disabled={feedback !== null}
            />
          )}

            {/* Feedback */}
            {feedback && (
              <div className="mt-8">
                <FeedbackDisplay feedback={feedback} questionType={question?.type} />
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex gap-3 justify-end">
            {!feedback && (
              <button
                onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {submitting ? "Submitting..." : isLastQuestion ? "Submit & Finish" : "Submit Answer"}
                </button>
            )}
            {showNext && (
              <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 shadow-sm hover:shadow-md"
                  >
                    Next →
                  </button>
            )}
            {feedback && isLastQuestion && (
              <button
                onClick={async () => {
                  // 先切换到总结状态，显示"思考中"
                  onComplete(null as any);
                  // 然后异步获取总结
                  try {
                    const summary = await getSummary(sessionId);
                    onComplete(summary);
                  } catch (err: any) {
                    console.error('Failed to get summary:', err);
                    alert('Failed to generate report: ' + err.message);
                  }
                    }}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover shadow-sm hover:shadow-md"
                  >
                    View Report →
                  </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

