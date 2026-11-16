import { Router } from "express";
import type { Request, Response } from "express";
import {PoolConn} from "../config/db.config.js";
import { PutUrl } from "../storage/upload.bucket.js";
import { VerifyUplMeta } from "../utils/middleware/checkUplMeta.js";
import { generatePin,generateStorageKey } from "../utils/PinGenerator.js";
export const uploadRouter = Router();
const pool = PoolConn();
const fileId=generateStorageKey();//STorage Key for the bucket and File ID for the database
uploadRouter.post("/init", VerifyUplMeta, async (req: Request, res: Response) => {
  console.log("Received upload initiation request");
  const {fileName, fileType, fileSize} = req.body;
  const uploadUrl= await PutUrl(fileType,fileName,fileSize,fileId);
  // const uploadUrl="www.googlecom"
  const data = {
    "upload-url": uploadUrl,
    "X-File-Name": fileName ?? "unknown",
    "Content-Type": fileType?? "application/octet-stream",
    "Content-Length": req.get("Content-Length") ?? "0",
  };
  const pin = generatePin();

  // pool.query(
  //   "INSERT INTO VedDrop (file_id, file_name, file_type, file_size,pin_hash) VALUES ($1, $2, $3, $4)",
  //   [fileId, data["X-File-Name"], data["Content-Type"], data["Content-Length"], pin],
  // );

  res.status(200).json(data);
});