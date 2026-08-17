const bcrypt = require('bcryptjs')
const prisma = require('../src/config/database')

async function main() {
  const existingUsers = await prisma.user.count()
  if (existingUsers > 0) {
    console.log('Database already seeded, skipping.')
    return
  }

  const password = await bcrypt.hash('password', 10)

  const customer = await prisma.user.create({
    data: { name: 'John Doe', email: 'john@example.com', password, role: 'customer', emailVerified: true },
  })

  const ownerUser = await prisma.user.create({
    data: { name: 'Pizza Palace', email: 'owner@example.com', password, role: 'owner', emailVerified: true },
  })

  await prisma.user.create({
    data: { name: 'Rider Ram', email: 'rider@example.com', password, role: 'rider', emailVerified: true, restaurantId: 1 },
  })

  await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@example.com', password, role: 'admin', emailVerified: true },
  })

  const restaurants = [
    { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min', isOpen: true, ownerId: ownerUser.id, latitude: 27.7150, longitude: 85.3120, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Pizza' },
    { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min', isOpen: true, latitude: 27.7040, longitude: 85.3070, image: '/burgerbarn.png' },
    { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min', isOpen: true, latitude: 27.6710, longitude: 85.3260, image: '/sushispot.png' },
    { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min', isOpen: false, latitude: 27.7210, longitude: 85.3620, image: '/tocotown.png' },
    { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min', isOpen: true, latitude: 27.7100, longitude: 85.3480, image: '/curryhouse.png' },
    { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min', isOpen: true, latitude: 27.6720, longitude: 85.4280, image: '/noodenest.png' },
    { id: 7, name: 'Momo House', cuisine: 'Nepali', rating: 4.8, deliveryTime: '20-30 min', isOpen: true, latitude: 27.7180, longitude: 85.3350, image: '/momohouse.png' },
  ]

  for (const r of restaurants) {
    await prisma.$executeRawUnsafe(
      "INSERT INTO Restaurant (id, name, cuisine, rating, deliveryTime, isOpen, ownerId, latitude, longitude, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      r.id, r.name, r.cuisine, r.rating, r.deliveryTime, r.isOpen, r.ownerId || null, r.latitude, r.longitude, r.image
    )
  }

  const pizzaCat = await prisma.category.create({ data: { restaurantId: 1, name: 'Pizza' } })
  const appetizerCat = await prisma.category.create({ data: { restaurantId: 1, name: 'Appetizer' } })
  await prisma.subCategory.create({ data: { categoryId: pizzaCat.id, name: 'Vegetarian' } })
  await prisma.subCategory.create({ data: { categoryId: pizzaCat.id, name: 'Non-Vegetarian' } })
  await prisma.subCategory.create({ data: { categoryId: appetizerCat.id, name: 'Hot' } })

  const menuData = [
    { restaurantId: 1, name: 'Margherita Pizza',    category: 'Pizza',    subCategory: 'Vegetarian',    price: 599,  desc: 'Classic cheese and tomato on thin crust' },
    { restaurantId: 1, name: 'Pepperoni Pizza',     category: 'Pizza',    subCategory: 'Non-Vegetarian',price: 749,  desc: 'Loaded with pepperoni and mozzarella' },
    { restaurantId: 1, name: 'Garlic Bread',        category: 'Appetizer',subCategory: 'Hot',           price: 199,  desc: 'Toasted with garlic butter and herbs' },
    { restaurantId: 2, name: 'Classic Burger',      category: 'Burger',   subCategory: 'Beef',          price: 450,  desc: 'Beef patty with lettuce, tomato, and special sauce' },
    { restaurantId: 2, name: 'Cheese Burger',       category: 'Burger',   subCategory: 'Beef',          price: 520,  desc: 'Double cheese melt with caramelized onions' },
    { restaurantId: 2, name: 'French Fries',        category: 'Fries',    subCategory: 'Classic',       price: 180,  desc: 'Crispy golden fries with dip' },
    { restaurantId: 3, name: 'California Roll',     category: 'Sushi',    subCategory: 'Maki',          price: 550,  desc: 'Crab, avocado, and cucumber wrapped' },
    { restaurantId: 3, name: 'Salmon Roll',         category: 'Sushi',    subCategory: 'Maki',          price: 680,  desc: 'Fresh salmon wrapped in seasoned rice' },
    { restaurantId: 3, name: 'Edamame',             category: 'Appetizer',subCategory: 'Cold',          price: 250,  desc: 'Steamed soy beans with sea salt' },
    { restaurantId: 4, name: 'Beef Taco',           category: 'Taco',     subCategory: 'Hard',          price: 220,  desc: 'Spiced beef in crisp tortilla shell' },
    { restaurantId: 4, name: 'Chicken Quesadilla',  category: 'Quesadilla',subCategory: 'Chicken',     price: 380,  desc: 'Grilled chicken and cheese quesadilla' },
    { restaurantId: 4, name: 'Guacamole',           category: 'Appetizer',subCategory: 'Cold',          price: 250,  desc: 'Fresh avocado dip with lime and cilantro' },
    { restaurantId: 5, name: 'Butter Chicken',      category: 'Curry',    subCategory: 'Chicken',       price: 650,  desc: 'Creamy tomato curry with butter and spices' },
    { restaurantId: 5, name: 'Garlic Naan',         category: 'Bread',    subCategory: 'Naan',          price: 120,  desc: 'Oven-baked flatbread with garlic' },
    { restaurantId: 5, name: 'Chicken Biryani',     category: 'Rice',     subCategory: 'Biryani',       price: 550,  desc: 'Fragrant layered rice with spiced chicken' },
    { restaurantId: 6, name: 'Chow Mein',           category: 'Noodle',   subCategory: 'Chow Mein',     price: 380,  desc: 'Stir-fried egg noodles with vegetables' },
    { restaurantId: 6, name: 'Fried Rice',          category: 'Rice',     subCategory: 'Fried',         price: 350,  desc: 'Wok-fried rice with egg and veggies' },
    { restaurantId: 6, name: 'Spring Rolls',        category: 'Appetizer',subCategory: 'Hot',           price: 200,  desc: 'Crispy vegetable spring rolls' },
    { restaurantId: 7, name: 'Chicken Momo',        category: 'Momo',     subCategory: 'Steamed',       price: 280,  desc: 'Steamed chicken dumplings with achar' },
    { restaurantId: 7, name: 'Buff Momo',           category: 'Momo',     subCategory: 'Steamed',       price: 320,  desc: 'Buff momo served with sesame dip' },
    { restaurantId: 7, name: 'Veg Momo',            category: 'Momo',     subCategory: 'Steamed',       price: 250,  desc: 'Steamed vegetable momo' },
    { restaurantId: 7, name: 'Dal Bhat',            category: 'Rice',     subCategory: 'Regular',       price: 350,  desc: 'Rice with lentil soup, curry, and pickles' },
    { restaurantId: 7, name: 'Chow Mein',           category: 'Noodle',   subCategory: 'Chow Mein',     price: 220,  desc: 'Nepali-style street chow mein' },
    { restaurantId: 7, name: 'Sekuwa',              category: 'Appetizer',subCategory: 'Hot',           price: 400,  desc: 'Grilled marinated meat skewers' },
    { restaurantId: 7, name: 'Lassi',               category: 'Beverage', subCategory: 'Cold',          price: 120,  desc: 'Refreshing yogurt drink' },
    { restaurantId: 7, name: 'Chiya',               category: 'Beverage', subCategory: 'Hot',           price: 60,   desc: 'Traditional Nepali spiced tea' },
  ]

  for (const m of menuData) {
    await prisma.menuItem.create({
      data: { restaurantId: m.restaurantId, name: m.name, category: m.category, subCategory: m.subCategory, price: m.price, desc: m.desc },
    })
  }

  console.log('Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
