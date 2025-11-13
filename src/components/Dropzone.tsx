import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import styles from './Dropzone.module.scss';

interface DropzoneProps {
  onFileAccepted: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

const Dropzone = ({ onFileAccepted, isLoading, error }: DropzoneProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false,
    disabled: Boolean(isLoading)
  });

  const rejectionError =
    fileRejections[0]?.errors[0]?.message ?? (error ? error : undefined);

  return (
    <motion.div
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${
        isLoading ? styles.loading : ''
      }`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <input {...getInputProps()} />
      <div className={styles.content}>
        <motion.div
          className={styles.uploadArrow}
          animate={{
            y: isDragActive ? [-4, 4, -4] : 0,
            scale: isLoading ? 0.9 : 1
          }}
          transition={{ 
            duration: isDragActive ? 1.2 : 0.3, 
            ease: 'easeInOut', 
            repeat: isDragActive ? Infinity : 0 
          }}
        >
          ↑
        </motion.div>
        <h3>Drag in a PDF or click to upload</h3>
        <p className="muted">ResumeAI extracts text locally and analyzes it with GPT-4</p>
        {isLoading && <span className={styles.spinner} />}
      </div>
      {rejectionError && <span className={styles.error}>{rejectionError}</span>}
    </motion.div>
  );
};

export default Dropzone;

