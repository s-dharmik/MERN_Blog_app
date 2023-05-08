const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const UserSchema = new Schema({
    // these both are validation minimum of 4 is length of username
    username: {type: String, required: true, min: 4, unique: true},
    password: {type: String, required: true},

})

const UserModel = model('User', UserSchema);

module.exports = UserModel;

// we can use this user model inside of api/index.js