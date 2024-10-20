const mongoose = require('mongoose');
const Joi = require('joi');

const tokenSchema = new mongoose.Schema({
   email: {
      type: String,
      required: [true, 'please enter email']
   },
   token: {
      type: String,
      required: [true, 'please enter token'],
      unique: true
   },
   expiresAt: {
      type: Date,
      default: Date.now()
   }
})

const Token = mongoose.model('tokens', tokenSchema)

function validateTokenReset(token) {
   return Joi.object({
      newPassword: Joi.string().required()
   }).validate(token)
}
module.exports.Token = Token
module.exports.validateTokenReset = validateTokenReset