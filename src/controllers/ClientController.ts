// src/controllers/ClientController.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import utils from "../utils/utils.js";
import { uploadImage } from "../utils/upload.utils.js";

const prisma = new PrismaClient();

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

  // Get client by compteId
  public static async getClientByCompteId(
    req: Request,
    res: Response
  ): Promise<void> {
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
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du client par compteId:",
        error
      );
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
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      res.status(500).json({
        message: "Erreur lors de la mise à jour du client",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default ClientController;
