const User=require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const sendEmail=require('../utils/sendEmail');
const {
    normalizeEmail, normalizeName, asString,
    validateEmail, validatePassword, validateName,
} = require('../utils/validators');

// Case-insensitive email lookup, so "Rahul@Gmail.com" finds "rahul@gmail.com"
// (also matches older accounts that were saved before emails were lowercased)
const findByEmail = (email) => User.findOne({ email }).collation({ locale: 'en', strength: 2 });

const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'});
}
//Register user
const registerUser=async(req,res)=>{
    const name = normalizeName(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = asString(req.body.password);

    // Validate before touching the database
    const validationError = validateName(name) || validateEmail(email) || validatePassword(password);
    if(validationError){
        return res.status(400).json({ message: validationError });
    }

    try{
        const existingUser=await findByEmail(email);
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        //Hash the password before saving it to the database
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const user= await User.create({name,email,password:hashedPassword});
        if(user){
            const message=`Hi ${name},\n\nWelcome to ShopNest! Your account has been created successfully.\n\nHappy shopping!\nTeam ShopNest`;

            // Don't let an email failure fail the whole registration:
            // the user is already saved at this point.
            try{
                await sendEmail(email,"Welcome to ShopNest!",message);
            }catch(emailErr){
                console.error("Welcome email failed:",emailErr.message);
            }

          res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
            token:generateToken(user._id)
            
          });
        }else{
            res.status(400).json({message:"Invalid user data"});
        } 

    }catch(err){
        // Two sign-ups with the same email at the same moment → unique index error
        if(err.code === 11000){
            return res.status(400).json({message:"User already exists"});
        }
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}

//Login User
const loginUser=async(req,res)=>{
    const email = normalizeEmail(req.body.email);
    const password = asString(req.body.password);
    if(!email || !password){
        return res.status(400).json({message:"Please enter your email and password"});
    }
    try{
        const user=await findByEmail(email);
        if(user && (await bcrypt.compare(password,user.password))){
            res.json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                token:generateToken(user._id)
            });
        }else{
            res.status(401).json({message:"Invalid email or password"});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
};

//Get all Users
const getUsers=async(req,res)=>{
    try{
        const users=await User.find({}).select('-password');
        res.json(users);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Server Error"})
    }

}

module.exports={
    registerUser,
    loginUser,
    getUsers
}