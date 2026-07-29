const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '..', 'dev.db')
const journalPath = dbPath + '-journal'

if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
if (fs.existsSync(journalPath)) fs.unlinkSync(journalPath)

console.log('Deleted dev.db')

execSync('npx prisma migrate dev --name init', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
execSync('npx prisma db seed', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })

console.log('Database reset complete')
