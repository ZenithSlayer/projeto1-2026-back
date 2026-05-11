const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  const tables = [
    'cart',
    'order_items',
    'orders',
    'credit_cards',
    'addresses',
    'product_categories',
    'products',
    'categories',
    'users'
  ];

  for (const table of tables) {
    await connection.query(`TRUNCATE TABLE ${table}`);
  }

  const users = [];
  for (let i = 0; i < 50; i++) {
    users.push([
      faker.person.fullName(),
      faker.internet.email(),
      faker.internet.password(),
      faker.string.numeric(11),
      i < 5 ? 1 : 0
    ]);
  }
  await connection.query(
    `INSERT INTO users (name, email, password, cpf, is_admin) VALUES ?`,
    [users]
  );

  const categories = [];
  for (let i = 0; i < 50; i++) {
    categories.push([
      faker.commerce.department() + i,
      faker.lorem.sentence()
    ]);
  }
  await connection.query(
    `INSERT INTO categories (name, description) VALUES ?`,
    [categories]
  );

  const products = [];
  for (let i = 0; i < 50; i++) {
    products.push([
      faker.number.int({ min: 1, max: 5 }),
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      faker.commerce.price({ min: 10, max: 1000 }),
      faker.image.url()
    ]);
  }
  await connection.query(
    `INSERT INTO products (admin_id, name, description, price, image_url) VALUES ?`,
    [products]
  );

  const productCategories = [];
  for (let i = 1; i <= 50; i++) {
    productCategories.push([
      i,
      faker.number.int({ min: 1, max: 50 })
    ]);
  }
  await connection.query(
    `INSERT IGNORE INTO product_categories (product_id, category_id) VALUES ?`,
    [productCategories]
  );

  const addresses = [];
  for (let i = 1; i <= 50; i++) {
    addresses.push([
      i,
      faker.location.country(),
      faker.location.state(),
      faker.location.city(),
      faker.location.street(),
      faker.number.int({ min: 1, max: 9999 }).toString(),
      faker.helpers.arrayElement([0, 1]),
      faker.location.zipCode('########')
    ]);
  }
  await connection.query(
    `INSERT INTO addresses (user_id, country, state, city, street, number, is_favorite, postal_code) VALUES ?`,
    [addresses]
  );

  const creditCards = [];
  for (let i = 1; i <= 50; i++) {
    creditCards.push([
      i,
      faker.finance.creditCardNumber('####-####-####-####'),
      faker.finance.creditCardCVV(),
      faker.date.future().toISOString().split('T')[0],
      faker.helpers.arrayElement([0, 1]) // is_favorite
    ]);
  }
  await connection.query(
    `INSERT INTO credit_cards (user_id, card_number, security_code, expiration_date, is_favorite) VALUES ?`,
    [creditCards]
  );

  const orders = [];
  for (let i = 1; i <= 50; i++) {
    orders.push([
      faker.number.int({ min: 1, max: 50 }),
      faker.commerce.price({ min: 50, max: 5000 }),
      faker.helpers.arrayElement(['pending', 'paid', 'shipped', 'delivered'])
    ]);
  }
  await connection.query(
    `INSERT INTO orders (user_id, total, status) VALUES ?`,
    [orders]
  );

  const orderItems = [];
  for (let i = 1; i <= 50; i++) {
    orderItems.push([
      i,
      faker.number.int({ min: 1, max: 50 }),
      faker.number.int({ min: 1, max: 5 }),
      faker.commerce.price({ min: 10, max: 1000 })
    ]);
  }
  await connection.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`,
    [orderItems]
  );

  const cartItems = [];
  for (let i = 0; i < 50; i++) {
    cartItems.push([
      faker.number.int({ min: 1, max: 50 }),
      faker.number.int({ min: 1, max: 50 }),
      faker.number.int({ min: 1, max: 5 })
    ]);
  }
  await connection.query(
    `INSERT INTO cart (user_id, product_id, quantity) VALUES ?`,
    [cartItems]
  );

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  await connection.end();
  console.log("Seeding complete using provided SQL structure.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});