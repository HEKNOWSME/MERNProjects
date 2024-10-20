const express = require('express');
const config = require('config');
const users = require('./routes/users');
const auth = require('./routes/auth');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/users", users);
app.use("/auth", auth);
mongoose.connect(`${config.get('dbUrl')}userManagementSystem`)
   .then(() => console.log("connected"))
   .catch(error => console.log(error));
const port = process.env.PORT || 3000;
app.listen(port, () => { console.log(`listening to the app ${port}`) });