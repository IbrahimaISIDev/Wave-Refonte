import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
export default class ServiceController {
    static async getAllServices(req, res) {
        const result = await prisma.service.findMany({
            include: {
                compte: true
            }
        });
        res.json(result);
    }
    static async createService(req, res) {
        try {
            const newService = await prisma.service.create({
                data: {
                    nomService: req.body.nomService,
                    compteId: req.body.compteId,
                }
            });
            res.json(newService);
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to create service',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    static async getServiceById(req, res) {
        const { id } = req.params;
        const result = await prisma.service.findUnique({
            where: { id: Number(id) },
            include: {
                compte: true
            }
        });
        res.json(result);
    }
    static async updateService(req, res) {
        const { id } = req.params;
        const { firstName, lastName, phone, password, CNI } = req.body;
        const existingCompte = await prisma.compte.findUnique({
            where: { phone },
        });
        if (existingCompte) {
            res.status(400).json({ error: 'CNI de compte est déjà enregistré.' });
            return;
        }
        if (!/\d/.test(password)) {
            res.status(400).json({ error: 'Le mot de passe doit contenir que des chiffres.' });
            return;
        }
        if (!/^(77|76|75|70|78)[0-9]{7}$/.test(phone)) {
            res.status(400).json({ error: 'Le numéro de téléphone doit commencer par 77 ou 76 ou 75 ou 70 ou 78 et avoir 9 chiffres.' });
            return;
        }
        if (password.length < 6 || password.length > 6) {
            res.status(400).json({ error: 'Le mot de passe doit etre 6 charactères .' });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const updatedCompte = await prisma.compte.update({
            where: { id: Number(id) },
            data: {
                firstName,
                lastName,
                phone,
                password: passwordHash,
                CNI
            }
        });
        res.json(updatedCompte);
    }
    static async deleteService(req, res) {
        const { id } = req.params;
        const result = await prisma.service.delete({
            where: { id: Number(id) },
        });
        res.json(result);
    }
}
//# sourceMappingURL=ServiceController.js.map