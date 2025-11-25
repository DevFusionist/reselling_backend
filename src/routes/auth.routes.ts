import { Hono } from "hono";
import { authController } from "../controllers/auth.controller";

const router = new Hono();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
