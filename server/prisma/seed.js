const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const path = require('path')

const dbUrl = 'file:' + path.resolve(__dirname, '..', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('password', 10)

  const customer = await prisma.user.upsert({
    where: { email: 'john@test.com' },
    update: {},
    create: { name: 'John Doe', email: 'john@test.com', password, role: 'customer' },
  })

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: { name: 'Pizza Palace', email: 'owner@test.com', password, role: 'owner' },
  })

  await prisma.user.upsert({
    where: { email: 'rider@test.com' },
    update: {},
    create: { name: 'Rider Ram', email: 'rider@test.com', password, role: 'rider' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@test.com', password, role: 'admin' },
  })

  const pizzaPalace = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5,
      deliveryTime: '25-35 min', ownerId: ownerUser.id,
      latitude: 27.7150, longitude: 85.3120,
    },
  })

  const restaurants = [
    { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min', latitude: 27.7040, longitude: 85.3070 },
    { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min', latitude: 27.6710, longitude: 85.3260 },
    { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min', isOpen: false, latitude: 27.7210, longitude: 85.3620 },
    { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min', latitude: 27.7100, longitude: 85.3480 },
    { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min', latitude: 27.6720, longitude: 85.4280 },
  ]

  for (const r of restaurants) {
    await prisma.restaurant.upsert({ where: { id: r.id }, update: {}, create: r })
  }

  await prisma.menuItem.deleteMany()

  const menus = {
    1: [
      { name: 'Margherita Pizza', price: 169, desc: 'Classic cheese and tomato' },
      { name: 'Pepperoni Pizza', price: 195, desc: 'Loaded with pepperoni' },
      { name: 'Garlic Bread', price: 78, desc: 'Toasted with garlic butter' },
    ],
    2: [
      { name: 'Classic Burger', price: 130, desc: 'Beef patty with lettuce' },
      { name: 'Cheese Burger', price: 143, desc: 'Double cheese melt' },
      { name: 'Fries', price: 52, desc: 'Crispy golden fries' },
    ],
    3: [
      { name: 'California Roll', price: 117, desc: 'Crab, avocado, cucumber' },
      { name: 'Salmon Roll', price: 143, desc: 'Fresh salmon wrapped' },
      { name: 'Edamame', price: 65, desc: 'Steamed soy beans' },
    ],
    4: [
      { name: 'Beef Taco', price: 52, desc: 'Spiced beef in tortilla' },
      { name: 'Chicken Quesadilla', price: 104, desc: 'Grilled chicken and cheese' },
      { name: 'Guacamole', price: 65, desc: 'Fresh avocado dip' },
    ],
    5: [
      { name: 'Butter Chicken', price: 182, desc: 'Creamy tomato curry' },
      { name: 'Naan Bread', price: 39, desc: 'Oven-baked flatbread' },
      { name: 'Biryani', price: 156, desc: 'Fragrant rice dish' },
    ],
    6: [
      { name: 'Lo Mein', price: 117, desc: 'Stir-fried egg noodles' },
      { name: 'Fried Rice', price: 104, desc: 'Wok-fried rice' },
      { name: 'Spring Rolls', price: 65, desc: 'Crispy vegetable rolls' },
    ],
  }

  for (const [restId, items] of Object.entries(menus)) {
    for (const item of items) {
      await prisma.menuItem.create({
        data: { restaurantId: Number(restId), ...item },
      })
    }
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
