const {login,deleteUser,userSearch,creatorVerification,getme,getAvatar, editProfile} = require('../controller/creatorControl')
const router = require('express').Router()
const authorizer = require('../middlewares/authorizeUser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const creatorSchema = require('../model/creatorSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const dotenv = require('dotenv')
const crypto = require('crypto')
const {S3Client,PutObjectCommand} = require('@aws-sdk/client-s3')

//creator verification







//create random image names
const imagenameCreator = (bytes=32)=>{ return crypto.randomBytes(bytes).toString('hex')}




//bucket configuration
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
//multer memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })



//verification and email transporting
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'igocheservices@gmail.com',
      pass: 'ukhwuxwplydrjkei'
    }
  });





//generate token for email verification
const generateTokenEmailVerification = (id) =>{
    return jwt.sign({id},'abc123',{expiresIn:'7m'})
}



router.post('/register',upload.single('avatar') ,async(req,res,next)=>{
    try{
        if(!req.body.Email || !req.body.Password || !req.body.Username || !req.body.name || req.body.bio){
            res.status(400)
            console.log('error here')
            //throw new errorClass('Fill all fields',400)
        }
       const {Username,Password,Email,name,bio} = req.body
       const exisitingEmail = await creatorSchema.findOne({Email})
       const exisitingUsername = await creatorSchema.findOne({Username})
       if(exisitingEmail || exisitingUsername){
           if(exisitingEmail){
            console.log('error here')
            //throw new errorClass('Email already exists',404)
           }
           else{
            console.log('error here')
            //throw new errorClass('Username already exists',405)
           }
           
       }
    
       const params = {
        Bucket : bucketName,
        Key : imagenameCreator(),
        Body : req.file.buffer,
        ContentType : req.file.mimetype
       }

       const command = new PutObjectCommand(params)

       await s3.send(command)
       const seed = await bcrypt.genSalt(10)
       const hashedpassword = await bcrypt.hash(Password,seed)
      
       let userdata = await creatorSchema.create({
           Username : `@${Username}`,
           Password:hashedpassword,
           Email,
           name,
           bio,
           avatarName:params?.Key,
           backgroundColor: req.body?.backgroundColor,
           twitter: req.body?.twitter,
           facebook:  req.body?.facebook,
           instagram: req.body?.instagram,
       })
       const verificationToken = generateTokenEmailVerification(userdata._id); // generate a unique token
       const verificationLink = `https://fashion-r-services.onrender.com/creator/verifyEmail/${verificationToken}`;
    
       
       //const verificationLink = `https://fashion-r-services.onrender.com/creator/verifyEmail?token=${verificationToken}`;
    
      
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
    }})


router.post('/signin',login)
router.get('/search',authorizer,userSearch)
router.get('/verifyEmail/:token',creatorVerification)
router.delete('/delete',authorizer,deleteUser)
router.get('/avatar/:userId',getAvatar)
router.post('/editProfile',authorizer,editProfile)
router.get('/personal/:userId',authorizer,getme)

module.exports = router