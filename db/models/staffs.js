const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const StaffSchema = mongoose.Schema({
    name: String,
    username: String,
    password: String,
    role: {type: ObjectId, ref: 'roles'},
    workStatus: String,
    phone: String,
    supplyTag: {type: ObjectId, ref: 'supplies'}
})

module.exports = mongoose.model('staffs', StaffSchema)