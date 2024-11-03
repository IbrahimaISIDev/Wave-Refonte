import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
dotenv.config();
const prisma = new PrismaClient();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export class CompteService {
    constructor(io) {
        this.io = io;
    }
    async generateAndUploadQRCode(compte) {
        try {
            const qrData = {
                firstName: compte.firstName,
                lastName: compte.lastName,
                phone: compte.phone,
            };
            const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
                errorCorrectionLevel: "H",
                margin: 1,
                width: 300,
                color: {
                    dark: "#000000",
                    light: "#ffffff",
                },
            });
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    folder: "qr-codes",
                    public_id: `qr-code-${compte.id}`,
                    format: "png",
                    transformation: [
                        { quality: "auto:best" },
                        { fetch_format: "auto" },
                    ],
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result.secure_url);
                });
                const readableStream = new Readable({
                    read() {
                        this.push(qrBuffer);
                        this.push(null);
                    },
                });
                readableStream.pipe(uploadStream);
            });
        }
        catch (error) {
            console.error("Erreur lors de la génération/upload du QR code:", error);
            throw error;
        }
    }
    async createCompte(data) {
        const { login, secretCode, phone } = data;
        const existingCompteByLogin = await prisma.compte.findUnique({
            where: { login },
        });
        if (existingCompteByLogin)
            throw new Error("Ce login est déjà utilisé");
        const existingCompteByPhone = await prisma.compte.findUnique({
            where: { phone },
        });
        if (existingCompteByPhone)
            throw new Error("Ce numéro de téléphone est déjà utilisé");
        if (secretCode.length !== 4 || !/^\d+$/.test(secretCode)) {
            throw new Error("Le code secret doit être un nombre de 4 chiffres.");
        }
        const salt = await bcrypt.genSalt(10);
        const hashedSecretCode = await bcrypt.hash(secretCode, salt);
        try {
            const result = await prisma.$transaction(async (prisma) => {
                const newCompte = await prisma.compte.create({
                    data: {
                        login: data.login,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        phone: data.phone,
                        CNI: data.CNI,
                        photo: data.photo,
                        secretCode: hashedSecretCode,
                        password: data.password,
                        role: data.role || "CLIENT",
                    },
                });
                const qrCodeUrl = await this.generateAndUploadQRCode(newCompte);
                const updatedCompte = await prisma.compte.update({
                    where: { id: newCompte.id },
                    data: { qrCodeUrl },
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
                await this.sendWelcomeSMSWithQR(updatedCompte, qrCodeUrl);
                await prisma.notification.create({
                    data: {
                        content: `Bienvenue ${newCompte.firstName} ! Votre compte a été créé avec succès. Votre QR code personnel est disponible dans votre profil.`,
                        compteId: newCompte.id,
                        type: "WELCOME",
                    },
                });
                return { newCompte: updatedCompte, porteFeuille };
            });
            const token = this.generateToken(result.newCompte.id);
            const { secretCode: _, ...compteWithoutSecretCode } = result.newCompte;
            return {
                compte: compteWithoutSecretCode,
                porteFeuille: result.porteFeuille,
                token,
            };
        }
        catch (error) {
            console.error("Erreur lors de la création du compte:", error);
            throw new Error("Erreur lors de la création du compte");
        }
    }
    async sendWelcomeSMSWithQR(compte, qrCodeUrl) {
        try {
            const message = await twilioClient.messages.create({
                body: `Bienvenue ${compte.firstName} sur notre plateforme ! Votre compte a été créé avec succès. Votre QR code personnel est disponible ici : ${qrCodeUrl}`,
                to: compte.phone,
                from: process.env.TWILIO_PHONE_NUMBER,
            });
            console.log("SMS de bienvenue envoyé:", message.sid);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("Erreur lors de l'envoi du SMS de bienvenue:", error.message);
            }
            else {
                console.error("Erreur inconnue lors de l'envoi du SMS de bienvenue:", error);
            }
        }
    }
    async regenerateQRCode(compteId) {
        const compte = await prisma.compte.findUnique({
            where: { id: compteId },
        });
        if (!compte) {
            throw new Error("Compte non trouvé");
        }
        const newQRCodeUrl = await this.generateAndUploadQRCode(compte);
        await prisma.compte.update({
            where: { id: compteId },
            data: { qrCodeUrl: newQRCodeUrl },
        });
        return newQRCodeUrl;
    }
    generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        });
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
            if (compte)
                await this.sendStatusSMS(compte, "activé");
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
            if (error instanceof Error) {
                console.error("Erreur lors de l'envoi du SMS de statut:", error.message);
            }
            else {
                console.error("Erreur inconnue lors de l'envoi du SMS de statut:", error);
            }
        }
    }
    static generateToken(userId) {
        return jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        });
    }
    async getAllComptes() {
        return await prisma.compte.findMany();
    }
    async getCompteById(compteId) {
        const compte = await prisma.compte.findUnique({
            where: { id: compteId },
        });
        if (!compte) {
            throw new Error("Compte non trouvé");
        }
        return compte;
    }
    async updateCompte(compteId, data) {
        const updatedCompte = await prisma.compte.update({
            where: { id: compteId },
            data,
        });
        return updatedCompte;
    }
    async deleteCompte(compteId) {
        const compte = await prisma.compte.delete({
            where: { id: compteId },
        });
        return compte;
    }
}
//# sourceMappingURL=CompteService.js.map