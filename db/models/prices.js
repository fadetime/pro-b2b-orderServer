const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const pricesSchema = mongoose.Schema({
    canteen: ObjectId,
    sku: String,
    price: Number,
    product: ObjectId
})

module.exports = mongoose.model('prices', pricesSchema)