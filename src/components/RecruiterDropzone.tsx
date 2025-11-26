import { useCallback, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import heic2any from 'heic2any';
import { extractTextFromPdf, convertPdfPageToImage } from '../services/pdfParser';
import { analyzeResume } from '../services/gemini';
import { saveCandidate } from '../services/candidate';
import type { ResumeAnalysis } from '../types/analysis';
import styles from './RecruiterDropzone.module.scss';

interface RecruiterDropzoneProps {
    onCandidateAdded: () => void;
}

const RecruiterDropzone = ({ onCandidateAdded }: RecruiterDropzoneProps) => {
    const { user } = useUser();
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFile = useCallback(
        async (file: File) => {
            if (!user) return;

            setError(null);
            setIsProcessing(true);
            setStatusMessage('Analyzing resume...');

            try {
                let analysisInput;

                if (file.type === 'application/pdf') {
                    const text = await extractTextFromPdf(file);

                    if (text && text.length > 50) {
                        analysisInput = text;
                    } else {
                        setStatusMessage('PDF contains images, analyzing visually...');
                        try {
                            const imageData = await convertPdfPageToImage(file, 1);
                            analysisInput = {
                                inlineData: imageData
                            };
                        } catch (conversionError) {
                            console.error('PDF to image conversion failed:', conversionError);
                            throw new Error('Could not process this PDF. Please try converting it to an image (JPEG/PNG) first.');
                        }
                    }
                } else {
                    let imageFile = file;

                    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
                        try {
                            const convertedBlob = await heic2any({
                                blob: file,
                                toType: 'image/jpeg',
                                quality: 0.8
                            });

                            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            imageFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
                        } catch (e) {
                            console.error('HEIC conversion failed:', e);
                            throw new Error('Could not convert HEIC image. Please try converting to JPEG first.');
                        }
                    }

                    const base64Data = await fileToBase64(imageFile);
                    analysisInput = {
                        inlineData: {
                            data: base64Data,
                            mimeType: imageFile.type
                        }
                    };
                }

                setStatusMessage('Analyzing with AI...');
                const result = await analyzeResume(analysisInput);

                setStatusMessage('Saving candidate...');
                await saveCandidate(user.id, file, result);

                setStatusMessage('Candidate added successfully!');
                onCandidateAdded();

                setTimeout(() => {
                    setStatusMessage(null);
                }, 3000);

            } catch (err) {
                console.error(err);
                const message =
                    err instanceof Error
                        ? err.message
                        : 'Something went wrong during the analysis. Please try again later.';
                setError(message);
            } finally {
                setIsProcessing(false);
            }
        },
        [user, onCandidateAdded]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
        };
        input.click();
    };

    return (
        <div className={styles.wrapper}>
            <h3 className="subsection-title">Upload Candidate Resume</h3>
            <motion.div
                className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${isProcessing ? styles.processing : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={isProcessing ? undefined : handleClick}
                whileHover={isProcessing ? {} : { scale: 1.01 }}
                whileTap={isProcessing ? {} : { scale: 0.99 }}
            >
                {isProcessing ? (
                    <div className={styles.processingState}>
                        <div className={styles.spinner} />
                        <p>{statusMessage}</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.icon}>📄</div>
                        <p className={styles.mainText}>Drop resume here or click to browse</p>
                        <p className={styles.subText}>Supports PDF, JPEG, PNG, HEIC</p>
                    </>
                )}
            </motion.div>

            {error && (
                <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {error}
                </motion.div>
            )}

            {statusMessage && !isProcessing && (
                <motion.div
                    className={styles.successMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {statusMessage}
                </motion.div>
            )}
        </div>
    );
};

export default RecruiterDropzone;
