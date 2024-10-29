"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
// src/utils/upload.utils.ts
const cloudinary_config_js_1 = __importDefault(require("../config/cloudinary.config.js"));
const uploadImage = async (imageFile) => {
    try {
        const result = await cloudinary_config_js_1.default.uploader.upload(imageFile, {
            folder: 'wave-clients',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
            transformation: [{ width: 500, height: 500, crop: 'fill' }]
        });
        return result;
    }
    catch (error) {
        throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.uploadImage = uploadImage;
