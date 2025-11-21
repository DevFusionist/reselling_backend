import "reflect-metadata";
import { Request, Response } from "express";
import { container } from "tsyringe";
import AuthService from "../services/AuthService";

class AuthController {
  async register(req:Request, res:Response) {
    try {
      const svc = container.resolve(AuthService);
      const { user, token } = await svc.register(req.body.name, req.body.email, req.body.password, req.body.role);
      res.json({ user:{ id:user._id, email:user.email, role:user.role }, token });
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }

  async login(req:Request, res:Response) {
    try {
      const svc = container.resolve(AuthService);
      const { user, token } = await svc.login(req.body.email, req.body.password);
      res.json({ user:{ id:user._id, email:user.email, role:user.role }, token });
    } catch (err:any) { res.status(400).json({ message: err.message }); }
  }
}

const controller = new AuthController();

// Export bound methods to maintain the same interface
export const register = controller.register.bind(controller);
export const login = controller.login.bind(controller);
