import { Router } from "express";
import CompteController from "../controllers/CompteController.js";

const compteRoute = (compteController: CompteController) => {
  const router = Router();

  router.post("/create", (req, res) => compteController.createCompte(req, res));
  // Ajoutez d'autres routes ici

  return router;
};

export default compteRoute;
