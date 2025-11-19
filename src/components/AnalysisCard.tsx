import { motion } from 'framer-motion';
import styles from './AnalysisCard.module.scss';
import type { ResumeAnalysis } from '../types/analysis';

interface AnalysisCardProps {
  analysis: ResumeAnalysis;
  onGenerateLink?: () => void;
}

const listVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.25, ease: 'easeOut' }
  })
};

const AnalysisCard = ({ analysis, onGenerateLink }: AnalysisCardProps) => {
  const getScoreTone = (score: number) => {
    if (score === 100) return styles.scoreGold;
    if (score >= 76) return styles.scoreGreen;
    if (score >= 65) return styles.scoreLightGreen;
    if (score >= 50) return styles.scoreYellow;
    if (score >= 36) return styles.scoreOrange;
    return styles.scoreRed;
  };

  const hasActions = Boolean(onGenerateLink);

  return (
    <motion.section
      className={`${styles.card} glass-card`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.header}>
        <div className={`${styles.score} ${getScoreTone(analysis.score)}`}>
          <span>Score</span>
          <strong>{analysis.score}<span style={{ fontSize: '0.5em', opacity: 0.7 }}>/100</span></strong>
        </div>
        <div className={styles.meta}>
          <span className="chip">AI Feedback</span>
          <time className="muted">
            {new Date(analysis.createdAt).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short'
            })}
          </time>
        </div>
      </div>

      <p className={styles.summary}>{analysis.summary}</p>

      <div className={styles.section}>
        <h4 className="subsection-title gradient-text">💪 Key Strengths</h4>
        <ul className={styles.list}>
          {analysis.keyStrengths.map((strength, index) => (
            <motion.li
              key={strength}
              custom={index}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              dangerouslySetInnerHTML={{ __html: strength }}
            />
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h4 className="subsection-title gradient-text">🎯 Improvement Recommendations</h4>
        <ul className={styles.list}>
          {analysis.improvementRecommendations.map((recommendation, index) => (
            <motion.li
              key={recommendation}
              custom={index}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              dangerouslySetInnerHTML={{ __html: recommendation }}
            />
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h4 className="subsection-title gradient-text">✨ Ideal Headline & Profile</h4>
        <ul className={styles.list}>
          {analysis.idealHeadlines.map((headline, index) => (
            <motion.li
              key={headline}
              custom={index}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              dangerouslySetInnerHTML={{ __html: headline }}
            />
          ))}
        </ul>
      </div>

      {hasActions && (
        <div className={styles.actions}>
          {onGenerateLink && (
            <motion.button
              className={styles.secondaryButton}
              onClick={onGenerateLink}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Create recruiter link
            </motion.button>
          )}
        </div>
      )}
    </motion.section>
  );
};

export default AnalysisCard;

