import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export class NotificationService {
    constructor(io) {
        this.io = io;
        io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);
            socket.on("join", (compteId) => {
                socket.join(`user-${compteId}`);
                console.log(`User ${compteId} joined their room`);
            });
            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });
    }
    async createNotification(compteId, content, type = "general") {
        try {
            const notification = await prisma.notification.create({
                data: {
                    content,
                    compteId,
                    type,
                    isRead: false,
                },
                include: {
                    compte: true,
                }
            });
            this.io.to(`user-${compteId}`).emit("newNotification", notification);
            if (notification.compte.phone && this.shouldSendSMS(type)) {
                await this.sendSMS(notification.compte.phone, content);
            }
            return notification;
        }
        catch (error) {
            console.error("Erreur lors de la création de la notification:", error);
            throw error;
        }
    }
    shouldSendSMS(type) {
        const smsRequiredTypes = ["urgent", "payment", "security"];
        return smsRequiredTypes.includes(type);
    }
    async sendSMS(phoneNumber, message) {
        try {
            const response = await twilioClient.messages.create({
                body: message,
                to: phoneNumber,
                from: process.env.TWILIO_PHONE_NUMBER
            });
            console.log("SMS envoyé avec succès:", response.sid);
            return response;
        }
        catch (error) {
            console.error("Erreur lors de l'envoi du SMS:", error);
            throw error;
        }
    }
    async getUserNotifications(compteId) {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    compteId: Number(compteId),
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    compte: {
                        select: {
                            id: true,
                            phone: true
                        }
                    }
                }
            });
            const unreadCount = notifications.filter((notif) => !notif.isRead).length;
            return { notifications, unreadCount };
        }
        catch (error) {
            console.error("Erreur lors de la récupération des notifications:", error);
            throw error;
        }
    }
}
//# sourceMappingURL=NotificationService.js.map