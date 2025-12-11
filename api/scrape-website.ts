/**
 * Server-side website scraper API
 * 
 * This runs on Vercel's servers, bypassing CORS restrictions
 * that would block client-side fetching.
 * 
 * Endpoint: POST /api/scrape-website
 * Body: { url: string, projectName?: string }
 * Returns: { success: true, content: string, structured?: object }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Simple HTML to text extraction (no external dependencies)
function htmlToText(html: string): string {
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    // Remove style tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Remove head section
    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, ' ')
    // Remove nav sections (usually boilerplate)
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    // Remove footer (usually boilerplate)
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    // Replace common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    // Convert headers to emphasized text
    .replace(/<h[1-6][^>]*>/gi, '\n\n### ')
    .replace(/<\/h[1-6]>/gi, ' ###\n\n')
    // Convert list items
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    // Convert paragraphs and divs to newlines
    .replace(/<\/(p|div|section|article)>/gi, '\n\n')
    .replace(/<(p|div|section|article)[^>]*>/gi, '\n')
    // Convert breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode remaining HTML entities
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Clean up whitespace
    .replace(/[ \t]+/g, ' ')           // Multiple spaces to single
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Multiple newlines to double
    .replace(/^\s+|\s+$/gm, '')         // Trim each line
    .trim();
}

// Structure the content using Gemini AI
async function structureContent(
  textContent: string, 
  projectName: string
): Promise<Record<string, any>> {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('[SCRAPER] No Gemini API key, returning raw content');
    return { rawContent: textContent };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // Use more content for structuring (up to 50K chars)
    const contentForAI = textContent.slice(0, 50000);

    const prompt = `Analyze this website content for "${projectName}" and extract key information.

IMPORTANT: Extract dates, numbers, and specific details EXACTLY as they appear. Do not interpret or modify them.

Website Content:
${contentForAI}

Return a JSON object with these fields (use empty array [] or null if not found):
{
  "description": "Brief 2-3 sentence project overview",
  "features": ["feature1", "feature2", ...],
  "tokenomics": {
    "ticker": "...",
    "totalSupply": "...",
    "distribution": "..."
  },
  "presale": {
    "dates": "EXACT dates as written (e.g., 'Dec 25 - Jan 15')",
    "price": "...",
    "softCap": "...",
    "hardCap": "..."
  },
  "roadmap": [
    {"phase": "...", "date": "...", "items": ["..."]}
  ],
  "team": ["member1 - role", "member2 - role"],
  "socialLinks": {
    "twitter": "...",
    "telegram": "...",
    "discord": "...",
    "website": "..."
  },
  "faqs": [
    {"question": "...", "answer": "..."}
  ],
  "keyDates": {
    "presaleStart": "EXACT date",
    "presaleEnd": "EXACT date",
    "tokenLaunch": "EXACT date"
  }
}

Rules:
- Extract dates EXACTLY as written (e.g., "DEC 25", "Q1 2026", "Jan 15")
- Include ALL numbers and percentages verbatim
- If field not found, use null or empty array
- Return ONLY valid JSON, no markdown code blocks`;

    console.log('[SCRAPER] Calling Gemini to structure data...');
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const structured = JSON.parse(responseText);
    
    // Always include raw content as backup
    structured.rawContent = textContent;
    structured.lastScraped = new Date().toISOString();
    
    console.log('[SCRAPER] Successfully structured data:', Object.keys(structured));
    return structured;
    
  } catch (error) {
    console.error('[SCRAPER] Error structuring with Gemini:', error);
    return { 
      rawContent: textContent,
      lastScraped: new Date().toISOString(),
      error: 'Failed to structure content, using raw text'
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, projectName = 'Unknown Project' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log('[SCRAPER] Scraping:', url);

    // Fetch the website (server-side, no CORS issues)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartSentinels Bot/1.0; +https://smartsentinels.net)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error('[SCRAPER] Failed to fetch:', response.status, response.statusText);
      return res.status(502).json({ 
        error: `Failed to fetch website: ${response.status} ${response.statusText}` 
      });
    }

    const html = await response.text();
    console.log('[SCRAPER] Fetched HTML:', html.length, 'bytes');

    // Convert HTML to text
    const textContent = htmlToText(html);
    console.log('[SCRAPER] Extracted text:', textContent.length, 'characters');

    if (textContent.length < 100) {
      return res.status(422).json({ 
        error: 'Could not extract meaningful content from website. The page may be JavaScript-rendered.',
        hint: 'Try adding key information manually in Custom FAQs or Additional Info fields.'
      });
    }

    // Structure the content with AI
    const structured = await structureContent(textContent, projectName);

    return res.status(200).json({
      success: true,
      content: textContent,
      structured,
      stats: {
        htmlBytes: html.length,
        textChars: textContent.length,
        scrapedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[SCRAPER] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to scrape website',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
