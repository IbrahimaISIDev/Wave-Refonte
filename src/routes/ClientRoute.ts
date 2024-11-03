// src/routes/ClientRoute.ts
import { Router } from "express";
import ClientController from "../controllers/ClientController.js";
import Middleware from "../middlewares/midlleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const ClientRoute = () => {
  const router = Router();

  // Routes publiques
  router.get("/", ClientController.getAllClients);
  router.get("/getClient/:id", Middleware.auth, ClientController.getClientById);

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
  router.post("/logout", Middleware.auth, ClientController.logout);
  router.post("/validateSmsCode", ClientController.validateSmsCode);

  return router; // Return the router instance
};

export default ClientRoute;
