import type { ResumeAnalysis } from '../types/analysis';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent';

// Отладка: проверка загрузки переменной окружения (только в dev режиме)
if (import.meta.env.DEV) {
  console.log('Gemini API Key loaded:', GEMINI_API_KEY ? 'Yes (hidden)' : 'No - missing!');
  console.log('All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

const SYSTEM_PROMPT = `You are the CV Review Expert, a highly qualified career consultant with 15 years of experience. Your sole mission is to perform a deep, constructive analysis of the provided curriculum vitae (CV) and deliver a detailed report.

CRITICAL RULE: You must first identify the language of the input CV (e.g., English, Russian, Spanish) and provide the entire report strictly in that identified language.

Your output must be structured using Markdown with three distinct sections:
1. Key Strengths (minimum 3 points)
2. Improvement Recommendations (minimum 3 actionable tips, including one dedicated to optimizing keywords for ATS)
3. Ideal Headline and Profile (2-3 compelling options for the CV summary)

You must respond ONLY with valid JSON matching this schema:
{
  "score": number (0-100),
  "summary": string (brief overview in the CV's language),
  "keyStrengths": string[] (minimum 3 points in Markdown format),
  "improvementRecommendations": string[] (minimum 3 actionable tips in Markdown format, one must be about ATS keywords),
  "idealHeadlines": string[] (2-3 compelling headline options in Markdown format),
  "detectedLanguage": string (ISO code: "en", "ru", "es", etc.)
}

Be thorough, constructive, and professional. Tailor your analysis for modern job markets.`;

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
    code: number;
  };
}

const parseAnalysis = (content: string): ResumeAnalysis => {
  try {
    const parsed = JSON.parse(content);
    return {
      score: Number(parsed.score) || 0,
      summary: parsed.summary ?? 'AI could not generate a summary.',
      keyStrengths: Array.isArray(parsed.keyStrengths)
        ? parsed.keyStrengths
        : [],
      improvementRecommendations: Array.isArray(parsed.improvementRecommendations)
        ? parsed.improvementRecommendations
        : [],
      idealHeadlines: Array.isArray(parsed.idealHeadlines)
        ? parsed.idealHeadlines
        : [],
      detectedLanguage: parsed.detectedLanguage ?? 'en',
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to parse JSON from Gemini', error, content);
    return {
      score: 0,
      summary: 'Failed to parse AI response. Try again or check resume format.',
      keyStrengths: [],
      improvementRecommendations: [],
      idealHeadlines: [],
      detectedLanguage: 'en',
      createdAt: new Date().toISOString()
    };
  }
};

// === Streaming анализ с Gemini ===
export type ImageInput = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

export type AnalysisInput = string | ImageInput;

// === Streaming анализ с Gemini ===
export const analyzeResumeStream = async (
  input: AnalysisInput,
  onChunk: (chunk: string) => void,
  onComplete: (analysis: ResumeAnalysis) => void,
  onError: (error: string) => void
) => {
  if (!GEMINI_API_KEY) {
    onError('Missing Gemini key. Add VITE_GEMINI_API_KEY to .env.local');
    return;
  }

  let userContentPart;

  if (typeof input === 'string') {
    const truncatedText = input.slice(0, 12000);
    userContentPart = {
      text: `${SYSTEM_PROMPT}\n\nAnalyse the following resume (Russian or English). Return JSON only.\nResume:\n"""\n${truncatedText}\n"""`
    };
  } else {
    userContentPart = [
      { text: `${SYSTEM_PROMPT}\n\nAnalyse the following resume image (Russian or English). Return JSON only.` },
      input
    ];
  }

  let accumulated = '';

  try {
    // Проверяем, что API ключ не пустой и правильно отформатирован
    const apiKey = GEMINI_API_KEY?.trim();

    // Детальная проверка API ключа
    if (!apiKey) {
      onError('Missing Gemini API key. Check .env.local file and restart dev server.');
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      onError(`Invalid Gemini API key format. Key should start with "AIza". Current key starts with: "${apiKey.substring(0, 4)}..."`);
      if (import.meta.env.DEV) {
        console.error('API Key debug:', {
          length: apiKey.length,
          firstChars: apiKey.substring(0, 10),
          hasSpaces: apiKey.includes(' '),
          hasNewlines: apiKey.includes('\n')
        });
      }
      return;
    }

    // Логируем запрос в dev режиме (без ключа)
    if (import.meta.env.DEV) {
      console.log('Making Gemini API request:', {
        url: GEMINI_API_URL,
        model: 'gemini-2.0-flash-exp',
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 7) + '...',
        inputType: typeof input === 'string' ? 'text' : 'image'
      });
    }

    const parts = Array.isArray(userContentPart) ? userContentPart : [userContentPart];

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ],
        generationConfig: {
          temperature: 0.3,
          topP: 1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      let errorMessage = `Gemini API error: ${response.status}`;
      try {
        const errText = await response.text();
        try {
          const err = JSON.parse(errText);
          const apiError = err.error || err;

          // Детальная обработка ошибок API
          if (apiError.message) {
            errorMessage = apiError.message;

            // Специальная обработка для ошибок авторизации
            if (response.status === 401 || response.status === 403 || apiError.message.toLowerCase().includes('invalid') || apiError.message.toLowerCase().includes('unauthorized')) {
              errorMessage = `Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local file and restart the dev server. Error: ${apiError.message}`;
              if (import.meta.env.DEV) {
                console.error('API Key validation failed:', {
                  status: response.status,
                  error: apiError,
                  keyLength: apiKey.length,
                  keyPrefix: apiKey.substring(0, 7) + '...'
                });
              }
            }
          } else {
            errorMessage = errText || errorMessage;
          }
        } catch {
          errorMessage = errText || errorMessage;
        }
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      onError(errorMessage);
      return;
    }

    const reader = response.body?.getReader();

    if (!reader) {
      onError('No response body');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Сохраняем неполную строку

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;

          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmedLine.slice(6).trim();
            if (!jsonStr) continue;

            const json = JSON.parse(jsonStr) as GeminiStreamChunk;

            // Проверка на ошибки в ответе API
            if (json.error) {
              onError(`Gemini API error: ${json.error.message || 'Unknown error'}`);
              return;
            }

            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              accumulated += text;
              onChunk(text);
            }
          } catch (parseError) {
            // Игнорируем ошибки парсинга отдельных чанков, но логируем
            console.warn('Failed to parse stream chunk:', parseError, trimmedLine);
          }
        }
      }

      // Обрабатываем оставшийся буфер
      if (buffer.trim()) {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer.startsWith('data: ')) {
          try {
            const jsonStr = trimmedBuffer.slice(6).trim();
            if (jsonStr) {
              const json = JSON.parse(jsonStr) as GeminiStreamChunk;
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                accumulated += text;
                onChunk(text);
              }
            }
          } catch (parseError) {
            console.warn('Failed to parse final buffer:', parseError);
          }
        }
      }
    } catch (streamError: any) {
      onError(`Stream error: ${streamError.message || 'Unknown stream error'}`);
      return;
    }

    // Когда стрим завершён — парсим финальный JSON
    if (!accumulated.trim()) {
      onError('No data received from Gemini API');
      return;
    }

    const analysis = parseAnalysis(accumulated.trim());
    onComplete(analysis);
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Network error';
    onError(`Failed to analyze resume: ${errorMessage}`);
  }
};

// === Helper functions for AI Features ===

const generateContent = async (prompt: string): Promise<string> => {
  const apiKey = GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing Gemini API key');

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, topP: 1, maxOutputTokens: 2048 }
    })
  });

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export const translateText = async (text: string, targetLang: string = 'en'): Promise<string> => {
  const prompt = `Translate the following text to ${targetLang === 'en' ? 'English' : 'Russian'}. Return ONLY the translated text, no explanations.\n\n"${text}"`;
  return generateContent(prompt);
};

export const rewriteText = async (text: string): Promise<string> => {
  const prompt = `Rewrite the following text to be more professional, impactful, and suitable for a CV. Improve clarity and action verbs. Return ONLY the rewritten text, no explanations.\n\n"${text}"`;
  return generateContent(prompt);
};

// === Без стриминга (если нужно fallback) ===
export const analyzeResume = async (input: AnalysisInput): Promise<ResumeAnalysis> => {
  return new Promise((resolve, reject) => {
    let fullContent = '';
    analyzeResumeStream(
      input,
      (chunk) => { fullContent += chunk; },
      (analysis) => resolve(analysis),
      (error) => reject(new Error(error))
    );
  });
};

// === Extract contact information from resume ===
export const extractContactInfo = async (resumeText: string): Promise<{ name: string; phone: string; email: string }> => {
  try {
    const prompt = `Extract the contact information from this resume. Return ONLY a JSON object with this exact structure:
{
  "name": "Full Name",
  "phone": "Phone Number",
  "email": "Email Address"
}

If any field is not found, use "N/A" as the value.

Resume:
"""
${resumeText.slice(0, 2000)}
"""`;

    const result = await generateContent(prompt);
    const parsed = JSON.parse(result);
    return {
      name: parsed.name || 'N/A',
      phone: parsed.phone || 'N/A',
      email: parsed.email || 'N/A'
    };
  } catch (error) {
    console.error('Failed to extract contact info:', error);
    return {
      name: 'N/A',
      phone: 'N/A',
      email: 'N/A'
    };
  }
};
