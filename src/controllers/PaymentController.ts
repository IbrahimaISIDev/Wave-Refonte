import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();


class PaymentController {
  // Méthode pour effectuer un paiement
  public static async createPayment(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { compteId, operateurId, amount } = req.body;

      const compte = await prisma.compte.findUnique({
        where: { id: Number(compteId) },
        include: {
          porteFeuille: true,
          client: true,
        },
      });

      if (!compte) {
        res.status(404).json({ message: "Compte non trouvé" });
        return;
      }

      if (compte.role !== "CLIENT") {
        res.status(403).json({
          message: "Seuls les clients peuvent effectuer des paiements!",
        });
        return;
      }

      const operateur = await prisma.operateur.findUnique({
        where: { id: Number(operateurId) },
      });

      if (!operateur) {
        res.status(404).json({ message: "Opérateur non trouvé" });
        return;
      }

      if (!compte.porteFeuille || !compte.porteFeuille.isActive) {
        res
          .status(400)
          .json({ message: "Le portefeuille du client n'est pas actif" });
        return;
      }

      if (amount <= 0) {
        res.status(400).json({ message: "Le montant doit être supérieur à 0" });
        return;
      }

      if (compte.porteFeuille.balance < amount) {
        res
          .status(400)
          .json({ message: "Solde insuffisant pour effectuer le paiement" });
        return;
      }

      const newPayment = await prisma.payment.create({
        data: {
          amount,
          compteId: Number(compteId),
          operateurId: Number(operateurId),
          status: "SUCCESS",
        },
      });

      // Nous avons vérifié que porteFeuille n'est pas nul ci-dessus
      await prisma.porteFeuille.update({
        where: { id: compte.porteFeuille!.id }, // Utilisation de '!' pour indiquer que ce n'est pas nul
        data: {
          balance: compte.porteFeuille!.balance - amount, // Utilisation de '!' ici aussi
        },
      });

      await prisma.notification.create({
        data: {
          content: `Paiement de ${amount} XOF effectué avec succès à ${operateur.nomOperateur}`,
          compteId: compte.id,
          isRead: false,
        },
      });

      res.status(201).json({
        message: "Paiement effectué avec succès",
        data: newPayment,
      });
    } catch (error) {
      console.error("Erreur lors du paiement:", error);
      res.status(500).json({
        message: "Une erreur est survenue lors du paiement",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Méthode pour obtenir les détails d'un paiement
  public static async getPaymentDetails(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { idPaiement } = req.params;

      const payment = await prisma.payment.findUnique({
        where: {
          id: Number(idPaiement),
        },
        include: {
          compte: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
          operateur: {
            select: {
              id: true,
              nomOperateur: true,
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({ message: "Paiement non trouvé" });
        return;
      }

      res.json({
        message: "Détails du paiement récupérés avec succès",
        payment,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails du paiement:",
        error
      );
      res.status(500).json({
        message:
          "Une erreur est survenue lors de la récupération des détails du paiement",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Méthode pour obtenir l'historique des paiements d'un client
  public static async getClientPaymentHistory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { compteId } = req.params;
      const { page = "1", limit = "10", startDate, endDate } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      const payments = await prisma.payment.findMany({
        where: {
          compteId: Number(compteId),
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        include: {
          operateur: { select: { nomOperateur: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit as string),
      });

      const total = await prisma.payment.count({
        where: {
          compteId: Number(compteId),
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
      });

      res.json({
        message: "Historique des paiements récupéré avec succès",
        payments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'historique des paiements:",
        error
      );
      res.status(500).json({
        message:
          "Une erreur est survenue lors de la récupération de l'historique des paiements",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Méthode pour obtenir les statistiques de paiement d'un client

  public static async getClientPaymentStats(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { compteId } = req.params;
      const { startDate, endDate } = req.query;

      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);

      type PaymentGroupByOutput = Prisma.PaymentGroupByOutputType & {
        _sum: {
          amount: number | null;
        };
        _count: {
          _all: number;
        };
      };

      const [aggregateResult, groupByResults] = await prisma.$transaction([
        prisma.payment.aggregate({
          where: {
            compteId: Number(compteId),
            ...(startDate || endDate ? { createdAt: dateFilter } : {}),
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payment.groupBy({
          by: ["operateurId"],
          where: {
            compteId: Number(compteId),
            ...(startDate || endDate ? { createdAt: dateFilter } : {}),
          },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { operateurId: "asc" },
        }),
      ]);

      const operateurIds = (groupByResults as PaymentGroupByOutput[]).map(
        (result) => result.operateurId
      );

      const operateurs = await prisma.operateur.findMany({
        where: { id: { in: operateurIds } },
      });

      const paymentsByOperateur = (
        groupByResults as PaymentGroupByOutput[]
      ).map((result) => ({
        operateurName:
          operateurs.find((op) => op.id === result.operateurId)?.nomOperateur ??
          "Inconnu",
        totalAmount: result._sum.amount ?? 0,
        count: result._count._all,
      }));

      res.json({
        message: "Statistiques des paiements récupérées avec succès",
        stats: {
          totalAmount: aggregateResult._sum.amount ?? 0,
          totalCount: aggregateResult._count,
          paymentsByOperateur,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({
        message:
          "Une erreur est survenue lors de la récupération des statistiques",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default PaymentController;
