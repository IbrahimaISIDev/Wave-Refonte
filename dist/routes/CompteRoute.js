import { Router } from "express";
const compteRoute = (compteController) => {
    const router = Router();
    router.post("/create", (req, res) => compteController.createCompte(req, res));
    // Ajoutez d'autres routes ici
    return router;
};
export default compteRoute;
