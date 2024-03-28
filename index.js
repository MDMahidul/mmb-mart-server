const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const multer = require('multer');
const app=express();
const path=require("path")
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
  `mongodb+srv://mmbmart:mxkwL9VF9F4uWl8m@cluster0.0cmlqfw.mongodb.net/`
);

/* apis */
/* ----------------image storage------------------ */
const storage = multer.diskStorage({
    destination:'./upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

/* ------image upload api-------- */
app.use('/images',express.static('upload/images'))
app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success: 1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})



app.get('/',(req,res)=>{
    res.send(`MMB Mart is running on port: ${port}`);
})

app.listen(port,()=>{
    console.log('server is running...');
})