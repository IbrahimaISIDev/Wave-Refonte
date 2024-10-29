import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
class Middleware {
    static async auth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).json({ message: "Authentification requise" });
                return;
            }
            const token = authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({ message: "Token non fourni" });
                return;
            }
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in environment variables');
            }
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
export default Middleware;
//# sourceMappingURL=midlleware.js.map