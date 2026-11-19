import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

export const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT as string,
  region: process.env.B2_REGION as string,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID as string,
    secretAccessKey: process.env.B2_APPLICATION_KEY as string,
  },
});
