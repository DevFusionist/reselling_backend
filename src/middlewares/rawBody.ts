import { Request, Response, NextFunction } from "express";
export const rawBodyMiddleware = (req:Request,res:Response,next:NextFunction)=> {
  let data = "";
  req.on("data",chunk=>data+=chunk);
  req.on("end",()=>{ (req as any).rawBody = data; try { req.body = JSON.parse(data); } catch(e){}; next(); });
};
