// seed.js
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

  console.log('Connected to DB, seeding...');

  // 1. Users
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push([
      faker.person.fullName(),
      faker.internet.email(),
      faker.internet.password(),
      faker.string.numeric(11),
      i === 0 ? 1 : 0,
    ]);
  }
  const [userResult] = await connection.query(
    `INSERT INTO users (name, email, password, cpf, is_admin) VALUES ?`,
    [users]
  );
  console.log(`Inserted ${userResult.affectedRows} users`);

  // 2. Categories
  const categories = [];
  for (let i = 0; i < 5; i++) {
    categories.push([faker.commerce.department(), faker.lorem.sentence()]);
  }
  await connection.query(
    `INSERT INTO categories (name, description) VALUES ?`,
    [categories]
  );

  // 3. Products
  const products = [];
  for (let i = 0; i < 20; i++) {
    products.push([
      1, // admin user
      faker.commerce.productName(),
      faker.commerce.productDescription(),
      faker.commerce.price(10, 500, 2),
      faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
    ]);
  }
  await connection.query(
    `INSERT INTO products (admin_id, name, description, price, image_url) VALUES ?`,
    [products]
  );

  // 4. Product-Categories
  const productCategories = [];
  for (let i = 1; i <= 20; i++) {
    const catId = faker.number.int({ min: 1, max: 5 });
    productCategories.push([i, catId]);
  }
  await connection.query(
    `INSERT INTO product_categories (product_id, category_id) VALUES ?`,
    [productCategories]
  );

  // 5. Addresses
  const addresses = [];
  for (let i = 1; i <= 10; i++) {
    addresses.push([
      i,
      faker.location.country(),
      faker.location.state(),
      faker.location.city(),
      faker.location.street(),
      faker.number.int({ min: 1, max: 9999 }).toString(),
      faker.location.zipCode(),
    ]);
  }
  await connection.query(
    `INSERT INTO addresses (user_id, country, state, city, street, number, postal_code) VALUES ?`,
    [addresses]
  );

  // 6. Credit Cards
  const creditCards = [];
  for (let i = 1; i <= 10; i++) {
    creditCards.push([
      i,
      faker.finance.creditCardNumber(),
      faker.finance.creditCardCVV(),
      faker.date.future().toISOString().split('T')[0],
    ]);
  }
  await connection.query(
    `INSERT INTO credit_cards (user_id, card_number, security_code, expiration_date) VALUES ?`,
    [creditCards]
  );

  // 7. Orders
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    orders.push([i, faker.commerce.price(50, 2000, 2), 'pending']);
  }
  await connection.query(
    `INSERT INTO orders (user_id, total, status) VALUES ?`,
    [orders]
  );

  // 8. Order Items
  const orderItems = [];
  for (let i = 1; i <= 10; i++) {
    const productId = faker.number.int({ min: 1, max: 20 });
    orderItems.push([i, productId, faker.number.int({ min: 1, max: 5 }), faker.commerce.price(10, 500, 2)]);
  }
  await connection.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`,
    [orderItems]
  );

  await connection.end();
  console.log('Seeding complete!');
}

main().catch(err => console.error('Seeding failed:', err));