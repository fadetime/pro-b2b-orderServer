const mongoose = require('mongoose')

const rolesSchema = mongoose.Schema({
    name: String,
    description: String,
    othersAuths: String
})

module.exports = mongoose.model('roles', rolesSchema)