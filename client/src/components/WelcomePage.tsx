import { useState } from 'react';
import { startTest } from '../api';
import { Question } from '../types';

interface WelcomePageProps {
  onStart: (sessionId: string, question: Question) => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { sessionId, question } = await startTest();
      onStart(sessionId, question);
    } catch (err: any) {
      setError(err.message || 'Failed to start, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl">
        {/* Main card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-8">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>

          {/* Logo and Title */}
          <div className="mb-10">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <svg className="w-9 h-9 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-foreground tracking-tight">KnowCheck</div>
                <div className="text-sm text-muted-foreground font-medium">AI Literacy Assessment</div>
              </div>
            </div>
            <h1 className="text-4xl font-semibold text-foreground tracking-tight text-balance">Test Your AI Knowledge</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-error-light border border-error-border rounded-xl text-error text-sm text-left">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* CTA button */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-10 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl shadow-sm hover:bg-primary-hover hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading
              </span>
            ) : (
              "Start Assessment"
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

