const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", productsRoutes);
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;