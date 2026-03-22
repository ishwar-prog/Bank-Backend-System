const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")

async function userRegisterController(req, res){

    const {email, name, password} = req.body;

    const isExists = await userModel.findOne({email:email});

    if(isExists){
        return res.status(422).json({
            message: "User already exists",
            status: "FAILED"
        });
    }

    const user = await userModel.create({
        email, password , name
    });

    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET_KEY, {expiresIn:"3d"});

    res.cookie("token", token, {httpOnly: true, secure: true});

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    });

    await emailService.sendRegisterEmail(user.email, user.name);

}

async function userLoginController(req, res){

    const {email, password} = req.body;

    const user = await userModel.findOne({email}).select("+password");

    if(!user){
        return res.status(401).json({
            message: "Invalid email or password",
            status: "FAILED"
        })
    }

    const isValidPassword = await user.comparePassword(password);

    if(!isValidPassword){
        return res.status(401).json({
            message: "Invalid email or password",
        })
    }

    const token = jwt.sign({userId:user._id}, process.env.JWT_SECRET_KEY, {expiresIn:"3d"});

    res.cookie("token", token, {httpOnly: true, secure: true});

       res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    });

}

module.exports = {
    userRegisterController,
    userLoginController
}