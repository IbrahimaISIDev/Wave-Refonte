// src/services/NotificationService.ts
import { PrismaClient } from "@prisma/client";
import twilio from "twilio";
const prisma = new PrismaClient();
// Configuration Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export class NotificationService {
    constructor(io) {
        this.io = io;
        // Gestion des événements Socket.IO
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
            // Créer la notification dans la base de données
            const notification = await prisma.notification.create({
                data: {
                    content,
                    compteId,
                    type,
                    isRead: false,
                },
                include: {
                    compte: true, // Inclure les informations du compte pour obtenir le numéro de téléphone
                }
            });
            // Émettre la notification en temps réel via Socket.IO
            this.io.to(`user-${compteId}`).emit("newNotification", notification);
            // Si le compte a un numéro de téléphone valide et que le type nécessite un SMS
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
        // Liste des types de notifications qui nécessitent un SMS
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
