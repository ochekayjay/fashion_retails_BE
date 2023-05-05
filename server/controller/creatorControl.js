const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const creatorSchema = require('../model/creatorSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const dotenv = require('dotenv')



dotenv.config()

const bucketName = process.env.BUCKET_NAME
const bucketRegion = process.env.BUCKET_REGION
const accessKey = process.env.BUCKET_ACCESS_KEY
const secretAccessKey = process.env.BUCKET_SECRET_ACCESS_KEY


const s3 = new S3Client({
  credentials:{
    accessKeyId:accessKey,
    secretAccessKey:secretAccessKey
  },
  region: bucketRegion
})

const creatorVerification = async(req,res,next)=>{
    try{
    const tok = req.params.token
    console.log(tok)
    const decoded = jwt.verify(tok,'abc123')
    console.log(decoded)
    if(decoded){
        const creatordata = await creatorSchema.findByIdAndUpdate(decoded.id,{
        verified:true
        })
        if(creatordata?.id){
            res.send('link to congratulatory message')}
        else{
            res.send('link to link expired')
        }
    }}

    catch(error){
        console.log('link to link expired')
    }
}




const register = async(req,res,next)=>{
try{
    if(!req.body.Email || !req.body.Password || !req.body.Username || !req.body.name){
        res.status(400)
        throw new errorClass('Fill all fields',400)
    }
   const {Username,Password,Email,name,bio} = req.body
   const exisitingEmail = await creatorSchema.findOne({Email})
   const exisitingUsername = await creatorSchema.findOne({Username})
   if(exisitingEmail || exisitingUsername){
       if(exisitingEmail){
        throw new errorClass('Email already exists',404)
       }
       else{
        throw new errorClass('Username already exists',405)
       }
       
   }

   const seed = await bcrypt.genSalt(10)
   const hashedpassword = await bcrypt.hash(Password,seed)
  
   let userdata = await creatorSchema.create({
       Username : `@${Username}`,
       Password:hashedpassword,
       Email,
       name,
       bio,
       backgroundColor: req.body?.backgroundColor
   })
   const verificationToken = generateTokenEmailVerification(userdata._id); // generate a unique token
   const verificationLink = `http://localhost:5005/creator/verifyEmail?token=${verificationToken}`;

  
  const mailOptions = {
    from: 'igocheservices@gmail.com',
    to: Email,
    subject: 'Email Confirmation',
    html: `Thank you for registering! Please click the following link to verify your email address: <a href="${verificationLink}">${verificationLink}</a>`
  };
  

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      res.json({verification:'mail sent'})
    }
  });

 /**
  * 
  *   res.status(200).json({
       _id:userdata.id,
       Username:userdata.Username,
       Email:userdata.Email,
       name: userdata.name,
       Token:generateToken(userdata._id),
       socket : userdata.socketId,
   })
  */

}

catch(error){
    next(error)
}
}


const login = async(req,res,next)=>{
    try{
        
        if(!req.body.Email || !req.body.Password ){
            
            throw new errorClass('Fill all fields',400)
        }
       const {Password,Email} = req.body
       const exisitingUser = await creatorSchema.findOne({Email:Email})
       if(exisitingUser && (await bcrypt.compare(Password,exisitingUser.Password))){
            if(!exisitingUser.verified){
                res.send('unverified user')
            }

        
           res.status(200).json({
            _id:exisitingUser.id,
            Username:exisitingUser.Username,
            name:exisitingUser.name,
            Email:exisitingUser.Email,
            Token:generateToken(exisitingUser._id)})
       }

       else{
           throw new errorClass('User does not exist',400)
       }
    }
    
    catch(error){
        next(error)
    }
    }

    const getme = async(req,res,next)=>{
        try{
            const exisitingUser = await creatorSchema.findById(req.params.userId)
            const getObjectParams = {
                Bucket: bucketName,
                Key: exisitingUser.avatarName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });

            res.json({
                url,
                username:exisitingUser.Username
            })


        }
        catch(error){
            console.log(error)
        }
    }

    const deleteUser = async(req,res,next)=>{
        try{
           const deletedAccount = await creatorSchema.findByIdAndDelete(req.params.id)
           if(deletedAccount){
            res.json({message:'user succesfully deleted'})
           }
          
        }
        
        catch(error){
             next(error)
        
    }}

    const generateTokenEmailVerification = (id) =>{
        return jwt.sign({id},'abc123',{expiresIn:'7m'})
    }


    const generateTokenAuthorization = (id) =>{
        return jwt.sign({id},'abc123',{expiresIn:'3d'})
    }


    const userSearch = async(req,res,next)=>{
        try{
        const foundData = await creatorSchema.aggregate([
            {$match:{$text: 
                {$search: req.query.text}
            }},{
                $sort:{
                    count:{$meta:"textScore"},
                    _id: -1
                }
            }])
        res.json(foundData)
        }
        catch(error){
            next(error)
        }
    }




    


    module.exports = {register,login,deleteUser,userSearch,creatorVerification,getme}