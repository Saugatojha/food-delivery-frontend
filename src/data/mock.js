export const MOCK_USERS = [
  { id: 1, name: 'John Doe', email: 'john@example.com', password: 'password', role: 'customer' },
  { id: 2, name: 'Pizza Palace', email: 'owner@example.com', password: 'password', role: 'owner', restaurantId: 1 },
  { id: 3, name: 'Rider Ram', email: 'rider@example.com', password: 'password', role: 'rider' },
  { id: 4, name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
]

export const MOCK_RESTAURANTS = [
  { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min', ownerId: 2, isOpen: true, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Pizza', latitude: 27.7150, longitude: 85.3120 },
  { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min', ownerId: null, isOpen: true, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Burger', latitude: 27.7040, longitude: 85.3070 },
  { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min', ownerId: null, isOpen: true, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Sushi', latitude: 27.6710, longitude: 85.3260 },
  { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min', ownerId: null, isOpen: false, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Taco', latitude: 27.7210, longitude: 85.3620 },
  { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min', ownerId: null, isOpen: true, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Curry', latitude: 27.7100, longitude: 85.3480 },
  { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min', ownerId: null, isOpen: true, image: 'https://placehold.co/400x200/EA580C/FFFFFF?text=Noodle', latitude: 27.6720, longitude: 85.4280 },
  { id: 7, name: 'Momo House', cuisine: 'Nepali', rating: 4.8, deliveryTime: '20-30 min', ownerId: null, isOpen: true, image: 'https://placehold.co/400x200/F97316/FFFFFF?text=Momo', latitude: 27.7180, longitude: 85.3350 },
]

export const MENUS = {
  1: [{ id: 101, name: 'Margherita Pizza', category: 'Pizza', price: 599, desc: 'Classic cheese and tomato on thin crust' }, { id: 102, name: 'Pepperoni Pizza', category: 'Pizza', price: 749, desc: 'Loaded with pepperoni and mozzarella' }, { id: 103, name: 'Garlic Bread', category: 'Appetizer', price: 199, desc: 'Toasted with garlic butter and herbs' }],
  2: [{ id: 201, name: 'Classic Burger', category: 'Burger', price: 450, desc: 'Beef patty with lettuce, tomato, and special sauce' }, { id: 202, name: 'Cheese Burger', category: 'Burger', price: 520, desc: 'Double cheese melt with caramelized onions' }, { id: 203, name: 'French Fries', category: 'Fries', price: 180, desc: 'Crispy golden fries with dip' }],
  3: [{ id: 301, name: 'California Roll', category: 'Sushi', price: 550, desc: 'Crab, avocado, and cucumber wrapped' }, { id: 302, name: 'Salmon Roll', category: 'Sushi', price: 680, desc: 'Fresh salmon wrapped in seasoned rice' }, { id: 303, name: 'Edamame', category: 'Appetizer', price: 250, desc: 'Steamed soy beans with sea salt' }],
  4: [{ id: 401, name: 'Beef Taco', category: 'Taco', price: 220, desc: 'Spiced beef in crisp tortilla shell' }, { id: 402, name: 'Chicken Quesadilla', category: 'Quesadilla', price: 380, desc: 'Grilled chicken and cheese quesadilla' }, { id: 403, name: 'Guacamole', category: 'Appetizer', price: 250, desc: 'Fresh avocado dip with lime' }],
  5: [{ id: 501, name: 'Butter Chicken', category: 'Curry', price: 650, desc: 'Creamy tomato curry with butter and spices' }, { id: 502, name: 'Garlic Naan', category: 'Bread', price: 120, desc: 'Oven-baked flatbread with garlic' }, { id: 503, name: 'Chicken Biryani', category: 'Rice', price: 550, desc: 'Fragrant layered rice with spiced chicken' }],
  6: [{ id: 601, name: 'Chow Mein', category: 'Noodle', price: 380, desc: 'Stir-fried egg noodles with vegetables' }, { id: 602, name: 'Fried Rice', category: 'Rice', price: 350, desc: 'Wok-fried rice with egg and veggies' }, { id: 603, name: 'Spring Rolls', category: 'Appetizer', price: 200, desc: 'Crispy vegetable spring rolls' }],
  7: [{ id: 701, name: 'Chicken Momo', category: 'Momo', price: 280, desc: 'Steamed chicken dumplings with achar' }, { id: 702, name: 'Buff Momo', category: 'Momo', price: 320, desc: 'Buff momo served with sesame dip' }, { id: 703, name: 'Dal Bhat', category: 'Rice', price: 350, desc: 'Rice with lentil soup and curry' }, { id: 704, name: 'Chow Mein', category: 'Noodle', price: 220, desc: 'Nepali-style street chow mein' }, { id: 705, name: 'Lassi', category: 'Beverage', price: 120, desc: 'Refreshing yogurt drink' }],
}

export function mockLogin(email, password) {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password)
  if (!user) throw new Error('Invalid email or password')
  const { password: _, ...safe } = user
  return { token: 'mock-jwt-' + Date.now(), user: safe }
}

export function mockRegister(name, email, password, role = 'customer') {
  const exists = MOCK_USERS.find(u => u.email === email)
  if (exists) throw new Error('Email already registered')
  const newUser = { id: Date.now(), name, email, password, role, restaurantId: null }
  MOCK_USERS.push(newUser)
  const { password: _, ...safe } = newUser
  return { token: 'mock-jwt-' + Date.now(), user: safe }
}

export function mockGetRestaurants() {
  return MOCK_RESTAURANTS
}

export function formatPrice(n) {
  return 'Rs. ' + n.toFixed(2)
}

export function calcTotal(items) {
  return items.reduce((s, i) => s + i.price * i.qty, 0)
}

export const CUISINE_CATEGORIES = {
  Italian: ['Pizza', 'Pasta', 'Salad', 'Appetizer', 'Dessert', 'Beverage'],
  American: ['Burger', 'Sandwich', 'Fries', 'Appetizer', 'Dessert', 'Beverage'],
  Japanese: ['Sushi', 'Roll', 'Noodle', 'Appetizer', 'Dessert', 'Beverage'],
  Mexican: ['Taco', 'Quesadilla', 'Nachos', 'Burrito', 'Appetizer', 'Beverage'],
  Indian: ['Curry', 'Bread', 'Rice', 'Appetizer', 'Dessert', 'Beverage'],
  Chinese: ['Noodle', 'Rice', 'Dumpling', 'Appetizer', 'Soup', 'Beverage'],
  Nepali: ['Momo', 'Curry', 'Rice', 'Dal Bhat', 'Appetizer', 'Beverage'],
}

export const CATEGORY_SUBCATEGORIES = {
  Pizza: ['Vegetarian', 'Non-Vegetarian', 'Specialty'],
  Pasta: ['White Sauce', 'Red Sauce', 'Baked'],
  Salad: ['Garden', 'Caesar', 'Fruit'],
  Burger: ['Beef', 'Chicken', 'Veggie'],
  Sandwich: ['Grilled', 'Club', 'Sub'],
  Fries: ['Classic', 'Loaded', 'Wedges'],
  Sushi: ['Maki', 'Nigiri', 'Sashimi'],
  Roll: ['California', 'Spicy', 'Tempura'],
  Noodle: ['Chow Mein', 'Lo Mein', 'Hakka'],
  Taco: ['Soft', 'Hard', 'Specialty'],
  Quesadilla: ['Chicken', 'Cheese', 'Veggie'],
  Nachos: ['Classic', 'Loaded'],
  Burrito: ['Chicken', 'Beef', 'Veggie'],
  Curry: ['Chicken', 'Mutton', 'Veggie', 'Paneer'],
  Bread: ['Naan', 'Roti', 'Paratha'],
  Rice: ['Biryani', 'Plain', 'Fried'],
  Dumpling: ['Steamed', 'Fried'],
  Soup: ['Hot & Sour', 'Wonton', 'Clear'],
  Momo: ['Steamed', 'Fried', 'Jhol', 'C Momo'],
  'Dal Bhat': ['Regular', 'Special'],
  Appetizer: ['Hot', 'Cold', 'Platter'],
  Dessert: ['Ice Cream', 'Cake', 'Traditional'],
  Beverage: ['Hot', 'Cold', 'Signature'],
}
