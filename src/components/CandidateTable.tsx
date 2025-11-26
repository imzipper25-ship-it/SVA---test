import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Candidate } from '../services/candidate';
import { calculateMatch } from '../services/matching';
import { Vacancy } from '../services/vacancy';
import styles from './CandidateTable.module.scss';

interface CandidateTableProps {
    selectedVacancy: Vacancy | null;
}

interface ScoredCandidate extends Candidate {
    matchScore?: number;
    matchRationale?: string;
}

const CandidateTable = ({ selectedVacancy }: CandidateTableProps) => {
    const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    useEffect(() => {
        if (selectedVacancy && candidates.length > 0) {
            runMatching();
        }
    }, [selectedVacancy]);

    const fetchCandidates = async () => {
        setIsLoading(true);
        // In a real app, we would paginate and filter server-side
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching candidates:', error);
        } else {
            setCandidates(data || []);
        }
        setIsLoading(false);
    };

    const runMatching = async () => {
        if (!selectedVacancy) return;
        setIsLoading(true);

        const scored = await Promise.all(
            candidates.map(async (candidate) => {
                // Skip if already scored for this vacancy (optimization needed in real app)
                const match = await calculateMatch(selectedVacancy, candidate.parsed_data);
                return { ...candidate, matchScore: match.score, matchRationale: match.rationale };
            })
        );

        // Sort by score descending
        scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        setCandidates(scored);
        setIsLoading(false);
    };

    return (
        <div className={styles.tableWrapper}>
            {isLoading && <div className={styles.loadingOverlay}>Processing...</div>}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Summary</th>
                        <th>Skills</th>
                        {selectedVacancy && <th>Match Score</th>}
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {candidates.map((candidate) => (
                        <tr key={candidate.id}>
                            <td>{new Date(candidate.created_at).toLocaleDateString()}</td>
                            <td className={styles.summaryCell}>
                                {candidate.parsed_data.summary.substring(0, 80)}...
                            </td>
                            <td className={styles.skillsCell}>
                                {candidate.parsed_data.keyStrengths.slice(0, 3).join(', ')}
                            </td>
                            {selectedVacancy && (
                                <td className={styles.scoreCell}>
                                    <div className={styles.scoreBadge} style={{
                                        backgroundColor: `hsla(${candidate.matchScore || 0}, 70%, 40%, 0.2)`,
                                        color: `hsl(${candidate.matchScore || 0}, 70%, 40%)`
                                    }}>
                                        {candidate.matchScore}%
                                    </div>
                                    <small>{candidate.matchRationale}</small>
                                </td>
                            )}
                            <td>
                                <a href={candidate.file_url} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                                    View PDF
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CandidateTable;
