const delay = (ms = 600) => new Promise(r => setTimeout(r, ms))

export const MOCK_USERS = [
  { id: 1, name: 'John Doe', email: 'john@test.com', password: 'password', role: 'customer' },
  { id: 2, name: 'Pizza Palace', email: 'owner@test.com', password: 'password', role: 'owner', restaurantId: 1 },
  { id: 3, name: 'Rider Ram', email: 'rider@test.com', password: 'password', role: 'rider' },
  { id: 4, name: 'Admin User', email: 'admin@test.com', password: 'password', role: 'admin' },
]

export const MOCK_RESTAURANTS = [
  { id: 1, name: 'Pizza Palace', cuisine: 'Italian', rating: 4.5, deliveryTime: '25-35 min', ownerId: 2, isOpen: true, image: '🍕' },
  { id: 2, name: 'Burger Barn', cuisine: 'American', rating: 4.2, deliveryTime: '20-30 min', ownerId: null, isOpen: true, image: '🍔' },
  { id: 3, name: 'Sushi Spot', cuisine: 'Japanese', rating: 4.7, deliveryTime: '30-40 min', ownerId: null, isOpen: true, image: '🍣' },
  { id: 4, name: 'Taco Town', cuisine: 'Mexican', rating: 4.3, deliveryTime: '15-25 min', ownerId: null, isOpen: false, image: '🌮' },
  { id: 5, name: 'Curry House', cuisine: 'Indian', rating: 4.6, deliveryTime: '25-35 min', ownerId: null, isOpen: true, image: '🍛' },
  { id: 6, name: 'Noodle Nest', cuisine: 'Chinese', rating: 4.1, deliveryTime: '20-30 min', ownerId: null, isOpen: true, image: '🥡' },
]

export const MENUS = {
  1: [{ id: 101, name: 'Margherita Pizza', price: 169, desc: 'Classic cheese and tomato' }, { id: 102, name: 'Pepperoni Pizza', price: 195, desc: 'Loaded with pepperoni' }, { id: 103, name: 'Garlic Bread', price: 78, desc: 'Toasted with garlic butter' }],
  2: [{ id: 201, name: 'Classic Burger', price: 130, desc: 'Beef patty with lettuce' }, { id: 202, name: 'Cheese Burger', price: 143, desc: 'Double cheese melt' }, { id: 203, name: 'Fries', price: 52, desc: 'Crispy golden fries' }],
  3: [{ id: 301, name: 'California Roll', price: 117, desc: 'Crab, avocado, cucumber' }, { id: 302, name: 'Salmon Roll', price: 143, desc: 'Fresh salmon wrapped' }, { id: 303, name: 'Edamame', price: 65, desc: 'Steamed soy beans' }],
  4: [{ id: 401, name: 'Beef Taco', price: 52, desc: 'Spiced beef in tortilla' }, { id: 402, name: 'Chicken Quesadilla', price: 104, desc: 'Grilled chicken & cheese' }, { id: 403, name: 'Guacamole', price: 65, desc: 'Fresh avocado dip' }],
  5: [{ id: 501, name: 'Butter Chicken', price: 182, desc: 'Creamy tomato curry' }, { id: 502, name: 'Naan Bread', price: 39, desc: 'Oven-baked flatbread' }, { id: 503, name: 'Biryani', price: 156, desc: 'Fragrant rice dish' }],
  6: [{ id: 601, name: 'Lo Mein', price: 117, desc: 'Stir-fried egg noodles' }, { id: 602, name: 'Fried Rice', price: 104, desc: 'Wok-fried rice' }, { id: 603, name: 'Spring Rolls', price: 65, desc: 'Crispy vegetable rolls' }],
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

export function mockGetMenu(restaurantId) {
  return MENUS[restaurantId] || []
}

export function formatPrice(n) {
  return 'Rs. ' + n.toFixed(2)
}

export function calcTotal(items) {
  return items.reduce((s, i) => s + i.price * i.qty, 0)
}
