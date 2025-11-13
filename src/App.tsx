import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Analyzer from './pages/Analyzer';
import Recruiter from './pages/Recruiter';
import Examples from './pages/Examples';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 }
};

function App() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="app-main"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/recruiter" element={<Recruiter />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

export default App;

