const {createContent,querySearchAll,getUserContents,getAllContents,deleteProject,hashBrowse,querySearchAllWithImg,getOneContent,editProjects,HashAllContents,searchUserContent,querySearchText} = require('../controller/contentController')
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

  const compression = 20; // Set your desired compression value
  const compressedImageData = await sharp(imageBuffer)
  .webp({ quality: compression }) // Convert to WebP format with the desired quality
  .toBuffer(); 

  console.log(compressedImageData)
  req.compressed = compressedImageData;

  next()
}


router.post('/creation',authorizer,upload.single('avatar'),optimizeImage ,createContent)
router.post('/creation/edit/:id',authorizer,editProjects)
router.delete('/delete/:id',authorizer,deleteProject)
router.get('/hashBrowse',hashBrowse)
router.get('/allProjects',getAllContents)
router.get('/allHash',HashAllContents)
router.get('/allSearch',querySearchAll)
router.get('/allSearchWithImg',querySearchAllWithImg)
router.get('/user/contents/:creatorId',getUserContents)
router.get('/user/hashtag',searchUserContent)
router.get('/user/search/:creator',querySearchText)
router.get('/user/singlecontent/:contentId',getOneContent)



module.exports = router

