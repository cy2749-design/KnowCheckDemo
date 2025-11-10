import { useState } from 'react';
import { MCQQuestion as MCQQuestionType } from '../../types';

interface MCQQuestionProps {
  question: MCQQuestionType;
  onAnswer: (answer: { selected: string[] }) => void;
  disabled?: boolean;
}

export default function MCQQuestion({ question, onAnswer, disabled = false }: MCQQuestionProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    
    // 单选题：只允许选择一个
    const newSelected = [optionId];
    setSelected(newSelected);
    onAnswer({ selected: newSelected });
  };

  return (
    <div className="space-y-3">
      {question.options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={disabled}
            className={`
              w-full p-5 text-left rounded-xl border-2 transition-all
              ${isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"}
              ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
            `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}
                `}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                  </svg>
                )}
              </div>
              <span className={`font-medium ${isSelected ? "text-foreground" : "text-card-foreground"}`}>
                {option.text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

