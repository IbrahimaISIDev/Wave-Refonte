import cloudinary from '../config/cloudinary.config.js';
export const uploadImage = async (imageFile) => {
    try {
        const result = await cloudinary.uploader.upload(imageFile, {
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
//# sourceMappingURL=upload.utils.js.map