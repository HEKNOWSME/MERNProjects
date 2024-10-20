const express = require('express');
const config = require('config');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
const { User, validateUser } = require('../models/user');
const Otp = require('../models/otp');
const Joi = require('joi');
const router = express.Router();
router.post('/', async (req, res) => {
   const { error } = validateUser(req.body)
   if (error) return res.status(404).send(error.details[0].message)
   const user = await User.findOne({ email: req.body.email });
   if (user) return res.status(404).send("this email is taken choose another one")
   req.body.password = await bcrypt.hash(req.body.password, 10)
   const newUser = await new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      isVerified: false
   }).save()
   const otp = generateOpt();
   await sendOtp(newUser.email, otp)
   res.send("go to your email to verify email")
});
router.post('/resend', async (req, res) => {
    const { error } = validateResendOtp(req.body)
   if (error) return res.status(404).send(error.details[0].message);

   const user = await User.findOne({email: req.body.email});
   if (!user) return res.status(404).send('we don`t have the user');

   const verifyOtpExistence = await Otp.findOne({ email: req.body.email })
   if(verifyOtpExistence) return res.status(400).send('please check your email the Otp sent before is not expired')
   const otp = generateOpt()
   sendOtp(req.body.email, otp)
   res.send("go to your email to verify again")
})
router.post("/verify", async (req, res) => {
   const { error } = validateOtp(req.body)
   if (error) return res.status(404).send(error.details[0].message);

   const user = await User.findOne({email: req.body.email})
   if (!user) return res.status(404).send('we don`t have the user')

   const otpVerification = await Otp.findOne({ email: req.body.email });
   if (!otpVerification) return res.status(404).send("has not been verified")

   const isOtpValid = await bcrypt.compare(req.body.otp, otpVerification.otp)
   if (!isOtpValid) return res.status(404).send('invalid otp')  
      
   const expiresAt = otpVerification.expiresAt;
   if (Date.now() > expiresAt) {
      await Otp.deleteOne({userId: req.body.userId})
      return res.status(404).send("this otp expired")
   }
   await User.updateOne({ email: req.body.email }, {
            isVerified: true
         })
   await Otp.deleteOne({email: req.body.email})
   res.send('user email verified successfully')
})

function generateOpt() {
   return randomstring.generate({length: 6, charset: "numeric"})
}
async function sendOtp(email, otp) {
   const mailOption = {
       from: 'iranziclaude619@gmail.com',
       to: email,
       subject: 'OTP Verification',
       text: `your Otp for verification ${otp}`
   };
   const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
         user: config.get("user"),
         pass: config.get("password")
      }
   })

   transport.sendMail(mailOption, async(fail, pass) => {
      if (fail) console.log(fail.message);
      else {
         otp = await bcrypt.hash(otp, 10)
      await new Otp({
         email: email,
         otp: otp,
         expiresAt: Date.now() + 1000 * 60* 3 // expired in three minutes
      }).save()
      console.log('sent')
      }
   })
}

function validateOtp(otp) {
   return Joi.object({
      email: Joi.string().required(),
      otp: Joi.string().required()
   }).validate(otp)
}

function validateResendOtp(email) {
   return Joi.object({
      email: Joi.string().email()
   }).validate(email)
}

module.exports = router