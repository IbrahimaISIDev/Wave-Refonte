"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const CompteService_js_1 = require("./services/CompteService.js");
const NotificationService_js_1 = require("./services/NotificationService.js");
const CompteController_js_1 = __importDefault(require("./controllers/CompteController.js"));
const CompteRoute_js_1 = __importDefault(require("./routes/CompteRoute.js"));
const ClientRoute_js_1 = __importDefault(require("./routes/ClientRoute.js"));
const NotificationRoute_js_1 = __importDefault(require("./routes/NotificationRoute.js"));
const OperateurRoute_js_1 = __importDefault(require("./routes/OperateurRoute.js"));
const PaymentRoute_js_1 = __importDefault(require("./routes/PaymentRoute.js"));
const PorteFeuilleRoute_js_1 = __importDefault(require("./routes/PorteFeuilleRoute.js"));
const TransactionRoute_js_1 = __importDefault(require("./routes/TransactionRoute.js"));
const TransfertRoute_js_1 = __importDefault(require("./routes/TransfertRoute.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});
const prisma = new client_1.PrismaClient();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("join", (compteId) => {
        socket.join(`user-${compteId}`);
        console.log(`User ${compteId} joined their room`);
    });
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});
// Services initialization
const compteService = new CompteService_js_1.CompteService(io);
const notificationService = new NotificationService_js_1.NotificationService(io);
// Controllers initialization
const compteController = new CompteController_js_1.default(compteService);
// Routes
const BASE_URL = process.env.BASE_URL || "/api/v1";
app.use(`${BASE_URL}/comptes`, (0, CompteRoute_js_1.default)(compteController));
app.use(`${BASE_URL}/actor/clients`, (0, ClientRoute_js_1.default)());
app.use(`${BASE_URL}/clients/notifications`, (0, NotificationRoute_js_1.default)(notificationService));
app.use(`${BASE_URL}/transactions`, TransactionRoute_js_1.default);
app.use(`${BASE_URL}/transferts`, TransfertRoute_js_1.default);
app.use(`${BASE_URL}/portefeuilles`, PorteFeuilleRoute_js_1.default);
app.use(`${BASE_URL}/operateurs`, OperateurRoute_js_1.default);
app.use(`${BASE_URL}/paiements`, PaymentRoute_js_1.default);
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
exports.default = httpServer;
