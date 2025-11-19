import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import AnalysisCard from '../components/AnalysisCard';
import { getAnalysisById } from '../services/shareLink';
import type { ResumeAnalysis } from '../types/analysis';
import styles from './Recruiter.module.scss';

const Recruiter = () => {
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resumeId = searchParams.get('resumeId');
    if (!resumeId) {
      setError('Invalid or missing link. Please make sure you opened the full URL.');
      return;
    }

    const entry = getAnalysisById(resumeId);
    if (!entry) {
      setError('No analysis found for this link — it may have been removed.');
      return;
    }

    setAnalysis(entry.analysis);
  }, [searchParams]);

  return (
    <section className={styles.wrapper}>
      <motion.div
        className={styles.banner}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div>
          <span className="chip">Recruiter Mode</span>
          <h2 className="section-title">Anonymous resume insights</h2>
          <p className="muted">
            Candidate data is hidden. You can only access the AI score, guidance, and keyword
            suggestions.
          </p>
        </div>
        {analysis && (
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const text = [
                `ResumeAI Score: ${analysis.score}/100`,
                `Summary: ${analysis.summary}`,
                '',
                'Key Strengths:',
                ...analysis.keyStrengths.map((strength) => `• ${strength}`),
                '',
                'Improvement Recommendations:',
                ...analysis.improvementRecommendations.map((rec) => `• ${rec}`),
                '',
                'Ideal Headlines:',
                ...analysis.idealHeadlines.map((headline) => `• ${headline}`)
              ].join('\n');
              navigator.clipboard
                .writeText(text)
                .catch(() => setError('Unable to copy feedback. Please try again.'));
            }}
          >
            Copy Feedback
          </motion.button>
        )}
      </motion.div>

      {error && (
        <motion.div
          className={styles.errorBanner}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {analysis && <AnalysisCard analysis={analysis} />}
    </section>
  );
};

export default Recruiter;

