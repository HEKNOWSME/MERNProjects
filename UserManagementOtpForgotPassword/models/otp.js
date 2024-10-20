const mongoose = require('mongoose');
const otpSchema = new mongoose.Schema({
   email: {
      type: String,
      minlength: 5,
      maxlength: 255,
      required: [true, 'please enter email address']
   },
   otp: {
      type: String
   },
   createdAt: {
      type: Date,
      default: Date.now()
   },
   expiresAt: {
      type: Date
   }
})
const Opt = mongoose.model("optVerification", otpSchema);

module.exports = Opt