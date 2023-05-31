const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const contentSchema = require('../model/contentSchema')
const nodemailer = require('nodemailer')
const multer = require('multer')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto')
const dotenv = require('dotenv')



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

  
//create random image names
const imagenameCreator = (bytes=32)=>{ return crypto.randomBytes(bytes).toString('hex')}


const createContent = async (req,res,next)=>{

    try{
        const {title,photoDescription,hashtag,itemArray,backgroundColor} = req.body
        const items = JSON.parse(itemArray)

        const params = {
            Bucket : bucketName,
            Key : imagenameCreator(),
            Body : req.compressed,
            ContentType : 'image/webp'
           }

           const command = new PutObjectCommand(params)

           await s3.send(command)

        let newProject = contentSchema.create({
            creator: req.user.id,
            imageName: params.Key,
            backgroundColor: backgroundColor,
            hashtag: hashtag,
            title:title,
            projectDescription: photoDescription,
            itemsArray:items,
            
        })
        res.json(newProject)
    }

    catch(error){
        console.log(error)
    }
}


module.exports = {createContent}

