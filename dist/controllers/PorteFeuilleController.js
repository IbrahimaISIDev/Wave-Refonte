import { PrismaClient } from '@prisma/client';
import utils from '../utils/utils.js';
import { error } from 'console';
const prisma = new PrismaClient();
export default class PorteFeuilleController {
    static async createWallet(req, res) {
        const { compteId } = req.body;
        if (!compteId) {
            return res.status(400).json({ message: "Compte ID non fourni" });
        }
        const compteIdNumber = Number(compteId);
        if (isNaN(compteIdNumber)) {
            return res.status(400).json({ message: "Compte ID doit être un nombre" });
        }
        try {
            const firstWallet = await prisma.porteFeuille.findFirst({
                where: { compteId: compteIdNumber }
            });
            if (firstWallet) {
                return res.status(400).json({ message: "Portefeuille déjà existant" });
            }
            const wallet = await prisma.porteFeuille.create({
                data: {
                    compteId: compteIdNumber,
                    balance: 0,
                    devise: req.body.devise || "XOF",
                    montantPlafond: 2000000,
                    isActive: false
                }
            });
            const code = utils.generateRandomCode(5);
            await prisma.activation.create({
                data: {
                    porteFeuilleId: wallet.id,
                    code: code
                }
            });
            const portefeuille = await prisma.porteFeuille.findFirst({
                where: {
                    id: wallet.id
                },
                include: { activations: true, compte: true }
            });
            return res.status(201).json({
                message: "Portefeuille créé avec succès",
                data: portefeuille
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de la création du portefeuille", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static async getWallet(req, res) {
        const { compteId } = req.body;
        if (!compteId) {
            return res.status(400).json({ message: "Compte ID non fourni" });
        }
        const compteIdNumber = Number(compteId);
        if (isNaN(compteIdNumber)) {
            return res.status(400).json({ message: "Compte ID doit être un nombre" });
        }
        try {
            const firstWallet = await prisma.porteFeuille.findFirst({
                where: { compteId: compteIdNumber }
            });
            if (!firstWallet) {
                return res.status(404).json({ message: "Portefeuille non trouvé" });
            }
            return res.status(200).json({
                message: "Portefeuille trouvé",
                data: firstWallet
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de la récupération du portefeuille", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static async getWalletById(idCompte, res) {
        try {
            const compte = await prisma.compte.findUnique({
                where: { id: idCompte },
                include: { porteFeuille: true }
            });
            if (!compte) {
                return res.status(404).json({ message: "Compte non trouvé" });
            }
            if (compte.status === "INACTIVE") {
                return res.status(403).json({ message: "Ce compte est bloqué pour le moment" });
            }
            const wallet = compte.porteFeuille;
            if (!wallet) {
                return res.status(404).json({ message: "Portefeuille non trouvé" });
            }
            const transactions = await prisma.transaction.findMany({
                where: { porteFeuilleId: wallet.id }
            });
            const transferts = await prisma.transfert.findMany({
                where: {
                    OR: [
                        { senderId: idCompte },
                        { receiverId: idCompte }
                    ]
                }
            });
            const paiements = await prisma.payment.findMany({
                where: { compteId: idCompte }
            });
            const combinedData = [...transactions, ...transferts, ...paiements];
            if (combinedData.length === 0) {
                return res.status(404).json({ message: "Aucune transaction trouvée" });
            }
            const latestDateTimestamp = Math.max(...combinedData.map(item => new Date(item.createdAt).getTime()));
            const filteredData = combinedData.filter(item => new Date(item.createdAt).getTime() === latestDateTimestamp);
            return res.status(200).json({
                message: "Portefeuille et transactions trouvés",
                data: {
                    portefeuille: wallet,
                    transactions: filteredData
                }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de la récupération du portefeuille et des transactions", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static async getWalletByClient(req, res) {
        const clientId = req.body.idClient;
        if (!clientId) {
            return res.status(400).json({ message: "Client ID non fourni" });
        }
        if (isNaN(Number(clientId))) {
            return res.status(400).json({ message: "Client ID is not a number" });
        }
        try {
            const client = await prisma.client.findFirst({
                where: {
                    compte: {
                        id: Number(clientId)
                    }
                },
                include: {
                    compte: true
                }
            });
            if (!client) {
                return res.status(404).json({ message: "Client non trouvé" });
            }
            const data = await this.getWalletById(client.compte.id, res);
            return data;
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de la récupération du portefeuille et des transactions", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static async getWalletByService(req, res) {
        const serviceId = req.body.idService;
        if (!serviceId) {
            return res.status(400).json({ message: "Service ID non fourni" });
        }
        if (isNaN(Number(serviceId))) {
            return res.status(400).json({ message: "Service ID is not a number" });
        }
        try {
            const service = await prisma.service.findFirst({
                where: {
                    id: Number(serviceId)
                },
                include: {
                    compte: true
                }
            });
            if (!service) {
                return res.status(404).json({ message: "Service non trouvé" });
            }
            const data = await this.getWalletById(service.compte.id, res);
            return data;
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de la récupération du portefeuille et des transactions", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static async getWalletByOperateur(req, res) {
        const operateurId = req.body.idOperateur;
        if (!operateurId) {
            return res.status(400).json({ message: "Opérateur ID non fourni" });
        }
        if (isNaN(Number(operateurId))) {
            return res.status(400).json({ message: "Opérateur ID is not a number" });
        }
        try {
            const operateur = await prisma.operateur.findFirst({
                where: {
                    id: Number(operateurId)
                },
                include: {
                    compte: true
                }
            });
            if (!operateur) {
                return res.status(404).json({ message: "Opérateur non trouvé" });
            }
            const data = await this.getWalletById(operateur.compte.id, res);
            return data;
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: " Erreur lors de la récupération du portefeuille et des transactions", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
    static existAccount(id) {
        if (!id) {
            throw new Error("Compte ID non fourni");
        }
        const compteIdNumber = Number(id);
        if (isNaN(compteIdNumber)) {
            throw new Error("Compte ID doit être un nombre");
        }
    }
    static async verifyCodeExpiration(porteFeuilleId) {
        const expiredActivations = await prisma.activation.updateMany({
            where: {
                porteFeuilleId: porteFeuilleId,
                expiration: false,
                createdAt: {
                    lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            data: {
                expiration: true
            }
        });
        return expiredActivations;
    }
    static async getCodeWallet(req, res) {
        try {
            const portefeuille = await prisma.porteFeuille.findUnique({
                where: {
                    id: req.body.portefeuilleId,
                },
                include: {
                    activations: true
                }
            });
            if (!portefeuille) {
                throw new Error("Portefeuille non trouvé");
            }
            await this.verifyCodeExpiration(req.body.portefeuilleId);
            const code = utils.generateRandomCode(5);
            await prisma.activation.create({
                data: {
                    porteFeuilleId: req.body.portefeuilleId,
                    code: code,
                    expiration: false,
                    isActive: false
                }
            });
            return res.status(200).json({
                message: "Code généré avec succès",
                data: { code }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Erreur lors de la génération du code",
                error: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
    }
    static async accessToWallet(req, res) {
        try {
            const activation = await prisma.activation.findFirst({
                where: {
                    porteFeuilleId: req.body.portefeuilleId,
                    code: req.body.code,
                    expiration: false,
                    isActive: false
                }
            });
            if (!activation) {
                throw new Error("Code invalide ou expiré");
            }
            const [updatedPortefeuille, updatedActivation] = await prisma.$transaction([
                prisma.porteFeuille.update({
                    where: { id: req.body.portefeuilleId },
                    data: { isActive: true }
                }),
                prisma.activation.update({
                    where: { id: activation.id },
                    data: { isActive: true }
                })
            ]);
            return res.status(200).json({
                message: "Votre portefeuille est maintenant accessible",
                data: {
                    portefeuille: updatedPortefeuille
                }
            });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Erreur lors de l'accès au portefeuille",
                error: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
    }
    static async openWallet(req, res) {
        this.existAccount(req.body.portefeuilleId);
        const secretCode = req.body.secretCode;
        try {
            const portefeuille = await prisma.porteFeuille.findUnique({
                where: {
                    id: req.body.portefeuilleId
                },
                include: {
                    compte: true
                }
            });
            if (!portefeuille) {
                throw new Error("Portefeuille non trouvé");
            }
            if (!utils.comparePassword(secretCode, portefeuille.compte.secretCode)) {
                throw new Error("Code secret invalide");
            }
            if (portefeuille.isActive) {
                throw new Error("Ce portefeuille est déjà ouvert");
            }
            const wallet = await prisma.porteFeuille.update({
                where: { id: req.body.portefeuilleId },
                data: { isActive: true }
            });
            return res.status(200).json({ message: "Votre portefeuille est maintenant ouvert",
                data: {
                    portefeuille: wallet
                }
            });
        }
        catch {
            console.error(error);
            return res.status(500).json({ message: "Erreur lors de l'ouverture du portefeuille", error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
    }
}
//# sourceMappingURL=PorteFeuilleController.js.map