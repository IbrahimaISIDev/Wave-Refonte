"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PorteFeuilleController_js_1 = __importDefault(require("../controllers/PorteFeuilleController.js"));
const router = (0, express_1.Router)();
router.post('/', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.createWallet(req, res);
});
router.get('/', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.getWallet(req, res);
});
router.get('/client', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.getWalletByClient(req, res);
});
router.get('/service', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.getWalletByService(req, res);
});
router.get('/operateur', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.getWalletByOperateur(req, res);
});
router.get('/code', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.getCodeWallet(req, res);
});
router.put('/access', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.accessToWallet(req, res);
});
router.put('/open', async (req, res, next) => {
    await PorteFeuilleController_js_1.default.openWallet(req, res);
});
exports.default = router;
