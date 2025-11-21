import "reflect-metadata";
import { Request, Response } from "express";
import { container } from "tsyringe";
import ResellerService from "../services/ResellerService";

class ResellerController {
  async generateLink(req:Request, res:Response) {
    try {
      const svc = container.resolve(ResellerService);
      const resellerId = (req as any).user._id;
      const link = await svc.generateLink(req.body.productId, String(resellerId), Number(req.body.margin||0));
      res.json({ url: `${process.env.BASE_URL}/product/${req.body.productId}?ref=${resellerId}&margin=${link.margin}&token=${link.token}`, link });
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }

  async getLinks(req:Request, res:Response) {
    const svc = container.resolve(ResellerService);
    const links = await svc.getLinks(String((req as any).user._id));
    res.json(links);
  }

  async getWallet(req:Request, res:Response) {
    const u = (req as any).user;
    res.json({ balance: u.walletBalance||0 });
  }
}

const controller = new ResellerController();

// Export bound methods to maintain the same interface
export const generateLink = controller.generateLink.bind(controller);
export const getLinks = controller.getLinks.bind(controller);
export const getWallet = controller.getWallet.bind(controller);
