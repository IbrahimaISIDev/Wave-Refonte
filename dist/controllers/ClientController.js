import { PrismaClient } from "@prisma/client";
import { uploadImage } from "../utils/upload.utils.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/AuthService.js";
const prisma = new PrismaClient();
const authService = new AuthService();
class ClientController {
    static async initiateFirstLogin(req, res) {
        try {
            const { phone, secretCode } = req.body;
            if (!phone) {
                res.status(400).json({ message: "Numéro de téléphone requis" });
                return;
            }
            if (!secretCode) {
                res.status(400).json({ message: "Code secret requis" });
                return;
            }
            const result = await authService.initiateFirstLogin(phone, secretCode);
            res.status(200).json(result);
        }
        catch (error) {
            console.error("Erreur lors de l'initiation de la première connexion:", error);
            res.status(500).json({
                message: "Erreur lors de l'initiation de la première connexion",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async validateFirstLogin(req, res) {
        try {
            const { phone, temporaryCode } = req.body;
            if (!phone || !temporaryCode) {
                res.status(400).json({
                    message: "Numéro de téléphone et code temporaire requis",
                });
                return;
            }
            const result = await authService.validateFirstLogin(phone, temporaryCode);
            res.status(200).json({
                message: "Première connexion réussie",
                ...result,
            });
        }
        catch (error) {
            console.error("Erreur lors de la validation de la première connexion:", error);
            res.status(500).json({
                message: "Erreur lors de la validation de la première connexion",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    static async getAllClients(req, res) {
        try {
            const clients = await prisma.client.findMany({
                include: {
                    compte: {
                        select: {
                            id: true,
                            login: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            CNI: true,
                            status: true,
                            role: true,
                            porteFeuille: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });
            res.status(200).json({ data: clients });
        }
        catch (error) {
            console.error("Erreur lors de la récupération des clients:", error);
            res.status(500).json({
                message: "Erreur lors de la récupération des clients",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async getClientById(req, res) {
        try {
            const { id } = req.params;
            const client = await prisma.client.findUnique({
                where: { id: Number(id) },
                include: {
                    compte: {
                        select: {
                            id: true,
                            login: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            CNI: true,
                            status: true,
                            role: true,
                            porteFeuille: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });
            if (!client) {
                res.status(404).json({ message: "Client non trouvé" });
                return;
            }
            res.status(200).json({ data: client });
        }
        catch (error) {
            console.error("Erreur lors de la récupération du client:", error);
            res.status(500).json({
                message: "Erreur lors de la récupération du client",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async getClientByCompteId(req, res) {
        try {
            const { compteId } = req.params;
            const client = await prisma.client.findUnique({
                where: { compteId: Number(compteId) },
                include: {
                    compte: {
                        select: {
                            id: true,
                            login: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            CNI: true,
                            status: true,
                            role: true,
                            porteFeuille: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            });
            if (!client) {
                res.status(404).json({ message: "Client non trouvé" });
                return;
            }
            res.status(200).json({ data: client });
        }
        catch (error) {
            console.error("Erreur lors de la récupération du client par compteId:", error);
            res.status(500).json({
                message: "Erreur lors de la récupération du client",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async createClient(req, res) {
        try {
            const { compteId } = req.body;
            const photoFile = req.file;
            if (!photoFile) {
                res.status(400).json({ message: "Photo requise" });
                return;
            }
            const compte = await prisma.compte.findUnique({
                where: { id: Number(compteId) },
            });
            if (!compte) {
                res.status(404).json({ message: "Compte non trouvé" });
                return;
            }
            if (compte.role !== "CLIENT") {
                res.status(400).json({ message: "Le compte doit être de type CLIENT" });
                return;
            }
            const cloudinaryResponse = await uploadImage(photoFile.path);
            const newClient = await prisma.client.create({
                data: {
                    compteId: Number(compteId),
                    photo: cloudinaryResponse.secure_url,
                },
                include: {
                    compte: true,
                },
            });
            res.status(201).json({
                message: "Client créé avec succès",
                data: newClient,
            });
        }
        catch (error) {
            console.error("Erreur lors de la création du client:", error);
            res.status(500).json({
                message: "Erreur lors de la création du client",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async updateClient(req, res) {
        try {
            const { id } = req.params;
            const photoFile = req.file;
            if (!photoFile) {
                res.status(400).json({ message: "Photo requise" });
                return;
            }
            const cloudinaryResponse = await uploadImage(photoFile.path);
            const updatedClient = await prisma.client.update({
                where: { id: Number(id) },
                data: {
                    photo: cloudinaryResponse.secure_url,
                },
                include: {
                    compte: true,
                },
            });
            res.status(200).json({
                message: "Client mis à jour avec succès",
                data: updatedClient,
            });
        }
        catch (error) {
            console.error("Erreur lors de la mise à jour du client:", error);
            res.status(500).json({
                message: "Erreur lors de la mise à jour du client",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async loginClient(req, res) {
        try {
            const { secretCode } = req.body;
            if (!secretCode) {
                res.status(400).json({ message: "Code secret requis" });
                return;
            }
            const compte = await prisma.compte.findFirst({
                where: { secretCode },
                include: {
                    porteFeuille: true,
                    payments: true,
                    sentTransferts: true,
                    receivedTransferts: true,
                    notifications: true,
                    transactions: true,
                },
            });
            if (!compte) {
                res.status(401).json({ message: "Identifiants invalides" });
                return;
            }
            const isSecretCodeValid = await bcrypt.compare(secretCode, compte.secretCode);
            if (!isSecretCodeValid) {
                res.status(401).json({ message: "Identifiants invalides" });
                return;
            }
            const token = jwt.sign({ id: compte.id, role: compte.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
            res.status(200).json({
                message: "Connexion réussie",
                token,
                user: {
                    id: compte.id,
                    login: compte.login,
                    firstName: compte.firstName,
                    lastName: compte.lastName,
                    phone: compte.phone,
                    role: compte.role,
                    CNI: compte.CNI,
                    lastLoginAt: compte.lastLoginAt,
                    qrCode: compte.qrCodeUrl,
                    porteFeuille: {
                        solde: compte.porteFeuille?.balance,
                        devise: compte.porteFeuille?.devise,
                        montantPlafond: compte.porteFeuille?.montantPlafond,
                        isActive: compte.porteFeuille?.isActive,
                    },
                    paiements: compte.payments,
                    transfertsEnvoyes: compte.sentTransferts,
                    transfertsRecus: compte.receivedTransferts,
                    notifications: compte.notifications,
                    transactions: compte.transactions,
                },
            });
        }
        catch (error) {
            console.error("Erreur lors de la connexion du client:", error);
            res.status(500).json({
                message: "Erreur lors de la connexion",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
}
export default ClientController;
//# sourceMappingURL=ClientController.js.map