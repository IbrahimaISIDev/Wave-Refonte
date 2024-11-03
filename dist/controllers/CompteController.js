import { uploadImage } from "../utils/upload.utils.js";
class CompteController {
    constructor(compteService) {
        this.compteService = compteService;
    }
    async createCompte(req, res) {
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
        }
        catch (error) {
            console.error("Erreur lors de la création du compte:", error);
            let statusCode = 500;
            let errorMessage = "Une erreur est survenue lors de la création du compte";
            if (error instanceof Error) {
                if (error.message.includes("déjà utilisé")) {
                    statusCode = 400;
                    errorMessage = error.message;
                }
                else {
                    errorMessage = error.message;
                }
            }
            res.status(statusCode).json({
                error: errorMessage,
            });
        }
    }
    async updateCompteStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedCompte = await this.compteService.updateCompteStatus(Number(id), status);
            res.status(200).json({
                message: "Statut du compte mis à jour avec succès",
                compte: updatedCompte,
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la mise à jour du statut du compte",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    async getAllComptes(req, res) {
        try {
            const comptes = await this.compteService.getAllComptes();
            res.status(200).json(comptes);
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la récupération des comptes",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    async getCompteById(req, res) {
        try {
            const { id } = req.params;
            const compte = await this.compteService.getCompteById(Number(id));
            if (!compte) {
                res.status(404).json({ message: "Compte non trouvé" });
                return;
            }
            res.status(200).json(compte);
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la récupération du compte",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    async updateCompte(req, res) {
        try {
            const { id } = req.params;
            const updatedData = req.body;
            const updatedCompte = await this.compteService.updateCompte(Number(id), updatedData);
            if (!updatedCompte) {
                res.status(404).json({ message: "Compte non trouvé" });
                return;
            }
            res.status(200).json({
                message: "Compte mis à jour avec succès",
                compte: updatedCompte,
            });
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la mise à jour du compte",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
    async deleteCompte(req, res) {
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
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la suppression du compte",
                error: error instanceof Error ? error.message : "Erreur inconnue",
            });
        }
    }
}
export default CompteController;
//# sourceMappingURL=CompteController.js.map