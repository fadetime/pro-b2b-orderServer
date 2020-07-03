const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const customerSchema = mongoose.Schema({
    name_ch: String,
    name_en: String,
    contact: String,
    phone: String,
    address: String,
    invoiceAddress: String,
    postcode: String,
    number: String,
    favorites: [
        {
            product: {type: ObjectId, ref: 'products'},
            sku: String
        }
    ],
    customerHistory: [
        {
            product: {type: ObjectId, ref: 'products'},
            sku: String
        }
    ],
    distributers:[
        {type: ObjectId, ref: 'staffs'}
    ],
    agreeDate: Date,
    payPeriod: String
})

module.exports = mongoose.model('canteens', customerSchema)