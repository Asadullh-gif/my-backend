require("dotenv").config();

const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tilestore",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));




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

    // Если выбрана новая картинка — сохраняем её в Cloudinary
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





