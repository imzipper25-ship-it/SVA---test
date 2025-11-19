import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  let fullText = '';

  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string }>;
    const pageText = items.map((item) => item.str ?? '').join(' ');
    fullText += `${pageText}\n`;
  }

  return fullText.trim();
};

/**
 * Convert a PDF page to a base64-encoded JPEG image
 * Useful for PDFs that contain images instead of text (e.g., Canva exports)
 */
export const convertPdfPageToImage = async (
  file: File,
  pageNumber: number = 1
): Promise<{ data: string; mimeType: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  // Get the specified page (default to first page)
  const page = await pdfDocument.getPage(Math.min(pageNumber, pdfDocument.numPages));

  // Set up canvas with appropriate scale for good quality
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render PDF page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  // Convert canvas to base64 JPEG
  const base64Image = canvas.toDataURL('image/jpeg', 0.9);
  // Remove the "data:image/jpeg;base64," prefix
  const base64Data = base64Image.split(',')[1];

  return {
    data: base64Data,
    mimeType: 'image/jpeg'
  };
};

