const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticate, authorize } = require('../middleware/auth')
const { serverError } = require('../utils/errors')

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

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
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, GIF, WebP allowed'))
  },
})

const router = express.Router()

router.post('/image', authenticate, authorize('owner', 'rider', 'admin'), (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message })
      return res.status(400).json({ error: err.message })
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const origin = process.env.APP_URL || `${req.protocol}://${req.get('host') || 'localhost:5000'}`
    res.json({ url: `${origin}/uploads/${req.file.filename}` })
  })
})

module.exports = router