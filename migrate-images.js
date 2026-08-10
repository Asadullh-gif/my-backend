require("dotenv").config();

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Product = require("./models/Product");
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB подключена");

    const products = await Product.find();

    console.log(`Найдено товаров: ${products.length}`);

    for (const product of products) {
      // Если картинка уже Cloudinary — пропускаем
      if (
        product.image &&
        product.image.includes("cloudinary.com")
      ) {
        console.log(`✓ ${product.name} уже в Cloudinary`);
        continue;
      }

      if (!product.image) {
        console.log(`⚠️ ${product.name} — картинки нет`);
        continue;
      }

      const filename = path.basename(product.image);

      const localPath = path.join(
        __dirname,
        "uploads",
        filename
      );

      if (!fs.existsSync(localPath)) {
        console.log(
          `❌ ${product.name} — файл не найден: ${localPath}`
        );
        continue;
      }

      console.log(`⬆️ Загружаю: ${product.name}`);

      const result = await cloudinary.uploader.upload(
        localPath,
        {
          folder: "tilestore/products",
        }
      );

      product.image = result.secure_url;

      await product.save();

      console.log(
        `✅ ${product.name} → ${result.secure_url}`
      );
    }

    console.log("🎉 Миграция завершена!");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

migrate();