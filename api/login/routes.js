const Router = require('koa-router')
let api = new Router({ prefix: '/api/login' }) // 业务一级路由用复数
let Controllers = require('./controllers')

//下单人员
api.post('/',Controllers.loginMethod)

//配单人员
api.post('/order',Controllers.loginForOrderMethod)

module.exports = [api]