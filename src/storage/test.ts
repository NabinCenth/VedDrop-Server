import { GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/bucket.config.js";

const result = await s3Client.send(
  new GetBucketCorsCommand({
    Bucket: "VedDrop"
  })
);

console.log(result.CORSRules, { depth: null });