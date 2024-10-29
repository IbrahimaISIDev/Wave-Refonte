import { Router } from "express";
import TransfertController from "../controllers/TransfertController.js";
const router = Router();
router.post("/", TransfertController.createTransfert);
router.get("/history/:compteId", TransfertController.getTransfertsHistory);
router.post("/:transfertId/cancel", TransfertController.cancelTransfert);
router.get("/:transfertId/resend", TransfertController.resendTransfert);
export default router;
