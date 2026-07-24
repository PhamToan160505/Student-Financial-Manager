const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép tải lên file ảnh (jpeg, png, jpg, v.v...)'), false);
    }
  }
});

/**
 * Uploads a buffer to Cloudinary via upload_stream
 * @param {Buffer} buffer - The image buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'avatars') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        format: 'webp', // Convert to webp for optimization
        transformation: [{ width: 400, height: 400, crop: 'fill' }] // Resize and crop
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary
};
