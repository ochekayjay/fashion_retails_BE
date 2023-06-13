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
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
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
        const {title,projectDescription,hashtag,itemArray,backgroundColor} = req.body
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
            projectDescription: projectDescription,
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

         const content = await contentSchema.findById(req.params.contentId).populate('creator')

        const userData = content.creator

        const getObjectParamsOne = {
            Bucket: bucketName,
            Key: userData.avatarName
        }
        const commandOne = new GetObjectCommand(getObjectParamsOne);
        const avatarUrl = await getSignedUrl(s3, commandOne, { expiresIn: 3600*5 });

        const userDetail = {
            _id:userData.id,
        Username:userData.Username,
        name:userData.name,
        Email:userData.Email,
        avatarLink:avatarUrl,
        status:'successful',
        color: userData.backgroundColor,
        bio: userData.bio,
        hashtag: userData.hashtag
        }

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
    
        //console.log(foun)
        for(let i=0;i<foundContent.length;i++){
            let singleItem = {...foundContent[i].toObject()}
    
    
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
        
    }
    catch(error){
        console.log(error)
    }
}




const HashAllContents = async(req,res,next)=>{
    try{
        const UserArray = []
        const foundContent = await contentSchema.find({hashtag:req.query.hashtag})
    
        //console.log(foun)
        for(let i=0;i<foundContent.length;i++){
            let singleItem = {...foundContent[i].toObject()}
    
            
            const getObjectParams = {
                Bucket: bucketName,
                Key: foundContent[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }

res.json({userImages:UserArray})

    }
    catch(error){
        console.log(error)
    }
}




//search text

const querySearchText = async(req,res,next)=>{

       //console.log(`${req.query.message} value`)
       try{
           
           await contentSchema.find({creator:req.params.creator}).lean()
           
       
           const foundData = await contentSchema.aggregate([
        
           {$match:
               {$text: 
                   {$search: req.query.message,
                       $caseSensitive: false}} }
       
       ])       

    
       if(foundData[0]){
        res.json({textdata:foundData,state:true})
           
       }
       else{
        res.json({state:false,message:"text not found!"})
   
   }
   }
       catch(error){
           next(error)
       }
   }



   
const querySearchAllWithImg = async(req,res,next)=>{
        let UserArray = []
       //console.log(`${req.query.message} value`)
       try{
           
           await contentSchema.find().lean()
           
       
           const foundData = await contentSchema.aggregate([
        
           {$match:
               {$text: 
                   {$search: req.query.message,
                       $caseSensitive: false}} }
       
       ])       


       if(foundData[0]){
        for(let i=0;i<foundData.length;i++){
            let singleItem = {...foundData[i]}
    
        
            const getObjectParams = {
                Bucket: bucketName,
                Key: foundData[i].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
    
            UserArray.unshift(singleItem)
        }
        res.json({UserSearch:UserArray,state:true})
           
       }
       else{

        res.json({state:false,message:"text not found!"})
   
   }
   }
       catch(error){
           console.log(error)
       }
   }

   const querySearchAll = async(req,res,next)=>{

    //console.log(`${req.query.message} value`)
    try{
        
        await contentSchema.find().lean()
        
    
        const foundData = await contentSchema.aggregate([
     
        {$match:
            {$text: 
                {$search: req.query.message,
                    $caseSensitive: false}} }
    
    ])       


    if(foundData[0]){
     res.json({textdata:foundData,state:true})
        
    }
    else{
     res.json({state:false,message:"text not found!"})

}
}
    catch(error){
        next(error)
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





const getAllContents = async(req,res,next)=>{

    try{

        const UserArray = []

        const data = await contentSchema.find()
    
    
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
        res.json({userImages:UserArray})
        }

        catch(error){
            console.log(error)
        }
        }


const hashBrowse = async(req,res,next)=>{
    const hashArray = ['#dinner','#women', '#casual','#outdoor','#men', '#office','#freestyle','#beach','#jewelries','#crotchet','#wig','#rings']
    let hashExplore = []


    for(let i=0;i<hashArray.length;i++){
      let hashHolder =  await contentSchema.aggregate([
            { $match: { hashtag: hashArray[i] } },
            { $sample: { size: 1 } },
            { $limit: 1 }
          ])
        
    
            let singleItem = {...hashHolder[0]}
    
            
            const getObjectParams = {
                Bucket: bucketName,
                Key: hashHolder[0].imageName
            }
            const command = new GetObjectCommand(getObjectParams);
            const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
            singleItem.imageLink = url
            singleItem.hash = hashArray[i]
          hashExplore.unshift(singleItem)
    }

    res.json(hashExplore)



}

const getUserContents = async(req,res,next)=>{

    try{

        const UserArray = []

        const exisitingUser = await creatorSchema.findById(req.params.creatorId)
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

        const data = await contentSchema.find({creator :req.params.creatorId})
    
    
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
    



res.json({userDetail,userImages:UserArray})
}

catch(error){
    console.log(error)
}
}

const deleteProject = async (req,res,next)=>{
    const data = await contentSchema.findById(req.params.id)

    const getObjectParams = {
        Bucket: bucketName,
        Key: data.imageName
    }

    const command = new DeleteObjectCommand(getObjectParams)

    await s3.send(command)

    const newData = await contentSchema.findByIdAndDelete(req.params.id)
    res.json(newData)


}


module.exports = {createContent,getAllContents,getUserContents,deleteProject,querySearchAllWithImg,getOneContent,editProjects,querySearchAll,HashAllContents,searchUserContent,querySearchText,hashBrowse}

