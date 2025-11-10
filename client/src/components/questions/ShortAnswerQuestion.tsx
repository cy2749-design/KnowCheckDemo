import { useState } from 'react';
import { ShortAnswerQuestion as ShortAnswerQuestionType } from '../../types';

interface ShortAnswerQuestionProps {
  question: ShortAnswerQuestionType;
  onAnswer: (answer: { answer: string }) => void;
  disabled?: boolean;
}

export default function ShortAnswerQuestion({ 
  question, 
  onAnswer, 
  disabled = false 
}: ShortAnswerQuestionProps) {
  const [answer, setAnswer] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    onAnswer({ answer: newAnswer });
  };

  return (
    <div className="space-y-6">
      {/* 情境描述 */}
      <div className="p-6 bg-muted/30 rounded-xl border border-border">
        <p className="text-base text-foreground leading-relaxed whitespace-pre-line">
          {question.scenario}
        </p>
      </div>

      {/* 答题区域 */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-3">
          Please enter your answer
          {question.expected_length && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Suggested length: {question.expected_length})
            </span>
          )}
        </label>
        <textarea
          value={answer}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your answer..."
          rows={6}
          className={`
            w-full p-4 rounded-xl border-2 transition-all resize-none
            ${disabled 
              ? 'border-border bg-muted text-muted-foreground cursor-not-allowed' 
              : 'border-border bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
            placeholder:text-muted-foreground/50
          `}
        />
        <div className="mt-2 text-xs text-muted-foreground text-right">
          {answer.length} characters
        </div>
      </div>
    </div>
  );
}

