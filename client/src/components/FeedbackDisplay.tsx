interface FeedbackDisplayProps {
  feedback: {
    message: string;
    isCorrect: boolean;
  };
  questionType?: 'match' | 'bucket' | 'mcq' | 'discernment' | 'short_answer';
}

export default function FeedbackDisplay({ feedback, questionType }: FeedbackDisplayProps) {
  // 简答题不显示正确/错误，而是显示评析
  const isShortAnswer = questionType === 'short_answer';
  
  if (isShortAnswer) {
    return (
      <div className="p-6 rounded-xl border-2 bg-info-light border-info-border">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-info/20">
            <svg className="w-6 h-6 text-info" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-info">Analysis</h3>
            <p className="text-sm text-card-foreground leading-relaxed">{feedback.message}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`p-6 rounded-xl border-2 ${
        feedback.isCorrect ? "bg-success-light border-success-border" : "bg-error-light border-error-border"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            feedback.isCorrect ? "bg-success/20" : "bg-error/20"
          }`}
        >
          {feedback.isCorrect ? (
            <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-error" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${feedback.isCorrect ? "text-success" : "text-error"}`}>
            {feedback.isCorrect ? "Correct!" : "Incorrect"}
          </h3>
          <p className="text-sm text-card-foreground leading-relaxed">{feedback.message}</p>
        </div>
      </div>
    </div>
  );
}

