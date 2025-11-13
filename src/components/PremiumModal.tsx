import { motion, AnimatePresence } from 'framer-motion';
import styles from './PremiumModal.module.scss';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
  '3 премиум-шаблона резюме (IT, Product, Marketing)',
  'Настройка тональности и ключевых слов под вакансию',
  'Экспорт в PDF и DOCX без водяных знаков',
  'AI-подсказки по каждому разделу'
];

const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <motion.div
          className={`${styles.modal} glass-card`}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            ×
          </button>
          <div className={styles.header}>
            <span className="chip">Premium Upgrade</span>
            <h3 className="section-title gradient-text">Готовые шаблоны + AI кастомизация</h3>
            <p className="muted">
              Получи профессиональные структуры резюме и рекомендации по ключевым словам под нужные
              вакансии.
            </p>
          </div>
          <ul className={styles.list}>
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <div className={styles.checkout}>
            <div className={styles.priceTag}>
              <span>Единовременно</span>
              <strong>$5</strong>
            </div>
            <motion.button
              className="cta-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                window.alert('Stripe Checkout в разработке. Мы сообщим, когда будет готово!')
              }
            >
              Buy Premium (Stripe Coming Soon)
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default PremiumModal;

