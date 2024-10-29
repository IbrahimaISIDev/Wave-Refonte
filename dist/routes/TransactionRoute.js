import { Router } from "express";
import TransactionController from "../controllers/TransactionController.js";
const router = Router();
router.post("/depot", TransactionController.createDepot);
router.post("/retrait", TransactionController.createRetrait);
router.get("/liste", TransactionController.getTransactions);
router.get("/statistiques", TransactionController.getTransactionStats);
router.post("/annuler/:transactionId", TransactionController.cancelTransaction);
export default router;
//# sourceMappingURL=TransactionRoute.js.map