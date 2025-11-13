import { motion } from 'framer-motion';
import styles from './Footer.module.scss';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        <span className={styles.copy}>© {year} ResumeAI Analyzer</span>
        <nav className={styles.links}>
          <a href="/privacy" className={styles.link}>
            Privacy
          </a>
          <a href="/terms" className={styles.link}>
            Terms
          </a>
        </nav>
        <div className={styles.socials}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className={styles.socialLink}
          >
            GitHub
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className={styles.socialLink}
          >
            X
          </a>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;

