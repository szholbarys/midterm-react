const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User.js');
const bcryptjs = require('bcryptjs');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');

require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fanjdskanfjkanjksnelkmas'

app.use(express.json()); 
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
}));


app.get('/test', (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    res.json('test ok');
});
//9MAIQ5maV410Emd1

app.post('/register', async (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {name, email, password} = req.body;
    try{
        const userDoc = await User.create({
            name, 
            email, 
            password: bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc)
    }catch(e){
        res.status(422).json(e);
        // Unproccessable entity
    }
});

app.post('/login', async (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {email, password} = req.body;
    const userDoc = await User.findOne({email})
    if(userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password)
        if(passOk){
            // jwt with callback function
            jwt.sign({
                email:userDoc.email, 
                id: userDoc._id, 
                }, 
                jwtSecret, {}, (err, token) => {
                if(err) throw err;
                res.cookie('token', token).json(userDoc)
            })
        }else{
            res.status(422).json('password is not ok')
        }
    }else{
        res.json('not found')
    }
})

app.get('/profile', (req, res) => {
    mongoose.connect(process.env.MONGO_URL);
    const {token} = req.cookies;
    if(token){
        jwt.verify( token, jwtSecret, {}, async (err, userData) => {
            if(err) throw err;
            const {name, email, _id} = await User.findById(userData.id);
            res.json({name, email, _id});
        });
    }else{
        res.json(null)
    }
})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json(true); 
})

app.post('/upload-by-link', async (req, res) => {
    const {link} = req.body;
    const newName ='photo' + Date.now() + '.jpg';
    await imageDownloader.image({
        url: link,
        dest: __dirname + '/uploads/' + newName, 
    });
    res.json(newName);
})

const photosMiddleware = multer({dest:'uploads'});
app.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
    res.json(req.files);
});

app.listen(4000); 
