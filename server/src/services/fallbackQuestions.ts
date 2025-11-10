import { Question, QuestionType } from '../types/question.js';

/**
 * 降级方案：静态题目库
 * 当 API 调用失败时使用
 */

const FALLBACK_QUESTIONS: Record<string, Question[]> = {
  match: [
    {
      type: 'match',
      question_text: 'Match the terms on the left with the explanations on the right',
      options_left: [
        { id: 'A', text: 'LLM' },
        { id: 'B', text: 'Pre-training' },
        { id: 'C', text: 'Prompt' }
      ],
      options_right: [
        { id: '1', text: 'Language model pre-trained on large amounts of text' },
        { id: '2', text: 'Learning general patterns on large-scale data' },
        { id: '3', text: 'Instructions or context given to the model' }
      ],
      answer_key: [['A', '1'], ['B', '2'], ['C', '3']],
      short_explanation: 'LLM is a large language model, pre-training is the training method, and Prompt is the input instruction.',
      concept: 'LLM'
    },
    {
      type: 'match',
      question_text: 'Match the AI-related concepts on the left with the explanations on the right',
      options_left: [
        { id: 'A', text: 'AI' },
        { id: 'B', text: 'Machine Learning' },
        { id: 'C', text: 'Deep Learning' }
      ],
      options_right: [
        { id: '1', text: 'Technology that allows computers to learn from data' },
        { id: '2', text: 'Learning method using multi-layer neural networks' },
        { id: '3', text: 'Field of making machines simulate human intelligence' }
      ],
      answer_key: [['A', '3'], ['B', '1'], ['C', '2']],
      short_explanation: 'AI is the umbrella term, machine learning is a subset of AI, and deep learning is a subset of machine learning.',
      concept: 'AI_ML_DL_relation'
    }
  ],
  bucket: [
    {
      type: 'bucket',
      question_text: 'Drag the following tasks into the appropriate category buckets',
      cards: [
        { id: 'card1', text: 'Write product introduction copy' },
        { id: 'card2', text: 'Make important business decisions' },
        { id: 'card3', text: 'Summarize meeting notes' },
        { id: 'card4', text: 'Comfort a friend who is feeling down' }
      ],
      buckets: [
        { id: 'ai_ok', text: 'Suitable for AI' },
        { id: 'human_better', text: 'Better for humans' }
      ],
      answer_key: {
        card1: 'ai_ok',
        card2: 'human_better',
        card3: 'ai_ok',
        card4: 'human_better'
      },
      short_explanation: 'AI is suitable for text generation and summarization, but not for decision-making and emotional support.',
      concept: 'AI_capability_boundary'
    }
  ],
  mcq: [
    {
      type: 'mcq',
      question_text: 'Which statement about LLMs is closest to the truth?',
      options: [
        { id: 'A', text: 'LLMs are conscious artificial intelligence' },
        { id: 'B', text: 'LLMs are prediction models trained on large amounts of text' },
        { id: 'C', text: 'LLMs can completely replace human thinking' },
        { id: 'D', text: 'LLMs work without training' }
      ],
      correct_options: ['B'],
      short_explanation: 'LLMs are prediction models pre-trained on large amounts of text, not conscious artificial intelligence.',
      concept: 'LLM'
    },
    {
      type: 'mcq',
      question_text: 'What is the main difference between pre-training and fine-tuning?',
      options: [
        { id: 'A', text: 'Pre-training uses big data, fine-tuning uses small data' },
        { id: 'B', text: 'Pre-training learns general capabilities, fine-tuning targets specific tasks' },
        { id: 'C', text: 'Pre-training doesn\'t need data, fine-tuning needs data' },
        { id: 'D', text: 'There is no difference' }
      ],
      correct_options: ['B'],
      short_explanation: 'Pre-training learns on large-scale general data, fine-tuning continues training on specific task data.',
      concept: 'pretraining'
    }
  ],
  discernment: [
    {
      type: 'discernment',
      question_text: 'Determine whether the following statement is correct',
      statement: 'LLMs develop consciousness after training',
      correct_answer: false,
      short_explanation: 'LLMs are prediction models based on statistical patterns and do not develop consciousness.',
      concept: 'LLM'
    },
    {
      type: 'discernment',
      question_text: 'Determine whether the following statement is correct',
      statement: 'The more complex and mystical the prompt, the better the AI performs',
      correct_answer: false,
      short_explanation: 'Prompts should be clear and specific, not more complex is better. Good prompts are concrete, understandable instructions.',
      concept: 'prompt'
    }
  ],
  short_answer: [
    {
      type: 'short_answer',
      question_text: 'Please answer the question based on the following scenario',
      scenario: 'You are a product manager explaining to the technical team why a certain feature is suitable for AI implementation. This feature needs to extract key issues and suggestions from a large amount of user feedback.\n\nPlease briefly explain: 1) Why is this task suitable for AI? 2) What should be noted when using AI?',
      key_points: [
        'AI excels at processing large amounts of text data and extracting patterns',
        'Human review of AI-extracted results is needed',
        'Pay attention to data privacy and compliance'
      ],
      expected_length: '50-150 words',
      short_explanation: 'AI is suitable for processing large amounts of text data, but requires human review and attention to privacy compliance.',
      concept: 'LLM_application'
    },
    {
      type: 'short_answer',
      question_text: 'Please answer the question based on the following scenario',
      scenario: 'You are a student who wants to use AI to help complete homework. Your assignment is to write an essay on "The History of Artificial Intelligence Development."\n\nPlease explain: 1) How to properly use AI to assist with this task? 2) Which parts should you complete yourself?',
      key_points: [
        'AI can help collect information and organize thoughts',
        'Core viewpoints and arguments should be completed by yourself',
        'Fact-checking of AI-generated content is necessary'
      ],
      expected_length: '50-150 words',
      short_explanation: 'AI can assist with information collection, but core thinking and argumentation should be done by yourself, with fact-checking required.',
      concept: 'responsible_AI'
    }
  ]
};

/**
 * 获取降级题目
 */
export function getFallbackQuestion(type: QuestionType, questionIndex: number): Question | null {
  const questions = FALLBACK_QUESTIONS[type];
  if (!questions || questions.length === 0) {
    // 如果没有该题型的降级题目，尝试其他题型
    const allTypes: QuestionType[] = ['match', 'bucket', 'mcq', 'discernment', 'short_answer'];
    for (const altType of allTypes) {
      const altQuestions = FALLBACK_QUESTIONS[altType];
      if (altQuestions && altQuestions.length > 0) {
        const index = questionIndex % altQuestions.length;
        const question = altQuestions[index];
        // 修改类型以匹配请求
        const modifiedQuestion = JSON.parse(JSON.stringify(question));
        modifiedQuestion.type = type; // 保持请求的类型
        return modifiedQuestion;
      }
    }
    return null;
  }
  
  // 循环使用题目
  const index = questionIndex % questions.length;
  const question = questions[index];
  
  // 深拷贝避免修改原始数据
  return JSON.parse(JSON.stringify(question));
}

