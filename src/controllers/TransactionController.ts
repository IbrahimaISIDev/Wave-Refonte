import { Request, Response } from 'express';
import { PrismaClient, TransactionType, TransactionStatus, Compte, PorteFeuille } from '@prisma/client';

const prisma = new PrismaClient();

class TransactionController {
    /**
     * Effectue un dépôt d'argent sur un portefeuille
     */
    public static async createDepot(req: Request, res: Response): Promise<void> {
        try {
            const { amount, compteId, agentId } = req.body;

            // Validation des données
            if (!amount || !compteId || !agentId) {
                res.status(400).json({ message: 'Veuillez fournir tous les champs requis' });
                return;
            }

            if (amount <= 0) {
                res.status(400).json({ message: 'Le montant doit être positif' });
                return;
            }

            // Vérification du compte et du portefeuille
            const compte = await prisma.compte.findUnique({
                where: { id: Number(compteId) },
                include: { porteFeuille: true }
            });

            if (!compte) {
                res.status(404).json({ message: 'Compte non trouvé' });
                return;
            }

            if (!compte.porteFeuille) {
                res.status(400).json({ message: 'Aucun portefeuille associé à ce compte' });
                return;
            }

            const porteFeuille = await prisma.porteFeuille.findUnique({
                where: { id: compte.porteFeuille.id }
            });

            if (!porteFeuille) {
                res.status(404).json({ message: 'Portefeuille non trouvé' });
                return;
            }

            // Vérification du solde et création de la transaction
            try {
                const transaction = await prisma.$transaction(async (tx) => {
                    // Mise à jour du solde du portefeuille
                    const updatedPorteFeuille = await tx.porteFeuille.update({
                        where: { id: porteFeuille.id },
                        data: { balance: porteFeuille.balance + amount }
                    });

                    // Création de la transaction
                    const newTransaction = await tx.transaction.create({
                        data: {
                            amount,
                            type: TransactionType.DEPOSIT,
                            status: TransactionStatus.SUCCESS,
                            compteId: Number(compteId),
                            agentId: Number(agentId),
                            porteFeuilleId: porteFeuille.id
                        }
                    });

                    // Création de la notification
                    await tx.notification.create({
                        data: {
                            content: `Dépôt de ${amount} ${porteFeuille.devise} effectué avec succès`,
                            compteId: Number(compteId),
                            isRead: false
                        }
                    });

                    return newTransaction;
                });

                res.status(201).json({
                    success: true,
                    transaction,
                    message: 'Dépôt effectué avec succès'
                });

            } catch (txError) {
                console.error('Erreur lors de la transaction:', txError);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la transaction'
                });
            }

        } catch (error) {
            console.error('Erreur lors du dépôt:', error);
            res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors du dépôt'
            });
        }
    }

    /**
     * Effectue un retrait d'argent depuis un portefeuille
     */
    public static async createRetrait(req: Request, res: Response): Promise<void> {
        try {
            const { amount, compteId, agentId } = req.body;

            // Validation des données
            if (!amount || !compteId || !agentId) {
                res.status(400).json({ message: 'Veuillez fournir tous les champs requis' });
                return;
            }

            if (amount <= 0) {
                res.status(400).json({ message: 'Le montant doit être positif' });
                return;
            }

            // Vérification du compte et du portefeuille
            const compte = await prisma.compte.findUnique({
                where: { id: Number(compteId) },
                include: { porteFeuille: true }
            });

            const agent = await prisma.agent.findUnique({
                where: { id: Number(agentId) }
            });

            if (!compte) {
                res.status(404).json({ message: 'Compte non trouvé' });
                return;
            }

            if (!agent) {
                res.status(404).json({ message: 'Agence non trouvé' });
                return;
            }

            if (!compte.porteFeuille) {
                res.status(400).json({ message: 'Aucun portefeuille associé à ce compte' });
                return;
            }

            const porteFeuille = await prisma.porteFeuille.findUnique({
                where: { id: compte.porteFeuille.id }
            });

            if (!porteFeuille) {
                res.status(404).json({ message: 'Portefeuille non trouvé' });
                return;
            }

            // Vérification du solde
            if (porteFeuille.balance < amount) {
                res.status(400).json({
                    message: 'Solde insuffisant',
                    soldeActuel: porteFeuille.balance,
                    montantDemande: amount
                });
                return;
            }

            // Transaction Prisma
            try {
                const transaction = await prisma.$transaction(async (tx) => {
                    // Mise à jour du solde du portefeuille
                    const updatedPorteFeuille = await tx.porteFeuille.update({
                        where: { id: porteFeuille.id },
                        data: { balance: porteFeuille.balance - amount }
                    });

                    // Création de la transaction
                    const newTransaction = await tx.transaction.create({
                        data: {
                            amount,
                            type: TransactionType.WITHDRAW,
                            status: TransactionStatus.SUCCESS,
                            compteId: Number(compteId),
                            agentId: Number(agentId),
                            porteFeuilleId: porteFeuille.id
                        }
                    });

                    // Création de la notification
                    await prisma.notification.create({
                      data: {
                        content: `Retrait de ${amount} ${porteFeuille.devise} effectué avec succès`,
                        compteId: Number(compteId),
                        isRead: false
                      }
                    });

                    return newTransaction;
                });

                res.status(201).json({
                    success: true,
                    transaction,
                    message: 'Retrait effectué avec succès'
                });

            } catch (txError) {
                console.error('Erreur lors de la transaction:', txError);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la transaction'
                });
            }

        } catch (error) {
            console.error('Erreur lors du retrait:', error);
            res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors du retrait'
            });
        }
    }
    
     /**
     * Liste les transactions avec possibilité de filtrage
     */
     public static async getTransactions(req: Request, res: Response): Promise<void> {
        try {
            const { 
                startDate, 
                endDate, 
                type,
                compteId,
                status
            } = req.query;

            // Construction du filtre dynamique
            let whereClause: any = {};

            // Filtre par date
            if (startDate && endDate) {
                whereClause.createdAt = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            // Filtre par type de transaction
            if (type) {
                whereClause.type = type;
            }

            // Filtre par compte
            if (compteId) {
                whereClause.compteId = Number(compteId);
            }

            // Filtre par statut
            if (status) {
                whereClause.status = status;
            }

            const transactions = await prisma.transaction.findMany({
                where: whereClause,
                include: {
                    compte: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    },
                    porteFeuille: {
                        select: {
                            balance: true,
                            devise: true
                        }
                    },
                    agent: {
                        select: {
                            nomAgence: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Calcul des statistiques
            const stats = {
                totalTransactions: transactions.length,
                totalDeposits: transactions.filter(t => t.type === TransactionType.DEPOSIT).length,
                totalWithdrawals: transactions.filter(t => t.type === TransactionType.WITHDRAW).length,
                totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0)
            };

            res.status(200).json({
                success: true,
                data: transactions,
                stats,
                message: 'Transactions récupérées avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des transactions'
            });
        }
    }

    /**
     * Annule une transaction (dépôt ou retrait)
     */
    public static async cancelTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { transactionId } = req.params;
            const { reason } = req.body;

            // Vérification de l'existence de la transaction
            const transaction = await prisma.transaction.findUnique({
                where: { id: Number(transactionId) },
                include: {
                    porteFeuille: true
                }
            });

            if (!transaction) {
                res.status(404).json({
                    success: false,
                    message: 'Transaction non trouvée'
                });
                return;
            }

            // Vérification que la transaction n'est pas déjà annulée
            if (transaction.status === TransactionStatus.FAILED) {
                res.status(400).json({
                    success: false,
                    message: 'Cette transaction est déjà annulée'
                });
                return;
            }

            try {
                const result = await prisma.$transaction(async (tx) => {
                    // Mise à jour du solde du portefeuille
                    const updatedBalance = transaction.type === TransactionType.DEPOSIT
                        ? transaction.porteFeuille!.balance - transaction.amount  // Annulation d'un dépôt
                        : transaction.porteFeuille!.balance + transaction.amount; // Annulation d'un retrait

                    // Mise à jour du portefeuille
                    await tx.porteFeuille.update({
                        where: { id: transaction.porteFeuilleId },
                        data: { balance: updatedBalance }
                    });

                    // Mise à jour du statut de la transaction
                    const updatedTransaction = await tx.transaction.update({
                        where: { id: Number(transactionId) },
                        data: {
                            status: TransactionStatus.FAILED
                        }
                    });

                    // Création d'une notification
                    await tx.notification.create({
                        data: {
                            content: `Transaction ${transaction.type} de ${transaction.amount} ${transaction.porteFeuille!.devise} annulée. Raison: ${reason}`,
                            compteId: transaction.compteId,
                            isRead: false
                        }
                    });

                    return updatedTransaction;
                });

                res.status(200).json({
                    success: true,
                    transaction: result,
                    message: 'Transaction annulée avec succès'
                });

            } catch (txError) {
                console.error('Erreur lors de l\'annulation de la transaction:', txError);
                res.status(500).json({
                    success: false,
                    message: 'Erreur lors de l\'annulation de la transaction'
                });
            }

        } catch (error) {
            console.error('Erreur lors de l\'annulation:', error);
            res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de l\'annulation'
            });
        }
    }

    /**
     * Récupère les statistiques des transactions sur une période donnée
     */
    public static async getTransactionStats(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, endDate, compteId } = req.query;

            let whereClause: any = {};

            if (startDate && endDate) {
                whereClause.createdAt = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string)
                };
            }

            if (compteId) {
                whereClause.compteId = Number(compteId);
            }

            const transactions = await prisma.transaction.findMany({
                where: whereClause
            });

            const stats = {
                totalTransactions: transactions.length,
                deposits: {
                    count: transactions.filter(t => t.type === TransactionType.DEPOSIT).length,
                    total: transactions
                        .filter(t => t.type === TransactionType.DEPOSIT)
                        .reduce((sum, t) => sum + t.amount, 0)
                },
                withdrawals: {
                    count: transactions.filter(t => t.type === TransactionType.WITHDRAW).length,
                    total: transactions
                        .filter(t => t.type === TransactionType.WITHDRAW)
                        .reduce((sum, t) => sum + t.amount, 0)
                },
                successfulTransactions: transactions.filter(t => t.status === TransactionStatus.SUCCESS).length,
                failedTransactions: transactions.filter(t => t.status === TransactionStatus.FAILED).length
            };

            res.status(200).json({
                success: true,
                stats,
                message: 'Statistiques récupérées avec succès'
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            res.status(500).json({
                success: false,
                message: 'Une erreur est survenue lors de la récupération des statistiques'
            });
        }
    }
}


export default TransactionController;