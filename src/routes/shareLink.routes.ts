import { Hono } from "hono";
import { shareLinkController } from "../controllers/shareLink.controller";
import { authRequired } from "../middlewares/auth.middleware";

const router = new Hono();

// Public route - anyone can view share link
router.get("/:code", shareLinkController.getByCode);

// Authenticated routes - create, list, delete own links
router.post("/", authRequired, shareLinkController.create);
router.get("/", authRequired, shareLinkController.list);
router.delete("/:code", authRequired, shareLinkController.delete);

export default router;

