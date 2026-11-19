import { Router } from "express";
import type { Request, Response } from "express";
import {downloadgateway} from "../services/download.service.js";
export const downloadRouter = Router();
downloadRouter.post("/download", async (req: Request, res: Response) => {
await downloadgateway(req,res);
})
