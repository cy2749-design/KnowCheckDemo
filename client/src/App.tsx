import { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import QuestionPage from './components/QuestionPage';
import SummaryPage from './components/SummaryPage';
import { Question, Summary } from './types';

type AppState = 'welcome' | 'question' | 'summary';

function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const handleStart = (sessionId: string, question: Question) => {
    setSessionId(sessionId);
    setCurrentQuestion(question);
    setState('question');
  };

  const handleQuestionComplete = (question: Question | null) => {
    setCurrentQuestion(question);
  };

  const handleAllComplete = (summary: Summary | null) => {
    // summary为null表示正在生成
    setSummary(summary);
    setState('summary');
  };

  const handleRestart = () => {
    setState('welcome');
    setSessionId(null);
    setCurrentQuestion(null);
    setSummary(null);
  };

  return (
    <div className="min-h-screen">
      {state === 'welcome' && <WelcomePage onStart={handleStart} />}
      {state === 'question' && sessionId && (
        <QuestionPage
          sessionId={sessionId}
          initialQuestion={currentQuestion}
          onQuestionChange={handleQuestionComplete}
          onComplete={handleAllComplete}
        />
      )}
      {state === 'summary' && (
        <SummaryPage summary={summary} onRestart={handleRestart} />
      )}
    </div>
  );
}

export default App;

