import { Summary } from '../types';
import { Component, ErrorInfo, ReactNode } from 'react';

interface SummaryPageProps {
  summary: Summary | null;
  onRestart: () => void;
}

// 错误边界组件
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ SummaryPage渲染错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-6 flex items-center justify-center bg-background">
          <div className="max-w-2xl w-full">
            <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-warning/10 rounded-2xl mb-6">
                  <svg
                    className="w-10 h-10 text-warning"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-semibold text-foreground mb-4">Error Rendering Report</h1>
                <p className="text-muted-foreground mb-4">
                  An error occurred while rendering the summary report.
                </p>
                <details className="text-left bg-muted p-4 rounded-lg mb-4">
                  <summary className="cursor-pointer font-semibold mb-2">Error Details</summary>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {this.state.error?.message || 'Unknown error'}
                    {'\n\n'}
                    {this.state.error?.stack || ''}
                  </pre>
                </details>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 获取level标签
function getLevelLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score < 33) {
    return { label: 'Low', color: 'text-red-600', bgColor: 'bg-red-100' };
  } else if (score < 67) {
    return { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  } else {
    return { label: 'High', color: 'text-green-600', bgColor: 'bg-green-100' };
  }
}

// 获取level描述文本
function getLevelDescription(level: number): string {
  const descriptions = [
    '', // 0 (not used)
    'I barely understand it',
    'I know a little',
    'I have a moderate understanding',
    'I understand it better than most people',
    'I am close to a professional level',
  ];
  return descriptions[level] || '';
}

// 校准状态类型
type CalibrationStatus = 'overconfident' | 'underconfident' | 'wellCalibrated';

function getCalibrationStatus(selfRating: number, systemLevel: number): {
  delta: number;
  status: CalibrationStatus;
} {
  const delta = systemLevel - selfRating;
  if (delta <= -1) return { delta, status: 'overconfident' };
  if (delta >= 1) return { delta, status: 'underconfident' };
  return { delta, status: 'wellCalibrated' };
}

// Self-Perception vs Actual Result Comparison Card
function SelfPerceptionComparisonCard({ selfRating, systemLevel }: { selfRating: number; systemLevel: number }) {
  const { delta, status } = getCalibrationStatus(selfRating, systemLevel);
  
  const statusConfig = {
    overconfident: {
      label: 'Overconfident',
      description: 'Your self-assessment was higher than your actual performance. Consider focusing on foundational concepts.',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      icon: '📈',
    },
    underconfident: {
      label: 'Underconfident',
      description: 'Your self-assessment was lower than your actual performance. You know more than you think!',
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: '📉',
    },
    wellCalibrated: {
      label: 'Well Calibrated',
      description: 'Your self-assessment closely matches your actual performance. Great self-awareness!',
      color: 'text-info',
      bgColor: 'bg-info/10',
      icon: '✅',
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{config.icon}</span>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground mb-2">Self-Perception vs Actual Result</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Compare your initial self-assessment with your actual performance
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Self Rating */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Your Self-Assessment</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl">
              <span className="text-2xl font-bold text-primary">{selfRating}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">
                {getLevelDescription(selfRating)}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded ${
                      level <= selfRating ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* System Level */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Actual Performance</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-success/10 rounded-xl">
              <span className="text-2xl font-bold text-success">{systemLevel}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">
                {getLevelDescription(systemLevel)}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded ${
                      level <= systemLevel ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status */}
      <div className={`p-4 rounded-xl ${config.bgColor} border border-current/20`}>
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1">
            <div className={`font-semibold ${config.color} mb-1`}>{config.label}</div>
            <div className="text-sm text-muted-foreground">{config.description}</div>
            {delta !== 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                Difference: {delta > 0 ? '+' : ''}{delta} level{Math.abs(delta) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// 子弹图组件（分项详情）
function BulletChart({ categories, scores }: { categories: string[]; scores: number[] }) {
  if (categories.length === 0 || scores.length === 0) {
    return null;
  }

  // 创建数据（保持原始顺序，不排序）
  const data = categories.map((cat, idx) => ({
    category: cat,
    score: scores[idx],
    level: getLevelLabel(scores[idx]),
  }));

  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-foreground">{item.category}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {item.score}/100
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.level.bgColor} ${item.level.color}`}>
                    {item.level.label}
                  </span>
                </div>
              </div>
              
              {/* 子弹图背景（0-100分区） */}
              <div className="relative h-6 bg-muted rounded-full overflow-hidden mb-2">
                {/* 背景分区：低/中/高 */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-red-100/50 border-r border-red-200"></div>
                  <div className="flex-1 bg-yellow-100/50 border-r border-yellow-200"></div>
                  <div className="flex-1 bg-green-100/50"></div>
                </div>
                {/* 前景条：用户当前分数 */}
                <div
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 z-10"
                  style={{ width: `${item.score}%` }}
                />
                {/* 分数标记点 */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground z-20"
                  style={{ left: `${item.score}%` }}
                />
              </div>
              
              {/* 能力描述 */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your performance in {item.category.toLowerCase()} is {item.level.label.toLowerCase()}. 
                {item.score < 50 
                  ? ' Focus on building foundational understanding in this area.' 
                  : item.score < 80 
                  ? ' Continue practicing to strengthen your knowledge.' 
                  : ' You have a strong grasp of this concept.'}
              </p>
            </div>
            
            {/* 行动按钮 */}
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  // 滚动到学习资源部分
                  const resourcesSection = document.getElementById('learning-resources');
                  if (resourcesSection) {
                    resourcesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                Learn →
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SummaryPage({ summary, onRestart }: SummaryPageProps) {
  // 添加错误边界和调试信息
  console.log('📊 SummaryPage rendered with summary:', {
    hasSummary: !!summary,
    hasOverall: !!summary?.overall,
    highlightsType: Array.isArray(summary?.highlights) ? 'array' : typeof summary?.highlights,
    highlightsLength: Array.isArray(summary?.highlights) ? summary.highlights.length : 'N/A',
    blindspotsType: Array.isArray(summary?.blindspots) ? 'array' : typeof summary?.blindspots,
    blindspotsLength: Array.isArray(summary?.blindspots) ? summary.blindspots.length : 'N/A',
    hasRadarData: !!summary?.radarData,
    hasLearningResources: !!summary?.learningResources,
  });

  // 如果summary为null，显示"思考中"状态
  if (!summary) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-background">
        <div className="max-w-2xl w-full">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
                <svg
                  className="w-10 h-10 text-primary animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-foreground mb-4">Analyzing Your Responses</h1>
              <p className="text-muted-foreground mb-8">AI is generating your personalized diagnostic report, please wait...</p>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { icon: "📊", text: "Analyzing patterns" },
                { icon: "🔍", text: "Identifying weak points" },
                { icon: "📚", text: "Finding resources" },
                { icon: "✨", text: "Generating suggestions" },
              ].map((step, i) => (
                <div key={i} className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <span className="text-lg">{step.icon}</span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>

            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse transition-all" style={{ width: "70%" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen py-12 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-success/10 rounded-2xl mb-6">
              <svg
                className="w-10 h-10 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-5xl font-semibold text-foreground mb-3 tracking-tight">Assessment Complete</h1>
            <p className="text-lg text-muted-foreground">Your Personalized AI Literacy Report</p>
          </div>

          <div className="space-y-6">
            {/* Self-Perception vs Actual Result Comparison */}
            {summary.selfRating !== undefined && summary.systemLevel !== undefined && (
              <SelfPerceptionComparisonCard 
                selfRating={summary.selfRating} 
                systemLevel={summary.systemLevel} 
              />
            )}

            {/* 子弹图列表（分项详情） */}
            {summary.radarData && summary.radarData.categories.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-info" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-2">Detailed Performance Breakdown</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Individual assessment for each knowledge area with actionable insights
                    </p>
                    <BulletChart 
                      categories={summary.radarData.categories} 
                      scores={summary.radarData.scores} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Overall */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-info" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-3">Overall Assessment</h2>
                  <p className="text-base text-card-foreground leading-relaxed">{summary.overall}</p>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {summary.highlights && summary.highlights.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Strengths</h2>
                    <ul className="space-y-3">
                      {summary.highlights.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-success/10 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                            </svg>
                          </span>
                          <span className="text-sm text-card-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Blindspots */}
            {summary.blindspots && summary.blindspots.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Areas to Improve</h2>
                    <ul className="space-y-3">
                      {summary.blindspots.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-warning/10 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
                            </svg>
                          </span>
                          <span className="text-sm text-card-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {summary.suggestions && summary.suggestions.length > 0 && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Recommendations</h2>
                    <ul className="space-y-3">
                      {summary.suggestions.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-semibold text-primary">{index + 1}</span>
                          </span>
                          <span className="text-sm text-card-foreground leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            {summary.detailedAnalysis && (
              <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Detailed Analysis</h2>
                    <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                      {summary.detailedAnalysis}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Resources */}
            {summary.learningResources && summary.learningResources.length > 0 && (
              <div id="learning-resources" className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.553a1 1 0 00-1.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 01.787 1.838l-7 3a1 1 0 000 1.84l7 3a1 1 0 00.788 0l7-3a1 1 0 000-1.84l-7-3a1 1 0 01-.788-1.838l1.939-.83-1.939-.831a1 1 0 01-.787-1.838l4-1.714a1 1 0 11.788 1.838l-4.5 1.929a.999.999 0 01-.356.257l-4 1.714a1 1 0 11-.788-1.838l7-3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Recommended Resources</h2>
                    <p className="text-sm text-muted-foreground mb-6">Curated content to help you improve</p>

                    <div className="space-y-3">
                      {summary.learningResources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className="p-5 bg-muted/50 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                {resource.type === "video" ? (
                                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                                  {resource.title}
                                </h3>
                                {resource.description && (
                                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                                    {resource.description}
                                  </p>
                                )}
                                <span className="inline-block text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-medium">
                                  {resource.type === "video"
                                    ? "Video"
                                    : resource.type === "article"
                                      ? "Article"
                                      : resource.type === "blog"
                                        ? "Blog"
                                        : "Course"}
                                </span>
                              </div>
                              <svg
                                className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                />
                              </svg>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onRestart}
              className="px-10 py-4 bg-foreground text-background text-lg font-semibold rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
            >
              Retake Assessment
            </button>
            <p className="mt-4 text-sm text-muted-foreground">Want to test again? Click to restart</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
