import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
class NotificationController {
    static async createNotification(req, res, notificationService) {
        try {
            const { compteId, content, type } = req.body;
            const compte = await prisma.compte.findUnique({
                where: { id: compteId },
            });
            if (!compte) {
                res.status(404).json({ message: "Compte non trouvé" });
                return;
            }
            const notification = await notificationService.createNotification(compteId, content, type);
            res.status(201).json({
                message: "Notification créée avec succès",
                notification,
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la création de la notification",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async getUserNotifications(req, res, notificationService) {
        try {
            const { compteId } = req.params;
            const { notifications, unreadCount } = await notificationService.getUserNotifications(Number(compteId));
            res.status(200).json({
                notifications,
                unreadCount,
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la récupération des notifications",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notification = await prisma.notification.update({
                where: { id: Number(id) },
                data: { isRead: true },
            });
            res.status(200).json({
                message: "Notification marquée comme lue",
                notification,
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la mise à jour de la notification",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async markAllAsRead(req, res) {
        try {
            const { compteId } = req.params;
            await prisma.notification.updateMany({
                where: {
                    compteId: Number(compteId),
                    isRead: false,
                },
                data: { isRead: true },
            });
            res.status(200).json({
                message: "Toutes les notifications ont été marquées comme lues",
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la mise à jour des notifications",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            await prisma.notification.delete({
                where: { id: Number(id) },
            });
            res.status(200).json({
                message: "Notification supprimée avec succès",
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la suppression de la notification",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async deleteReadNotifications(req, res) {
        try {
            const { compteId } = req.params;
            await prisma.notification.deleteMany({
                where: {
                    compteId: Number(compteId),
                    isRead: true,
                },
            });
            res.status(200).json({
                message: "Toutes les notifications lues ont été supprimées",
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la suppression des notifications",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
}
export default NotificationController;
//# sourceMappingURL=NotificationController.js.map