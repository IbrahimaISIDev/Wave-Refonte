import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
class OperateurController {
    static async createOperateur(req, res) {
        const { compteId, nomOperateur, photo } = req.body;
        const compte = await prisma.compte.findUnique({
            where: {
                id: Number(compteId)
            }
        });
        if (!compte) {
            res.status(404).json({ message: 'Compte not found' });
            return;
        }
        const existingOperateurByNom = await prisma.operateur.findFirst({
            where: {
                nomOperateur
            }
        });
        if (existingOperateurByNom) {
            res.status(400).json({ message: 'Un opérateur avec ce nom existe déjà' });
            return;
        }
        const newOperateur = await prisma.operateur.create({
            data: {
                compteId: Number(compteId),
                nomOperateur,
                photo
            }
        });
        res.status(201).json({ message: 'Opérateur créé avec succès', operateur: newOperateur });
    }
    static async getAllOperateursByCompteId(req, res) {
        const { compteId } = req.params;
        const parsedCompteId = Number(compteId);
        if (isNaN(parsedCompteId)) {
            res.status(400).json({ message: 'Invalid compteId' });
            return;
        }
        const operateurs = await prisma.operateur.findMany({
            where: { compteId: parsedCompteId }
        });
        res.json({ operateurs });
    }
    static async getOperateurById(req, res) {
        const { id } = req.params;
        const operateur = await prisma.operateur.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                compte: true
            }
        });
        if (!operateur) {
            res.status(404).json({ message: 'Opérateur not found' });
            return;
        }
        res.json({ operateur });
    }
    static async getAllOperateursWithCompte(req, res) {
        const operateurs = await prisma.operateur.findMany({
            include: {
                compte: true
            }
        });
        res.json({ operateurs });
    }
    static async updateOperateur(req, res) {
        const { id } = req.params;
        const { nomOperateur, photo } = req.body;
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
            res.status(400).json({ message: 'Invalid operateur ID' });
            return;
        }
        const existingOperateur = await prisma.operateur.findUnique({
            where: {
                id: parsedId
            }
        });
        if (!existingOperateur) {
            res.status(404).json({ message: 'Opérateur not found' });
            return;
        }
        const updatedData = {};
        if (nomOperateur) {
            const existingOperateurByNom = await prisma.operateur.findFirst({
                where: {
                    nomOperateur,
                    id: {
                        not: parsedId
                    }
                }
            });
            if (existingOperateurByNom) {
                res.status(400).json({ message: 'Un opérateur avec ce nom existe déjà' });
                return;
            }
            updatedData.nomOperateur = nomOperateur;
        }
        if (photo) {
            updatedData.photo = photo;
        }
        const updatedOperateur = await prisma.operateur.update({
            where: {
                id: parsedId
            },
            data: updatedData
        });
        res.json({ message: 'Opérateur mis à jour avec succès', operateur: updatedOperateur });
    }
    static async deleteOperateur(req, res) {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
            res.status(400).json({ message: 'Invalid operateur ID' });
            return;
        }
        const existingOperateur = await prisma.operateur.findUnique({
            where: {
                id: parsedId
            }
        });
        if (!existingOperateur) {
            res.status(404).json({ message: 'Opérateur not found' });
            return;
        }
        await prisma.operateur.delete({
            where: {
                id: parsedId
            }
        });
        res.json({ message: 'Opérateur supprimé avec succès' });
    }
}
export default OperateurController;
//# sourceMappingURL=OperateurController.js.map