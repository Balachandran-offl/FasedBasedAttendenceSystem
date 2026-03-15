require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const qualityRoutes = require("./routes/quality");
const authRoutes=require("./routes/auth");
const { initGridFS } = require("./models/gridfs");
const app=express();
app.use(express.json());
app.use(cors());
const staffVerifyRoutes = require('./routes/verify_student');
mongoose.connect(process.env.MONGO_URI)
    .then(() => 
    {
        console.log("✅ MongoDB Connected Successfully");
        initGridFS(); 
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
app.use('/api',authRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/staff', staffVerifyRoutes);
const PORT=process.env.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Server is flying on http://localhost:${PORT}`);
});