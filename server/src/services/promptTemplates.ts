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

export function getQuestionTemplate(type: QuestionType, concept: string, conceptDescription?: string): string {
  const conceptContext = conceptDescription ? `Concept Description: ${conceptDescription}` : '';
  
  const basePrompt = `
You are an AI literacy education expert. Generate a ${getTypeName(type)} question to test the user's understanding of the "${concept}" concept.

${conceptContext}

${KNOWLEDGE_SCOPE}

${OUTPUT_REQUIREMENTS}

**Important Requirements:**
- Question content should be novel and diverse, avoiding repetitive common examples
- Can be combined with practical application scenarios (work, study, life)
- Can design some counter-intuitive but important edge cases
- Question wording should be vivid and interesting, avoiding dullness
- **MANDATORY: Generate ALL content in English - question text, options, explanations, everything**
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
      throw new Error(`未知题型: ${type}`);
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
1. **MUST analyze based on the user's specific answer content**, pointing out which parts of the answer demonstrate correct understanding of the concept
2. If the answer is incomplete, point out which key points are missing
3. If the answer is incorrect, kindly point out the problems and explain the correct understanding
4. Use a friendly, encouraging tone, and can provide improvement suggestions
5. Must mention a specific knowledge point
6. Do not use attacking or sarcastic expressions
7. **CRITICAL: Output feedback in English ONLY**

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
  
  return `
You are an AI literacy education expert who needs to deeply analyze the user's quiz performance and generate a detailed diagnostic report.

The user completed an AI literacy assessment test. Here are the detailed quiz records:

${detailedResults}

Statistics:
- Well-mastered concepts: ${correctConcepts.join(', ') || 'None'}
- Partially mastered concepts: ${partialConcepts.join(', ') || 'None'}
- Easily misunderstood concepts: ${incorrectConcepts.join(', ') || 'None'}
- Answer patterns: ${patterns.join('; ') || 'No obvious pattern'}

Please think deeply and generate a concise and effective diagnostic summary in JSON format:
{
  "overall": "One overall assessment (within 150 characters, be specific, don't be vague, point out the user's real level)",
  "highlights": ["Highlight 1 (within 100 characters, specifically explain what the user has mastered and why it's important)", "Highlight 2 (within 100 characters)"],
  "blindspots": ["Blind spot 1 (within 100 characters, specifically explain where the user's understanding is wrong and why)", "Blind spot 2 (within 100 characters)"],
  "suggestions": ["Suggestion 1 (within 120 characters, be specific and actionable, targeting specific concepts)", "Suggestion 2 (within 120 characters)"],
  "detailedAnalysis": "A concise analysis (450-600 characters), must include: 1. User's overall level (1-2 sentences, be specific) 2. Core weak points analysis (1-2 sentences, point out key problems) 3. How to improve (1-2 sentences, give specific directions)",
  "learningResources": []
}

Important requirements:
- All content should be concise and effective, don't pad length
- overall should be specific but concise (within 150 characters)
- highlights and blindspots each 1-2 items, each within 100 characters
- suggestions should be specific and actionable (each within 120 characters)
- detailedAnalysis should be concise (450-600 characters), not exceeding 600 characters, focus on core issues
- Avoid repetition and redundancy, each part should be valuable
- learningResources leave empty for now, will be generated separately
- **CRITICAL: ALL content MUST be in English**
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

