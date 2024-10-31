// src/services/CompteService.ts
import { PrismaClient, Role, Compte } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";
import { Server as SocketServer } from "socket.io";
import QRCode from "qrcode";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

dotenv.config();

const prisma = new PrismaClient();

// Configuration Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CompteService {
  private io: SocketServer;

  constructor(io: SocketServer) {
    this.io = io;
  }
 // Méthode de génération et de téléversement de QR code
// Méthode pour générer et uploader le QR code
private async generateAndUploadQRCode(compte: Compte): Promise<string> {
  try {
    // Données à encoder dans le QR code
    const qrData = {
      firstName: compte.firstName,
      lastName: compte.lastName,
      phone: compte.phone,
    };

    // Générer le QR code en tant que buffer
    const qrBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Upload du QR code vers Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "qr-codes",
          public_id: `qr-code-${compte.id}`,
          format: "png",
          transformation: [
            { quality: "auto:best" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      );

      // Convertir le buffer en flux lisible et l'envoyer dans le flux de téléchargement
      const readableStream = new Readable({
        read() {
          this.push(qrBuffer);
          this.push(null);
        },
      });

      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    console.error("Erreur lors de la génération/upload du QR code:", error);
    throw error;
  }
}

// Méthode pour créer un compte
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

  // Vérifier l'unicité du login et du téléphone
  const existingCompteByLogin = await prisma.compte.findUnique({
    where: { login },
  });
  if (existingCompteByLogin) throw new Error("Ce login est déjà utilisé");

  const existingCompteByPhone = await prisma.compte.findUnique({
    where: { phone },
  });
  if (existingCompteByPhone) throw new Error("Ce numéro de téléphone est déjà utilisé");

  // Vérifier le format du code secret
  if (secretCode.length !== 4 || !/^\d+$/.test(secretCode)) {
    throw new Error("Le code secret doit être un nombre de 4 chiffres.");
  }

  // Hasher le code secret
  const salt = await bcrypt.genSalt(10);
  const hashedSecretCode = await bcrypt.hash(secretCode, salt);

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Créer le compte initial
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

      // Générer et uploader le QR code
      const qrCodeUrl = await this.generateAndUploadQRCode(newCompte);

      // Mettre à jour le compte avec l'URL du QR code
      const updatedCompte = await prisma.compte.update({
        where: { id: newCompte.id },
        data: { qrCodeUrl },
      });

      // Créer le portefeuille associé
      const porteFeuille = await prisma.porteFeuille.create({
        data: {
          compteId: newCompte.id,
          balance: 0,
          devise: "XOF",
          montantPlafond: 2000000.0,
          isActive: false,
        },
      });

      // Envoyer le SMS de bienvenue avec le QR code
      await this.sendWelcomeSMSWithQR(updatedCompte, qrCodeUrl);

      // Créer la notification de bienvenue
      await prisma.notification.create({
        data: {
          content: `Bienvenue ${newCompte.firstName} ! Votre compte a été créé avec succès. Votre QR code personnel est disponible dans votre profil.`,
          compteId: newCompte.id,
          type: "WELCOME",
        },
      });

      return { newCompte: updatedCompte, porteFeuille };
    });

    // Générer et retourner le token
    const token = this.generateToken(result.newCompte.id);
    const { secretCode: _, ...compteWithoutSecretCode } = result.newCompte;

    return {
      compte: compteWithoutSecretCode,
      porteFeuille: result.porteFeuille,
      token,
    };
  } catch (error) {
    console.error("Erreur lors de la création du compte:", error);
    throw new Error("Erreur lors de la création du compte");
  }
}


  private async sendWelcomeSMSWithQR(compte: Compte, qrCodeUrl: string) {
    try {
      const message = await twilioClient.messages.create({
        body: `Bienvenue ${compte.firstName} sur notre plateforme ! Votre compte a été créé avec succès. Votre QR code personnel est disponible ici : ${qrCodeUrl}`,
        to: compte.phone,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      console.log("SMS de bienvenue envoyé:", message.sid);
    } catch (error) {
      if (error instanceof Error) {
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
    }
  }

  // Méthode pour régénérer le QR code d'un compte existant
  async regenerateQRCode(compteId: number): Promise<string> {
    const compte = await prisma.compte.findUnique({
      where: { id: compteId },
    });

    if (!compte) {
      throw new Error("Compte non trouvé");
    }

    const newQRCodeUrl = await this.generateAndUploadQRCode(compte);

    // Mettre à jour l'URL du QR code dans la base de données
    await prisma.compte.update({
      where: { id: compteId },
      data: { qrCodeUrl: newQRCodeUrl },
    });

    return newQRCodeUrl;
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
