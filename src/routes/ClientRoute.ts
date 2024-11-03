// src/routes/ClientRoute.ts
import { Router } from "express";
import ClientController from "../controllers/ClientController.js";
import Middleware from "../middlewares/midlleware.js";

const ClientRoute = () => {
  const router = Router();

  // Routes publiques
  router.get("/", ClientController.getAllClients);
  router.get("/:id", Middleware.auth, ClientController.getClientById);

  // Routes protégées
  router.post(
    "/",
    Middleware.auth,
    ClientController.createClient
  );
  router.put(
    "/:id",
    Middleware.auth,
    ClientController.updateClient
  );
  router.post("/login", ClientController.loginClient);
  router.post("/logout", Middleware.auth, ClientController.logout);
  router.post("/validateSmsCode", ClientController.validateSmsCode);

  return router; // Return the router instance
};

export default ClientRoute;
