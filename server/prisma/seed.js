const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const path = require('path')

const dbUrl = 'file:' + path.resolve(__dirname, '..', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('password', 10)

  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF')
  await prisma.rating.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.user.updateMany({ data: { restaurantId: null } })
  await prisma.restaurant.deleteMany()
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='Restaurant'")
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')

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

  const restaurants = [
    { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min', isOpen: 1, ownerId: ownerUser.id, latitude: 27.7150, longitude: 85.3120, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Pizza' },
    { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min', isOpen: 1, ownerId: null, latitude: 27.7040, longitude: 85.3070, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Burger' },
    { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min', isOpen: 1, ownerId: null, latitude: 27.6710, longitude: 85.3260, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Sushi' },
    { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min', isOpen: 0, ownerId: null, latitude: 27.7210, longitude: 85.3620, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Taco' },
    { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min', isOpen: 1, ownerId: null, latitude: 27.7100, longitude: 85.3480, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Curry' },
    { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min', isOpen: 1, ownerId: null, latitude: 27.6720, longitude: 85.4280, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Noodle' },
  ]

  for (const r of restaurants) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO Restaurant (id, name, cuisine, rating, deliveryTime, isOpen, ownerId, latitude, longitude, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      r.id, r.name, r.cuisine, r.rating, r.deliveryTime, r.isOpen, r.ownerId, r.latitude, r.longitude, r.image
    )
  }

  const pizzaPalace = await prisma.restaurant.findUnique({ where: { id: 1 } })

  await prisma.$executeRawUnsafe('DELETE FROM MenuItem')
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='MenuItem'")

  const menuData = [
    { id: 1,  restaurantId: 1, name: 'Margherita Pizza',  price: 169, desc: 'Classic cheese and tomato' },
    { id: 2,  restaurantId: 1, name: 'Pepperoni Pizza',   price: 195, desc: 'Loaded with pepperoni' },
    { id: 3,  restaurantId: 1, name: 'Garlic Bread',      price: 78,  desc: 'Toasted with garlic butter' },
    { id: 4,  restaurantId: 2, name: 'Classic Burger',    price: 130, desc: 'Beef patty with lettuce' },
    { id: 5,  restaurantId: 2, name: 'Cheese Burger',     price: 143, desc: 'Double cheese melt' },
    { id: 6,  restaurantId: 2, name: 'Fries',             price: 52,  desc: 'Crispy golden fries' },
    { id: 7,  restaurantId: 3, name: 'California Roll',   price: 117, desc: 'Crab, avocado, cucumber' },
    { id: 8,  restaurantId: 3, name: 'Salmon Roll',       price: 143, desc: 'Fresh salmon wrapped' },
    { id: 9,  restaurantId: 3, name: 'Edamame',           price: 65,  desc: 'Steamed soy beans' },
    { id: 10, restaurantId: 4, name: 'Beef Taco',         price: 52,  desc: 'Spiced beef in tortilla' },
    { id: 11, restaurantId: 4, name: 'Chicken Quesadilla',price: 104, desc: 'Grilled chicken and cheese' },
    { id: 12, restaurantId: 4, name: 'Guacamole',         price: 65,  desc: 'Fresh avocado dip' },
    { id: 13, restaurantId: 5, name: 'Butter Chicken',    price: 182, desc: 'Creamy tomato curry' },
    { id: 14, restaurantId: 5, name: 'Naan Bread',        price: 39,  desc: 'Oven-baked flatbread' },
    { id: 15, restaurantId: 5, name: 'Biryani',           price: 156, desc: 'Fragrant rice dish' },
    { id: 16, restaurantId: 6, name: 'Lo Mein',           price: 117, desc: 'Stir-fried egg noodles' },
    { id: 17, restaurantId: 6, name: 'Fried Rice',        price: 104, desc: 'Wok-fried rice' },
    { id: 18, restaurantId: 6, name: 'Spring Rolls',      price: 65,  desc: 'Crispy vegetable rolls' },
  ]

  for (const m of menuData) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO MenuItem (id, restaurantId, name, price, desc, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      m.id, m.restaurantId, m.name, m.price, m.desc
    )
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
