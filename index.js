const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// CLOUDINARY
// =========================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================
// MULTER + CLOUDINARY
// =========================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tilestore/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// =========================
// MONGODB
// =========================

mongoose
  .connect(
    "mongodb://muhammedarupov1_db_user:Ara_2026@ac-lmekdoi-shard-00-00.9civ3fl.mongodb.net:27017,ac-lmekdoi-shard-00-01.9civ3fl.mongodb.net:27017,ac-lmekdoi-shard-00-02.9civ3fl.mongodb.net:27017/?ssl=true&replicaSet=atlas-19l7hm-shard-0&authSource=admin&appName=Cluster0"
  )
  .then(() => console.log("MongoDB подключена"))
  .catch((err) => console.log("Ошибка MongoDB:", err));

// =========================
// ДОБАВИТЬ ТОВАР
// =========================

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      size: req.body.size,
      material: req.body.material,
      room: req.body.room,
      type: req.body.type,
      description: req.body.description,
      featured: req.body.featured === "true",

      // Cloudinary URL
      image: req.file ? req.file.path : "",
    });

    await product.save();

    res.json(product);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// =========================
// ИЗМЕНИТЬ ТОВАР
// =========================

app.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      price: req.body.price,
      size: req.body.size,
      material: req.body.material,
      room: req.body.room,
      type: req.body.type,
      description: req.body.description,
      featured: req.body.featured === "true",
    };

    // Если загрузили новую картинку
    if (req.file) {
      updateData.image = req.file.path;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(product);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

// =========================
// ПОЛУЧИТЬ ТОВАРЫ
// =========================

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// =========================
// УДАЛИТЬ ТОВАР
// =========================

app.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Товар удален",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});


