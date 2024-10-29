// src/utils/utils.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import QRCode from 'qrcode';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}

const utils = {
    hashPassword: async (password: string): Promise<string> => {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    comparePassword: async (password: string, hashedPassword: string): Promise<boolean> => {
        return bcrypt.compare(password, hashedPassword);
    },

    generateToken: (userId: number): string => {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },

    verifyToken: (token: string): any => {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jwt.verify(token, JWT_SECRET);
    },

    generateRandomCode: (length: number): string => {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    },

    generateQRCode: async (data: string): Promise<string> => {
        try {
            return await QRCode.toDataURL(data.toString());
        } catch (error) {
            throw new Error(`Error generating QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};

export default utils;