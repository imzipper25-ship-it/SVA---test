export interface ResumeAnalysis {
  score: number;
  summary: string;
  keyStrengths: string[];
  improvementRecommendations: string[];
  idealHeadlines: string[];
  detectedLanguage: string;
  createdAt: string;
}

export interface ShareableAnalysis {
  id: string;
  analysis: ResumeAnalysis;
  createdAt: string;
}

