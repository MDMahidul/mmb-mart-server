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
  ratings: {
    type: Number,
    require: true,
  },
  description: {
    type: String,
    require: false,
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
      ratings: req.body.ratings,
      description: req.body.description
    });
    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success:true,
        name:req.body.name,
    })
 });

 /* remove data from db */
 app.delete("/deleteproduct/:id",async(req,res)=>{
    await Product.findOneAndDelete({id:req.params.id});
    console.log("removed");
    res.json({
        success: true,
        name: req.body.name
    })
 })

 /* get all the products from db */
 app.get('/allproducts',async(req,res)=>{
    let products =await Product.find({});
    console.log("all products fetched");
    res.send(products);
 })

 /* -------------------shecma for user-------------- */
 const Users = mongoose.model("Users", {
   name: {
     type: String,
   },
   email: {
     type: String,
     unique: true,
   },
   password: {
     type: String,
   },
   role: {
     type: String,
     default: "customer",
   },
   cartData: {
     type: Object,
   },
   date: {
     type: Date,
     default: Date.now,
   },
 });

 /* add user to db */
 app.post('/signup',async(req,res)=>{
  let checkEmail = await Users.findOne({email:req.body.email});
  if(checkEmail){
    return res.status(400).json({success:false,errors:"Existing user found with this email"})
  }
  let cart={};
  for(let i=0;i<300;i++){
    cart[i]=0;
  }

  const user = new Users({
    name:req.body.username,
    email:req.body.email,
    password:req.body.password,
    cartData:cart,
  });

  await user.save();

  const data = {
    user:{
      id:user.id
    }
  }

  const token = jwt.sign(data,'sercet_ecom');
  res.json({ success: true, token, role: user.role });
 })

 /* user login  */
 app.post('/login',async(req,res)=>{
  let user = await Users.findOne({email:req.body.email});
  if(user){
    const passCheck = req.body.password === user.password;
    if(passCheck){
      const data = {
        user:{
        id:user.id
      }
    }
      const token = jwt.sign(data,'secret_ecom');
      res.json({ success: true, token, role: user.role });
    }
    else{
      res.json({success:false,errors:"wrong password"})
    }
  }else{
    res.json({success:false,errors:"Wrong email id"})
  }
 })

app.get("/", (req, res) => {
  res.send(`MMB Mart is running on port: ${port}`);
});

app.listen(port, () => {
  console.log("server is running...");
});
