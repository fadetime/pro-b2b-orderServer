const Router = require('koa-router')
let api = new Router({ prefix: '/api/order' }) // 业务一级路由用复数
let Controllers = require('./controllers')
//下单客户端用
api.post('/',Controllers.createOrder)
api.get('/last',Controllers.lastOrder)

//配单客户端用
api.get('/waiting',Controllers.getWaitingOrder)
api.post('/orderDetail', Controllers.getOrderDetail)
api.get('/orderArray', Controllers.getOrderArray)
api.post('/finish',Controllers.finishOrder)
api.post('/changeStatus', Controllers.changeOrderStatus)//配单员获取订单
api.get('/processing', Controllers.getProcessingOrder)
api.get('/finish', Controllers.getFinishOrder)

module.exports = [api]