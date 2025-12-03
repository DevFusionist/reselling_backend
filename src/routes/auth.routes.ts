import { Hono } from "hono";
import { authController } from "../controllers/auth.controller";
import { authRequired } from "../middlewares/auth.middleware";

const router = new Hono();
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/profile-picture', authRequired, authController.uploadProfilePicture);

export default router;
