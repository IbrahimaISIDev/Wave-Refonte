"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ClientRoute.ts
const express_1 = require("express");
const ClientController_js_1 = __importDefault(require("../controllers/ClientController.js"));
const midlleware_js_1 = __importDefault(require("../middlewares/midlleware.js"));
const upload_middleware_js_1 = require("../middlewares/upload.middleware.js");
const ClientRoute = () => {
    const router = (0, express_1.Router)();
    // Routes publiques
    router.get("/", ClientController_js_1.default.getAllClients);
    router.get("/:id", ClientController_js_1.default.getClientById);
    router.get("/user/:compteId", ClientController_js_1.default.getClientByCompteId);
    // Routes protégées
    router.post("/", midlleware_js_1.default.auth, upload_middleware_js_1.upload.single('photo'), ClientController_js_1.default.createClient);
    router.put("/:id", midlleware_js_1.default.auth, upload_middleware_js_1.upload.single('photo'), ClientController_js_1.default.updateClient);
    return router; // Return the router instance
};
exports.default = ClientRoute;
