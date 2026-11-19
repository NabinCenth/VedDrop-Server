import type { NextFunction, Request, Response } from "express";

export const VerifyUplMeta = (req: Request, res: Response, next: NextFunction) => {
    if(Number(req.get("Content-Length") ?? 0) > 52428800){
 res.status(400).json({
            "message":"File size exceeds the limit of 50MB"
        })
        return;
   }

    next();
};