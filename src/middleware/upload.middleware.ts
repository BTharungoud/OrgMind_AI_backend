import multer from 'multer'
import { env } from '../config/env.js'
import { SUPPORTED_UPLOAD_TYPES } from '../config/constants.js'
import { ApiError } from '../utils/apiError.js'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 10 },
  fileFilter: (_request, file, callback) => {
    if (!SUPPORTED_UPLOAD_TYPES.has(file.mimetype)) {
      callback(new ApiError(415, `Unsupported file type: ${file.mimetype}`, 'UNSUPPORTED_FILE_TYPE'))
      return
    }
    callback(null, true)
  },
})

