import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {s3Client} from '../config/bucket.config.js';
import {  PutObjectCommand} from '@aws-sdk/client-s3';

export  async function PutUrl(type:string, name:string, size:number,key:string):Promise<string> {
  return  getSignedUrl(s3Client,new PutObjectCommand({
    Bucket: "VedDrop",
    Key: key,
    ContentType: type,
    ContentDisposition: "attachment",
    ContentLength: size
  }),
  {expiresIn: 600,
signableHeaders: new Set(["content-type"])
})
}

