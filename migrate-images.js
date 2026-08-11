require("dotenv").config();

const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Product = require("./models/Product");

// =========================
// CLOUDINARY
// =========================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================
// НАСТРОЙКИ
// =========================

const MONGODB_URI = process.env.MONGODB_URI;

const OLD_HOST = "my-backend-j4fz.onrender.com";

// =========================
// ПРОВЕРКА URL
// =========================

function isOldUploadUrl(image) {
  if (!image || typeof image !== "string") {
    return false;
  }

  return (
    image.includes(`${OLD_HOST}/uploads/`) ||
    image.includes("/uploads/")
  );
}

function isCloudinaryUrl(image) {
  return (
    typeof image === "string" &&
    image.includes("res.cloudinary.com")
  );
}

// =========================
// ЗАГРУЗКА В CLOUDINARY
// =========================

async function uploadImage(imageUrl) {
  console.log("   Загружаем:");

  console.log(`   ${imageUrl}`);

  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: "tilestore/products",
    resource_type: "image",
  });

  if (!result || !result.secure_url) {
    throw new Error(
      "Cloudinary не вернул secure_url"
    );
  }

  return result.secure_url;
}

// =========================
// MIGRATION
// =========================

async function migrate() {
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    console.log("");
    console.log("==============================");
    console.log("   MIGRATION IMAGES");
    console.log("==============================");
    console.log("");

    // -------------------------
    // Проверяем MongoDB
    // -------------------------

    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI отсутствует в .env"
      );
    }

    // -------------------------
    // Подключаемся к MongoDB
    // -------------------------

    console.log("Подключение к MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB подключена");
    console.log("");

    // -------------------------
    // Получаем товары
    // -------------------------

    const products = await Product.find({
      image: {
        $exists: true,
        $ne: "",
      },
    });

    console.log(
      `Найдено товаров с изображениями: ${products.length}`
    );

    console.log("");

    // -------------------------
    // Перебираем товары
    // -------------------------

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      console.log("------------------------------");

      console.log(
        `${i + 1}/${products.length} ${product.name}`
      );

      console.log(`ID: ${product._id}`);

      console.log(
        `Текущая картинка: ${product.image}`
      );

      // =========================
      // Уже Cloudinary
      // =========================

      if (isCloudinaryUrl(product.image)) {
        console.log(
          "✓ Уже Cloudinary — пропускаем"
        );

        skipped++;

        continue;
      }

      // =========================
      // Не старый uploads URL
      // =========================

      if (!isOldUploadUrl(product.image)) {
        console.log(
          "⚠ Неизвестный формат URL — пропускаем"
        );

        skipped++;

        continue;
      }

      // =========================
      // Загрузка
      // =========================

      try {
        const oldUrl = product.image;

        console.log(
          "→ Переносим в Cloudinary..."
        );

        const newUrl = await uploadImage(
          oldUrl
        );

        console.log(
          "✓ Cloudinary загрузил изображение"
        );

        console.log(
          `Новый URL: ${newUrl}`
        );

        // =========================
        // ВАЖНО:
        // сначала загрузили,
        // только потом MongoDB
        // =========================

        product.image = newUrl;

        await product.save();

        console.log(
          "✓ MongoDB обновлена"
        );

        migrated++;

      } catch (err) {
        console.error(
          "✗ Ошибка:",
          err.message
        );

        console.log(
          "⚠ Этот товар НЕ изменён"
        );

        errors++;
      }
    }

    // =========================
    // ИТОГ
    // =========================

    console.log("");
    console.log("==============================");
    console.log("        МИГРАЦИЯ ЗАВЕРШЕНА");
    console.log("==============================");

    console.log(
      `Всего товаров: ${products.length}`
    );

    console.log(
      `Перенесено: ${migrated}`
    );

    console.log(
      `Пропущено: ${skipped}`
    );

    console.log(
      `Ошибок: ${errors}`
    );

    console.log("==============================");
    console.log("");

    if (errors > 0) {
      console.log(
        "⚠ Некоторые изображения не были перенесены."
      );

      console.log(
        "Их MongoDB записи остались без изменений."
      );
    }

  } catch (err) {
    console.error("");
    console.error(
      "✗ КРИТИЧЕСКАЯ ОШИБКА:"
    );
    console.error(err.message);
    console.error("");

  } finally {
    // =========================
    // Отключаем MongoDB
    // =========================

    try {
      await mongoose.disconnect();

      console.log(
        "MongoDB отключена."
      );
    } catch (err) {
      console.error(
        "Ошибка отключения MongoDB:",
        err.message
      );
    }
  }
}

// =========================
// START
// =========================

migrate();