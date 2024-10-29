// src/services/CompteService.ts
import { PrismaClient, Role, Compte } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import twilio from 'twilio';
import { Server as SocketServer } from "socket.io";

dotenv.config();

const prisma = new PrismaClient();

// Configuration Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export class CompteService {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }

  async createCompte(data: {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    CNI: string;
    role?: Role;
  }) {
    const { login, password, phone } = data;

    // Vérifications
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

    // Hashage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Transaction Prisma pour création synchronisée
    const result = await prisma.$transaction(async (prisma) => {
      // Création du compte
      const newCompte = await prisma.compte.create({
        data: {
          ...data,
          password: hashedPassword,
          role: data.role || "CLIENT",
        },
      });

      // Création du portefeuille
      const porteFeuille = await prisma.porteFeuille.create({
        data: {
          compteId: newCompte.id,
          balance: 0,
          devise: "XOF",
          montantPlafond: 2000000.0,
          isActive: false,
        },
      });

      // Envoi du SMS de bienvenue
      await this.sendWelcomeSMS(newCompte);

      // Création d'une notification
      await prisma.notification.create({
        data: {
          content: `Bienvenue ${newCompte.firstName} ! Votre compte a été créé avec succès.`,
          compteId: newCompte.id,
          type: "WELCOME",
        },
      });

      return { newCompte, porteFeuille };
    });

    // Génération du token JWT
    const token = this.generateToken(result.newCompte.id);

    const { password: _, ...compteWithoutPassword } = result.newCompte;
    return {
      compte: compteWithoutPassword,
      porteFeuille: result.porteFeuille,
      token,
    };
  }

  private async sendWelcomeSMS(compte: Compte) {
    try {
      const message = await twilioClient.messages.create({
        body: `Bienvenue ${compte.firstName} sur notre plateforme ! Votre compte a été créé avec succès.`,
        to: compte.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      console.log("SMS de bienvenue envoyé:", message.sid);
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS de bienvenue:", error);
      // Ne pas bloquer la création du compte si le SMS échoue
    }
  }

  private generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
  }

  async updateCompteStatus(compteId: number, status: "ACTIVE" | "INACTIVE") {
    const updatedCompte = await prisma.compte.update({
      where: { id: compteId },
      data: { status },
    });

    // Notification temps réel
    this.io.to(`user-${compteId}`).emit("statusUpdate", {
      compteId,
      status: updatedCompte.status,
    });

    // Notification SMS
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

  private async sendStatusSMS(compte: Compte, action: string) {
    try {
      await twilioClient.messages.create({
        body: `Votre compte a été ${action} avec succès.`,
        to: compte.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS de statut:", error);
    }
  }
}