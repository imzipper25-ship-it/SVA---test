import { ResumeAnalysis } from '../types/analysis';
import { Vacancy } from './vacancy';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface MatchResult {
    score: number;
    rationale: string;
}

export const calculateMatch = async (vacancy: Vacancy, candidateAnalysis: ResumeAnalysis): Promise<MatchResult> => {
    const apiKey = GEMINI_API_KEY?.trim();
    if (!apiKey) throw new Error('Missing Gemini API key');

    const prompt = `
    Role: Senior Technical Recruiter.
    Task: Evaluate the match between a Job Vacancy and a Candidate Profile.
    
    Vacancy Title: ${vacancy.title}
    Vacancy Description: ${vacancy.description}
    Vacancy Requirements: ${vacancy.requirements.join(', ')}
    
    Candidate Summary: ${candidateAnalysis.summary}
    Candidate Strengths: ${candidateAnalysis.keyStrengths.join(', ')}
    
    Output JSON ONLY:
    {
      "score": number (0-100),
      "rationale": "One sentence explanation of the score."
    }
  `;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            })
        });

        if (!response.ok) throw new Error('Gemini API error');

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('No response from AI');

        const result = JSON.parse(text);
        return {
            score: result.score || 0,
            rationale: result.rationale || 'Analysis failed'
        };
    } catch (error) {
        console.error('Matching failed:', error);
        return { score: 0, rationale: 'Matching service unavailable' };
    }
};
