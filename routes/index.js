let express = require('express');
let router = express.Router();
let WebSocket = require("ws")
let WebSocketServer = WebSocket.Server;
let wss = new WebSocketServer({ port: 80 })
let SocketUtil = require("./socketUtil")
const config = require("../config")
const {RDS_PORT, RDS_HOST, RDS_OPTS} = config.redis

let redis = require('redis'),
    redisClient = redis.createClient();

let rooms = {};

//初始化聊天记录
// redisClient.set("chatHistory", JSON.stringify([]), redis.print);

//有连接加入时
wss.on('connection', function (ws, a, b) {
    console.log("有用户加入连接")
    const socketUtil = new SocketUtil(ws,rooms,redisClient);

    ws.on("message", function (msg) {
        console.log(`收到消息：${msg}`)
        let msgObj = JSON.parse(msg)
        let roomName = ws.roomName

        //加入聊天室
        if (msgObj.type === "joinRoom") {
            socketUtil.joinRoom(msgObj)
            return;
        } else if (msgObj.type === "sendMsg") {
            //保存聊天信息
            msg = socketUtil.saveMsg(msgObj);
            //群发
            socketUtil.sendToRoom(roomName, msg)
        } else if (msgObj.type === "revertMsg") {
            //删除消息
            socketUtil.delMsg(msgObj);
            socketUtil.sendSysInfo(roomName, `${ws.username}撤回了一条消息`, msgObj.msgId + "---" + msgObj.username, "revertMsg")
        }
    });


    ws.on("close", function () {
        socketUtil.leaveRoom(ws)
    })
});



module.exports = router;
