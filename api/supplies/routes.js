const Router = require('koa-router')
let api = new Router({ prefix: '/api/supplies' }) // 业务一级路由用复数
let Controllers = require('./controllers')

api.get('/',Controllers.getSupplies)

module.exports = [api]