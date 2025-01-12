import { Router } from "express";
import ServiceController from "../controllers/ServiceController.js";
import Middleware from "../middlewares/midlleware.js";
const router = Router();
router.get("/:id", Middleware.auth, ServiceController.getServiceById);
router.get("/", Middleware.auth, ServiceController.getAllServices);
router.post("/", Middleware.auth, ServiceController.createService);
router.put("/:id", Middleware.auth, ServiceController.updateService);
router.delete("/:id", Middleware.auth, ServiceController.deleteService);
export default router;
//# sourceMappingURL=ServiceRoute.js.map