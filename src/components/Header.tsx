import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Header.module.scss';

interface NavLinkItem {
  to: string;
  label: string;
  end?: boolean;
}

const navLinks: NavLinkItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/analyzer', label: 'Analyzer' },
  { to: '/examples', label: 'Examples' },
  { to: '/recruiter', label: 'Recruiter Mode' }
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.notch} glass`}>
        <motion.div
          className={`${styles.logo} serif-accent`}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          ResumeAI
        </motion.div>
        <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <motion.button
          className={styles.burger}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </motion.button>
      </div>
    </header>
  );
};

export default Header;

