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
    { id: 7, name: 'Momo House', cuisine: 'Nepali', rating: 4.8, deliveryTime: '20-30 min', isOpen: 1, ownerId: null, latitude: 27.7180, longitude: 85.3350, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Momo' },
  ]

  for (const r of restaurants) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO Restaurant (id, name, cuisine, rating, deliveryTime, isOpen, ownerId, latitude, longitude, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      r.id, r.name, r.cuisine, r.rating, r.deliveryTime, r.isOpen, r.ownerId, r.latitude, r.longitude, r.image
    )
  }

  await prisma.$executeRawUnsafe("DELETE FROM MenuItem")
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name='MenuItem'")

  const menuData = [
    { id: 1,  restaurantId: 1, name: 'Margherita Pizza',    category: 'Pizza',    price: 599,  desc: 'Classic cheese and tomato on thin crust' },
    { id: 2,  restaurantId: 1, name: 'Pepperoni Pizza',     category: 'Pizza',    price: 749,  desc: 'Loaded with pepperoni and mozzarella' },
    { id: 3,  restaurantId: 1, name: 'Garlic Bread',        category: 'Appetizer',price: 199,  desc: 'Toasted with garlic butter and herbs' },
    { id: 4,  restaurantId: 2, name: 'Classic Burger',      category: 'Burger',   price: 450,  desc: 'Beef patty with lettuce, tomato, and special sauce' },
    { id: 5,  restaurantId: 2, name: 'Cheese Burger',       category: 'Burger',   price: 520,  desc: 'Double cheese melt with caramelized onions' },
    { id: 6,  restaurantId: 2, name: 'French Fries',        category: 'Fries',    price: 180,  desc: 'Crispy golden fries with dip' },
    { id: 7,  restaurantId: 3, name: 'California Roll',     category: 'Sushi',    price: 550,  desc: 'Crab, avocado, and cucumber wrapped' },
    { id: 8,  restaurantId: 3, name: 'Salmon Roll',         category: 'Sushi',    price: 680,  desc: 'Fresh salmon wrapped in seasoned rice' },
    { id: 9,  restaurantId: 3, name: 'Edamame',             category: 'Appetizer',price: 250,  desc: 'Steamed soy beans with sea salt' },
    { id: 10, restaurantId: 4, name: 'Beef Taco',           category: 'Taco',     price: 220,  desc: 'Spiced beef in crisp tortilla shell' },
    { id: 11, restaurantId: 4, name: 'Chicken Quesadilla',  category: 'Quesadilla',price: 380, desc: 'Grilled chicken and cheese quesadilla' },
    { id: 12, restaurantId: 4, name: 'Guacamole',           category: 'Appetizer',price: 250,  desc: 'Fresh avocado dip with lime and cilantro' },
    { id: 13, restaurantId: 5, name: 'Butter Chicken',      category: 'Curry',    price: 650,  desc: 'Creamy tomato curry with butter and spices' },
    { id: 14, restaurantId: 5, name: 'Garlic Naan',         category: 'Bread',    price: 120,  desc: 'Oven-baked flatbread with garlic' },
    { id: 15, restaurantId: 5, name: 'Chicken Biryani',     category: 'Rice',     price: 550,  desc: 'Fragrant layered rice with spiced chicken' },
    { id: 16, restaurantId: 6, name: 'Chow Mein',           category: 'Noodle',   price: 380,  desc: 'Stir-fried egg noodles with vegetables' },
    { id: 17, restaurantId: 6, name: 'Fried Rice',          category: 'Rice',     price: 350,  desc: 'Wok-fried rice with egg and veggies' },
    { id: 18, restaurantId: 6, name: 'Spring Rolls',        category: 'Appetizer',price: 200,  desc: 'Crispy vegetable spring rolls' },
    { id: 19, restaurantId: 7, name: 'Chicken Momo',        category: 'Momo',     price: 280,  desc: 'Steamed chicken dumplings with achar' },
    { id: 20, restaurantId: 7, name: 'Buff Momo',           category: 'Momo',     price: 320,  desc: 'Buff momo served with sesame dip' },
    { id: 21, restaurantId: 7, name: 'Veg Momo',            category: 'Momo',     price: 250,  desc: 'Steamed vegetable momo' },
    { id: 22, restaurantId: 7, name: 'Dal Bhat',            category: 'Rice',     price: 350,  desc: 'Rice with lentil soup, curry, and pickles' },
    { id: 23, restaurantId: 7, name: 'Chow Mein',           category: 'Noodle',   price: 220,  desc: 'Nepali-style street chow mein' },
    { id: 24, restaurantId: 7, name: 'Sekuwa',              category: 'Appetizer',price: 400,  desc: 'Grilled marinated meat skewers' },
    { id: 25, restaurantId: 7, name: 'Lassi',               category: 'Beverage', price: 120,  desc: 'Refreshing yogurt drink' },
    { id: 26, restaurantId: 7, name: 'Chiya',               category: 'Beverage', price: 60,   desc: 'Traditional Nepali spiced tea' },
  ]

  for (const m of menuData) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO MenuItem (id, restaurantId, name, category, price, desc, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
      m.id, m.restaurantId, m.name, m.category, m.price, m.desc
    )
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
