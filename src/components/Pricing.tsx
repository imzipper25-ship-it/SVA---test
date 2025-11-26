import { motion } from 'framer-motion';
import styles from './Pricing.module.scss';

const Pricing = () => {
    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: '/mo',
            features: [
                '1 Resume Analysis per month',
                'Basic AI Scoring',
                'Standard Support',
            ],
            cta: 'Get Started',
            popular: false,
        },
        {
            name: 'Pro Monthly',
            price: '$9.99',
            period: '/mo',
            features: [
                'Unlimited Resume Analyses',
                'Advanced AI Insights',
                'PDF Export',
                'AI Rewrite & Translation',
                'Priority Support',
            ],
            cta: 'Upgrade to Pro',
            popular: true,
        },
        {
            name: 'Pro Yearly',
            price: '$79.99',
            period: '/yr',
            features: [
                'All Pro Features',
                'Save 33%',
                'Early Access to New Features',
            ],
            cta: 'Go Yearly',
            popular: false,
        },
    ];

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className="section-title gradient-text">Simple, Transparent Pricing</h2>
                    <p className="muted">Invest in your career with our premium tools.</p>
                </div>

                <div className={styles.grid}>
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            className={`${styles.card} ${plan.popular ? styles.popular : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {plan.popular && <div className={styles.badge}>Most Popular</div>}
                            <h3 className={styles.planName}>{plan.name}</h3>
                            <div className={styles.priceWrapper}>
                                <span className={styles.price}>{plan.price}</span>
                                <span className={styles.period}>{plan.period}</span>
                            </div>
                            <ul className={styles.features}>
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <svg
                                            className={styles.check}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button className={`${styles.cta} ${plan.popular ? styles.primary : styles.secondary}`}>
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
