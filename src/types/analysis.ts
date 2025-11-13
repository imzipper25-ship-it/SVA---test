export interface ResumeAnalysis {
  score: number;
  summary: string;
  keywordRecommendations: string[];
  structureTips: string[];
  industryFit: string[];
  warnings?: string[];
  createdAt: string;
}

export interface ShareableAnalysis {
  id: string;
  analysis: ResumeAnalysis;
  createdAt: string;
}

