require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const products = await Product.find({}, "name image");

    console.log("\n========== ТОВАРЫ ==========\n");

    products.forEach((product, index) => {
      console.log(
        `${index + 1}. ${product.name} -> ${product.image}`
      );
    });

    console.log("\n============================\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

check();
