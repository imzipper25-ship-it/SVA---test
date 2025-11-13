import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Landing.module.scss';

const testimonials = [
  {
    name: 'Elena, Frontend Engineer @ ScaleUp',
    quote:
      'ResumeAI rewrote my bullet points with measurable wins. Recruiter callbacks doubled in two weeks.'
  },
  {
    name: 'Mark, Growth Marketer @ Fintech Unicorn',
    quote:
      'The keyword suggestions got me past every ATS filter — I closed three interviews in five days.'
  },
  {
    name: 'Priya, PM @ Marketplace',
    quote:
      'Loved the anonymous sharing link. My mentor gave feedback instantly and I landed an offer in record time.'
  }
];

const Landing = () => (
  <section className={styles.landing}>
    <motion.div
      className={styles.hero}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <span className="chip">AI Resume Intelligence • 2025</span>
      <h1 className="section-title">
        With ResumeAI your chances of getting hired climb to <span className="gradient-text">90%</span>
      </h1>
      <p className={styles.subtitle}>
        ResumeAI scans your PDF, highlights blind spots, recommends keywords, and assigns a score so
        you can stand out in any hiring pipeline.
      </p>
      <div className={styles.actions}>
        <Link to="/analyzer">
          <motion.button className="cta-button" whileHover={{ scale: 1.05 }}>
            Try Now
          </motion.button>
        </Link>
        <Link to="/examples" className={styles.secondary}>
          Explore role examples
        </Link>
      </div>
    </motion.div>

    <motion.div
      className={`${styles.beforeAfterCard} glass-card`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      <div className={`${styles.face} ${styles.beforeFace}`}>
        <span className={styles.badge}>Before</span>
        <strong className={styles.score}>40 / 100</strong>
        <p className="muted">No keywords, generic responsibilities, missing impact.</p>
        <ul>
          <li>Add metrics (traffic uplift, revenue impact)</li>
          <li>Mention stack: React, TypeScript, tRPC</li>
          <li>Make the skills section scannable</li>
        </ul>
      </div>
      <div className={`${styles.face} ${styles.afterFace}`}>
        <span className={styles.badgeSuccess}>After ResumeAI</span>
        <strong className={styles.scoreSuccess}>85 / 100</strong>
        <p className="muted">Structured, ATS-friendly, tailored to the target role.</p>
        <ul>
          <li>Inserted keywords for Frontend Engineer roles</li>
          <li>Highlighted wins: +32% conversion, PWA launch</li>
          <li>Recommended sections: Tech Stack, Impact, Soft Skills</li>
        </ul>
      </div>
      <span className={styles.caseHint}>Hover or tap to reveal the transformation</span>
    </motion.div>

    <motion.div
      className={styles.features}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
    >
      <div>
        <h3>AI Scoring</h3>
        <p>Score out of 100 with quick wins for your next iteration.</p>
      </div>
      <div>
        <h3>Keyword Boost</h3>
        <p>Keyword suggestions tailored to tech and marketing job posts.</p>
      </div>
      <div>
        <h3>Recruiter Mode</h3>
        <p>Share a private analysis link without exposing personal details.</p>
      </div>
    </motion.div>

    <motion.div
      className={styles.examplesCta}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
    >
      <h3>Want inspiration?</h3>
      <p className="muted">
        Browse curated breakdowns for engineers, marketers, and product leaders — see exactly how the
        score improves.
      </p>
      <Link to="/examples" className="cta-button">
        View examples
      </Link>
    </motion.div>

    <motion.div
      className={styles.testimonials}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.35 }}
    >
      <div className={styles.testimonialHeader}>
        <h3>1,000+ candidates already landed roles</h3>
        <p className="muted">
          ResumeAI users report offer rates climbing above 90% after aligning their resumes with our
          tailored feedback.
        </p>
      </div>
      <div className={styles.testimonialGrid}>
        {testimonials.map((item) => (
          <article key={item.name} className={`${styles.testimonialCard} glass-card`}>
            <p>“{item.quote}”</p>
            <span>{item.name}</span>
          </article>
        ))}
      </div>
    </motion.div>
  </section>
);

export default Landing;

