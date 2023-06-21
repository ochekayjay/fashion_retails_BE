const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const creatorSchema = require('../model/creatorSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto')



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


//storage objects for user editing
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


//create random image names
const imagenameCreator = (bytes=32)=>{ return crypto.randomBytes(bytes).toString('hex')}

const creatorVerification = async (req,res,next)=>{
    try{
        

        //res.redirect('https://fashion-retails-fe.vercel.app/')
    const tok = req.params.token
    
    const decoded = jwt.verify(tok,'abc123')

    if(decoded){
        const creatordata = await creatorSchema.findByIdAndUpdate(decoded.id,{
        verified:true
        })
        if(creatordata?.id){
            res.redirect('https://fashion-retails-fe-ashen.vercel.app/verify/successful')
            //res.send('link to congratulatory message')
        }
        else{
            res.redirect('https://fashion-retails-fe-ashen.vercel.app/verify/failed')
        }
    }
}

    catch(error){
        console.log('link to link expired')
    }
}




const register = async(req,res,next)=>{
try{
    if(!req.body.Email || !req.body.Password || !req.body.Username || !req.body.name){
        res.status(400)
        res.send('Fill all fields')
        //throw new errorClass('Fill all fields',400)
    }
   const {Username,Password,Email,name,bio} = req.body
   const exisitingEmail = await creatorSchema.findOne({Email})
   const exisitingUsername = await creatorSchema.findOne({Username})
   if(exisitingEmail || exisitingUsername){
       if(exisitingEmail){
        res.send('Email already exists')
        //throw new errorClass('Email already exists',404)
       }
       else{
         res.send('Username already exists')
        //throw new errorClass('Username already exists',405)
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
             res.json({message:'Fill all fields'})
            //throw new errorClass('Fill all fields',400)
        }
       const {Password,Email} = req.body
       const exisitingUser = await creatorSchema.findOne({Email:Email})
       if(exisitingUser && (await bcrypt.compare(Password,exisitingUser.Password))){
            if(!exisitingUser.verified){
                res.json({status:'unverified'})
            }
            
            const getObjectParams = {
                Bucket: bucketName,
                Key: exisitingUser.avatarName
            }

            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
           res.status(200).json({
            _id:exisitingUser.id,
            Username:exisitingUser.Username,
            name:exisitingUser.name,
            Email:exisitingUser.Email,
            avatarLink:url,
            status:'successful',
            color: exisitingUser.backgroundColor,
            Token: generateTokenAuthorization(exisitingUser._id),
            bio: exisitingUser.bio,
            hashtag: exisitingUser.hashtag
        })
       }

       else if(exisitingUser._id){
        res.json({status:'wrong password'})

        /**
         * 
         * res.send('User does not exist')
           throw new errorClass('User does not exist',400)
         */
       }

       else{
        res.json({status:'No user'})
       }
    }
    
    catch(error){
        next(error)
    }
    }

    const editProfile = async(req,res,next)=>{
        try{
            //console.log(`${req.file} checking out`)
            if(req?.compressed){
            const params = {
                Bucket : bucketName,
                Key : imagenameCreator(),
                Body : req.compressed,
                ContentType :'image/webp'
               }

               const command = new PutObjectCommand(params)

               await s3.send(command)

          
            const userBody = {...req.body,avatarName:params?.Key}
    
            let newProfile = await creatorSchema.findByIdAndUpdate(req.user.id,{ $set: userBody},{upsert: true,new:true})
    
            const getObjectParams = {
                Bucket: bucketName,
                Key: newProfile.avatarName
            }
            const commandGet = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, commandGet, { expiresIn: 3600*5 })

            const modifiedDocument = {
                ...newProfile.toObject(),
                avatarUrl: url,
              };
            if(modifiedDocument){
                res.json(modifiedDocument)
            }}

            else{
                const userBody = {...req.body}
                let newProfile = await creatorSchema.findByIdAndUpdate(req.user.id,{ $set: userBody},{upsert: true,new:true})
                
                res.json(newProfile)
            }
        }

        catch(error){
            console.log(error)
        }
    }

    const getAvatar = async(req,res,next)=>{
        try{
            const exisitingUser = await creatorSchema.findById(req.params.userId)
            const getObjectParams = {
                Bucket: bucketName,
                Key: exisitingUser.avatarName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });

            res.json({
            avatarLink:url,
            })

        }

        catch(error){
            console.log(error)
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

            const resp = {
                _id:exisitingUser.id,
            Username:exisitingUser.Username,
            name:exisitingUser.name,
            Email:exisitingUser.Email,
            avatarLink:url,
            status:'successful',
            color: exisitingUser.backgroundColor,
            bio: exisitingUser.bio,
            hashtag: exisitingUser.hashtag
            }

            res.json(resp)


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
        return jwt.sign({id},'abc123',{expiresIn:'60m'})
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

    const resendVerification = async(req,res,next)=>{
        const {Email} = req.body
        const userdata = await creatorSchema.findOne({Email})

        const verificationToken = generateTokenEmailVerification(userdata._id); // generate a unique token
       const verificationLink = `https://fashion-r-services.onrender.com/creator/verifyEmail/${verificationToken}`;
    
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
          //res.send('mail sent')
          res.json({verification:'mail sent'})
        }
      });


    }



    


    module.exports = {register,login,deleteUser,userSearch,creatorVerification,getme,getAvatar,editProfile,resendVerification}