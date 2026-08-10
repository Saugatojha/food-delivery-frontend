const { execSync } = require('child_process')
const path = require('path')
const net = require('net')

const server = net.createServer()
server.on('error', () => {
  console.error('ERROR: Server is running on port 5001. Stop it first (Ctrl+C) then run reset.')
  process.exit(1)
})
server.listen(5001, () => {
  server.close()

  execSync('npx prisma migrate reset --force', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' })

  console.log('Database reset complete')
})
