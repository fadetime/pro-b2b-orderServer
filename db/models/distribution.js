const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

//配单模型
const distributionSchema = mongoose.Schema({
    order: ObjectId,//order id
    goods: [{
        product: ObjectId,// product id
        name_ch: String,
        name_en: String,
        sku: String,
        quantity: {
            real:   Number, // 配单量
            order: Number // 订单量
        }
    }],
    distributer: ObjectId,
    startTime: Date,
    endTime: Date
})

module.exports = mongoose.model('distribution', distributionSchema)