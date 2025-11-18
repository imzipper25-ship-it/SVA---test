import type { ResumeAnalysis } from '../types/analysis';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent';

// Отладка: проверка загрузки переменной окружения (только в dev режиме)
if (import.meta.env.DEV) {
  console.log('Gemini API Key loaded:', GEMINI_API_KEY ? 'Yes (hidden)' : 'No - missing!');
  console.log('All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
}

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
      keywordRecommendations: Array.isArray(parsed.keywordRecommendations)
        ? parsed.keywordRecommendations
        : [],
      structureTips: Array.isArray(parsed.structureTips) ? parsed.structureTips : [],
      industryFit: Array.isArray(parsed.industryFit) ? parsed.industryFit : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to parse JSON from Gemini', error, content);
    return {
      score: 0,
      summary: 'Failed to parse AI response. Try again or check resume format.',
      keywordRecommendations: [],
      structureTips: [],
      industryFit: [],
      warnings: ['Gemini returned invalid JSON.'],
      createdAt: new Date().toISOString()
    };
  }
};

// === Streaming анализ с Gemini ===
export const analyzeResumeStream = async (
  resumeText: string,
  onChunk: (chunk: string) => void,
  onComplete: (analysis: ResumeAnalysis) => void,
  onError: (error: string) => void
) => {
  if (!GEMINI_API_KEY) {
    onError('Missing Gemini key. Add VITE_GEMINI_API_KEY to .env.local');
    return;
  }

  const truncatedText = resumeText.slice(0, 12000);
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
        model: 'gemini-pro',
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 7) + '...'
      });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nAnalyse the following resume (Russian or English). Return JSON only.\nResume:\n"""\n${truncatedText}\n"""`
              }
            ]
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

// === Без стриминга (если нужно fallback) ===
export const analyzeResume = async (resumeText: string): Promise<ResumeAnalysis> => {
  return new Promise((resolve, reject) => {
    let fullContent = '';
    analyzeResumeStream(
      resumeText,
      (chunk) => { fullContent += chunk; },
      (analysis) => resolve(analysis),
      (error) => reject(new Error(error))
    );
  });
};
