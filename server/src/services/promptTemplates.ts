import { QuestionType } from '../types/question.js';

/**
 * 提示词模板库 - 符合PRD第8节要求
 */

const KNOWLEDGE_SCOPE = `
Knowledge Scope:
- AI / Machine Learning / Deep Learning: hierarchical relationships in plain language
- Neural Networks: roughly "networks with many connected parameters that learn patterns from data" - black box models
- LLM (Large Language Models): "text prediction models" pre-trained on large amounts of text, not "conscious brains"
- Pre-training: learning general patterns on large-scale general data
- Fine-tuning/Instruction tuning: continued training or alignment on specific tasks/styles
- Prompt: instructions/context given to the model, not magic spells
- Tasks suitable for AI: draft writing, rewriting, summarizing, organizing information, etc.
- Tasks not suitable for AI alone: final decisions, emotional support, sensitive compliance judgments, medical/legal final decisions, etc.
`;

const OUTPUT_REQUIREMENTS = `
Output Requirements:
1. Output STRICTLY in JSON format, without any markdown code block markers
2. Each question tests only 1 core concept
3. Use plain English, avoid formulas and complex jargon
4. No word traps, no multiple mappings
5. Provide short_explanation for error feedback (1-2 sentences of standard explanation)
6. **CRITICAL: ALL content MUST be in English - questions, options, explanations, feedback - EVERYTHING**
`;

const DIFFICULTY_GUIDANCE: Record<number, string> = {
  1: `
**Self-Assessment Level: 1/5 (Beginner)**
- Use very simple language and explain fundamental terms explicitly
- Focus on core definitions and straightforward cause-effect relationships
- Avoid multi-step reasoning; keep scenarios concrete and relatable
`,
  2: `
**Self-Assessment Level: 2/5 (Novice)**
- Use plain language with light technical vocabulary
- Introduce slightly more detailed scenarios but keep reasoning linear
- Emphasize conceptual clarity and common misunderstandings
`,
  3: `
**Self-Assessment Level: 3/5 (Intermediate)**
- Use balanced technical language and real-world application scenarios
- Encourage moderate reasoning steps and comparison of alternatives
- Highlight trade-offs, decision points, or mid-level implementation details
`,
  4: `
**Self-Assessment Level: 4/5 (Advanced)**
- Use professional terminology and multi-step scenarios
- Expect the learner to synthesize concepts across different AI components
- Include nuanced edge cases, evaluation criteria, or optimization choices
`,
  5: `
**Self-Assessment Level: 5/5 (Expert)**
- Use expert-level vocabulary and high-complexity scenarios
- Challenge the learner with ambiguous situations requiring judgment
- Encourage deep analysis, referencing architectural, ethical, or scaling considerations
`
};

export function getQuestionTemplate(
  type: QuestionType, 
  concept: string, 
  conceptDescription?: string,
  userInfo?: { age: number; role: 'student' | 'professional' | 'educator' | 'researcher' | 'entrepreneur' | 'other'; selfRating?: number }
): string {
  const conceptContext = conceptDescription ? `Concept Description: ${conceptDescription}` : '';
  
  // 根据用户身份确定情境
  let scenarioContext = '';
  if (userInfo) {
    if (userInfo.role === 'student') {
      scenarioContext = `
**CRITICAL: Scenario Requirements for Students:**
- ALL scenarios MUST be set in American educational contexts (e.g., American high schools, colleges, universities)
- Use American educational terminology (e.g., "professor", "semester", "GPA", "dorm", "campus")
- Focus on academic scenarios: writing essays, research papers, studying for exams, group projects, presentations
- NEVER use workplace or professional scenarios
- Examples: "You're a college student at an American university...", "You're working on a research paper for your American history class...", "Your professor asks you to..."
`;
    } else if (userInfo.role === 'professional') {
      scenarioContext = `
**CRITICAL: Scenario Requirements for Working Professionals:**
- ALL scenarios MUST be set in American workplace contexts (e.g., American companies, offices, business environments)
- Use American business terminology (e.g., "meeting", "deadline", "client", "quarterly report", "team standup")
- Focus on professional scenarios: writing emails, creating reports, presentations, client communications, project management
- NEVER use academic or school scenarios
- Examples: "You're a product manager at a tech company in Silicon Valley...", "Your team needs to prepare a quarterly business report...", "A client asks you to..."
`;
    } else if (userInfo.role === 'educator') {
      scenarioContext = `
**CRITICAL: Scenario Requirements for Educators:**
- ALL scenarios MUST be set in American educational contexts (e.g., American schools, universities, teaching environments)
- Use American educational terminology (e.g., "curriculum", "lesson plan", "student assessment", "classroom")
- Focus on teaching scenarios: creating lesson plans, grading assignments, student interactions, curriculum development
- Examples: "You're a teacher at an American high school...", "You need to create a lesson plan...", "Your students ask you about..."
`;
    } else if (userInfo.role === 'researcher') {
      scenarioContext = `
**CRITICAL: Scenario Requirements for Researchers:**
- ALL scenarios MUST be set in American research contexts (e.g., American universities, research institutions, labs)
- Use American research terminology (e.g., "research paper", "peer review", "conference", "publication", "grant proposal")
- Focus on research scenarios: writing papers, conducting experiments, analyzing data, presenting findings
- Examples: "You're a researcher at an American university...", "You're preparing a research paper for publication...", "Your research team needs to..."
`;
    } else if (userInfo.role === 'entrepreneur') {
      scenarioContext = `
**CRITICAL: Scenario Requirements for Entrepreneurs:**
- ALL scenarios MUST be set in American business/startup contexts (e.g., American startups, business environments, Silicon Valley)
- Use American business/startup terminology (e.g., "pitch deck", "venture capital", "MVP", "customer acquisition", "scaling")
- Focus on entrepreneurial scenarios: business planning, product development, fundraising, market analysis, team building
- Examples: "You're an entrepreneur starting a tech company in Silicon Valley...", "You need to prepare a pitch deck...", "Your startup needs to..."
`;
    } else {
      scenarioContext = `
**CRITICAL: Scenario Requirements:**
- ALL scenarios MUST be set in American cultural and social contexts
- Use American terminology and cultural references
- Can include both everyday life and general professional scenarios
- Examples: "You're planning a trip using American travel services...", "You need to write a recommendation letter in American format..."
`;
    }
    
    if (userInfo.selfRating) {
      const rating = Math.max(1, Math.min(5, Math.round(userInfo.selfRating)));
      scenarioContext += DIFFICULTY_GUIDANCE[rating];
    }
  } else {
    scenarioContext = `
**CRITICAL: Scenario Requirements:**
- ALL scenarios MUST be set in American cultural and social contexts
- Use American terminology, cultural references, and social norms
- Examples should reflect American workplace, educational, or daily life contexts
`;
  }
  
  const basePrompt = `
You are an AI literacy education expert. Generate a ${getTypeName(type)} question to test the user's understanding of the "${concept}" concept.

${conceptContext}

${KNOWLEDGE_SCOPE}

${OUTPUT_REQUIREMENTS}

${scenarioContext}

**Important Requirements:**
- Question content should be novel and diverse, avoiding repetitive common examples
- Can be combined with practical application scenarios (work, study, life) - but MUST match user's role context
- Can design some counter-intuitive but important edge cases
- Question wording should be vivid and interesting, avoiding dullness
- **MANDATORY: Generate ALL content in English - question text, options, explanations, everything**
- **MANDATORY: ALL scenarios must reflect American culture, society, and contexts**
`;

  switch (type) {
    case 'match':
      return basePrompt + `
Generate a matching question (match), requirements:
- Left side: 3-4 terms (e.g. "LLM", "pre-training", etc.)
- Right side: corresponding concise explanations (colloquial, avoid jargon stacking)
- Ensure 1:1 matching, no multiple mappings

Output JSON format (ALL TEXT IN ENGLISH):
{
  "type": "match",
  "question_text": "Match the terms on the left with the explanations on the right",
  "options_left": [{"id": "A", "text": "Term 1"}, ...],
  "options_right": [{"id": "1", "text": "Explanation 1"}, ...],
  "answer_key": [["A", "1"], ["B", "2"], ...],
  "short_explanation": "1-2 sentences of standard explanation IN ENGLISH",
  "concept": "${concept}"
}
`;

    case 'bucket':
      return basePrompt + `
Generate a categorization question (bucket), requirements:
- Provide 4-6 task description cards
- Two category buckets: "Suitable for AI" and "Better for humans"
- Include at least 1-2 "counter-intuitive but important" boundary points (e.g. emotional support, final decisions)
- Avoid controversial gray areas

Output JSON format (ALL TEXT IN ENGLISH):
{
  "type": "bucket",
  "question_text": "Drag the following tasks into the appropriate category buckets",
  "cards": [{"id": "card1", "text": "Task description 1"}, ...],
  "buckets": [
    {"id": "ai_ok", "text": "Suitable for AI"},
    {"id": "human_better", "text": "Better for humans"}
  ],
  "answer_key": {"card1": "ai_ok", "card2": "human_better", ...},
  "short_explanation": "Explain the reasons for 1-2 typical task categorizations IN ENGLISH",
  "concept": "${concept}"
}
`;

    case 'mcq':
      return basePrompt + `
Generate a multiple-choice question (mcq), requirements:
- Focus on clarifying typical misconceptions (e.g. "LLM = search engine", "more mystical prompts are better", etc.)
- Provide 3-4 options, only one correct answer
- No calculation questions, no trivial terminology details

Output JSON format (ALL TEXT IN ENGLISH):
{
  "type": "mcq",
  "question_text": "Question description",
  "options": [{"id": "A", "text": "Option A"}, ...],
  "correct_options": ["A"],
  "short_explanation": "Explain the reason for the correct option & problems with wrong options IN ENGLISH",
  "concept": "${concept}"
}
`;

    case 'discernment':
      return basePrompt + `
Generate a true/false question (discernment), requirements:
- Design judgment statements for typical misconceptions (e.g. "LLMs develop consciousness after training")
- Focus on clarifying misconceptions like "AI can completely replace human judgment"

Output JSON format (ALL TEXT IN ENGLISH):
{
  "type": "discernment",
  "question_text": "Determine whether the following statement is correct",
  "statement": "Statement to be judged",
  "correct_answer": true/false,
  "short_explanation": "Explain why it is correct/incorrect IN ENGLISH",
  "concept": "${concept}"
}
`;

    case 'short_answer':
      return basePrompt + `
Generate a short answer question (short_answer), requirements:
- Design a practical scenario question (work, study, or life scenario)
- The scenario should be specific and vivid, allowing users to think from that perspective
- The question should test the user's understanding and application ability of the "${concept}" concept
- Answer key points should include 2-4 key points
- Expected answer length: 50-150 words

Output JSON format (ALL TEXT IN ENGLISH):
{
  "type": "short_answer",
  "question_text": "Please answer the question based on the following scenario",
  "scenario": "Specific scenario description (e.g.: You are a product manager who needs to explain to the team why a certain feature is suitable for AI implementation...)",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "expected_length": "50-150 words",
  "short_explanation": "Briefly explain the core points the answer should include IN ENGLISH",
  "concept": "${concept}"
}
`;

    default:
      throw new Error(`Unknown question type: ${type}`);
  }
}

export function getFeedbackTemplate(
  questionType: QuestionType,
  concept: string,
  result: 'correct' | 'partial' | 'incorrect',
  shortExplanation: string,
  question: any,
  userAnswer: any,
  correctAnswer: any
): string {
  // 构建用户答案和正确答案的详细描述
  let answerDetails = '';
  
  if (questionType === 'match') {
    const userMatches = userAnswer.matches || [];
    // correctAnswer 可能是 { matches: [...] } 或直接是数组
    const correctMatches = Array.isArray(correctAnswer) 
      ? correctAnswer 
      : (correctAnswer?.matches || correctAnswer || []);
    const questionData = question;
    
    // 找出用户答对和答错的部分
    const correctParts: string[] = [];
    const wrongParts: string[] = [];
    
    userMatches.forEach(([leftId, rightId]: [string, string]) => {
      const isCorrect = correctMatches.some(([cLeft, cRight]: [string, string]) => 
        cLeft === leftId && cRight === rightId
      );
      
      const leftText = questionData.options_left?.find((o: any) => o.id === leftId)?.text || leftId;
      const rightText = questionData.options_right?.find((o: any) => o.id === rightId)?.text || rightId;
      
      if (isCorrect) {
        correctParts.push(`${leftText} ↔ ${rightText}`);
      } else {
        wrongParts.push(`${leftText} ↔ ${rightText}`);
        // 找出正确的匹配
        const correctMatch = correctMatches.find(([cLeft]: [string, string]) => cLeft === leftId);
        if (correctMatch) {
          const correctRightText = questionData.options_right?.find((o: any) => o.id === correctMatch[1])?.text || correctMatch[1];
          wrongParts[wrongParts.length - 1] += ` (Should be: ${leftText} ↔ ${correctRightText})`;
        }
      }
    });
    
    answerDetails = `User's answer:
${correctParts.length > 0 ? `✓ Correct matches: ${correctParts.join(', ')}` : ''}
${wrongParts.length > 0 ? `✗ Incorrect matches: ${wrongParts.join(', ')}` : ''}`;
  } else if (questionType === 'bucket') {
    const userAssignments = userAnswer.assignments || {};
    // correctAnswer 可能是 { assignments: {...} } 或直接是对象
    const correctAssignments = correctAnswer?.assignments || correctAnswer || {};
    const questionData = question;
    
    const correctParts: string[] = [];
    const wrongParts: string[] = [];
    
    Object.entries(userAssignments).forEach(([cardId, bucketId]: [string, any]) => {
      const cardText = questionData.cards?.find((c: any) => c.id === cardId)?.text || cardId;
      const bucketText = questionData.buckets?.find((b: any) => b.id === bucketId)?.text || bucketId;
      const correctBucketId = correctAssignments[cardId];
      const correctBucketText = questionData.buckets?.find((b: any) => b.id === correctBucketId)?.text || correctBucketId;
      
      if (bucketId === correctBucketId) {
        correctParts.push(`${cardText} → ${bucketText}`);
      } else {
        wrongParts.push(`${cardText} → ${bucketText} (Should be: ${cardText} → ${correctBucketText})`);
      }
    });
    
    answerDetails = `User's answer:
${correctParts.length > 0 ? `✓ Correct categorizations: ${correctParts.join(', ')}` : ''}
${wrongParts.length > 0 ? `✗ Incorrect categorizations: ${wrongParts.join(', ')}` : ''}`;
  } else if (questionType === 'mcq') {
    const userSelected = userAnswer.selected || [];
    // correctAnswer 可能是 { selected: [...] } 或直接是数组
    const correctOptions = Array.isArray(correctAnswer)
      ? correctAnswer
      : (correctAnswer?.selected || correctAnswer || []);
    const questionData = question;
    
    const userSelectedTexts = userSelected.map((id: string) => 
      questionData.options?.find((o: any) => o.id === id)?.text || id
    );
    const correctTexts = correctOptions.map((id: string) => 
      questionData.options?.find((o: any) => o.id === id)?.text || id
    );
    
    answerDetails = `User selected: ${userSelectedTexts.join(', ')}
Correct answer: ${correctTexts.join(', ')}`;
  } else if (questionType === 'discernment') {
    const userAnswerValue = userAnswer.answer;
    // correctAnswer 可能是 { answer: true/false } 或直接是布尔值
    const correctAnswerValue = typeof correctAnswer === 'boolean'
      ? correctAnswer
      : (correctAnswer?.answer ?? correctAnswer);
    
    answerDetails = `User's judgment: ${userAnswerValue ? 'True' : 'False'}
Correct answer: ${correctAnswerValue ? 'True' : 'False'}`;
  } else if (questionType === 'short_answer') {
    const userAnswerText = userAnswer.answer || '';
    const questionData = question;
    const keyPoints = questionData.key_points || [];
    
    answerDetails = `User's answer: ${userAnswerText}
Key points: ${keyPoints.join(', ')}
Expected length: ${questionData.expected_length || '50-150 words'}`;
  }
  
  const resultText = result === 'correct' ? 'Completely correct' : result === 'partial' ? 'Partially correct' : 'Needs improvement';
  
  // 简答题的反馈模板稍有不同
  if (questionType === 'short_answer') {
    return `
The user just completed a ${getTypeName(questionType)} question involving the concept "${concept}".

Question scenario: ${question.scenario || question.question_text}

${answerDetails}

Result: ${resultText}
Standard explanation: ${shortExplanation}

Please generate personalized immediate feedback (3-5 sentences), requirements:
1. **MUST analyze based on the user's ACTUAL answer content word-by-word**. Quote specific parts of their answer that demonstrate correct understanding or misunderstanding
2. Point out EXACTLY which key points they covered and which they missed, based on what they actually wrote
3. If the answer is incorrect or incomplete, quote the problematic parts and explain what the correct understanding should be
4. Reference specific knowledge points from the concept being tested
5. Use a friendly, encouraging tone, and provide improvement suggestions
6. Do not make generic statements - every point must reference their actual answer
7. **CRITICAL: Output feedback in English ONLY**

**Example of good feedback**: "You mentioned '[quote from user's answer]' which shows you understand [concept]. However, you didn't address [specific key point], which is important because [explanation]."

Output only the feedback text, not JSON format.
`;
  }
  
  return `
The user just completed a ${getTypeName(questionType)} question involving the concept "${concept}".

Question: ${question.question_text}

${answerDetails}

Result: ${resultText}
Standard explanation: ${shortExplanation}

Please generate personalized immediate feedback (2-4 sentences), requirements:
1. **MUST analyze based on the user's specific answer**, clearly pointing out which matches/categorizations are correct (mark with "✓") and which are incorrect (mark with "✗")
2. For incorrect matches, clearly state what the correct match should be
3. Use a friendly, professional tone
4. Must mention a specific knowledge point
5. Do not use attacking or sarcastic expressions
6. If incorrect, kindly explain the correct concept and why

**Important**: Feedback must clearly list:
- Correct matches/categorizations (if any)
- Incorrect matches/categorizations (if any)
- What each incorrect match should be

**CRITICAL: Output feedback in English ONLY. Do NOT use Chinese.**

Output only the feedback text, not JSON format.
`;
}

export function getSummaryTemplate(results: Array<{
  concept: string;
  type: QuestionType;
  result: 'correct' | 'partial' | 'incorrect';
  userAnswer: any;
  correctAnswer: any;
}>): string {
  const correctConcepts = results.filter(r => r.result === 'correct').map(r => r.concept);
  const incorrectConcepts = results.filter(r => r.result === 'incorrect').map(r => r.concept);
  const partialConcepts = results.filter(r => r.result === 'partial').map(r => r.concept);
  
  // 构建详细的答题记录，包含更多上下文
  const detailedResults = results.map((r, idx) => {
    // 分析用户的答题模式
    let analysis = '';
    if (r.result === 'partial') {
      analysis = 'Partially correct, indicating some understanding but incomplete';
    } else if (r.result === 'incorrect') {
      analysis = 'Completely incorrect, may have conceptual misunderstandings';
    } else {
      analysis = 'Completely correct, solid grasp of the concept';
    }
    
    return `Question ${idx + 1}:
- Concept: ${r.concept}
- Type: ${getTypeName(r.type)}
- Result: ${r.result === 'correct' ? 'Correct' : r.result === 'partial' ? 'Partially correct' : 'Incorrect'}
- Analysis: ${analysis}
- User's answer: ${JSON.stringify(r.userAnswer)}
- Correct answer: ${JSON.stringify(r.correctAnswer)}`;
  }).join('\n\n');
  
  // 分析答题模式
  const patterns = [];
  if (partialConcepts.length > 0) {
    patterns.push(`Many partially correct cases (${partialConcepts.length} questions), indicating shallow understanding`);
  }
  if (incorrectConcepts.length > 0) {
    patterns.push(`Completely incorrect cases (${incorrectConcepts.length} questions), may have fundamental misunderstandings`);
  }
  if (correctConcepts.length === results.length) {
    patterns.push('All questions answered correctly, very solid foundation');
  }
  
  // 获取知识库内容作为参考
  const knowledgeBaseContext = `
**AI/ML Knowledge Base Reference:**

**LLM Concepts:**
- Large Language Models work through next-word prediction, trained on massive text corpora
- Pre-training: learning general patterns from large-scale general data
- Fine-tuning/Instruction tuning: continued training on specific tasks or styles
- Context windows: the amount of text a model can process at once
- Tokenization: breaking text into smaller units (tokens) for processing
- LLMs are not "conscious" - they predict text based on statistical patterns

**Prompt Engineering:**
- Effective prompts use clear instructions, examples (few-shot learning), and structured formats
- Common patterns: chain-of-thought, role-playing, step-by-step reasoning
- Prompt quality directly affects output quality - not "magic spells" but structured instructions

**Deep Learning:**
- Neural networks: interconnected layers of nodes (neurons) that learn patterns
- Activation functions: introduce non-linearity (ReLU, sigmoid, tanh)
- Backpropagation: how networks learn by adjusting weights based on errors
- Deep learning is a subset of machine learning using multi-layer neural networks

**RAG (Retrieval-Augmented Generation):**
- Combines retrieval (finding relevant information) with generation (creating responses)
- Uses vector databases to store and search embeddings
- Semantic search: finding information by meaning, not just keywords
- Enables LLMs to access up-to-date or domain-specific information

**Responsible AI:**
- Bias: models can perpetuate or amplify biases in training data
- Safety: ensuring AI systems don't produce harmful outputs
- Quality evaluation: checking outputs for accuracy, relevance, and appropriateness
- Ethical considerations: privacy, transparency, accountability

**Machine Learning Basics:**
- Supervised learning: learning from labeled examples
- Unsupervised learning: finding patterns in unlabeled data
- AI > Machine Learning > Deep Learning: hierarchical relationship
`;

  return `
You are an AI literacy education expert with deep knowledge of AI/ML concepts. You need to deeply analyze the user's quiz performance and generate a comprehensive, insightful diagnostic report.

${knowledgeBaseContext}

The user completed an AI literacy assessment test. Here are the detailed quiz records:

${detailedResults}

Statistics:
- Well-mastered concepts: ${correctConcepts.join(', ') || 'None'}
- Partially mastered concepts: ${partialConcepts.join(', ') || 'None'}
- Easily misunderstood concepts: ${incorrectConcepts.join(', ') || 'None'}
- Answer patterns: ${patterns.join('; ') || 'No obvious pattern'}

**CRITICAL REQUIREMENTS:**

1. **Deep Analysis Required**: Think deeply about the user's performance patterns. Analyze WHY they struggled with certain concepts and what this reveals about their understanding level. Don't just list concepts - provide insights.

2. **Reference Knowledge Base**: When discussing concepts, you MUST reference specific knowledge points from the knowledge base above. For example:
   - If they struggled with LLM: explain next-word prediction, pre-training vs fine-tuning
   - If they struggled with RAG: explain retrieval mechanisms, vector databases, semantic search
   - If they struggled with Deep Learning: explain neural network architecture, activation functions
   - Make your analysis specific and educational, referencing actual technical concepts

3. **Actionable Insights**: Provide insights that help the user understand:
   - What specific misunderstandings they have (be specific about the misconception)
   - What the correct understanding should be (reference knowledge base)
   - Why these concepts are important in practice
   - How to bridge their knowledge gaps (specific learning paths)

4. **Language**: ALL content MUST be in English, no exceptions.

Please generate a comprehensive diagnostic summary in JSON format:
{
  "overall": "A specific, insightful overall assessment (150-200 characters). Be precise about the user's actual level based on their specific answers, not vague. Reference specific concepts they struggled with and what this indicates.",
  "highlights": [
    "Highlight 1 (100-120 characters): Specifically explain what the user mastered based on their actual answers, why it's important (reference knowledge base), and what it indicates about their understanding",
    "Highlight 2 (100-120 characters): Another specific strength with educational context, based on their actual performance"
  ],
  "blindspots": [
    "Blind spot 1 (100-120 characters): Specifically explain where the user's understanding is wrong based on their actual answers, what the correct understanding should be (reference knowledge base), and why this matters",
    "Blind spot 2 (100-120 characters): Another specific weakness with educational context and knowledge base references, based on their actual mistakes"
  ],
  "suggestions": [
    "Suggestion 1 (120-150 characters): Be specific and actionable, targeting specific concepts the user struggled with. Reference learning approaches from knowledge base",
    "Suggestion 2 (120-150 characters): Another specific, actionable recommendation with knowledge base context, addressing their specific weak points"
  ],
  "detailedAnalysis": "A comprehensive analysis (700-900 characters) that MUST include: 1. User's overall level assessment with specific evidence from their actual answers - quote or reference what they answered (2-3 sentences) 2. Deep analysis of core weak points - explain the concepts they misunderstood based on their actual answers, what the correct understanding is (reference knowledge base), and why it matters (3-4 sentences) 3. Specific improvement roadmap - how to address each weak point based on their actual performance, what to learn first, and how concepts connect (2-3 sentences). Throughout, reference specific AI/ML knowledge points from the knowledge base above and their actual answer patterns.",
  "radarData": {
    "categories": ["Category1", "Category2", "Category3", "Category4", "Category5", "Category6"],
    "scores": [score1, score2, score3, score4, score5, score6]
  },
  "learningResources": []
}

**CRITICAL for radarData**:
- Analyze the user's performance across different concept areas
- Generate 4-6 categories based on the concepts they answered questions about
- Calculate scores (0-100) for each category based on their actual performance
- Categories should be meaningful (e.g., "LLM Basics", "Prompt Engineering", "RAG", "Responsible AI", etc.)
- Scores should reflect: correct=100, partial=50, incorrect=0, then average per category

**Quality Standards:**
- Be specific, not generic. Reference actual concepts and knowledge points from the knowledge base.
- Show deep understanding of AI/ML education, not surface-level observations.
- Provide educational value - help the user understand WHY, not just WHAT.
- All content in English only.
- detailedAnalysis should be comprehensive and insightful (700-900 characters), referencing knowledge base throughout.
`;
}

export function getTypeName(type: QuestionType): string {
  const map: Record<QuestionType, string> = {
    match: 'Matching',
    bucket: 'Categorization',
    mcq: 'Multiple Choice',
    discernment: 'True/False',
    short_answer: 'Short Answer',
  };
  return map[type];
}

