const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const contentSchema = require('../model/contentSchema')
const creatorSchema = require('../model/creatorSchema')
const {getme} = require('../controller/creatorControl')
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

const getOneContent = async(req,res,next)=>{
    try{

        const exisitingUser = await creatorSchema.findById(req.user.id)
        const getObjectParamsOne = {
            Bucket: bucketName,
            Key: exisitingUser.avatarName
        }
        const commandOne = new GetObjectCommand(getObjectParamsOne);
        const avatarUrl = await getSignedUrl(s3, commandOne, { expiresIn: 3600*5 });

        const userDetail = {
            _id:exisitingUser.id,
        Username:exisitingUser.Username,
        name:exisitingUser.name,
        Email:exisitingUser.Email,
        avatarLink:avatarUrl,
        status:'successful',
        color: exisitingUser.backgroundColor,
        bio: exisitingUser.bio,
        hashtag: exisitingUser.hashtag
        }


        const content = await contentSchema.findById(req.params.id)

        const getObjectParams = {
            Bucket: bucketName,
            Key: content.imageName
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });

        let contentObj = content.toObject()
        contentObj.imageLink = url

        res.json({content:contentObj,userDetail})
        

    }
    catch(error){
        console.log(error)
    }
}
const searchUserContent = async(req,res,next)=>{
    try{
        

        const UserArray = []

        const exisitingUser = await creatorSchema.findById(req.query.creator)
        const getObjectParams = {
            Bucket: bucketName,
            Key: exisitingUser.avatarName
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });

        const userDetail = {
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

        const foundContent = await contentSchema.find({creator:req.query.creator,hashtag:req.query.hashtag})
    
    
        for(let i=0;i<foundContent.length;i++){
            let singleItem = {...foundContent[i].toObject()}
    
            console.log(singleItem)
            const getObjectParams = {
                Bucket: bucketName,
                Key: foundContent[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }
    



res.json({userDetail,userImages:UserArray})
        console.log(foundContent)
    }
    catch(error){
        console.log(error)
    }
}

const editProjects = async(req,res,next)=>{
    try{
        const userBody = req.body
        const updatedProject = await contentSchema.findByIdAndUpdate(req.params.id,{ $set: userBody},{upsert: true,new:true})
        //console.log(JSON.stringify(updatedProject))
        if(updatedProject.projectDescription !==''){
            res.json({verified:true})
        }
    }

    catch(error){
        console.log(error)
    }
}


const getUserContents = async(req,res,next)=>{

    try{

        const UserArray = []

        const exisitingUser = await creatorSchema.findById(req.user.id)
        const getObjectParams = {
            Bucket: bucketName,
            Key: exisitingUser.avatarName
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });

        const userDetail = {
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

        const data = await contentSchema.find({creator :req.user.id})
    
    
        for(let i=0;i<data.length;i++){
            let singleItem = {...data[i].toObject()}
    
            console.log(singleItem)
            const getObjectParams = {
                Bucket: bucketName,
                Key: data[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }
    



res.json({userDetail,userImages:UserArray})
}

catch(error){
    console.log(error)
}
}



module.exports = {createContent,getUserContents,getOneContent,editProjects,searchUserContent}

