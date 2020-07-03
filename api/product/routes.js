const Router = require('koa-router')
let api = new Router({ prefix: '/api/product' }) // 业务一级路由用复数
let Controllers = require('./controllers')

api.get('/',Controllers.getSomeProduct)
api.post('/search',Controllers.searchProduct)

module.exports = [api]