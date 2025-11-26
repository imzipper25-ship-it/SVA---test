import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export const uploadFile = async (file: File, path: string) => {
    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: path,
            Body: file,
            ContentType: file.type,
        });

        await S3.send(command);
        return path;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
};

export const getFileUrl = async (path: string) => {
    try {
        // Generate a signed URL for temporary access (e.g., 1 hour)
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: path,
        });

        const url = await getSignedUrl(S3, command, { expiresIn: 3600 });
        return url;
    } catch (error) {
        console.error("Error getting file URL:", error);
        throw error;
    }
};
