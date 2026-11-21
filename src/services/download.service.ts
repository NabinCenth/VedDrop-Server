import {PoolConn} from "../config/db.config.js";
import {s3Client} from "../config/bucket.config.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type {Request,Response} from "express";
import { pipeline } from "node:stream/promises";

const pool = PoolConn();
export async function downloadgateway(req: Request,res:Response){
    const controller =new AbortController();
    const Pin=req.body.pin;
    res.on('close', () => controller.abort());

    //a input pin is validated
    try{
        const result = await pool.query("SELECT   file_name, file_size,status,storage_key FROM VedDrop WHERE pin_hash=$1",[Pin]);
        console.log("Query result:", result.rows[0].file_size);
        if(result.rows.length===0){
            return res.status(404).json({ message: "Invalid Pin" });
        };
        const fileName=result.rows[0].file_name;
        const fileSize=result.rows[0].file_size;
        const status=result.rows[0].status;
        const storageKey=result.rows[0].storage_key;
        if(status=="pending"){
            return res.status(400).json({message: "File is not active"});
        }
        else if(status=="expired"){
            return res.status(400).json({message: "File is expired"});
        }
        if (status=="active"){
            try{
                 const command = new GetObjectCommand({
                Bucket: process.env.B2_BUCKET_NAME as string,
                Key: storageKey
            });
            const response = await s3Client.send(command,{abortSignal: controller.signal as AbortSignal});
        const contentType = response.ContentType || 'application/octet-stream';
       if(contentType) {res.setHeader('Content-Type', contentType);}
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

       response.ContentLength? 
       res.setHeader('Content-Length',response.ContentLength?.toString()as string):
            null;
            await pipeline(response.Body as NodeJS.ReadableStream, res, { signal: controller.signal });
       
            }
            catch(error){
                console.error("Error occurred while fetching the file from S3:", error);
                return res.status(500).json({message: "Unable to fetch the file"});
            }
           
            
        }
    } catch (error) {
        console.error("Error occurred while querying the database:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
    finally{
          console.log("Client disconnected, aborting the download");
        res.off('close',() => controller.abort())
    }
console.log("Pin received:", Pin);

}

