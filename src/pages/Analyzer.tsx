import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TelegramShareButton,
  LinkedinShareButton,
  EmailShareButton,
  TelegramIcon,
  LinkedinIcon,
  EmailIcon
} from 'react-share';

import heic2any from 'heic2any';
import Dropzone from '../components/Dropzone';
import AnalysisCard from '../components/AnalysisCard';
import { extractTextFromPdf } from '../services/pdfParser';
import { analyzeResume } from '../services/gemini';
import { saveAnalysis } from '../services/shareLink';
import type { ResumeAnalysis } from '../types/analysis';

import styles from './Analyzer.module.scss';

const Analyzer = () => {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);
      setShareUrl(null);
      setStatusMessage(null);

      try {
        let analysisInput;

        if (file.type === 'application/pdf') {
          const text = await extractTextFromPdf(file);
          if (!text) {
            throw new Error('Could not extract text from the PDF. Please check the file.');
          }
          analysisInput = text;
        } else {
          // Handle Images (JPEG, PNG, HEIC)
          let imageFile = file;

          // Convert HEIC to JPEG if needed
          if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
            try {
              const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
              });

              // heic2any can return a Blob or Blob[]
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

        const result = await analyzeResume(analysisInput);
        setAnalysis(result);
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : 'Something went wrong during the analysis. Please try again later.';
        setError(message);
      } finally {
        setIsLoading(false);
        searchParams.delete('demo');
        setSearchParams(searchParams, { replace: true });
      }
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setError('Demo PDF is unavailable offline. Upload your own resume to continue.');
    }
  }, [searchParams]);

  const handleShare = () => {
    if (!analysis) return;
    const entry = saveAnalysis(analysis);
    const url = `${window.location.origin}/recruiter?resumeId=${entry.id}`;
    setShareUrl(url);
    setStatusMessage('Link generated — ready to share!');
  };

  const shareMessage = useMemo(
    () =>
      analysis
        ? `ResumeAI scored this resume ${analysis.score}/100. Review the recommendations: ${shareUrl ?? ''}`
        : '',
    [analysis, shareUrl]
  );

  return (
    <section className={styles.wrapper}>
      <div className={styles.heading}>
        <h2 className="section-title gradient-text">Upload a PDF to get instant AI feedback</h2>
        <p className="muted">
          We parse the file locally with pdf.js and send the text to Google Gemini AI for analysis. Your resume never
          gets stored on our servers.
        </p>
      </div>

      <Dropzone onFileAccepted={handleFile} isLoading={isLoading} />

      {error && (
        <motion.div
          className={styles.errorBanner}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {analysis && (
        <>
          <AnalysisCard
            analysis={analysis}
            onGenerateLink={handleShare}
          />

          {shareUrl && (
            <motion.div
              className={styles.shareBlock}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={styles.shareHeader}>
                <h4 className="subsection-title">Recruiter Mode is live</h4>
                <button
                  className={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => setStatusMessage('Link copied to clipboard.'))
                      .catch(() => setError('Failed to copy link.'));
                  }}
                >
                  Copy link
                </button>
              </div>
              <p className="muted">
                Share the insights with a recruiter, mentor, or peer. Personal data stays hidden —
                only the analysis is shared.
              </p>
              {statusMessage && <span className={styles.status}>{statusMessage}</span>}

              <div className={styles.shareButtons}>
                <TelegramShareButton url={shareUrl} title={shareMessage}>
                  <TelegramIcon round size={42} />
                </TelegramShareButton>
                <LinkedinShareButton url={shareUrl} summary={shareMessage} title="ResumeAI Review">
                  <LinkedinIcon round size={42} />
                </LinkedinShareButton>
                <EmailShareButton url={shareUrl} subject="ResumeAI Feedback" body={shareMessage}>
                  <EmailIcon round size={42} />
                </EmailShareButton>
              </div>
            </motion.div>
          )}
        </>
      )}
    </section>
  );
};

export default Analyzer;

