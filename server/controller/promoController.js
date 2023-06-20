const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const contentSchema = require('../model/contentSchema')
const creatorSchema = require('../model/creatorSchema')
const promoSchema = require('../model/promotionSchema')
const {getme} = require('../controller/creatorControl')
const nodemailer = require('nodemailer')
const multer = require('multer')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
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

  
//create random image names
const imagenameCreator = (bytes=32)=>{ return crypto.randomBytes(bytes).toString('hex')}




const createPromo = async (req,res,next)=>{

    try{
        const {title,promoDescription,link} = req.body
        

        const params = {
            Bucket : bucketName,
            Key : imagenameCreator(),
            Body : req.compressed,
            ContentType : 'image/webp'
           }

           const command = new PutObjectCommand(params)

           await s3.send(command)

        let newProject = promoSchema.create({
            creator: req.user.id,
            imageName: params.Key,
            title:title,
            promoDescription: promoDescription,
            link:link,
            
        })
        res.json(newProject)
    }

    catch(error){
        console.log(error)
    }
}



const getUserPromos = async(req,res,next)=>{

    try{

        const UserArray = []

        const data = await promoSchema.find({creator :req.params.creatorId})
        console.log(data)
    if(data[0]){
        for(let i=0;i<data.length;i++){
            let singleItem = {...data[i].toObject()}
    
            
            const getObjectParams = {
                Bucket: bucketName,
                Key: data[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }
        res.json({promoImages:UserArray,status:true})
    }

    else{
        res.json({status:false})
    }
        
}

catch(error){
    console.log(error)
}
}



const deletePromo = async (req,res,next)=>{
    let UserArray = []
    const data = await promoSchema.findById(req.params.id)

    const getObjectParams = {
        Bucket: bucketName,
        Key: data.imageName
    }

    const command = new DeleteObjectCommand(getObjectParams)

    await s3.send(command)

    await promoSchema.findByIdAndDelete(req.params.id)

    const newData = await promoSchema.find({creator:req.user.id})

    if(newData.status){
        for(let i=0;i<newData.length;i++){
            let singleItem = {...newData[i].toObject()}
    
        
            const getObjectParams = {
                Bucket: bucketName,
                Key: newData[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }
        res.json({promoImages:UserArray,status:true})
    }

    else{
        res.json({status:false})
    }
}

module.exports = {createPromo,getUserPromos,deletePromo}