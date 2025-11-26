import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getCandidateById, updateCandidate } from '../services/candidate';
import { generatePdf } from '../services/pdfGenerator';
import { translateText, rewriteText } from '../services/gemini';
import { ResumeAnalysis } from '../types/analysis';
import styles from './Editor.module.scss';

const Editor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isLoaded, isSignedIn } = useUser();
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (id && user) {
                try {
                    const data = await getCandidateById(id);
                    if (data) {
                        if (data.user_id !== user.id) {
                            // Basic authorization check
                            navigate('/dashboard');
                            return;
                        }
                        setAnalysis(data.parsed_data);
                    }
                } catch (error) {
                    console.error('Failed to fetch candidate:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (isLoaded && isSignedIn) {
            fetchData();
        }
    }, [id, user, isLoaded, isSignedIn, navigate]);

    const handleSave = async () => {
        if (!id || !analysis) return;
        setIsSaving(true);
        try {
            await updateCandidate(id, analysis);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Failed to save changes:', error);
            alert('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPdf = () => {
        if (analysis) {
            generatePdf(analysis);
        }
    };

    const handleTranslate = async () => {
        if (!analysis) return;
        setIsProcessingAI(true);
        try {
            const targetLang = analysis.detectedLanguage === 'en' ? 'ru' : 'en';

            // Translate Summary
            const newSummary = await translateText(analysis.summary, targetLang);

            // Translate Strengths
            const newStrengths = await Promise.all(
                analysis.keyStrengths.map(s => translateText(s, targetLang))
            );

            // Translate Recommendations
            const newRecs = await Promise.all(
                analysis.improvementRecommendations.map(r => translateText(r, targetLang))
            );

            setAnalysis({
                ...analysis,
                summary: newSummary,
                keyStrengths: newStrengths,
                improvementRecommendations: newRecs,
                detectedLanguage: targetLang
            });
        } catch (error) {
            console.error("Translation failed:", error);
            alert("Translation failed. Please try again.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleRewrite = async (field: 'summary' | 'keyStrengths', index?: number) => {
        if (!analysis) return;
        setIsProcessingAI(true);
        try {
            if (field === 'summary') {
                const rewritten = await rewriteText(analysis.summary);
                setAnalysis({ ...analysis, summary: rewritten });
            } else if (field === 'keyStrengths' && typeof index === 'number') {
                const current = analysis.keyStrengths[index];
                const rewritten = await rewriteText(current);
                const newStrengths = [...analysis.keyStrengths];
                newStrengths[index] = rewritten;
                setAnalysis({ ...analysis, keyStrengths: newStrengths });
            }
        } catch (error) {
            console.error("Rewrite failed:", error);
            alert("Rewrite failed. Please try again.");
        } finally {
            setIsProcessingAI(false);
        }
    };

    const handleChange = (field: keyof ResumeAnalysis, value: any) => {
        if (!analysis) return;
        setAnalysis({ ...analysis, [field]: value });
    };

    if (!isLoaded || isLoading) return <div className={styles.loading}>Loading editor...</div>;
    if (!analysis) return <div className={styles.error}>Resume not found.</div>;

    return (
        <section className={styles.wrapper}>
            <div className={styles.header}>
                <h2 className="section-title">Edit Analysis</h2>
                <div className={styles.actions}>
                    <button onClick={() => navigate('/dashboard')} className={styles.cancelBtn}>Back</button>
                    <button onClick={handleTranslate} disabled={isProcessingAI} className={styles.aiBtn}>
                        {isProcessingAI ? 'Translating...' : `Translate to ${analysis.detectedLanguage === 'en' ? 'RU' : 'EN'}`}
                    </button>
                    <button onClick={handleExportPdf} className={styles.secondaryBtn}>Export PDF</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.form}>
                <div className={styles.field}>
                    <div className={styles.labelRow}>
                        <label>Summary</label>
                        <button onClick={() => handleRewrite('summary')} disabled={isProcessingAI} className={styles.rewriteBtn}>
                            ✨ Rewrite
                        </button>
                    </div>
                    <textarea
                        value={analysis.summary}
                        onChange={(e) => handleChange('summary', e.target.value)}
                        rows={6}
                    />
                </div>

                <div className={styles.field}>
                    <label>Key Strengths</label>
                    {analysis.keyStrengths.map((strength, idx) => (
                        <div key={idx} className={styles.inputRow}>
                            <input
                                value={strength}
                                onChange={(e) => {
                                    const newStrengths = [...analysis.keyStrengths];
                                    newStrengths[idx] = e.target.value;
                                    handleChange('keyStrengths', newStrengths);
                                }}
                            />
                            <button onClick={() => handleRewrite('keyStrengths', idx)} disabled={isProcessingAI} className={styles.rewriteBtn}>
                                ✨
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.field}>
                    <label>Improvement Recommendations (one per line)</label>
                    <textarea
                        value={analysis.improvementRecommendations.join('\n')}
                        onChange={(e) => handleChange('improvementRecommendations', e.target.value.split('\n'))}
                        rows={6}
                    />
                </div>
            </div>
        </section>
    );
};

export default Editor;
