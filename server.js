const express = require("express");
const cors = require("cors");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/products", productsRoutes);
app.use("/users", usersRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);