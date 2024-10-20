const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {Token, validateTokenReset} = require('../models/token')
const bcrypt = require('bcrypt');
const config = require('config');
const Joi = require("joi");
const { User } = require('../models/user');
const router = express.Router();
router.post('/', async (req, res) => {
   const { error } = validateUser(req.body)
   if (error) return res.status(404).send(error.details[0].message)
   const user = await User.findOne({ email: req.body.email });
   
   if (!user) return res.status(400).send("Please enter match email")
   if (!await bcrypt.compare(req.body.password, user.password)) return res.status(400).send("please enter the password you registered")
   
   if(!user.isVerified) return res.status(400).send("verify your account to login")
   const token = user.generateToken()
   res.cookie("auth", token, {
      cookie: {
         maxAge: 1000 * 60 * 25,
         httpOnly: true
      }
   }).send('logged in')
})

router.post('/reset', async (req, res) => {
   const { error } = forgotPassword(req.body);
   if (error) return res.status(404).send(error.details[0].message);
   
   const user = await User.findOne({email: req.body.email});
   if (!user) return res.status(400).send('Please check your email');
   const token = crypto.randomBytes(32).toString('hex')
   const hashToken = crypto.createHash('sha256').update(token).digest('hex');

   await new Token({
      email: user.email,
      token: hashToken,
      expiresAt: Date.now() + 10 * 60 * 1000
   }).save()

   const urlToken = `${req.protocol}://${req.get('host')}/auth/reset/${token}`
   await sendToken(req.body.email, urlToken)
   res.send('the link sent to your email to reset password')
})

router.patch('/reset/:token', async (req, res) => {

   const hastToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
   const token = await Token.findOne({ token: hastToken });
   if (!token) return res.status(404).send("invalid token");
   const isExpired = token.expiresAt
   if (Date.now() > isExpired) {
      await token.deleteOne()
      return res.status(404).send('it is expired request new one')
   }
   const { error } = validateTokenReset(req.body)
   if (error) return res.status(404).send(error.details[0].message)
   req.body.newPassword = await bcrypt.hash(req.body.newPassword, 10)
   await User.updateOne({ email: token.email }, {
      password: req.body.newPassword
   })
   await token.deleteOne()
   res.send('successful updated password')

})
function validateUser(user) {
   return Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
   }).validate(user)
}
function forgotPassword(email) {
   return Joi.object({
      email: Joi.string().email().required()
   }).validate(email)
}
async function sendToken(email, token) {
   const mailOption = {
       from: 'claudistack | full stack developer',
       to: email,
       subject: 'password change received',
       text: `we have received reset request. use below link to reset your password\n\n${token}`
   };
   const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
         user: config.get("user"),
         pass: config.get("password")
      }
   })
   await transport.sendMail(mailOption, (fail, pass) => {
      (fail) ? console.log(fail): console.log('sent')
   })
}

module.exports = router