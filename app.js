const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", productsRoutes);
app.use("/users", usersRoutes);
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;