const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticate, authorize } = require('../middleware/auth')
const { serverError } = require('../utils/errors')

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

function sniffImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return 'image/png'
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeBase = file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80)
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '')
    cb(null, `${Date.now()}-${safeBase || 'image'}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, GIF, WebP images are allowed'))
  },
})

function verifyMagicBytes(filePath, declaredType) {
  const fd = fs.openSync(filePath, 'r')
  const buf = Buffer.alloc(12)
  const bytesRead = fs.readSync(fd, buf, 0, 12, 0)
  fs.closeSync(fd)
  const sniffed = sniffImageType(buf.subarray(0, bytesRead))
  return sniffed !== null && sniffed === declaredType
}

const router = express.Router()

router.post('/image', authenticate, authorize('owner', 'rider', 'admin'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message })
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    if (!verifyMagicBytes(req.file.path, req.file.mimetype)) {
      fs.unlink(req.file.path, () => {})
      return res.status(400).json({ error: 'File content does not match its declared image type' })
    }
    res.json({ url: `/uploads/${req.file.filename}` })
  })
})

module.exports = router

