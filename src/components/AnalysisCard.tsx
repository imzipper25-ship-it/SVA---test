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
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    return styles.needsWork;
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
          <strong>{analysis.score}</strong>
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

      <div className={styles.columns}>
        <div>
          <h4 className="subsection-title gradient-text">Structure</h4>
          <ul className={styles.list}>
            {analysis.structureTips.map((tip, index) => (
              <motion.li
                key={tip}
                custom={index}
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="subsection-title gradient-text">Keywords</h4>
          <ul className={styles.list}>
            {analysis.keywordRecommendations.map((keyword, index) => (
              <motion.li
                key={keyword}
                custom={index}
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {keyword}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.industry}>
        <h4 className="subsection-title gradient-text">Best suited for</h4>
        <div className={styles.badges}>
          {analysis.industryFit.map((industry) => (
            <motion.span
              key={industry}
              className={styles.badge}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {industry}
            </motion.span>
          ))}
        </div>
      </div>

      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className={styles.warnings}>
          <h4 className="subsection-title">Address these first</h4>
          <ul className={styles.list}>
            {analysis.warnings.map((warning, index) => (
              <motion.li
                key={warning}
                custom={index}
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {warning}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

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

