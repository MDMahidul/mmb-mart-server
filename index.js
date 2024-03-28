const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const app = express();
require("dotenv").config();
const path = require("path");
const port = process.env.PORT || 5000;

/* middlewares */
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(express.json());
app.use(cors(corsOptions));

/* db connection */
mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0cmlqfw.mongodb.net/mmb-mart`
);

/* apis */
/* ----------------image storage------------------ */
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage: storage });

/* ------image upload api-------- */
app.use("/images", express.static("upload/images"));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

/* schema for upolading products */
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    require: true,
  },
  name: {
    type: String,
    require: true,
  },
  image: {
    type: String,
    require: true,
  },
  category: {
    type: String,
    require: true,
  },
  sub_category: {
    type: String,
    require: true,
  },
  new_price: {
    type: Number,
    require: true,
  },
  old_price: {
    type: Number,
    require: true,
  },
  date: {
    type: Date,
    default:Date.now,
  },
  avilable: {
    type: Boolean,
    default:true,
  },
});

 app.post('/addproduct',async(req,res)=>{
    let products= await Product.find({});
    let id;
    if(products.length > 0){
        let last_product_array = products.slice(-1);
        let last_prodyct = last_product_array[0];
        id=last_prodyct.id + 1;
    }else{
        id=1;
    }
    const product = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      sub_category: req.body.sub_category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      name: req.body.name,
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success:true,
        name:req.body.name,
    })
 });

app.get("/", (req, res) => {
  res.send(`MMB Mart is running on port: ${port}`);
});

app.listen(port, () => {
  console.log("server is running...");
});
