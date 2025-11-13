import axios from 'axios';
import type { ResumeAnalysis } from '../types/analysis';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are ResumeAI, an assistant that reviews resumes for recruiters and job seekers.
Your task: evaluate resume content and respond ONLY with valid JSON matching this schema:
{
  "score": number (0-100),
  "summary": string,
  "keywordRecommendations": string[],
  "structureTips": string[],
  "industryFit": string[],
  "warnings": string[]
}
Be concise, actionable, and tailored for tech and marketing roles.`;

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

const parseAnalysis = (content: string | null): ResumeAnalysis => {
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      score: Number(parsed.score) || 0,
      summary: parsed.summary ?? 'AI could not generate a concise summary.',
      keywordRecommendations: Array.isArray(parsed.keywordRecommendations)
        ? parsed.keywordRecommendations
        : [],
      structureTips: Array.isArray(parsed.structureTips) ? parsed.structureTips : [],
      industryFit: Array.isArray(parsed.industryFit) ? parsed.industryFit : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to parse JSON from OpenAI', error, content);
    return {
      score: 0,
      summary:
        'We could not parse the AI response. Please try again or check if the resume is formatted correctly.',
      keywordRecommendations: [],
      structureTips: [],
      industryFit: [],
      warnings: ['OpenAI returned a malformed JSON payload.'],
      createdAt: new Date().toISOString()
    };
  }
};

export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'Missing OpenAI key. Add VITE_OPENAI_API_KEY to your .env.local file before running.'
    );
  }

  const response = await axios.post<OpenAIChatResponse>(
    OPENAI_API_URL,
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyse the following resume (language may be Russian or English).
Return JSON as requested above.
Resume:
"""
${resumeText.slice(0, 12000)}
"""
`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = response.data.choices?.[0]?.message?.content ?? null;
  return parseAnalysis(content);
};

