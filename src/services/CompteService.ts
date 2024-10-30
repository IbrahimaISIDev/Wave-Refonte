// src/services/CompteService.ts
import { PrismaClient, Role, Compte } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";
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
    firstName: string;
    lastName: string;
    phone: string;
    CNI: string;
    secretCode: string;
    password: string;
    role?: Role;
  }) {
    const { login, secretCode, phone } = data;

    // Vérifier que le login n'est pas déjà utilisé
    const existingCompteByLogin = await prisma.compte.findUnique({
      where: { login },
    });
    if (existingCompteByLogin) throw new Error("Ce login est déjà utilisé");

    // Vérifier que le numéro de téléphone n'est pas déjà utilisé
    const existingCompteByPhone = await prisma.compte.findUnique({
      where: { phone },
    });
    if (existingCompteByPhone)
      throw new Error("Ce numéro de téléphone est déjà utilisé");

    // Vérifier que le code secret est exactement de 4 chiffres
    if (secretCode.length !== 4 || !/^\d+$/.test(secretCode)) {
      throw new Error("Le code secret doit être un nombre de 4 chiffres.");
    }

  // Hasher le code secret
  const salt = await bcrypt.genSalt(10);
  const hashedSecretCode = await bcrypt.hash(secretCode, salt);

    const result = await prisma.$transaction(async (prisma) => {
      const newCompte = await prisma.compte.create({
        data: {
          login: data.login,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          CNI: data.CNI,
          secretCode: hashedSecretCode,
          password: data.password,
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
    const { secretCode: _, ...compteWithoutSecretCode } = result.newCompte;

    return {
      compte: compteWithoutSecretCode,
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
      if (error instanceof Error) {
        // Type guard
        console.error(
          "Erreur lors de l'envoi du SMS de bienvenue:",
          error.message
        );
      } else {
        console.error(
          "Erreur inconnue lors de l'envoi du SMS de bienvenue:",
          error
        );
      }
      // Ne pas bloquer la création du compte si le SMS échoue
    }
  }

  private generateToken(userId: number): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  async updateCompteStatus(compteId: number, status: "ACTIVE" | "INACTIVE") {
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
      if (compte) await this.sendStatusSMS(compte, "activé");
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
      if (error instanceof Error) {
        // Type guard
        console.error(
          "Erreur lors de l'envoi du SMS de statut:",
          error.message
        );
      } else {
        console.error(
          "Erreur inconnue lors de l'envoi du SMS de statut:",
          error
        );
      }
    }
  }
  static generateToken(userId: number): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }
}
