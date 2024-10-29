"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransfertController_js_1 = __importDefault(require("../controllers/TransfertController.js"));
const router = (0, express_1.Router)();
router.post("/", TransfertController_js_1.default.createTransfert);
router.get("/history/:compteId", TransfertController_js_1.default.getTransfertsHistory);
router.post("/:transfertId/cancel", TransfertController_js_1.default.cancelTransfert);
router.get("/:transfertId/resend", TransfertController_js_1.default.resendTransfert);
exports.default = router;
