require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const cors = require("cors");
const multer = require("multer");

const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB подключена"))
  .catch(err => console.log("Ошибка MongoDB:", err));




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
      image:
        `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
    });

    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

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
      updateData.image =
        `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(product);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});




app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});




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

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});





