
const {createNotification} = require('../controller/notificationController')
const router = require('express').Router()
const authorizer = require('../middlewares/authorizeUser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')






router.post('/project',authorizer,createNotification)

module.exports = router