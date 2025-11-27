import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './CVBuilder.module.scss';

const CVBuilder = () => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        summary: '',
        experience: '',
        education: '',
        skills: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate saving
        setTimeout(() => {
            setIsSaving(false);
            alert('CV Created! (This is a demo)');
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <section className={styles.wrapper}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h2 className="section-title gradient-text" style={{ marginBottom: '2rem' }}>CV Builder</h2>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Personal Details</h3>
                        <div className={styles.field}>
                            <label>Full Name</label>
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                required
                            />
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Phone</label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Professional Summary</h3>
                        <div className={styles.field}>
                            <label>Summary</label>
                            <textarea
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Briefly describe your professional background and goals..."
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Experience</h3>
                        <div className={styles.field}>
                            <label>Work History</label>
                            <textarea
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                rows={6}
                                placeholder="List your relevant work experience..."
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Education & Skills</h3>
                        <div className={styles.field}>
                            <label>Education</label>
                            <textarea
                                name="education"
                                value={formData.education}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Degrees, universities, and graduation years..."
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Skills</label>
                            <textarea
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                rows={3}
                                placeholder="List your key skills (comma separated)..."
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={() => navigate('/dashboard')} className={styles.cancelBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className={styles.saveBtn}>
                            {isSaving ? 'Creating...' : 'Create CV'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </section>
    );
};

export default CVBuilder;
