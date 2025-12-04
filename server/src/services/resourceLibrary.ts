import { LearningResource } from '../types/question.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ResourceEntry {
  id: string;
  type: 'Article' | 'Video';
  title: string;
  link: string;
  focus: string;
  concepts: string[]; // 关联的概念
}

// 概念映射：将答题结果中的概念映射到资源库中的关键词
const CONCEPT_MAPPING: Record<string, string[]> = {
  // LLM相关
  'LLM': ['LLM', 'Large Language Model', '大语言模型', 'language model', 'next word prediction'],
  'LLM_structure': ['LLM', 'structure', 'architecture', '结构', '架构'],
  'LLM_training': ['training', 'train', '训练', 'pretraining', 'pre-training'],
  'LLM_application': ['application', 'use case', '应用', '场景'],
  
  // 提示词工程
  'prompt': ['prompt', '提示词', 'Prompt Engineering', 'prompt engineering'],
  'prompt_engineering': ['prompt engineering', '提示词工程', 'Prompt Engineering'],
  'prompt_patterns': ['prompt pattern', '提示模式', 'template'],
  
  // 深度学习
  'deep_learning': ['Deep Learning', '深度学习', 'deep learning'],
  'neural_network': ['Neural Network', 'neural network', '神经网络', 'neuron', 'layer'],
  'activation': ['activation', '激活', 'Activation'],
  'neural_layers': ['layer', '层', 'Layer'],
  
  // 机器学习
  'machine_learning': ['Machine Learning', '机器学习', 'ML', 'machine learning'],
  'supervised_learning': ['Supervised Learning', 'supervised learning', '监督学习', 'labeled data'],
  'unsupervised_learning': ['Unsupervised Learning', 'unsupervised learning', '无监督学习'],
  'labeled_data': ['labeled data', '标注数据', 'label'],
  
  // AI/ML/DL关系
  'AI_ML_DL_relation': ['AI', 'ML', 'DL', 'Artificial Intelligence', '机器学习', '深度学习', 'vs'],
  
  // RAG
  'RAG': ['RAG', 'Retrieval-Augmented Generation', '检索增强生成', 'retrieval augmented'],
  'RAG_workflow': ['RAG', 'workflow', '流程', 'process'],
  
  // Embedding
  'embedding': ['Embedding', 'embedding', '向量', 'Vector', 'vector embedding'],
  'vector_database': ['Vector Database', 'vector database', '向量数据库'],
  'semantic_search': ['semantic search', '语义检索', 'Semantic'],
  
  // Transformer
  'transformer': ['Transformer', 'transformer', 'Transformer Model'],
  'self_attention': ['Self-Attention', 'self-attention', '自注意力', 'attention mechanism'],
  
  // Context Window & Token
  'context_window': ['Context Window', 'context window', '上下文窗口', 'context length'],
  'token': ['Token', 'token', 'tokenization', 'Tokenization'],
  'tokenization': ['Tokenization', 'tokenization', 'tokenize', 'Token化'],
  
  // Fine-Tuning
  'finetuning': ['Fine-Tuning', 'fine-tuning', '微调', 'Fine Tuning', 'fine tuning'],
  'fine_tuning_reason': ['fine-tuning', 'why', 'reason', '为什么', '微调'],
  'fine_tuning_process': ['fine-tuning', 'process', '流程', '微调'],
  
  // Responsible AI
  'responsible_AI': ['Responsible', 'responsible', '安全', '责任', '合规', 'Responsible AI', 'guidelines'],
  'AI_safety': ['safety', '安全', 'Safety', 'secure'],
  'AI_quality_check': ['quality', 'Quality', 'evaluation', '评估', 'check', '检查'],
};

// 资源库缓存
let resourceCache: ResourceEntry[] | null = null;

/**
 * 解析资源库文件
 */
function parseResourceLibrary(): ResourceEntry[] {
  if (resourceCache) {
    return resourceCache;
  }

  // 计算项目根目录路径
  // __dirname 是 server/src/services
  // 需要回到项目根目录：server/src/services -> server/src -> server -> 根目录
  const projectRoot = path.join(__dirname, '../../../');
  const resourceFilePath = path.join(projectRoot, '资源库.txt');
  
  console.log('📂 资源库文件路径:', resourceFilePath);
  
  try {
    const content = fs.readFileSync(resourceFilePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    const resources: ResourceEntry[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      // 解析Tab分隔的数据
      const parts = line.split('\t');
      if (parts.length < 4) {
        // 如果当前行不是数据行，可能是上一行的focus描述，跳过
        continue;
      }
      
      const id = parts[0].trim();
      if (!id || id === '') continue; // 跳过空ID
      
      const type = (parts[1].trim() as 'Article' | 'Video');
      const title = parts[2].trim();
      const link = parts[3].trim();
      
      // Focus可能在当前行的第5列，或者在下一行
      let focus = '';
      if (parts.length > 4 && parts[4].trim()) {
        focus = parts[4].trim();
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // 如果下一行不是数据行（不包含Tab或Tab数量少于4），可能是focus描述
        if (nextLine && !nextLine.includes('\t') && nextLine.split('\t').length < 4) {
          focus = nextLine;
          i++; // 跳过下一行
        }
      }
      
      // 根据focus和title提取关联的概念
      const concepts: string[] = [];
      const searchText = `${title} ${focus}`.toLowerCase();
      
      for (const [concept, keywords] of Object.entries(CONCEPT_MAPPING)) {
        for (const keyword of keywords) {
          if (searchText.includes(keyword.toLowerCase())) {
            concepts.push(concept);
            break;
          }
        }
      }
      
      resources.push({
        id,
        type,
        title,
        link,
        focus,
        concepts: [...new Set(concepts)], // 去重
      });
    }
    
    resourceCache = resources;
    console.log(`📚 成功加载 ${resources.length} 个资源`);
    return resources;
  } catch (error) {
    console.error('❌ 读取资源库文件失败:', error);
    return [];
  }
}

/**
 * 根据薄弱概念推荐学习资源
 */
export function getLearningResourcesForConcepts(weakConcepts: string[]): LearningResource[] {
  const resources = parseResourceLibrary();
  
  if (resources.length === 0) {
    console.warn('⚠️ 资源库为空，无法推荐资源');
    return [];
  }
  
  // 为每个薄弱概念找到匹配的资源
  const matchedResources = new Map<string, ResourceEntry>();
  
  for (const concept of weakConcepts) {
    // 查找匹配的资源
    const matchingResources = resources.filter(r => {
      // 检查概念映射
      if (r.concepts.includes(concept)) {
        return true;
      }
      // 检查focus和title中是否包含概念关键词
      const searchText = `${r.title} ${r.focus}`.toLowerCase();
      const keywords = CONCEPT_MAPPING[concept] || [];
      return keywords.some(kw => searchText.includes(kw.toLowerCase()));
    });
    
    // 优先选择未匹配的资源
    for (const resource of matchingResources) {
      if (!matchedResources.has(resource.id)) {
        matchedResources.set(resource.id, resource);
        break; // 每个概念只匹配一个资源
      }
    }
  }
  
  // 如果匹配的资源不足3个，随机补充
  if (matchedResources.size < 3) {
    const remaining = resources.filter(r => !matchedResources.has(r.id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    const needed = 3 - matchedResources.size;
    
    for (let i = 0; i < needed && i < shuffled.length; i++) {
      matchedResources.set(shuffled[i].id, shuffled[i]);
    }
  }
  
  // 转换为LearningResource格式
  const learningResources: LearningResource[] = Array.from(matchedResources.values())
    .slice(0, 3) // 最多3个
    .map(r => ({
      title: r.title,
      url: r.link,
      type: r.type === 'Video' ? 'video' : 'article',
      description: r.focus || `Learning resource about ${r.title}`,
    }));
  
  console.log(`✅ 为 ${weakConcepts.length} 个薄弱概念推荐了 ${learningResources.length} 个资源`);
  return learningResources;
}

