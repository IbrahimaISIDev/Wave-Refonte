// src/controllers/ClientController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import utils from "../utils/utils.js";
import { uploadImage } from "../utils/upload.utils.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { CompteService } from "../services/CompteService.js";
import { AuthService } from "../services/AuthService.js";

const prisma = new PrismaClient();
const authService = new AuthService();

class ClientController {

  // Get all clients with their user accounts
  public static async getAllClients(
    req: Request,
    res: Response
  ): Promise<void> {
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
              photo: true,
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
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération des clients",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get client by ID
  public static async getClientById(
    req: Request,
    res: Response
  ): Promise<void> {
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
              photo: true,
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
    } catch (error) {
      console.error("Erreur lors de la récupération du client:", error);
      res.status(500).json({
        message: "Erreur lors de la récupération du client",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Create new client with Cloudinary integration
  public static async createClient(req: Request, res: Response): Promise<void> {
    try {
      const { compteId } = req.body;
      const photoFile = req.file; // Assuming you're using multer for file upload

      if (!photoFile) {
        res.status(400).json({ message: "Photo requise" });
        return;
      }

      // Vérifier si le compte existe et est de type CLIENT
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

      // Upload image to Cloudinary
      const cloudinaryResponse = await uploadImage(photoFile.path);

      // Create client with Cloudinary URL
      const newClient = await prisma.client.create({
        data: {
          compteId: Number(compteId),
          // photo: cloudinaryResponse.secure_url,
        },
        include: {
          compte: true,
        },
      });

      res.status(201).json({
        message: "Client créé avec succès",
        data: newClient,
      });
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
      res.status(500).json({
        message: "Erreur lors de la création du client",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update client
  public static async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const photoFile = req.file;

      if (!photoFile) {
        res.status(400).json({ message: "Photo requise" });
        return;
      }

      // Upload new image to Cloudinary
      const cloudinaryResponse = await uploadImage(photoFile.path);

      const updatedClient = await prisma.client.update({
        where: { id: Number(id) },
        data: {
          // photo: cloudinaryResponse.secure_url,
        },
        include: {
          compte: true,
        },
      });

      res.status(200).json({
        message: "Client mis à jour avec succès",
        data: updatedClient,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour du client",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Méthode de connexion du client
  public static async loginClient(req: Request, res: Response): Promise<void> {
    try {
      const { phone, secretCode } = req.body;

      if (!phone || !secretCode) {
        res.status(400).json({ message: "Numéro de téléphone et code secret requis" });
        return;
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

      if (!compte) {
        res.status(401).json({ message: "Identifiants invalides" });
        return;
      }

      const isSecretCodeValid = await bcrypt.compare(secretCode, compte.secretCode);
      if (!isSecretCodeValid) {
        res.status(401).json({ message: "Identifiants invalides" });
        return;
      }

      // Envoi du code temporaire par SMS
      await authService.sendTemporaryCodeBySMS(phone);
      res.status(200).json({
        message: "Code de vérification envoyé par SMS. Veuillez confirmer pour finaliser la connexion.",
      });
    } catch (error) {
      console.error("Erreur lors de la connexion du client:", error);
      res.status(500).json({
        message: "Erreur lors de la connexion",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // Nouvelle méthode pour valider la connexion avec le code SMS
  public static async validateSmsCode(req: Request, res: Response): Promise<void> {
    try {
      const { phone, smsCode } = req.body;

      if (!phone || !smsCode) {
        res.status(400).json({ message: "Numéro de téléphone et code SMS requis" });
        return;
      }

      const isCodeValid = await authService.validateSmsCode(phone, smsCode);
      if (!isCodeValid) {
        res.status(401).json({ message: "Code SMS invalide ou expiré" });
        return;
      }

      // Récupération des informations du compte
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

      const token = jwt.sign(
        { id: compte.id, role: compte.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
          photo: compte.photo,
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
    } catch (error) {
      console.error("Erreur lors de la validation du code SMS:", error);
      res.status(500).json({
        message: "Erreur lors de la validation",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Récupération du token JWT depuis les headers d'autorisation
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
  
      if (!token) {
        res.status(400).json({ message: "Token non fourni" });
        return;
      }
  
      // Décodage du token pour obtenir les informations
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  
      // Calcul de l'expiration du token
      const expiresAt = decodedToken.exp ? new Date(decodedToken.exp * 1000) : null;
      if (expiresAt) {
        // Ajout du token à la liste noire dans la base de données
        await prisma.blackListToken.create({
          data: {
            token,
            expiresAt,
          },
        });
        
        res.status(200).json({ message: "Déconnexion réussie et token ajouté à la liste noire" });
      } else {
        res.status(500).json({ message: "Échec de la déconnexion: expiration du token non trouvée" });
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      res.status(500).json({
        message: "Erreur lors de la déconnexion",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}

export default ClientController;
