// src/services/AuthService.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import twilio from "twilio";

const prisma = new PrismaClient();

export class AuthService {
  private twilioClient: any;
  private readonly CODE_EXPIRATION = 5 * 60 * 1000;

  constructor() {
    // Vérification de la configuration Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      console.error("Configuration Twilio manquante");
    } else {
      this.twilioClient = twilio(accountSid, authToken);
    }
  }

  private generateTemporaryCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async sendTemporaryCodeBySMS(phone: string, code: string): Promise<void> {
    if (!this.twilioClient) {
      throw new Error("La configuration Twilio n'est pas disponible");
    }

    try {
      // Normaliser le numéro de téléphone
      const formattedPhone = this.formatPhoneNumber(phone);

      // Envoyer le SMS
      await this.twilioClient.messages.create({
        body: `Votre code de connexion est: ${code}. Ce code est valable pendant 5 minutes.`,
        to: formattedPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });

      console.log(`SMS envoyé avec succès à ${formattedPhone}`);
    } catch (error) {
      console.error("Erreur détaillée Twilio:", error);

      if (error instanceof Error) { // Vérifie si l'erreur est du type Error
        const err = error as any; // Pour accéder à `code` sans conflit de type

        if (err.code === 21211) {
          throw new Error("Numéro de téléphone invalide");
        } else if (err.code === 21608) {
          throw new Error("Numéro non vérifié dans Twilio");
        } else if (err.code === 20003) {
          throw new Error("Identifiants Twilio non autorisés");
        } else {
          throw new Error(`Erreur d'envoi SMS: ${err.message}`);
        }
      } else {
        throw new Error("Erreur inconnue lors de l'envoi du SMS");
      }
    }
  }

  // Formater le numéro de téléphone pour Twilio
  private formatPhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques
    let cleaned = phone.replace(/\D/g, '');
    
    // Ajouter le + si nécessaire
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  public async initiateFirstLogin(phone: string, secretCode: string): Promise<{ message: string; expiresAt: Date }> {
    try {
      // Vérifier si le compte existe
      const compte = await prisma.compte.findUnique({ 
        where: { phone, secretCode },
        select: {
          id: true,
          lastLoginAt: true,
          status: true
        }
      });

      if (!compte) {
        throw new Error("Compte non trouvé");
      }

      // Vérifier si c'est la première connexion
      if (compte.lastLoginAt) {
        throw new Error("Ce n'est pas votre première connexion. Veuillez utiliser votre code secret.");
      }

      // Générer et sauvegarder le code temporaire
      const temporaryCode = this.generateTemporaryCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRATION);

      // Supprimer les anciens codes non utilisés pour ce numéro
      await prisma.temporaryCode.deleteMany({
        where: {
          phone,
          used: false
        }
      });

      // Créer le nouveau code
      await prisma.temporaryCode.create({
        data: {
          code: temporaryCode,
          phone,
          expiresAt,
        },
      });

      // Envoyer le SMS
      await this.sendTemporaryCodeBySMS(phone, temporaryCode);

      console.log(`Code temporaire généré pour ${phone}: ${temporaryCode}`);

      return {
        message: "Code temporaire envoyé par SMS",
        expiresAt,
      };
    } catch (error) {
      console.error("Erreur complète:", error);
      throw error;
    }
  }

  // Valide le code temporaire et effectue la première connexion
  async validateFirstLogin(phone: string, temporaryCode: string): Promise<{
    token: string;
    user: any;
  }> {
    const codeRecord = await prisma.temporaryCode.findFirst({
      where: {
        phone,
        code: temporaryCode,
        expiresAt: { gt: new Date() },
        used: false,
      },
    });

    if (!codeRecord) {
      throw new Error("Code invalide ou expiré");
    }

    // Marquer le code comme utilisé
    await prisma.temporaryCode.update({
      where: { id: codeRecord.id },
      data: { used: true },
    });

    const compte = await prisma.compte.findUnique({
      where: { phone },
      include: {
        porteFeuille: true,
        payments: true,
        sentTransferts: true,
        receivedTransferts: true,
        notifications: true,
        transactions: true,
      },
    });

    if (!compte) throw new Error("Compte non trouvé");

    // Mettre à jour la date de dernière connexion
    await prisma.compte.update({
      where: { id: compte.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { id: compte.id, role: compte.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: compte.id,
        login: compte.login,
        firstName: compte.firstName,
        lastName: compte.lastName,
        phone: compte.phone,
        role: compte.role,
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
    };
  }

  // Connexion normale avec code secret
  // Méthode pour vérifier si c'est la première connexion
  private async isFirstLogin(phone: string): Promise<boolean> {
    const compte = await prisma.compte.findUnique({
      where: { phone },
      select: {
        lastLoginAt: true,
      },
    });

    // Si lastLoginAt est nul, c'est la première connexion
    return !compte?.lastLoginAt;
  }

  async regularLogin(phone: string, secretCode: string): Promise<{
    token: string;
    user: any;
  }> {
    if (await this.isFirstLogin(phone)) {
      throw new Error(
        "Première connexion détectée. Veuillez utiliser le processus de première connexion."
      );
    }

    const compte = await prisma.compte.findUnique({
      where: { phone },
      include: {
        porteFeuille: true,
        payments: true,
        sentTransferts: true,
        receivedTransferts: true,
        notifications: true,
        transactions: true,
      },
    });

    if (!compte) throw new Error("Compte non trouvé");

    const isSecretCodeValid = await bcrypt.compare(
      secretCode,
      compte.secretCode
    );
    if (!isSecretCodeValid) throw new Error("Code secret invalide");

    const token = jwt.sign(
      { id: compte.id, role: compte.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: compte.id,
        login: compte.login,
        firstName: compte.firstName,
        lastName: compte.lastName,
        phone: compte.phone,
        role: compte.role,
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
    };
  }
}