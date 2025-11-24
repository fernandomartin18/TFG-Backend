import express from 'express';
import multer from 'multer';
import { generateController } from '../controllers/generate.controller.js';
import { config } from '../config/index.js';

const router = express.Router();

// Configuración de multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

/**
 * @route   POST /api/generate
 * @desc    Genera código a partir de un prompt y opcionalmente una imagen
 * @access  Public
 */
router.post('/', upload.single('image'), generateController.generate.bind(generateController));

/**
 * @route   POST /api/generate/stream
 * @desc    Genera código con streaming a partir de un prompt y opcionalmente una imagen
 * @access  Public
 */
router.post('/stream', upload.single('image'), generateController.generateStream.bind(generateController));

export default router;
