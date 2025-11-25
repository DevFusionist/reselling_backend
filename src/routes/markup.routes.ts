import { Hono } from "hono";
import { markupController } from "../controllers/markup.controller";
import { authRequired, resellerOnly } from "../middlewares/auth.middleware";

const router = new Hono();

router.use("*", authRequired, resellerOnly);

router.post("/", markupController.setMarkup);
router.get("/", markupController.listMarkups);
router.get("/:productId", markupController.getMarkup);
router.delete("/:productId", markupController.deleteMarkup);

export default router;

