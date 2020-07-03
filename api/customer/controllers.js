const Customer = require('../../db/models/customer')
const service = require('./services')
const compose = require('koa-compose')

module.exports ={
    findCustomer: async (ctx) => {
        try{
            let res = await Customer.find({},{name_ch: 1,name_en: 1, remark: 1, number: 1})
            console.log(res)
            ctx.body = res
        }catch(err){
            console.log(err)
            throw err
        }
    },
    checkCustomerNumber: async (ctx) => {
        try{
            let res = await Customer.countDocuments()
            ctx.body = res
        }catch(err){
            console.log(err)
            throw err
        }
    },
    getOrderHistory: async (ctx) => {
        if(!ctx.request.body.customerId){
            let err = new Error('Need customer ID')
            err.code = 403
            throw err
        }
        let context={
            customerId: ctx.request.body.customerId,
            today: ctx.request.body.today,
            ctx: ctx
        }
        try{
            return compose([service.findCustomerInfo,service.ifTodayHaveOrder,service.res])(context)
        }catch(err){
            console.log(err)
            throw err
        }
    },
    delOrderHistory: async (ctx) => {
        let {customerId,productId} = ctx.query
        if(!customerId || !productId){
            let err = new Error('Need more parameter')
            err.code = 401
            throw err
        }
        console.log(customerId,productId)
        try{
            let customerInfo = await Customer.updateOne({_id: customerId},{$pull:{customerHistory: {product: productId}}})
            console.log(customerInfo)
            if(customerInfo.n === 1 && customerInfo.ok === 1){
                ctx.body = 'done'
            }else{
                let err = new Error('Del failed')
                err.code = 404
                throw err
            }
        }catch(err){
            let newError = new Error(err)
            throw newError
        }
    }
}