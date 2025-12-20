import { Hono } from "hono";
import { attributeController } from "../controllers/attribute.controller";

const router = new Hono();

// Public routes - all attribute endpoints are public for frontend dropdown population
router.get("/categories", attributeController.getAllCategories);
router.get("/sub-categories", attributeController.getAllSubCategories);
router.get("/categories/:categoryId/sub-categories", attributeController.getSubCategoriesByCategory);
router.get("/brands", attributeController.getAllBrands);
router.get("/colors", attributeController.getAllColors);
router.get("/sizes", attributeController.getAllSizes);
router.get("/materials", attributeController.getAllMaterials);
router.get("/styles", attributeController.getAllStyles);
router.get("/fits", attributeController.getAllFits);
router.get("/patterns", attributeController.getAllPatterns);
router.get("/all", attributeController.getAllAttributes); // Get all attributes in one request

export default router;

