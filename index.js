require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const Product = require("./models/Product");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   CLOUDINARY
========================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================
   MULTER
========================= */

// Файл временно хранится в памяти,
// а не в папке uploads.
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024, // максимум 10 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Можно загружать только JPG, JPEG, PNG или WEBP"
        )
      );
    }
  },
});

/* =========================
   CLOUDINARY UPLOAD
========================= */

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "tilestore/products",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
}

/* =========================
   MONGODB
========================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB подключена");
  })
  .catch((err) => {
    console.error("Ошибка MongoDB:", err.message);
  });

/* =========================
   HOME
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "TileStore API работает",
  });
});

/* =========================
   GET PRODUCTS
========================= */

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.error("Ошибка получения товаров:", err);

    res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   GET ONE PRODUCT
========================= */

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Товар не найден",
      });
    }

    res.json(product);
  } catch (err) {
    console.error("Ошибка получения товара:", err);

    res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   CREATE PRODUCT
========================= */

app.post(
  "/products",
  upload.single("image"),
  async (req, res) => {
    try {
      console.log("Создание товара...");
      console.log("Название:", req.body.name);

      let imageUrl = "";

      /* -------------------------
         Загружаем картинку
      ------------------------- */

      if (req.file) {
        console.log("Загрузка изображения в Cloudinary...");

        const result = await uploadToCloudinary(
          req.file.buffer
        );

        imageUrl = result.secure_url;

        console.log(
          "Изображение загружено:",
          imageUrl
        );
      }

      /* -------------------------
         Создаём товар
      ------------------------- */

      const product = new Product({
        name: req.body.name || "",
        brand: req.body.brand || "",
        collection: req.body.collection || "",

        price: Number(req.body.price) || 0,

        size: req.body.size || "",

        width: req.body.width
          ? Number(req.body.width)
          : undefined,

        height: req.body.height
          ? Number(req.body.height)
          : undefined,

        thickness: req.body.thickness
          ? Number(req.body.thickness)
          : undefined,

        category: req.body.category || "wall",

        room: req.body.room || "",

        material: req.body.material || "",

        color: req.body.color || "",

        finish: req.body.finish || "",

        description: req.body.description || "",

        featured:
          req.body.featured === "true" ||
          req.body.featured === true,

        image: imageUrl,

        textures: {
          color: req.body.textureColor || "",
          normal: req.body.textureNormal || "",
          roughness: req.body.textureRoughness || "",
          ao: req.body.textureAo || "",
          displacement:
            req.body.textureDisplacement || "",
          metalness:
            req.body.textureMetalness || "",
        },

        stock: Number(req.body.stock) || 0,

        active:
          req.body.active === undefined
            ? true
            : req.body.active === "true" ||
              req.body.active === true,
      });

      await product.save();

      console.log(
        "Товар сохранён:",
        product.name
      );

      res.status(201).json(product);
    } catch (err) {
      console.error(
        "Ошибка создания товара:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   UPDATE PRODUCT
========================= */

app.put(
  "/products/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(
        "Редактирование товара:",
        req.params.id
      );

      const updateData = {
        name: req.body.name || "",
        brand: req.body.brand || "",
        collection: req.body.collection || "",

        price:
          req.body.price !== undefined
            ? Number(req.body.price)
            : undefined,

        size: req.body.size || "",

        width:
          req.body.width !== undefined &&
          req.body.width !== ""
            ? Number(req.body.width)
            : undefined,

        height:
          req.body.height !== undefined &&
          req.body.height !== ""
            ? Number(req.body.height)
            : undefined,

        thickness:
          req.body.thickness !== undefined &&
          req.body.thickness !== ""
            ? Number(req.body.thickness)
            : undefined,

        category: req.body.category || "wall",

        room: req.body.room || "",

        material: req.body.material || "",

        color: req.body.color || "",

        finish: req.body.finish || "",

        description: req.body.description || "",

        featured:
          req.body.featured === "true" ||
          req.body.featured === true,

        stock:
          req.body.stock !== undefined
            ? Number(req.body.stock)
            : undefined,

        active:
          req.body.active === undefined
            ? true
            : req.body.active === "true" ||
              req.body.active === true,
      };

      /* -------------------------
         Если выбрана новая картинка
      ------------------------- */

      if (req.file) {
        console.log(
          "Новая картинка. Загружаем в Cloudinary..."
        );

        const result = await uploadToCloudinary(
          req.file.buffer
        );

        updateData.image = result.secure_url;

        console.log(
          "Новая картинка:",
          result.secure_url
        );
      }

      /* -------------------------
         Обновляем товар
      ------------------------- */

      const product =
        await Product.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!product) {
        return res.status(404).json({
          message: "Товар не найден",
        });
      }

      console.log(
        "Товар успешно обновлён:",
        product.name
      );

      res.json(product);
    } catch (err) {
      console.error(
        "Ошибка редактирования товара:",
        err
      );

      res.status(500).json({
        message: err.message,
      });
    }
  }
);

/* =========================
   DELETE PRODUCT
========================= */

app.delete("/products/:id", async (req, res) => {
  try {
    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        message: "Товар не найден",
      });
    }

    res.json({
      message: "Товар удалён",
      product,
    });
  } catch (err) {
    console.error(
      "Ошибка удаления товара:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Ошибка:", err);

  res.status(400).json({
    message: err.message,
  });
});

/* =========================
   SERVER
========================= */

app.listen(PORT, () => {
  console.log(
    `Сервер запущен на порту ${PORT}`
  );
});



