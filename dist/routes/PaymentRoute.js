"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PaymentController_js_1 = __importDefault(require("../controllers/PaymentController.js"));
const router = (0, express_1.Router)();
// Route pour créer un paiement
router.post("/", PaymentController_js_1.default.createPayment);
// Route pour obtenir les détails d'un paiement
router.get("/:idPaiement", PaymentController_js_1.default.getPaymentDetails);
// // Route pour obtenir l'historique des paiements d'un client
// router.get("/historique/:compteId", PaymentController.getClientPaymentHistory);
// // Route pour obtenir les statistiques de paiement d'un client
// router.get("/statistiques/:compteId", PaymentController.getClientPaymentStats);
exports.default = router;
