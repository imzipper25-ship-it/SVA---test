import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Pricing from '../components/Pricing';
import BackgroundAnimation from '../components/BackgroundAnimation';
import styles from './Landing.module.scss';

const testimonials = [
  {
    name: 'Elena, Frontend Engineer @ ScaleUp',
    quote:
      'HiringLab rewrote my bullet points with measurable wins. Recruiter callbacks doubled in two weeks.'
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
    <BackgroundAnimation />
    <motion.div
      className={styles.hero}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h1 className="section-title">
        With HiringLab your chances of getting hired climb to{' '}
        <span className={`${styles.heroPercent} serif-accent`}>90%</span>
      </h1>
      <p className={styles.subtitle}>
        HiringLab scans your PDF, highlights blind spots, recommends keywords, and assigns a score so
        you can stand out in any hiring pipeline.
      </p>
      <div className={styles.actions}>
        <Link to="/analyzer">
          <motion.button className={styles.tryNowButton} whileHover={{ scale: 1.05 }}>
            Try Now
          </motion.button>
        </Link>
        <Link to="/examples" className={styles.secondary}>
          Explore role examples
        </Link>
      </div>
    </motion.div>

    <motion.div
      className={styles.transformation}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
    >
      <div className={`${styles.transformationCard} ${styles.beforeCard}`}>
        <span className={styles.transformationLabel}>Before</span>
        <span className={`${styles.transformationScore} serif-accent`}>40/100</span>
        <p>No keywords, generic bullets, zero proof of impact.</p>
      </div>
      <div className={styles.transformationArrow}>
        <span className="serif-accent">feel the different</span>
        <div className={styles.arrowLine}>
          <span />
        </div>
      </div>
      <div className={`${styles.transformationCard} ${styles.afterCard}`}>
        <span className={styles.transformationLabel}>After</span>
        <span className={`${styles.transformationScore} serif-accent`}>90/100</span>
        <p>HiringLab injects impact statements, ATS keywords, and structure.</p>
      </div>
    </motion.div>

    <motion.div
      className={styles.features}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
    >
      <div className={styles.featureCard}>
        <h3>AI Scoring</h3>
        <p>Score out of 100 with quick wins for your next iteration.</p>
      </div>
      <div className={styles.featureCard}>
        <h3>Keyword Boost</h3>
        <p>Get ATS-friendly keywords tailored to your target role.</p>
      </div>
      <div className={styles.featureCard}>
        <h3>Structure Tips</h3>
        <p>Improve layout and formatting for maximum recruiter impact.</p>
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
      <Link to="/examples">
        <motion.button className={styles.viewExamplesButton} whileHover={{ scale: 1.05 }}>
          View examples
        </motion.button>
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
          HiringLab users report offer rates climbing above 90% after aligning their resumes with our
          tailored feedback.
        </p>
      </div>
      <div className={styles.testimonialGrid}>
        {testimonials.map((item) => (
          <article key={item.name} className={styles.testimonialCard}>
            <p>"{item.quote}"</p>
            <span>{item.name}</span>
          </article>
        ))}
      </div>
    </motion.div>
    <Pricing />
  </section>
);

export default Landing;

