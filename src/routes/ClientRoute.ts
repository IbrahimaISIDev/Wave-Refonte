// src/routes/ClientRoute.ts
import { Router } from "express";
import ClientController from "../controllers/ClientController.js";
import Middleware from "../middlewares/midlleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const ClientRoute = () => {
  const router = Router();

  // Routes publiques
  router.get("/", ClientController.getAllClients);
  router.get("/:id", ClientController.getClientById);
  router.get("/user/:compteId", ClientController.getClientByCompteId);

  // Routes protégées
  router.post(
    "/",
    Middleware.auth,
    upload.single("photo"),
    ClientController.createClient
  );
  router.put(
    "/:id",
    Middleware.auth,
    upload.single("photo"),
    ClientController.updateClient
  );
  router.post("/login", ClientController.loginClient);
  router.post("/first-login/initiate", ClientController.initiateFirstLogin);
  router.post("/first-login/validate", ClientController.validateFirstLogin);

  return router; // Return the router instance
};

export default ClientRoute;
