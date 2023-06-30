const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const errorClass = require('./errorControl')
const notificationSchema = require('../model/notificationSchema')
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



let followersArray = {onlineTagged:[],offlineTagged:[]}

const createNotification = async(req,res,next)=>{
    try{
        const {notifiedSockets,link,notified,imageName,imageLink,title,creator} = req.body

        let newNotif = await notificationSchema.create({
            notifier: req.user.id,
            link: link,
            notified: notified,
            imageName,
            title,
            creator
        })

        const populatedDoc = await notificationSchema.findById(newNotif._id).populate('notifier');


        const foundSockets = [...notifiedSockets]
        for(let i=0; i<foundSockets.length;i++){

            const a  = global.io.sockets.adapter.sids 

            const allSocketIds = [...a.keys()]

            if(allSocketIds.includes(foundSockets[i])){
                followersArray.onlineTagged.push(foundSockets[i])
            }
            else{
               /**
                *  followersArray.offlineTagged.push(notified[i])
                console.log('trying nots out')
                const nots = await notificationSchema.create({
                    userId: foundUsers[i]['_id'],
                    postId : post.id
                })
                */        
            }
        }

        const notifierObj = {imageLink:imageLink,creatorUsername:populatedDoc.notifier.Username,creatorName:populatedDoc.notifier.name,link}
        
        followersArray.onlineTagged.forEach(tag=>global.io.to(tag).emit('notifications',notifierObj))

        res.json({status:true})
                
    }

    catch(error){
        console.log(error)
    }
}

const getNotification = async(req,res,next)=>{

    const notifications = await notificationSchema.find({ $or: [{ notifier: req.params.id }, { notified: req.params.id }] })
    const UserArray = []
    
    for(let i=0;i<notifications.length;i++){
        let singleItem = {...notifications[i].toObject()}

        
        const getObjectParams = {
            Bucket: bucketName,
            Key: notifications[i].imageName
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600*5 });
        singleItem.imageLink = url

        UserArray.unshift(singleItem)
    }

    res.json(UserArray)
}
 


module.exports = {createNotification,getNotification}