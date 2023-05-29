const {createContent} = require('../controller/contentController')
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


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


router.post('/creation',authorizer,upload.single('avatar') ,createContent)


module.exports = router

