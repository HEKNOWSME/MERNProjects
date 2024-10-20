const mongoose = require('mongoose');
const config = require('config');
const jsonwebtoken = require('jsonwebtoken');
const Joi = require('joi');
const userSchema = new mongoose.Schema({
   name: {
      type: String,
      minlength: 5,
      maxlength: 255,
      required: [true, "please enter your name"],
      trim: true
   },
   email: {
      type: String,
      minlength: 5,
      maxlength: 255,
      required: [true, "Please enter your email"],
      trim: true,
      unique: true
   },
   phone: {
      type: String,
      minlength: 5,
      maxlength: 15,
      required: [true, "Please enter your phone number"]
   },
   password: {
      type: String,
      minlength: 5,
      maxlength: 255,
      required: [true, "Please enter your password"]
   },
   isVerified: {
      type: Boolean,
      default: false
   }
});
userSchema.methods.generateToken = function () {
   return jsonwebtoken.sign({ id: this._id, email: this.email }, config.get("privateKey"), {
      expiresIn: '15min'
   })
}
const User = mongoose.model("users", userSchema)
function validateUser(user) {
   return Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      password: Joi.string().required()
   }).validate(user)
}
exports.User = User
exports.userSchema = userSchema
exports.validateUser = validateUser