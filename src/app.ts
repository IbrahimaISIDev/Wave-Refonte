// src/app.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import compression from 'compression';
import { CompteService } from './services/CompteService.js';
import { NotificationService } from './services/NotificationService.js';
import CompteController from "./controllers/CompteController.js";
import CompteRoute from "./routes/CompteRoute.js";
import ClientRoute from "./routes/ClientRoute.js";
import NotificationRoute from "./routes/NotificationRoute.js";

import OperateurRoute from './routes/OperateurRoute.js';
import PaymentRoute from './routes/PaymentRoute.js';
import PorteFeuilleRoute from './routes/PorteFeuilleRoute.js';
import TransactionRoute from './routes/TransactionRoute.js';
import tranfertRoute from './routes/TransfertRoute.js';
import ServiceRoute from './routes/ServiceRoute.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());
// Middleware de compression
app.use(compression());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (compteId: string) => {
    socket.join(`user-${compteId}`);
    console.log(`User ${compteId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Services initialization
const compteService = new CompteService(io);
const notificationService = new NotificationService(io);

// Controllers initialization
const compteController = new CompteController(compteService);

// Routes
const BASE_URL = process.env.BASE_URL || "/api/v1";

app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.use(`${BASE_URL}/comptes`, CompteRoute(compteController));
app.use(`${BASE_URL}/actor/clients`, ClientRoute());
app.use(`${BASE_URL}/clients/notifications`, NotificationRoute(notificationService));
app.use(`${BASE_URL}/transactions`, TransactionRoute);
app.use(`${BASE_URL}/transferts`, tranfertRoute);
app.use(`${BASE_URL}/portefeuilles`, PorteFeuilleRoute);
app.use(`${BASE_URL}/operateurs`, OperateurRoute);
app.use(`${BASE_URL}/paiements`, PaymentRoute);
app.use(`${BASE_URL}/services`, ServiceRoute);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

export default httpServer;