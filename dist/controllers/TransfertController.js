import { PrismaClient, TransfertStatus } from '@prisma/client';
const prisma = new PrismaClient();
class TransfertController {
    static async createTransfert(req, res) {
        try {
            const { senderId, receiverId, amount } = req.body;
            if (!senderId || !receiverId || !amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    message: "Veuillez fournir toutes les informations requises et un montant valide"
                });
                return;
            }
            const sender = await prisma.compte.findUnique({
                where: { id: Number(senderId) },
                include: { porteFeuille: true }
            });
            const receiver = await prisma.compte.findUnique({
                where: { id: Number(receiverId) },
                include: { porteFeuille: true }
            });
            if (!sender) {
                res.status(404).json({
                    success: false,
                    message: "Expéditeur non trouvé"
                });
                return;
            }
            if (!receiver) {
                res.status(404).json({
                    success: false,
                    message: "Destinataire non trouvé"
                });
                return;
            }
            if (!sender.porteFeuille || sender.status !== 'ACTIVE') {
                res.status(400).json({
                    success: false,
                    message: "Votre compte n'est pas actif."
                });
                return;
            }
            if (!receiver.porteFeuille || receiver.status !== 'ACTIVE') {
                res.status(400).json({
                    success: false,
                    message: "Recepteur non-actif."
                });
                return;
            }
            const frais = amount * 0.005;
            const totalAmount = amount + frais;
            if (sender.porteFeuille.balance < totalAmount) {
                res.status(400).json({
                    success: false,
                    message: "Solde insuffisant pour effectuer le transfert",
                    soldeActuel: sender.porteFeuille.balance,
                    montantRequis: totalAmount,
                    frais: frais
                });
                return;
            }
            const transfert = await prisma.$transaction(async (prisma) => {
                await prisma.porteFeuille.update({
                    where: { id: sender.porteFeuille?.id },
                    data: { balance: { decrement: totalAmount } }
                });
                await prisma.porteFeuille.update({
                    where: { id: receiver.porteFeuille?.id },
                    data: { balance: { increment: amount } }
                });
                const newTransfert = await prisma.transfert.create({
                    data: {
                        amount,
                        frais,
                        status: TransfertStatus.COMPLETED,
                        senderId: sender.id,
                        receiverId: receiver.id
                    }
                });
                const superAdmin = await prisma.compte.findFirst({
                    where: { role: 'SUPERADMIN' },
                    include: { porteFeuille: true }
                });
                const superAdminWallet = superAdmin?.porteFeuille;
                if (superAdminWallet) {
                    await prisma.porteFeuille.update({
                        where: { id: Number(superAdminWallet.id) },
                        data: {
                            balance: { increment: frais },
                        },
                    });
                }
                await prisma.notification.create({
                    data: {
                        content: `Transfert de ${amount} ${sender.porteFeuille?.devise} envoyé à ${receiver.firstName} ${receiver.lastName}`,
                        compteId: sender.id
                    }
                });
                await prisma.notification.create({
                    data: {
                        content: `Vous avez reçu ${amount} ${receiver.porteFeuille?.devise} de ${sender.firstName} ${sender.lastName}`,
                        compteId: receiver.id
                    }
                });
                return newTransfert;
            });
            res.status(201).json({
                success: true,
                message: "Transfert effectué avec succès",
                transfert,
                frais
            });
        }
        catch (error) {
            console.error('Erreur lors du transfert:', error);
            res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors du transfert"
            });
        }
    }
    static async cancelTransfert(req, res) {
        try {
            const { transfertId } = req.params;
            const transfert = await prisma.transfert.findUnique({
                where: { id: Number(transfertId) },
                include: {
                    sender: { include: { porteFeuille: true } },
                    receiver: { include: { porteFeuille: true } }
                }
            });
            if (!transfert) {
                res.status(404).json({
                    success: false,
                    message: "Transfert non trouvé"
                });
                return;
            }
            if (transfert.status !== TransfertStatus.COMPLETED) {
                res.status(400).json({
                    success: false,
                    message: "Ce transfert ne peut pas être annulé"
                });
                return;
            }
            const transfertTime = new Date(transfert.createdAt).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = (currentTime - transfertTime) / (1000 * 60);
            if (timeDiff > 30) {
                res.status(400).json({
                    success: false,
                    message: "Le délai d'annulation de 30 minutes est dépassé"
                });
                return;
            }
            await prisma.$transaction(async (prisma) => {
                await prisma.porteFeuille.update({
                    where: { id: transfert.sender.porteFeuille?.id },
                    data: { balance: { increment: transfert.amount + transfert.frais } }
                });
                await prisma.porteFeuille.update({
                    where: { id: transfert.receiver.porteFeuille?.id },
                    data: { balance: { decrement: transfert.amount } }
                });
                await prisma.transfert.update({
                    where: { id: transfert.id },
                    data: { status: TransfertStatus.CANCELLED }
                });
                const superAdmin = await prisma.compte.findFirst({
                    where: { role: 'SUPERADMIN' },
                    include: { porteFeuille: true }
                });
                const superAdminWallet = superAdmin?.porteFeuille;
                if (superAdminWallet) {
                    await prisma.porteFeuille.update({
                        where: { id: Number(superAdminWallet.id) },
                        data: {
                            balance: { increment: transfert.frais },
                        },
                    });
                }
                await prisma.notification.create({
                    data: {
                        content: `Votre transfert de ${transfert.amount} ${transfert.sender.porteFeuille?.devise} a été annulé`,
                        compteId: transfert.senderId
                    }
                });
                await prisma.notification.create({
                    data: {
                        content: `Le transfert de ${transfert.amount} ${transfert.receiver.porteFeuille?.devise} a été annulé par l'expéditeur`,
                        compteId: transfert.receiverId
                    }
                });
            });
            res.status(200).json({
                success: true,
                message: "Transfert annulé avec succès"
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'annulation du transfert:', error);
            res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors de l'annulation du transfert"
            });
        }
    }
    static async resendTransfert(req, res) {
        try {
            const { transfertId } = req.params;
            const oldTransfert = await prisma.transfert.findUnique({
                where: { id: Number(transfertId) },
                include: {
                    sender: { include: { porteFeuille: true } },
                    receiver: { include: { porteFeuille: true } }
                }
            });
            if (!oldTransfert) {
                res.status(404).json({
                    success: false,
                    message: "Transfert original non trouvé"
                });
                return;
            }
            const newTransfertData = {
                senderId: oldTransfert.senderId,
                receiverId: oldTransfert.receiverId,
                amount: oldTransfert.amount
            };
            req.body = newTransfertData;
            await TransfertController.createTransfert(req, res);
        }
        catch (error) {
            console.error('Erreur lors du renvoi du transfert:', error);
            res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors du renvoi du transfert"
            });
        }
    }
    static async getTransfertsHistory(req, res) {
        try {
            const { compteId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const transferts = await prisma.transfert.findMany({
                where: {
                    OR: [
                        { senderId: Number(compteId) },
                        { receiverId: Number(compteId) }
                    ]
                },
                include: {
                    sender: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    },
                    receiver: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: Number(limit)
            });
            const total = await prisma.transfert.count({
                where: {
                    OR: [
                        { senderId: Number(compteId) },
                        { receiverId: Number(compteId) }
                    ]
                }
            });
            res.status(200).json({
                success: true,
                transferts,
                pagination: {
                    total,
                    pages: Math.ceil(total / Number(limit)),
                    currentPage: Number(page),
                    limit: Number(limit)
                }
            });
        }
        catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            res.status(500).json({
                success: false,
                message: "Une erreur est survenue lors de la récupération de l'historique des transferts"
            });
        }
    }
}
export default TransfertController;
//# sourceMappingURL=TransfertController.js.map