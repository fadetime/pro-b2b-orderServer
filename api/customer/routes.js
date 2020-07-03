const Router = require('koa-router')
let api = new Router({ prefix: '/api/customer' }) // 业务一级路由用复数
let Controllers = require('./controllers')

api.get('/',Controllers.findCustomer)
api.get('/check',Controllers.checkCustomerNumber)
api.post('/history',Controllers.getOrderHistory)
api.delete('/history',Controllers.delOrderHistory)

module.exports = [api]