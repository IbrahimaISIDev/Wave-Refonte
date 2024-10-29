import { Router } from "express";
import OperateurController from "../controllers/OperateurController.js";
import Middleware from '../middlewares/midlleware.js';
const router = Router();
router.post("/", Middleware.isAdmin, OperateurController.createOperateur);
router.get("/with-compte", Middleware.isAdmin, OperateurController.getAllOperateursWithCompte);
router.get("/:id", Middleware.isAdmin, OperateurController.getOperateurById);
router.get("/compte/:compteId", Middleware.isAdmin, OperateurController.getAllOperateursByCompteId);
router.put("/:id", Middleware.isAdmin, OperateurController.updateOperateur);
router.delete("/:id", Middleware.isAdmin, OperateurController.deleteOperateur);
export default router;
//# sourceMappingURL=OperateurRoute.js.map