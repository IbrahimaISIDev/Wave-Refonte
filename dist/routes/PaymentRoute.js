import { Router } from "express";
import PaymentController from "../controllers/PaymentController.js";
const router = Router();
router.post("/", PaymentController.createPayment);
router.get("/:idPaiement", PaymentController.getPaymentDetails);
export default router;
//# sourceMappingURL=PaymentRoute.js.map