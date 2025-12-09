import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Types
interface CreateAgentRequest {
  projectName: string;
  websiteUrl: string;
  whitepaper?: Buffer | string;
  botToken: string;
  additionalInfo?: string;
  personality: 'funny' | 'professional' | 'technical' | 'casual' | 'custom';
  customPersonality?: string;
  customFaqs: string;
  triggers: string[];
  pricingTier: 'starter' | 'pro' | 'enterprise';
}

interface BotConfig {
  projectName: string;
  knowledgeBase: Record<string, any>;
  personality: string;
  triggers: string[];
}

// Extract knowledge from website and whitepaper
async function extractProjectInfo(
  websiteUrl: string,
  whitepaperText?: string
): Promise<Record<string, any>> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Fetch website content
    let websiteContent = '';
    try {
      const response = await fetch(websiteUrl);
      const html = await response.text();
      // Extract text from HTML (simple regex, in production use cheerio or similar)
      websiteContent = html.replace(/<[^>]*>/g, ' ').slice(0, 3000);
    } catch (error) {
      console.error('Error fetching website:', error);
    }

    // Create extraction prompt
    const prompt = `Extract key information about this project and format as JSON:

Website Content:
${websiteContent}

${whitepaperText ? `\nWhitepaper Content:\n${whitepaperText.slice(0, 2000)}` : ''}

Please extract and return ONLY valid JSON with these fields:
{
  "projectName": "project name",
  "description": "short description",
  "tokenomics": {
    "name": "token name",
    "ticker": "TICKER",
    "totalSupply": "amount",
    "distribution": {}
  },
  "features": ["feature1", "feature2"],
  "roadmap": [
    {"phase": "Phase 1", "timeline": "timeframe", "details": "what"}
  ],
  "team": "team members if found",
  "socialLinks": {
    "website": "",
    "twitter": "",
    "telegram": ""
  },
  "faqs": {
    "question1": "answer1"
  }
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      projectName: 'Unknown Project',
      description: 'Project information could not be extracted',
      features: []
    };
  } catch (error) {
    console.error('Error extracting project info:', error);
    return {
      projectName: 'Unknown Project',
      description: 'Error extracting information',
      features: []
    };
  }
}

// Generate personality prompt based on style
function generatePersonalityPrompt(
  style: string,
  customPersonality?: string,
  projectInfo?: Record<string, any>
): string {
  const projectName = projectInfo?.projectName || 'the project';

  const styles = {
    funny: `You are a funny, witty AI assistant for ${projectName}. Use crypto slang (ser, gm, wagmi), make jokes, be sarcastic but helpful. Use emojis occasionally.`,
    professional: `You are a professional, formal AI assistant for ${projectName}. Provide detailed, informative responses. Be courteous and maintain a business-like tone.`,
    technical: `You are a technical AI assistant for ${projectName}. Focus on detailed explanations, code examples, and technical specifications. Be thorough and precise.`,
    casual: `You are a casual, friendly AI assistant for ${projectName}. Be approachable and conversational. Use casual language and be encouraging.`,
    custom: customPersonality || `You are an AI assistant for ${projectName}.`
  };

  return styles[style as keyof typeof styles] || styles.funny;
}

// Generate bot configuration file
function generateBotConfig(config: BotConfig): string {
  return `import { GoogleGenerativeAI } from '@google/generative-ai';

const PROJECT_KNOWLEDGE_BASE = ${JSON.stringify(config.knowledgeBase, null, 2)};

const PERSONALITY_PROMPT = \`${config.personality}\`;

const CUSTOM_TRIGGERS = ${JSON.stringify(config.triggers, null, 2)};

export async function generateResponse(message: string, userId: number, userName: string): Promise<string> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      systemInstruction: PERSONALITY_PROMPT + '\\n\\nProject Information: ' + JSON.stringify(PROJECT_KNOWLEDGE_BASE)
    });

    const response = await model.generateContent(message);
    return response.response.text();
  } catch (error) {
    console.error('API Error:', error);
    return "Oops! Something went wrong. Can you try again? 🤖⚡";
  }
}

export function shouldRespond(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CUSTOM_TRIGGERS.some((trigger: string) => lowerText.includes(trigger.toLowerCase()));
}`;
}

// Main handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      projectName,
      websiteUrl,
      botToken,
      additionalInfo,
      personality,
      customPersonality,
      customFaqs,
      triggers,
      pricingTier
    } = req.body as CreateAgentRequest;

    // Validate inputs
    if (!projectName || !websiteUrl || !botToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract project information
    const projectInfo = await extractProjectInfo(websiteUrl);

    // Generate personality prompt
    const personalityPrompt = generatePersonalityPrompt(personality, customPersonality, projectInfo);

    // Parse custom FAQs
    const faqs: Record<string, string> = {};
    const faqLines = customFaqs.split('\n');
    for (let i = 0; i < faqLines.length; i += 2) {
      const qLine = faqLines[i]?.trim();
      const aLine = faqLines[i + 1]?.trim();
      if (qLine?.startsWith('Q:') && aLine?.startsWith('A:')) {
        faqs[qLine.slice(2).trim()] = aLine.slice(2).trim();
      }
    }

    // Merge with extracted FAQs
    const allFaqs = { ...projectInfo.faqs, ...faqs };

    // Create bot configuration
    const botConfig: BotConfig = {
      projectName,
      knowledgeBase: {
        ...projectInfo,
        faqs: allFaqs,
        customTriggers: triggers,
        additionalContext: additionalInfo || ''
      },
      personality: personalityPrompt,
      triggers: [...(projectInfo.features || []), ...triggers]
    };

    // Generate bot config
    generateBotConfig(botConfig);

    // Save bot configuration (in production, save to database)
    console.log(`Created bot for ${projectName} with tier ${pricingTier}`);

    // TODO: In production:
    // 1. Save config to database
    // 2. Deploy to Vercel
    // 3. Configure webhook with Telegram
    // 4. Setup billing

    // Mock response - in production this would trigger actual deployment
    return res.status(200).json({
      success: true,
      botInfo: {
        username: `${projectName.toLowerCase().replace(/\s+/g, '_')}_bot`,
        token: botToken.slice(0, 10) + '...',
        status: 'pending',
        estimatedDeployment: '2 hours'
      },
      message: 'Bot creation initiated. You will receive an email when it\'s ready.'
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Failed to create bot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
