const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({dest:'uploads/'});
const fs = require('fs'); //FileSystem

// any random string with which bcrypt will hash our password.
const salt = bcrypt.genSaltSync(10);
const secret = 'asdirh32u8qwnejihqwu8ry3289nqr3918y7447';

app.use(cors({credentials: true, origin: 'http://localhost:3000/'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads' ));

// This establishes connection to mongoose databse
mongoose.connect('mongodb+srv://bond34766:mos5Tk85JFEv2bsx@cluster0.hf28cgd.mongodb.net/?retryWrites=true&w=majority')


// this is for register
app.post('/register', async(req, res)=> {
    // This line helps to get uname and pwd from register page as it is from req side
    // Req: When submitting DataTransfer(hypothatecally)
    // Res: When recieving feedback
    const {username, password} = req.body;
    try{
    const UserDoc = await User.create({
        username,
        password: bcrypt.hashSync(password, salt),
    });
    res.json(UserDoc);
    }
    catch(e){
        res.status(400).json(e);
    }
});


// this is for login
app.post('/login', async (req, res)=> {
    const {username,password} = req.body;
    const UserDoc = await User.findOne({username});

    //this cacn be used to see if username and password isworking for Login page we can see it in browser/ispect/network
    //we can say res.json is one kind of print function for checking if data is working or not on browser
    // res.json(UserDoc);

    // Now let's compare the passwords we got in loginpage and from database of Register
    const passOk = bcrypt.compareSync(password,UserDoc.password);
    if(passOk){
        //logged in successfully and we will respond with JWT(JsonWebToken)
        //as res.json we sill send json web token as below
        jwt.sign({username, id:UserDoc._id}, secret, {}, (err, token)=>{
            //if we find any error in it then just throw it or return token
            if (err) throw err;
            
            //we send data as a cookie not json
            res.cookie('token', token).json({
                id:UserDoc._id,
                username,
            });
        })
    }
    else{
        res.status(400).json('wrong credentials');
    }

});

//requesting cookies and fetching it to validate it if it is valid
app.get('/profile', (req,res) => {
    //wrapping token now we can read this token as this belongs to jwt with usernamepassword and usernameID which we set above
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, () => {
        if (err) throw err;
        res.json(info);
    });
});


//these are called ENDPOINTS
app.post('/logout',(req,res) => {
    //logged out... opposite samelogic of login
    res.cookie('token','').json('ok');
})


//Post request on /post
app.post('/post',uploadMiddleware.single('file'), async (req,res) => {
    //for getting all data from browser console and as that all files data is in json we stored  it in {}
    //uploading the file and renaming it...
    const {originalname, path} = req.file; //destructering
    const parts = originalname.split('.');
    const ext = parts[parts.lngt-1];
    const newPath = path+'.' +ext;
    fs.renameSync(path, newPath);

    const {token} = req.cookies;

    // After verifying token we get info inside info we are having ID we will get all of below details in our mongo db

    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
            const {title, summary, content} = req.body;
            //documents from our DB for this post
            const postDoc = await post.create({
                title,
                summary,
                content,
                cover: newPath,
                author: info.id,
            });
        res.json(postDoc);
    });


    
});

app.post('/post', uploadMiddleware.single('file'), async(req,res) =>{
    let newPath = null;
    if(req.file){
    const {originalname, path} = req.file; //destructering
    const parts = originalname.split('.');
    const ext = parts[parts.lngt-1];
    newPath = path+'.' +ext;
    fs.renameSync(path, newPath);
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async(err, info) => {
        if (err) throw err;
            const {id, title, summary, content} = req.body;
            const postDoc = await Post.findById(id);
            const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
            if(!isAuthor) {
                return res.status(400).json('You are not Author.');
            }

            await postDoc.update({
                title,
                summary,
                content,
                cover: newPath ? newPath : postDoc.cover,
            })
        res.json(postDoc);
    });


    }
});


//GET req on /post
app.get('/post',async (req, res) => {
    res.json(await Post.find()
    .populate('author', [username]).sort({createdAt:-1}) //this code helping to sort newest post on top
    .limit(20)
    );
});

app.get('/post/:id', async (req,res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    
})


app.listen(4000);
