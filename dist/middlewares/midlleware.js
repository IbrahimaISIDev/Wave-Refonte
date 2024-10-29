"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialisation de Prisma
const prisma = new client_1.PrismaClient();
class Middleware {
    static async auth(req, res, next) {
        try {
            // Vérifier si le header Authorization existe
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ message: "Authentification requise" });
                return;
            }
            // Extraire le token
            const token = authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: "Token non fourni" });
                return;
            }
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in environment variables');
            }
            try {
                // Vérifier et décoder le token directement avec jsonwebtoken
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                next();
            }
            catch (error) {
                res.status(401).json({
                    message: "Token invalide",
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                return;
            }
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur serveur lors de l'authentification",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Méthode pour vérifier si l'utilisateur est ADMIN
    static async isAdmin(req, res, next) {
        try {
            const idCompte = req.params.compteId;
            const compte = await prisma.compte.findUnique({
                where: {
                    id: Number(idCompte)
                }
            });
            if (compte?.role === "ADMIN" || compte?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({ message: "Accès refusé : vous n'êtes pas administrateur" });
            }
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la vérification des droits d'administration",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // Méthode pour vérifier si l'utilisateur est SUPERADMIN
    static async isSuperAdmin(req, res, next) {
        try {
            const idCompte = req.params.compteId;
            const compte = await prisma.compte.findUnique({
                where: {
                    id: Number(idCompte)
                }
            });
            if (compte?.role === "SUPERADMIN") {
                next();
            }
            else {
                res.status(403).json({ message: "Accès refusé : vous n'êtes pas super administrateur" });
            }
        }
        catch (error) {
            res.status(500).json({
                message: "Erreur lors de la vérification des droits de super administration",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.default = Middleware;
