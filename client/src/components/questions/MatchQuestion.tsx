import { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { MatchQuestion as MatchQuestionType } from '../../types';

interface MatchQuestionProps {
  question: MatchQuestionType;
  onAnswer: (answer: { matches: Array<[string, string]> }) => void;
  disabled?: boolean;
  userAnswer?: { matches: Array<[string, string]> };
  showFeedback?: boolean;
}

interface DraggableItemProps {
  id: string;
  text: string;
  side: 'left' | 'right';
  onDrop: (itemId: string, targetId: string) => void;
  disabled: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

function DraggableItem({ id, text, side, onDrop, disabled, isCorrect, isWrong }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: side,
    item: { id, side },
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: side === 'left' ? 'right' : 'left',
    drop: (item: { id: string; side: string }) => {
      if (item.side !== side) {
        onDrop(item.id, id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className={`
        p-4 rounded-xl border-2 transition-all
        ${isDragging ? "opacity-40 cursor-grabbing" : disabled ? "cursor-not-allowed" : "cursor-grab hover:shadow-sm"}
        ${isOver && !disabled ? "border-primary bg-primary/5 scale-[1.02]" : ""}
        ${isCorrect ? "border-success bg-success-light" : ""}
        ${isWrong ? "border-error bg-error-light" : ""}
        ${!isOver && !isCorrect && !isWrong ? "border-border bg-card" : ""}
        ${disabled ? "opacity-60" : ""}
      `}
    >
      <span className="text-sm font-medium text-card-foreground">{text}</span>
    </div>
  );
}

export default function MatchQuestion({ 
  question, 
  onAnswer, 
  disabled = false,
  userAnswer,
  showFeedback = false
}: MatchQuestionProps) {
  const [matches, setMatches] = useState<Array<[string, string]>>(
    userAnswer?.matches || []
  );
  
  // 当userAnswer变化时，更新matches
  useEffect(() => {
    if (userAnswer?.matches) {
      setMatches(userAnswer.matches);
    }
  }, [userAnswer]);
  
  // 如果有用户答案且显示反馈，计算哪些匹配是正确的
  const correctMatches = showFeedback && userAnswer 
    ? new Set(
        question.answer_key.map(([left, right]) => `${left}-${right}`)
      )
    : new Set();

  const handleDrop = (itemId: string, targetId: string) => {
    if (disabled) return;

    // 移除已存在的匹配
    const newMatches = matches.filter(([left, right]) => 
      left !== itemId && right !== itemId && left !== targetId && right !== targetId
    );

    // 确定左右
    const leftItem = question.options_left.find(o => o.id === itemId || o.id === targetId);
    const rightItem = question.options_right.find(o => o.id === itemId || o.id === targetId);

    if (leftItem && rightItem) {
      const leftId = leftItem.id;
      const rightId = rightItem.id;
      newMatches.push([leftId, rightId]);
      setMatches(newMatches);
      onAnswer({ matches: newMatches });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-4 pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Terms</h3>
          </div>
          <div className="space-y-3">
            {question.options_left.map((option) => {
              const matched = matches.some(([left]) => left === option.id);
              const userMatch =
                showFeedback && userAnswer ? userAnswer.matches.find(([left]) => left === option.id) : null;
              const isCorrect = userMatch ? correctMatches.has(`${userMatch[0]}-${userMatch[1]}`) : undefined;
              const isWrong = userMatch ? !isCorrect : undefined;

              return (
                <DraggableItem
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  side="left"
                  onDrop={handleDrop}
                  disabled={disabled || matched}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                />
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-4 pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Descriptions</h3>
          </div>
          <div className="space-y-3">
            {question.options_right.map((option) => {
              const matched = matches.some(([, right]) => right === option.id);
              const userMatch =
                showFeedback && userAnswer ? userAnswer.matches.find(([, right]) => right === option.id) : null;
              const isCorrect = userMatch ? correctMatches.has(`${userMatch[0]}-${userMatch[1]}`) : undefined;
              const isWrong = userMatch ? !isCorrect : undefined;

              return (
                <DraggableItem
                  key={option.id}
                  id={option.id}
                  text={option.text}
                  side="right"
                  onDrop={handleDrop}
                  disabled={disabled || matched}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                />
              );
            })}
          </div>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="p-4 bg-muted rounded-xl">
          <p className="text-sm font-medium text-muted-foreground mb-3">Matched {matches.length} pairs</p>
          {showFeedback && userAnswer && (
            <div className="space-y-2">
              {userAnswer.matches.map(([leftId, rightId], index) => {
                const isCorrect = correctMatches.has(`${leftId}-${rightId}`);
                const leftText = question.options_left.find((o) => o.id === leftId)?.text || leftId;
                const rightText = question.options_right.find((o) => o.id === rightId)?.text || rightId;
                const correctRightId = question.answer_key.find(([l]) => l === leftId)?.[1];
                const correctRightText = correctRightId
                  ? question.options_right.find((o) => o.id === correctRightId)?.text || correctRightId
                  : "";
                return (
                  <div
                    key={index}
                    className={`text-xs p-3 rounded-lg font-medium ${
                      isCorrect ? "bg-success-light text-success" : "bg-error-light text-error"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{isCorrect ? "✓" : "✗"}</span>
                      <span>
                        {leftText} ↔ {rightText}
                      </span>
                    </div>
                    {!isCorrect && correctRightText && (
                      <div className="mt-1 text-muted-foreground">
                        Correct: {leftText} ↔ {correctRightText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

