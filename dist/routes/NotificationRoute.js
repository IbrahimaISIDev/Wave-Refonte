import { Router } from "express";
import NotificationController from "../controllers/NotificationController.js";
import Middleware from "../middlewares/midlleware.js";
const NotificationRoute = (notificationService) => {
    const router = Router();
    router.use(Middleware.auth);
    router.post("/", (req, res) => NotificationController.createNotification(req, res, notificationService));
    router.get("/user/:compteId", (req, res) => NotificationController.getUserNotifications(req, res, notificationService));
    router.put("/:id/read", (req, res) => NotificationController.markAsRead(req, res));
    router.put("/user/:compteId/read-all", (req, res) => NotificationController.markAllAsRead(req, res));
    router.delete("/:id", (req, res) => NotificationController.deleteNotification(req, res));
    router.delete("/user/:compteId/read", (req, res) => NotificationController.deleteReadNotifications(req, res));
    return router;
};
export default NotificationRoute;
//# sourceMappingURL=NotificationRoute.js.map