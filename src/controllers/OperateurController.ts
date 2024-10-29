import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import utils from '../utils/utils.js';

const prisma = new PrismaClient();

class OperateurController {

    // Méthode pour créer un opérateur
    public static async createOperateur(req: Request, res: Response): Promise<void> {
        const { compteId, nomOperateur, photo } = req.body;

        // Vérification si le compte existe
        const compte = await prisma.compte.findUnique({
            where: {
                id: Number(compteId) // Conversion de compteId en nombre
            }
        });

        if (!compte) {
            res.status(404).json({ message: 'Compte not found' });
            return;
        }

        // Vérification si un opérateur avec ce nom existe déjà
        const existingOperateurByNom = await prisma.operateur.findFirst({
            where: {
                nomOperateur
            }
        });

        if (existingOperateurByNom) {
            res.status(400).json({ message: 'Un opérateur avec ce nom existe déjà' });
            return;
        }

        // Création de l'opérateur
        const newOperateur = await prisma.operateur.create({
            data: {
                compteId: Number(compteId), // Conversion de compteId en nombre
                nomOperateur,
                photo
            }
        });

        res.status(201).json({ message: 'Opérateur créé avec succès', operateur: newOperateur });
    }

    // Méthode pour récupérer tous les opérateurs associés à un compteId donné
    public static async getAllOperateursByCompteId(req: Request, res: Response): Promise<void> {
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

    // Méthode pour récupérer un opérateur par son id
    public static async getOperateurById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const operateur = await prisma.operateur.findUnique({
            where: {
                id: Number(id) // Conversion de id en nombre
            },
            include:{
                compte: true // Inclure les informations de l'entité compte associée
            }
        });

        if (!operateur) {
            res.status(404).json({ message: 'Opérateur not found' });
            return;
        }

        res.json({ operateur });
    }

    // Méthode pour récupérer tous les opérateurs avec les informations du compte associé
    public static async getAllOperateursWithCompte(req: Request, res: Response): Promise<void> {
        const operateurs = await prisma.operateur.findMany({
            include: {
                compte: true // Inclure les informations de l'entité compte associée
            }
        });

        res.json({ operateurs });
    }
    // Méthode pour modifier les informations d'un opérateur
public static async updateOperateur(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nomOperateur, photo } = req.body;
    const parsedId = Number(id);
    if (isNaN(parsedId)) {
        res.status(400).json({ message: 'Invalid operateur ID' });
        return;
    }
    // Vérification si l'opérateur existe
    const existingOperateur = await prisma.operateur.findUnique({
        where: {
            id: parsedId
        }
    });
    if (!existingOperateur) {
        res.status(404).json({ message: 'Opérateur not found' });
        return;
    }
    // Préparation des données à mettre à jour
    const updatedData: { nomOperateur?: string; photo?: string } = {};
    // Ajouter les champs seulement s'ils sont fournis
    if (nomOperateur) {
        // Vérification si un autre opérateur avec le même nom existe déjà
        const existingOperateurByNom = await prisma.operateur.findFirst({
            where: {
                nomOperateur,
                id: {
                    not: parsedId // Exclut l'opérateur actuel de la vérification
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
    // Mise à jour des informations de l'opérateur
    const updatedOperateur = await prisma.operateur.update({
        where: {
            id: parsedId
        },
        data: updatedData
    });
    res.json({ message: 'Opérateur mis à jour avec succès', operateur: updatedOperateur });
}

    
    // Méthode pour supprimer un opérateur
    public static async deleteOperateur(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
            res.status(400).json({ message: 'Invalid operateur ID' });
            return;
        }
        // Vérification si l'opérateur existe
        const existingOperateur = await prisma.operateur.findUnique({
            where: {
                id: parsedId
            }
        });
        if (!existingOperateur) {
            res.status(404).json({ message: 'Opérateur not found' });
            return;
        }
        // Suppression de l'opérateur
        await prisma.operateur.delete({
            where: {
                id: parsedId
            }
        });
        res.json({ message: 'Opérateur supprimé avec succès' });
    }
    
}

export default OperateurController;