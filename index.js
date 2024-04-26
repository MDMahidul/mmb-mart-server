const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose");
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

/* verify jwt token */
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(403)
      .send({ error: true, message: "Unauthorized Access" });
  }
  const token = authorization.split(" ")[1];
  /* token verifying */
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "Unauthorized Access" });
    }
    req.decoded = decoded;
    next();
  });
};

/* create jwt token */
app.post("/jwt", (req, res) => {
  const email = req.body;
  const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
  res.send({ token });
});

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
    default: Date.now,
  },
  avilable: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", verifyJWT, async (req, res) => {
  let products = await Product.find({});
  let id;
  if (products.length > 0) {
    let last_product_array = products.slice(-1);
    let last_prodyct = last_product_array[0];
    id = last_prodyct.id + 1;
  } else {
    id = 1;
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
    description: req.body.description,
  });
  console.log(product);
  await product.save();
  console.log("saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

/* remove data from db */
app.delete("/deleteproduct/:id", verifyJWT, async (req, res) => {
  await Product.findOneAndDelete({ id: req.params.id });
  console.log("removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

/* get all the products from db */
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("all products fetched");
  res.send(products);
});

/* get new collection data */
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({}).sort({ date: -1 });
  let newCollection = products.slice(0, 8);

  res.send(newCollection);
});

/* get the popular collections */
app.get("/popularcollections", async (req, res) => {
  let products = await Product.find({ ratings: { $gt: 4.5 } });
  let popularcollections = products.slice(0, 8);

  res.send(popularcollections);
});

/* get categories wise data */
app.get("/categories/:category", async (req, res) => {
  let products = await Product.find({ category: req.params.category });

  res.send(products);
});

/* get sub categories wise data */
app.get("/subcategories/:sub_category", async (req, res) => {
  let products = await Product.find({ sub_category: req.params.sub_category });

  res.send(products);
});

/* get single product */
app.get("/product/details/:name", async (req, res) => {
  const name = req.params.name;
  const result = await Product.findOne({ name: name });
  res.send(result);
});

/* update product data */
app.patch("/product/update/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const filter = await Product.findOne({ id: id });
  if (!filter) {
    return res.status(404).json({ message: "Product not found" });
  }
  const updateInfo = { $set: data };
  const result = await Product.findOneAndUpdate(filter, updateInfo, {
    new: true,
  });
  console.log("data updated successfully");
  res.send(result);
});

/* creating middelware to fetch user*/
const fetchUser = async (req, res, next) => {
  const token = req.header("access-token");
  //console.log(token);
  if (!token) {
    res.status(401).send({ errors: "Unauthorized access" });
  } else {
    try {
      const data = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // Extract user email from token payload
      const userEmail = data.email;

      // Find the user in the database based on the email
      const user = await Users.findOne({ email: userEmail });

      // If user is found, set user ID in the request object
      if (user) {
        req.userId = user._id; // Assuming user ID is stored in _id field
        next();
      } else {
        res.status(404).send({ errors: "User not found" });
      }
    } catch (error) {
      res.status(401).send({ errors: "Unauthorized access" });
    }
  }
};

/* add product to cart */
app.post("/addtocart", fetchUser, async (req, res) => {
  let userData = await Users.findOne({ _id: req.userId });
  userData.cartData[req.body.itemId] += 1;
  const result = await Users.findOneAndUpdate({ _id: req.userId },{cartData:userData.cartData});
  res.send(result);
});

/* remove cart data */
app.post('/removefromcart',fetchUser,async(req,res)=>{
  let userData = await Users.findOne({ _id: req.userId });
  if (userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
  const result = await Users.findOneAndUpdate(
    { _id: req.userId },
    { cartData: userData.cartData }
  );
  res.send(result);
})

/* get cart data */
app.post('/getcart',fetchUser,async(req,res)=>{
  console.log('hitted');
  let userData = await Users.findOne({ _id: req.userId });
  res.json(userData.cartData);
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
app.post("/signup", async (req, res) => {
  let checkEmail = await Users.findOne({ email: req.body.email });
  if (checkEmail) {
    return res
      .status(400)
      .json({ success: false, errors: "Existing user found with this email" });
  }
  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const user = new Users({
    name: req.body.username,
    email: req.body.email,
    cartData: cart,
  });

  await user.save();

  /*  const data = {
    user:{
      id:user.id
    }
  } */
  res.json({
    success: true,
  });
  /* const token = jwt.sign(data,'sercet_ecom');
  res.json({ success: true, token, role: user.role }); */
});

/* get single user data */
app.get("/user/:email", async (req, res) => {
  let user = await Users.findOne({ email: req.params.email });

  res.send(user);
});

/* check user role admin */
app.get("/user/admin/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  if (req.decoded.email !== email) {
    res.send({ admin: false });
  }
  let user = await Users.findOne({ email: req.params.email });
  const result = { admin: user?.role === "admin" };
  res.send(result);
});

app.get("/", (req, res) => {
  res.send(`MMB Mart is running on port: ${port}`);
});

app.listen(port, () => {
  console.log("server is running...");
});
