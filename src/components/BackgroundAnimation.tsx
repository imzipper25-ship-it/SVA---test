import { useScroll, useTransform, motion } from 'framer-motion';
import styles from './BackgroundAnimation.module.scss';

const BackgroundAnimation = () => {
    const { scrollY } = useScroll();
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    return (
        <motion.div className={styles.container} style={{ opacity }}>
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />
        </motion.div>
    );
};

export default BackgroundAnimation;
