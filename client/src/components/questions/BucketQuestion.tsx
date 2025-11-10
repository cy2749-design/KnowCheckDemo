import { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { BucketQuestion as BucketQuestionType } from '../../types';

interface BucketQuestionProps {
  question: BucketQuestionType;
  onAnswer: (answer: { assignments: Record<string, string> }) => void;
  disabled?: boolean;
  userAnswer?: { assignments: Record<string, string> };
  showFeedback?: boolean;
}

interface DraggableCardProps {
  id: string;
  text: string;
  onDrop: (cardId: string, bucketId: string) => void;
  disabled: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

function DraggableCard({ id, text, onDrop, disabled, isCorrect, isWrong }: DraggableCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { id },
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`
        p-4 rounded-xl border-2 transition-all
        ${isDragging ? "opacity-50" : ""}
        ${isCorrect ? "border-success bg-success-light" : ""}
        ${isWrong ? "border-error bg-error-light" : ""}
        ${!isCorrect && !isWrong ? "border-border bg-card hover:border-primary/50" : ""}
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-grab hover:shadow-md"}
      `}
    >
      <span className="text-sm font-medium text-card-foreground">{text}</span>
    </div>
  );
}

interface BucketProps {
  id: string;
  text: string;
  cards: string[];
  allCards: Array<{ id: string; text: string }>;
  onDrop: (cardId: string, bucketId: string) => void;
  disabled: boolean;
  cardStatus?: Record<string, { isCorrect: boolean; isWrong: boolean }>;
}

function Bucket({ id, text, cards, allCards, onDrop, disabled, cardStatus }: BucketProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'card',
    drop: (item: { id: string }) => {
      onDrop(item.id, id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`
        min-h-[200px] p-5 rounded-xl border-2 transition-all
        ${isOver && !disabled ? "border-primary bg-primary/5" : "border-border bg-muted/30"}
      `}
    >
      <h3 className="text-base font-semibold text-foreground mb-4 pb-3 border-b border-border">{text}</h3>
      <div className="space-y-2.5">
        {cards.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Drag cards here</p>}
        {cards.map((cardId) => {
          const card = allCards.find(c => c.id === cardId);
          const status = cardStatus?.[cardId];
          return card ? (
            <div 
              key={cardId} 
              className={`p-3 bg-card rounded-lg border text-sm ${
                status?.isCorrect
                  ? 'bg-success-light border-success' 
                  : status?.isWrong
                  ? 'bg-error-light border-error'
                  : 'border-border'
              }`}
            >
              {card.text}
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

export default function BucketQuestion({ 
  question, 
  onAnswer, 
  disabled = false,
  userAnswer,
  showFeedback = false
}: BucketQuestionProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>(
    userAnswer?.assignments || {}
  );
  
  // 计算哪些分类是正确的
  const cardStatus: Record<string, { isCorrect: boolean; isWrong: boolean }> = {};
  if (showFeedback && userAnswer) {
    question.cards.forEach(card => {
      const userBucket = userAnswer.assignments[card.id];
      const correctBucket = question.answer_key[card.id];
      cardStatus[card.id] = {
        isCorrect: userBucket === correctBucket,
        isWrong: userBucket !== correctBucket && userBucket !== undefined
      };
    });
  }

  const handleDrop = (cardId: string, bucketId: string) => {
    if (disabled) return;
    const newAssignments = { ...assignments, [cardId]: bucketId };
    setAssignments(newAssignments);
    onAnswer({ assignments: newAssignments });
  };

  // 按桶分组卡片
  const cardsByBucket: Record<string, string[]> = {};
  question.buckets.forEach(bucket => {
    cardsByBucket[bucket.id] = [];
  });
  Object.entries(assignments).forEach(([cardId, bucketId]) => {
    if (cardsByBucket[bucketId]) {
      cardsByBucket[bucketId].push(cardId);
    }
  });

  const unassignedCards = question.cards.filter(
    card => !assignments[card.id]
  );

  return (
    <div className="space-y-6">
      {/* 未分配的卡片 */}
      {unassignedCards.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Cards to Categorize</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {unassignedCards.map((card) => {
              const status = cardStatus[card.id];
              return (
                <DraggableCard
                  key={card.id}
                  id={card.id}
                  text={card.text}
                  onDrop={handleDrop}
                  disabled={disabled}
                  isCorrect={status?.isCorrect}
                  isWrong={status?.isWrong}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 分类桶 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.buckets.map((bucket) => (
          <Bucket
            key={bucket.id}
            id={bucket.id}
            text={bucket.text}
            cards={cardsByBucket[bucket.id] || []}
            allCards={question.cards}
            onDrop={handleDrop}
            disabled={disabled}
            cardStatus={cardStatus}
          />
        ))}
      </div>
    </div>
  );
}

