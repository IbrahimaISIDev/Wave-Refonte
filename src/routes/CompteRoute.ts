import { Router } from "express";
import CompteController from "../controllers/CompteController.js";
import Middleware from "../middlewares/midlleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const compteRoute = (compteController: CompteController) => {
  const router = Router();

  router.post("/create", upload.single("photo"), (req, res) => compteController.createCompte(req, res));
  router.get("/list", Middleware.auth, (req, res) => compteController.getAllComptes(req, res));
  router.get("/list/:id", Middleware.auth, (req, res) => compteController.getCompteById(req, res));
  router.put("/update", Middleware.auth, upload.single("photo"), (req, res) => compteController.updateCompte(req, res));
  router.delete("/delete", Middleware.auth, (req, res) => compteController.deleteCompte(req, res));
  router.put("/status/:id", Middleware.auth, upload.single("photo"), (req, res) => compteController.updateCompteStatus(req, res));
  return router;
};

export default compteRoute;
