import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';

import AnalysisCard from '../components/AnalysisCard';
import VacancyEditor from '../components/VacancyEditor';
import CandidateTable from '../components/CandidateTable';
import RecruiterDropzone from '../components/RecruiterDropzone';
import { getAnalysisById } from '../services/shareLink';
import { getVacancies, deleteVacancy, Vacancy } from '../services/vacancy';
import type { ResumeAnalysis } from '../types/analysis';
import styles from './Recruiter.module.scss';

const Recruiter = () => {
  const [searchParams] = useSearchParams();
  const { user, isLoaded, isSignedIn } = useUser();

  // Shared Link Mode State
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [sharedLinkError, setSharedLinkError] = useState<string | null>(null);

  // Dashboard Mode State
  const [activeTab, setActiveTab] = useState<'vacancies' | 'candidates'>('vacancies');
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);

  // Check if we are in "Shared Link Mode"
  const resumeId = searchParams.get('resumeId');

  useEffect(() => {
    if (resumeId) {
      const entry = getAnalysisById(resumeId);
      if (!entry) {
        setSharedLinkError('No analysis found for this link — it may have been removed.');
      } else {
        setAnalysis(entry.analysis);
      }
    }
  }, [resumeId]);

  useEffect(() => {
    if (isSignedIn && user && !resumeId) {
      loadVacancies();
    }
  }, [isSignedIn, user, resumeId]);

  const loadVacancies = async () => {
    if (!user) return;
    try {
      const data = await getVacancies(user.id);
      setVacancies(data);
    } catch (error) {
      console.error('Failed to load vacancies:', error);
    }
  };

  const handleDeleteVacancy = async (id: string) => {
    if (confirm('Are you sure you want to delete this vacancy?')) {
      try {
        await deleteVacancy(id);
        loadVacancies();
        if (selectedVacancy?.id === id) setSelectedVacancy(null);
      } catch (error) {
        console.error('Failed to delete vacancy:', error);
      }
    }
  };

  // === SHARED LINK MODE ===
  if (resumeId) {
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
                  `HiringLab Score: ${analysis.score}/100`,
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
                  .catch(() => setSharedLinkError('Unable to copy feedback. Please try again.'));
              }}
            >
              Copy Feedback
            </motion.button>
          )}
        </motion.div>

        {sharedLinkError && (
          <motion.div
            className={styles.errorBanner}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {sharedLinkError}
          </motion.div>
        )}

        {analysis && <AnalysisCard analysis={analysis} />}
      </section>
    );
  }

  // === DASHBOARD MODE ===
  if (!isLoaded) return <div className={styles.loading}>Loading...</div>;

  if (!isSignedIn) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.banner}>
          <h2>Recruiter Dashboard</h2>
          <p>Please sign in to access recruiter features.</p>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.dashboardHeader}>
        <h2 className="section-title gradient-text">Recruiter Dashboard</h2>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'vacancies' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('vacancies')}
          >
            My Vacancies
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'candidates' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            Candidate Database
          </button>
        </div>
      </div>

      {activeTab === 'vacancies' && (
        <div className={styles.content}>
          {!isCreatingVacancy ? (
            <>
              <div className={styles.actionsBar}>
                <motion.button
                  onClick={() => setIsCreatingVacancy(true)}
                  className={styles.createVacancyBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  + Create New Vacancy
                </motion.button>
              </div>

              {vacancies.length === 0 ? (
                <p className="muted">No vacancies found. Create one to start matching candidates.</p>
              ) : (
                <div className={styles.vacancyList}>
                  {vacancies.map((vacancy) => (
                    <div key={vacancy.id} className={`${styles.vacancyCard} ${selectedVacancy?.id === vacancy.id ? styles.selected : ''}`}>
                      <div className={styles.vacancyHeader}>
                        <h3>{vacancy.title}</h3>
                        <span className={`${styles.status} ${styles[vacancy.status]}`}>{vacancy.status}</span>
                      </div>
                      <p>{vacancy.description.substring(0, 100)}...</p>
                      <div className={styles.vacancyActions}>
                        <button onClick={() => setSelectedVacancy(vacancy)}>Select for Matching</button>
                        <button onClick={() => handleDeleteVacancy(vacancy.id)} className={styles.deleteBtn}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <VacancyEditor
              onVacancyCreated={() => {
                setIsCreatingVacancy(false);
                loadVacancies();
              }}
              onCancel={() => setIsCreatingVacancy(false)}
            />
          )}
        </div>
      )}

      {activeTab === 'candidates' && (
        <div className={styles.content}>
          <div className={styles.matchingHeader}>
            <h3>Candidate Database</h3>
            {selectedVacancy ? (
              <div className={styles.matchingContext}>
                <span>Matching against: <strong>{selectedVacancy.title}</strong></span>
                <button onClick={() => setSelectedVacancy(null)}>Clear</button>
              </div>
            ) : (
              <p className="muted">Select a vacancy from the "My Vacancies" tab to see match scores.</p>
            )}
          </div>
          <CandidateTable selectedVacancy={selectedVacancy} key={`candidates-${Date.now()}`} />
          <RecruiterDropzone onCandidateAdded={() => {
            // Force re-render of CandidateTable by updating a key or state
            window.location.reload(); // Temporary solution, will improve
          }} />
        </div>
      )}
    </section>
  );
};

export default Recruiter;

