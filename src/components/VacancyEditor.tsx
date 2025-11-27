import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { createVacancy, Vacancy } from '../services/vacancy';
import { rewriteText } from '../services/gemini'; // Using rewrite as a proxy for extraction for now
import styles from './VacancyEditor.module.scss';

interface VacancyEditorProps {
    onVacancyCreated: () => void;
    onCancel: () => void;
}

const VacancyEditor = ({ onVacancyCreated, onCancel }: VacancyEditorProps) => {
    const { user } = useUser();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [requirements, setRequirements] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleExtractRequirements = async () => {
        if (!description) return;
        setIsProcessing(true);
        try {
            // In a real app, we'd have a dedicated "extractRequirements" function
            // For now, we'll ask Gemini to list them
            const prompt = `Extract key technical skills and requirements from this job description. Return them as a comma-separated list. Description: ${description}`;
            const result = await rewriteText(prompt); // Reusing the helper
            const extracted = result.split(',').map(s => s.trim()).filter(s => s.length > 0);
            setRequirements(extracted);
        } catch (error) {
            console.error('Extraction failed:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsProcessing(true);
        try {
            await createVacancy({
                title,
                description,
                requirements,
                status: 'active'
            }, user.id);
            onVacancyCreated();
        } catch (error) {
            console.error('Failed to create vacancy:', error);
            alert(`Failed to create vacancy: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <h3 className="subsection-title">Create New Vacancy</h3>

            <div className={styles.field}>
                <label>Job Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    required
                />
            </div>

            <div className={styles.field}>
                <label>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Paste the full job description here..."
                    required
                />
                <button
                    type="button"
                    onClick={handleExtractRequirements}
                    disabled={!description || isProcessing}
                    className={styles.aiBtn}
                >
                    ✨ Extract Requirements with AI
                </button>
            </div>

            <div className={styles.field}>
                <label>Requirements (Auto-extracted)</label>
                <div className={styles.tags}>
                    {requirements.map((req, idx) => (
                        <span key={idx} className={styles.tag}>
                            {req}
                            <button
                                type="button"
                                onClick={() => setRequirements(requirements.filter((_, i) => i !== idx))}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                {requirements.length === 0 && <p className="muted">No requirements extracted yet.</p>}
            </div>

            <div className={styles.actions}>
                <button type="button" onClick={onCancel} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isProcessing} className="btn-primary">
                    {isProcessing ? 'Saving...' : 'Create Vacancy'}
                </button>
            </div>
        </form>
    );
};

export default VacancyEditor;
