const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const net = require('net')

const server = net.createServer()
server.on('error', () => {
  console.error('ERROR: Server is running on port 5000. Stop it first (Ctrl+C) then run reset.')
  process.exit(1)
})
server.listen(5000, () => {
  server.close()

  const dbPath = path.resolve(__dirname, '..', 'dev.db')
  const journalPath = dbPath + '-journal'

  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
  if (fs.existsSync(journalPath)) fs.unlinkSync(journalPath)

  console.log('Deleted dev.db')

  execSync('npx prisma migrate dev --name init', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })
  execSync('npx prisma db seed', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })

  console.log('Database reset complete')
})