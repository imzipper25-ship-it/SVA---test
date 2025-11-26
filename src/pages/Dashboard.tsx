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
            <h2 className="section-title gradient-text">My Resumes</h2>

            {candidates.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't analyzed any resumes yet.</p>
                    <Link to="/" className="btn-primary">Analyze New Resume</Link>
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
                                {candidate.parsed_data.summary.substring(0, 100)}...
                            </p>
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
