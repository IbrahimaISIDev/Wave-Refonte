import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Utils from '../utils/utils.js';
import CompteController from './CompteController.js';

const prisma = new PrismaClient();

export default class ServiceController {
    public static async getAllServices(req: express.Request, res: express.Response) {
        const result = await prisma.service.findMany({
            include: {
                compte: true
            }
        });
        res.json(result);
    }
    //create service
    public static async createService(req: Request, res: Response) {
        try {
            // Les champs correspondent au modèle Service dans le schéma
            const newService = await prisma.service.create({
                data: {
                    nomService: req.body.nomService,
                    compteId: req.body.compteId,
                }
            });
            res.json(newService);
        } catch (error) {
            res.status(500).json({ 
                error: 'Failed to create service',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    //get service by id
    public static async getServiceById(req: express.Request, res: express.Response) {
        const { id } = req.params;
        const result = await prisma.service.findUnique({
            where: { id: Number(id) },
            include: {
                compte: true
            }
        });
        res.json(result);
    }

    //update service
    public static async updateService(req: express.Request, res: express.Response) {
        const { id } = req.params;
        const { firstName, lastName, phone, secretCode, CNI } = req.body;
        const existingCompte = await prisma.compte.findUnique({
            where: { phone },
        });
    
        if (existingCompte) {
            res.status(400).json({ error: 'CNI de compte est déjà enregistré.' });
            return;
        }
    
        if (!/\d/.test(secretCode)) {
            res.status(400).json({ error: 'Le mot de passe doit contenir que des chiffres.' });
            return;
        }
    
        if (!/^(77|76|75|70|78)[0-9]{7}$/.test(phone)) {
            res.status(400).json({ error: 'Le numéro de téléphone doit commencer par 77 ou 76 ou 75 ou 70 ou 78 et avoir 9 chiffres.' });
            return;
        }
    
        if (secretCode.length < 6 || secretCode.length > 6) {
            res.status(400).json({ error: 'Le mot de passe doit etre 6 charactères .' });
            return;
        }
    
        const secretCodeHash = await bcrypt.hash(secretCode, 10);
        const updatedCompte = await prisma.compte.update({
            where: { id: Number(id) },
            data: {
                firstName,
                lastName,
                phone,
                secretCode: secretCodeHash,
                CNI
            }
        });
    
        res.json(updatedCompte);
    }

    //delete service
    public static async deleteService(req: express.Request, res: express.Response) {
        const { id } = req.params;
        const result = await prisma.service.delete({
            where: { id: Number(id) },
        });
        res.json(result);
    }

}