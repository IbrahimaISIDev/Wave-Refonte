// src/controllers/CompteController.ts
import { Request, Response } from "express";
import { CompteService } from "../services/CompteService.js";
import { uploadImage } from "../utils/upload.utils.js";

class CompteController {
  private compteService: CompteService;

  constructor(compteService: CompteService) {
    this.compteService = compteService;
  }

  public async createCompte(req: Request, res: Response): Promise<void> {
    try {
      const photoFile = req.file;

      if (!photoFile) {
        res.status(400).json({ message: "Photo requise" });
        return;
      }
      const cloudinaryResponse = await uploadImage(photoFile.path);
      const result = await this.compteService.createCompte({
        ...req.body,
        photo: cloudinaryResponse.secure_url,
      });
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

  public async getAllComptes(req: Request, res: Response): Promise<void> {
    try {
      const comptes = await this.compteService.getAllComptes();
      res.status(200).json(comptes);
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la récupération des comptes",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // 2. Récupérer les informations d'un compte spécifique
  public async getCompteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const compte = await this.compteService.getCompteById(Number(id));

      if (!compte) {
        res.status(404).json({ message: "Compte non trouvé" });
        return;
      }

      res.status(200).json(compte);
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la récupération du compte",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // 3. Modifier un compte
  public async updateCompte(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedData = req.body; // Les données à mettre à jour

      const updatedCompte = await this.compteService.updateCompte(Number(id), updatedData);

      if (!updatedCompte) {
        res.status(404).json({ message: "Compte non trouvé" });
        return;
      }

      res.status(200).json({
        message: "Compte mis à jour avec succès",
        compte: updatedCompte,
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la mise à jour du compte",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  // 4. Supprimer un compte
  public async deleteCompte(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deletedCompte = await this.compteService.deleteCompte(Number(id));

      if (!deletedCompte) {
        res.status(404).json({ message: "Compte non trouvé" });
        return;
      }

      res.status(200).json({
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la suppression du compte",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}

export default CompteController;