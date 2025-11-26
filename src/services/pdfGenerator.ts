import jsPDF from 'jspdf';
import { ResumeAnalysis } from '../types/analysis';

export const generatePdf = (analysis: ResumeAnalysis) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;

    // Helper to add text and advance y
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');

        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * fontSize * 0.5 + 5; // Line height approximation
    };

    // Title
    addText('Resume Analysis Report', 20, true);
    y += 5;

    // Score
    addText(`Score: ${analysis.score}/100`, 16, true);
    y += 10;

    // Summary
    addText('Executive Summary', 14, true);
    addText(analysis.summary, 12);
    y += 5;

    // Key Strengths
    addText('Key Strengths', 14, true);
    analysis.keyStrengths.forEach((strength) => {
        addText(`• ${strength}`, 12);
    });
    y += 5;

    // Improvement Recommendations
    addText('Improvement Recommendations', 14, true);
    analysis.improvementRecommendations.forEach((rec) => {
        addText(`• ${rec}`, 12);
    });
    y += 5;

    // Ideal Headlines
    addText('Suggested Headlines', 14, true);
    analysis.idealHeadlines.forEach((headline) => {
        addText(`• ${headline}`, 12);
    });

    // Save
    doc.save('resume-analysis.pdf');
};
