import type { ResumeAnalysis } from '../types/analysis';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Отладка: проверка загрузки переменной окружения (только в dev режиме)
if (import.meta.env.DEV) {
  console.log('Groq API Key loaded:', GROQ_API_KEY ? 'Yes (hidden)' : 'No - missing!');
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

interface GroqStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
  error?: {
    message: string;
    type: string;
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
    console.warn('Failed to parse JSON from Groq', error, content);
    return {
      score: 0,
      summary: 'Failed to parse AI response. Try again or check resume format.',
      keywordRecommendations: [],
      structureTips: [],
      industryFit: [],
      warnings: ['Groq returned invalid JSON.'],
      createdAt: new Date().toISOString()
    };
  }
};

// === НОВАЯ ФУНКЦИЯ: Streaming анализ ===
export const analyzeResumeStream = async (
  resumeText: string,
  onChunk: (chunk: string) => void,
  onComplete: (analysis: ResumeAnalysis) => void,
  onError: (error: string) => void
) => {
  if (!GROQ_API_KEY) {
    onError('Missing Groq key. Add VITE_GROQ_API_KEY to .env.local');
    return;
  }

  const truncatedText = resumeText.slice(0, 12000);
  let accumulated = '';

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Analyse the following resume (Russian or English). Return JSON only.\nResume:\n"""\n${truncatedText}\n"""`
          }
        ],
        temperature: 0.3,
        max_tokens: 8192,
        top_p: 1,
        stream: true,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      let errorMessage = `Groq API error: ${response.status}`;
      try {
        const errText = await response.text();
        try {
          const err = JSON.parse(errText);
          errorMessage = err.error?.message || err.message || errText || errorMessage;
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
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
          
          if (!trimmedLine.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmedLine.slice(6).trim();
            if (!jsonStr) continue;

            const json = JSON.parse(jsonStr) as GroqStreamChunk;

            // Проверка на ошибки в ответе API
            if (json.error) {
              onError(`Groq API error: ${json.error.message || 'Unknown error'}`);
              return;
            }

            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              onChunk(delta);
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
        if (trimmedBuffer.startsWith('data: ') && trimmedBuffer !== 'data: [DONE]') {
          try {
            const jsonStr = trimmedBuffer.slice(6).trim();
            if (jsonStr) {
              const json = JSON.parse(jsonStr) as GroqStreamChunk;
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                onChunk(delta);
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
      onError('No data received from Groq API');
      return;
    }

    const analysis = parseAnalysis(accumulated.trim());
    onComplete(analysis);
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Network error';
    onError(`Failed to analyze resume: ${errorMessage}`);
  }
};

// === СТАРАЯ ФУНКЦИЯ: Без стриминга (если нужно fallback) ===
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