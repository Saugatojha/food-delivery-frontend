require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')

const dbUrl = process.env.DATABASE_URL
const adapter = new PrismaMariaDb(dbUrl)
const prisma = new PrismaClient({ adapter })

module.exports = prisma
