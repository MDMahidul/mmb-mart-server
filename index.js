const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const app=express();
const port =process.env.PORT || 5000;

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
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0cmlqfw.mongodb.net/`
);

app.get('/',(req,res)=>{
    res.send(`MMB Mart is running on port: ${port}`);
})

app.listen(port,()=>{
    console.log('server is running...');
})