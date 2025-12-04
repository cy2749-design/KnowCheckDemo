import { useState } from 'react';

interface SelfPerceptionPageProps {
  onStart: (selfRating: number) => void;
}

const RATING_OPTIONS = [
  { value: 1, label: "I barely understand it" },
  { value: 2, label: "I know a little" },
  { value: 3, label: "I have a moderate understanding" },
  { value: 4, label: "I understand it better than most people" },
  { value: 5, label: "I am close to a professional level" },
];

export default function SelfPerceptionPage({ onStart }: SelfPerceptionPageProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedRating !== null) {
      onStart(selectedRating);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-background">
      <div className="max-w-2xl w-full">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-semibold text-foreground mb-4">
              Before we start, how would you rate your current understanding of AI?
            </h1>
          </div>

          <div className="space-y-4 mb-8">
            {RATING_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRating === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <input
                  type="radio"
                  name="selfRating"
                  value={option.value}
                  checked={selectedRating === option.value}
                  onChange={() => setSelectedRating(option.value)}
                  className="w-5 h-5 text-primary focus:ring-primary focus:ring-2"
                />
                <span className="text-lg text-foreground flex-1">
                  {option.value}. {option.label}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={selectedRating === null}
              className="px-10 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Start assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



