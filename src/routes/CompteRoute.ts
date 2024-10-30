import { Router } from "express";
import CompteController from "../controllers/CompteController.js";

const compteRoute = (compteController: CompteController) => {
  const router = Router();

  router.post("/create", (req, res) => compteController.createCompte(req, res));
  router.put("/status/:id", (req, res) => compteController.updateCompteStatus(req, res));
  //router.get("/:id", (req, res) => compteController.getCompteById(req, res));
  // Ajoutez d'autres routes ici

  return router;
};

export default compteRoute;
