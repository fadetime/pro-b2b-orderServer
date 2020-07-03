const mongoose = require('mongoose')

//配单模型
const globalsSchema = mongoose.Schema({
    delivery: {
        tax: Number
    }
})

module.exports = mongoose.model('globals', globalsSchema)