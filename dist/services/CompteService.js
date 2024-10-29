import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import twilio from 'twilio';
dotenv.config();
const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export class CompteService {
    constructor(io) {
        this.io = io;
    }
    async createCompte(data) {
        const { login, password, phone } = data;
        const existingCompteByLogin = await prisma.compte.findUnique({
            where: { login },
        });
        if (existingCompteByLogin) {
            throw new Error("Ce login est déjà utilisé");
        }
        const existingCompteByPhone = await prisma.compte.findUnique({
            where: { phone },
        });
        if (existingCompteByPhone) {
            throw new Error("Ce numéro de téléphone est déjà utilisé");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await prisma.$transaction(async (prisma) => {
            const newCompte = await prisma.compte.create({
                data: {
                    ...data,
                    password: hashedPassword,
                    role: data.role || "CLIENT",
                },
            });
            const porteFeuille = await prisma.porteFeuille.create({
                data: {
                    compteId: newCompte.id,
                    balance: 0,
                    devise: "XOF",
                    montantPlafond: 2000000.0,
                    isActive: false,
                },
            });
            await this.sendWelcomeSMS(newCompte);
            await prisma.notification.create({
                data: {
                    content: `Bienvenue ${newCompte.firstName} ! Votre compte a été créé avec succès.`,
                    compteId: newCompte.id,
                    type: "WELCOME",
                },
            });
            return { newCompte, porteFeuille };
        });
        const token = this.generateToken(result.newCompte.id);
        const { password: _, ...compteWithoutPassword } = result.newCompte;
        return {
            compte: compteWithoutPassword,
            porteFeuille: result.porteFeuille,
            token,
        };
    }
    async sendWelcomeSMS(compte) {
        try {
            const message = await twilioClient.messages.create({
                body: `Bienvenue ${compte.firstName} sur notre plateforme ! Votre compte a été créé avec succès.`,
                to: compte.phone,
                from: process.env.TWILIO_PHONE_NUMBER,
            });
            console.log("SMS de bienvenue envoyé:", message.sid);
        }
        catch (error) {
            console.error("Erreur lors de l'envoi du SMS de bienvenue:", error);
        }
    }
    generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" });
    }
    async updateCompteStatus(compteId, status) {
        const updatedCompte = await prisma.compte.update({
            where: { id: compteId },
            data: { status },
        });
        this.io.to(`user-${compteId}`).emit("statusUpdate", {
            compteId,
            status: updatedCompte.status,
        });
        if (status === "ACTIVE") {
            const compte = await prisma.compte.findUnique({
                where: { id: compteId },
            });
            if (compte) {
                await this.sendStatusSMS(compte, "activé");
            }
        }
        return updatedCompte;
    }
    async sendStatusSMS(compte, action) {
        try {
            await twilioClient.messages.create({
                body: `Votre compte a été ${action} avec succès.`,
                to: compte.phone,
                from: process.env.TWILIO_PHONE_NUMBER,
            });
        }
        catch (error) {
            console.error("Erreur lors de l'envoi du SMS de statut:", error);
        }
    }
}
//# sourceMappingURL=CompteService.js.map