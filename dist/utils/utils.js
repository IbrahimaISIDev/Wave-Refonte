"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/utils.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const qrcode_1 = __importDefault(require("qrcode"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in environment variables');
}
const utils = {
    hashPassword: async (password) => {
        const salt = await bcrypt_1.default.genSalt(10);
        return bcrypt_1.default.hash(password, salt);
    },
    comparePassword: async (password, hashedPassword) => {
        return bcrypt_1.default.compare(password, hashedPassword);
    },
    generateToken: (userId) => {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },
    verifyToken: (token) => {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    },
    generateRandomCode: (length) => {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    },
    generateQRCode: async (data) => {
        try {
            return await qrcode_1.default.toDataURL(data.toString());
        }
        catch (error) {
            throw new Error(`Error generating QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.default = utils;
