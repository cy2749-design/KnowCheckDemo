import { useState } from 'react';
import { DiscernmentQuestion as DiscernmentQuestionType } from '../../types';

interface DiscernmentQuestionProps {
  question: DiscernmentQuestionType;
  onAnswer: (answer: { answer: boolean }) => void;
  disabled?: boolean;
}

export default function DiscernmentQuestion({
  question,
  onAnswer,
  disabled = false,
}: DiscernmentQuestionProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const handleSelect = (answer: boolean) => {
    if (disabled) return;
    setSelected(answer);
    onAnswer({ answer });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-muted/30 rounded-xl border border-border">
        <p className="text-lg text-foreground leading-relaxed text-center">{question.statement}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect(true)}
          disabled={disabled}
          className={`
            p-6 rounded-xl border-2 font-semibold transition-all text-lg
            ${
              selected === true
                ? "border-success bg-success-light text-success"
                : "border-border bg-card text-card-foreground hover:border-success/50 hover:bg-success-light/30"
            }
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-md"}
          `}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>True</span>
          </div>
        </button>

        <button
          onClick={() => handleSelect(false)}
          disabled={disabled}
          className={`
            p-6 rounded-xl border-2 font-semibold transition-all text-lg
            ${
              selected === false
                ? "border-error bg-error-light text-error"
                : "border-border bg-card text-card-foreground hover:border-error/50 hover:bg-error-light/30"
            }
            ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-md"}
          `}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>False</span>
          </div>
        </button>
      </div>
    </div>
  );
}

