const User=require('../models/User');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const sendEmail=require('../utils/sendEmail');

const generateToken=(id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:'7d'});
}
//Register user
const registerUser=async(req,res)=>{
    const {name,email,password}=req.body;
    try{
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message:"User already exists"});
        }
        //Hash the password before saving it to the database
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);

        const user= await User.create({name,email,password:hashedPassword});
        if(user){
            const otp=Math.floor(100000+Math.random()*900000).toString();
            const message=`Welcome to ShopNest!, ${name} Your OTP is ${otp}. `;

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
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
}

//Login User
const loginUser=async(req,res)=>{
    const {email,password}=req.body;
    try{
        const user=await User.findOne({email});
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