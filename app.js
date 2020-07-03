const Koa = require('koa');
const app = new Koa();
const {port} = require('./config/index')()
const registerRouter  = require('./api/index')
const database = require('./db/index')
const MidConfig = require('./middleware/mid-config')

startMethod()
async function startMethod(){
    try{
        app.use(MidConfig())
        app.use(registerRouter())
        let connectInfo = await database.connect()
        console.log(connectInfo)
        app.listen(port,() => console.log(`Start listening for the request at ${port}`));
    }catch(err){
        console.log(err)
    }
}
