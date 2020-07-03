const Router = require('koa-router')
let api = new Router({ prefix: '/api/staff' }) // 业务一级路由用复数
let Controllers = require('./controllers')

api.post('/change',Controllers.changePassword)

module.exports = [api]