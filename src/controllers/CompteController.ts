// src/controllers/CompteController.ts
import { Request, Response } from "express";
import { CompteService } from "../services/CompteService.js";
import { Server as SocketServer } from "socket.io";

class CompteController {
  private compteService: CompteService;

  constructor(compteService: CompteService) {
    this.compteService = compteService;
  }

  public async createCompte(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.compteService.createCompte(req.body);
      res.status(201).json({
        message: "Compte créé avec succès",
        ...result,
      });
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);

      let statusCode = 500;
      let errorMessage = "Une erreur est survenue lors de la création du compte";

      if (error instanceof Error) {
        if (error.message.includes("déjà utilisé")) {
          statusCode = 400;
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        error: errorMessage,
      });
    }
  }


  public async updateCompteStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedCompte = await this.compteService.updateCompteStatus(
        Number(id),
        status
      );

      res.status(200).json({
        message: "Statut du compte mis à jour avec succès",
        compte: updatedCompte,
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la mise à jour du statut du compte",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}

export default CompteController;