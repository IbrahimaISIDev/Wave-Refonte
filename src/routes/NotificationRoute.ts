// src/routes/NotificationRoute.ts
import { Router } from "express";
import NotificationController from "../controllers/NotificationController.js";
import Middleware from "../middlewares/midlleware.js";
import { NotificationService } from "../services/NotificationService.js"; // Import NotificationService

const NotificationRoute = (notificationService: NotificationService) => { // Explicitly type notificationService
  const router = Router();

  // Use the middleware to protect all routes
  router.use(Middleware.auth);

  // Create a notification
  router.post("/", (req, res) => NotificationController.createNotification(req, res, notificationService));

  // Get user notifications
  router.get("/user/:compteId", (req, res) => NotificationController.getUserNotifications(req, res, notificationService));

  // Mark as read
  router.put("/:id/read", (req, res) => NotificationController.markAsRead(req, res));
  router.put("/user/:compteId/read-all", (req, res) => NotificationController.markAllAsRead(req, res));

  // Deletion routes
  router.delete("/:id", (req, res) => NotificationController.deleteNotification(req, res));
  router.delete("/user/:compteId/read", (req, res) => NotificationController.deleteReadNotifications(req, res));

  return router;
};

export default NotificationRoute;
