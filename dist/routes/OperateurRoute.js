"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OperateurController_js_1 = __importDefault(require("../controllers/OperateurController.js"));
const midlleware_js_1 = __importDefault(require("../middlewares/midlleware.js"));
// Importez les routes ici
// console.log('CompteController');
const router = (0, express_1.Router)();
router.post("/", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.createOperateur);
router.get("/with-compte", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.getAllOperateursWithCompte);
router.get("/:id", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.getOperateurById);
router.get("/compte/:compteId", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.getAllOperateursByCompteId);
router.put("/:id", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.updateOperateur);
router.delete("/:id", midlleware_js_1.default.isAdmin, OperateurController_js_1.default.deleteOperateur);
//  console.log('CompteController');
exports.default = router;
