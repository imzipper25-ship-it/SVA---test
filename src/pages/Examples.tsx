import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './Examples.module.scss';

const sampleAnalyses = [
  {
    title: 'Frontend Engineer — Series B SaaS',
    score: 82,
    highlights: [
      'Impact-focused bullet points with revenue metrics',
      'Technical stack alignment: React 18, Vite, GraphQL',
      'Added keywords: accessibility, microfrontends, PWA'
    ]
  },
  {
    title: 'Growth Marketer — Fintech',
    score: 78,
    highlights: [
      'Positioned experiments with north-star metric context',
      'Suggested keywords: CAC, lifecycle campaigns, Segmentation',
      'Recommended structure: Outcomes, Channels, Tooling'
    ]
  },
  {
    title: 'Product Manager — Marketplace',
    score: 88,
    highlights: [
      'Clarified roadmap ownership and stakeholder network',
      'Keywords inserted: GTM, discovery, monetization',
      'Suggested adding hypothesis-to-impact storytelling'
    ]
  }
];

const Examples = () => (
  <section className={styles.wrapper}>
    <div className={styles.hero}>
      <span className="chip">Playbook Library</span>
      <h1 className="section-title">See how HiringLab guides different roles</h1>
      <p className="muted">
        Explore real-world style breakdowns. Each example shows the score uplift, the keyword boosts,
        and the structural tweaks that helped candidates get offers faster.
      </p>
    </div>

    <div className={styles.grid}>
      {sampleAnalyses.map((example) => (
        <motion.article
          key={example.title}
          className={`${styles.card} glass-card`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className={styles.header}>
            <strong>{example.title}</strong>
            <span className={styles.score}>{example.score} / 100</span>
          </div>
          <ul>
            {example.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.article>
      ))}
    </div>

    <motion.div
      className={styles.cta}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      Ready to see your own analysis?
      <Link to="/analyzer" className="cta-button">
        Upload resume
      </Link>
    </motion.div>
  </section>
);

export default Examples;

