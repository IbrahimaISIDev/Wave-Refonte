"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/NotificationRoute.ts
const express_1 = require("express");
const NotificationController_js_1 = __importDefault(require("../controllers/NotificationController.js"));
const midlleware_js_1 = __importDefault(require("../middlewares/midlleware.js"));
const NotificationRoute = (notificationService) => {
    const router = (0, express_1.Router)();
    // Use the middleware to protect all routes
    router.use(midlleware_js_1.default.auth);
    // Create a notification
    router.post("/", (req, res) => NotificationController_js_1.default.createNotification(req, res, notificationService));
    // Get user notifications
    router.get("/user/:compteId", (req, res) => NotificationController_js_1.default.getUserNotifications(req, res, notificationService));
    // Mark as read
    router.put("/:id/read", (req, res) => NotificationController_js_1.default.markAsRead(req, res));
    router.put("/user/:compteId/read-all", (req, res) => NotificationController_js_1.default.markAllAsRead(req, res));
    // Deletion routes
    router.delete("/:id", (req, res) => NotificationController_js_1.default.deleteNotification(req, res));
    router.delete("/user/:compteId/read", (req, res) => NotificationController_js_1.default.deleteReadNotifications(req, res));
    return router;
};
exports.default = NotificationRoute;
