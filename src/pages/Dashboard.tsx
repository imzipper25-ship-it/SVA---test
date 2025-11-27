import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getCandidates, Candidate } from '../services/candidate';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCandidates = async () => {
            if (user) {
                try {
                    const data = await getCandidates(user.id);
                    setCandidates(data);
                } catch (error) {
                    console.error('Failed to fetch candidates:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (isLoaded && isSignedIn) {
            fetchCandidates();
        }
    }, [user, isLoaded, isSignedIn]);

    if (!isLoaded || isLoading) {
        return <div className={styles.loading}>Loading your dashboard...</div>;
    }

    if (!isSignedIn) {
        return <div className={styles.wrapper}>Please sign in to view your dashboard.</div>;
    }

    return (
        <section className={styles.wrapper}>
            <div className={styles.header}>
                <h2 className="section-title gradient-text">My Dashboard</h2>
                <div className={styles.actions}>
                    <Link to="/" className={styles.analyzeBtn}>Analyze New Resume</Link>
                    <Link to="/cv-builder" className={styles.createBtn}>+ Create CV</Link>
                </div>
            </div>

            {candidates.length === 0 ? (
                <div className={styles.emptyState}>
                    <h3>No resumes found</h3>
                    <p>Get started by analyzing an existing resume or creating a new one from scratch.</p>
                    <div className={styles.actions} style={{ justifyContent: 'center' }}>
                        <Link to="/" className={styles.analyzeBtn}>Analyze Resume</Link>
                        <Link to="/cv-builder" className={styles.createBtn}>Create CV</Link>
                    </div>
                </div>
            ) : (
                <div className={styles.grid}>
                    {candidates.map((candidate) => (
                        <Link key={candidate.id} to={`/editor/${candidate.id}`} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <span className={styles.date}>
                                    {new Date(candidate.created_at).toLocaleDateString()}
                                </span>
                                <span className={`${styles.score} ${getScoreClass(candidate.parsed_data.score)}`}>
                                    {candidate.parsed_data.score}
                                </span>
                            </div>
                            <p className={styles.summary}>
                                {candidate.parsed_data.summary}
                            </p>
                            <div className={styles.cardFooter}>
                                View Analysis →
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
};

const getScoreClass = (score: number) => {
    if (score >= 80) return styles.high;
    if (score >= 60) return styles.medium;
    return styles.low;
};

export default Dashboard;
