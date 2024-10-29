"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServiceController_js_1 = __importDefault(require("../controllers/ServiceController.js"));
const midlleware_js_1 = __importDefault(require("../middlewares/midlleware.js"));
const router = (0, express_1.Router)();
router.get("/:id", midlleware_js_1.default.auth, ServiceController_js_1.default.getServiceById);
router.get("/", midlleware_js_1.default.auth, ServiceController_js_1.default.getAllServices);
router.post("/", midlleware_js_1.default.auth, ServiceController_js_1.default.createService);
router.put("/:id", midlleware_js_1.default.auth, ServiceController_js_1.default.updateService);
router.delete("/:id", midlleware_js_1.default.auth, ServiceController_js_1.default.deleteService);
exports.default = router;
