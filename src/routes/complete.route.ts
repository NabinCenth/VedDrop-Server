import { Router } from "express";
import "dotenv/config";
import type { Request, Response } from "express";
import {PoolConn} from "../config/db.config.js";
import {s3Client} from "../config/bucket.config.js";
import { HeadObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
export const complete = Router();
const pool = PoolConn();
const bucket = s3Client;
complete.post("/complete",async (req: Request, res: Response)=>{
    const {uploadId,fileSize}=req.body;
    const result = await pool.query("SELECT storage_key FROM VedDrop WHERE file_id=$1", [uploadId])
    const storageKey = result.rows[0].storage_key;
   const command = new HeadObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME as string,
    Key: storageKey
    
   });
    try {
     const response = await bucket.send(command);
     if(response.ContentLength==fileSize){
      pool.query("UPDATE veddrop SET status='active' WHERE file_id=$1", [uploadId]);
      return res.status(200).json({message: "File is active"}); 
     }
     else{
     return res.status(400).json({message: "File size mismatch"});
     }
    } catch (error) {
     if (error instanceof S3ServiceException && error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({message: "File not found"});
     } else {
      return res.status(500).json({message: "Unable to verify file"});
     }
    }


})