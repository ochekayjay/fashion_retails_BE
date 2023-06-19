const {createPromo,getUserPromos,deletePromo} = require('../controller/promoController')
const router = require('express').Router()
const authorizer = require('../middlewares/authorizeUser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const creatorSchema = require('../model/creatorSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const dotenv = require('dotenv')
const crypto = require('crypto')
const sharp = require('sharp')
const {S3Client,PutObjectCommand} = require('@aws-sdk/client-s3')


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const optimizeImage = async(req,res,next)=>{
    const image = req.file;
  const imageBuffer = image.buffer;

  const compression = 40; // Set your desired compression value
  const compressedImageData = await sharp(imageBuffer)
  .webp({ quality: compression }) // Convert to WebP format with the desired quality
  .toBuffer(); 

  console.log(compressedImageData)
  req.compressed = compressedImageData;

  next()
}


router.post('/creation',authorizer,upload.single('avatar'),optimizeImage ,createPromo)
router.delete('/delete/:id',authorizer,deletePromo)
router.get('/creator/:creatorId',getUserPromos)