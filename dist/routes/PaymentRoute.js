import { Router } from "express";
import PaymentController from "../controllers/PaymentController.js";
const router = Router();
// Route pour créer un paiement
router.post("/", PaymentController.createPayment);
// Route pour obtenir les détails d'un paiement
router.get("/:idPaiement", PaymentController.getPaymentDetails);
// // Route pour obtenir l'historique des paiements d'un client
// router.get("/historique/:compteId", PaymentController.getClientPaymentHistory);
// // Route pour obtenir les statistiques de paiement d'un client
// router.get("/statistiques/:compteId", PaymentController.getClientPaymentStats);
export default router;
