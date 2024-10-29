"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionController_js_1 = __importDefault(require("../controllers/TransactionController.js"));
const router = (0, express_1.Router)();
router.post("/depot", TransactionController_js_1.default.createDepot);
router.post("/retrait", TransactionController_js_1.default.createRetrait);
router.get("/liste", TransactionController_js_1.default.getTransactions);
router.get("/statistiques", TransactionController_js_1.default.getTransactionStats);
router.post("/annuler/:transactionId", TransactionController_js_1.default.cancelTransaction);
exports.default = router;
