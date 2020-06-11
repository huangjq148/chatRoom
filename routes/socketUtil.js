let dayjs = require("dayjs");
let redis = require('redis');

class SocketUtil {
    constructor(ws,rooms,redisClient) {
        this.ws = ws
        this.rooms = rooms
        this.redisClient = redisClient
    }

    /**
     * 用户离开聊天室
     */
    leaveRoom() {
        const { roomName, username } = this.ws
        this.rooms[roomName] = this.rooms[roomName].filter(item => {
            return item !== this.ws;
        })
        this.sendSysInfo(roomName, `【${username}】离开了聊天室,当前聊天室还有${this.rooms [roomName].length}个人`)
    }

    /**
     * 保存聊天记录
     * @param {*} msgObj 消息内容
     */
    saveMsg(msgObj) {
        const _this = this;
        const { username, roomName } = _this.ws
        msgObj = {
            username,
            roomName,
            id: dayjs().format('YYYYMMDDHHmmssSSS'),
            sendTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            ...msgObj
        }

        const msg = JSON.stringify(msgObj)

        _this.redisClient.get(`${roomName}ChatHistory`, function (err, reply) {
            //取出历史聊天记录
            let history = JSON.parse(reply)
            // console.log(history)
            //将新的消息加入聊天记录
            history[msgObj.id] = msg
            //保存聊天记录
            _this.redisClient.set(`${roomName}ChatHistory`, JSON.stringify(history), redis.print);
        });
        return msg;
    }

    /**
     * 撤回消息
     * @param {*} msgObj 消息内容
     */
    delMsg(msgObj, ) {
        const msgId = msgObj.msgId;
        const roomName = this.ws.roomName;
        const _this = this;
        _this.redisClient.get(`${roomName}ChatHistory`, function (err, reply) {
            //取出历史聊天记录
            let history = JSON.parse(reply);
            //删除记录
            delete history[msgObj.msgId];
            //保存聊天记录
            _this.redisClient.set(`${roomName}ChatHistory`, JSON.stringify(history), redis.print);
        })
    }

    /**
     * 初始化socket连接信息
     */
    initWsInfo(info) {
        for (let key in info) {
            this.ws[key] = info[key]
        }
    }

    /**
     * 加入聊天室
     * @param {*} msgObj 消息内容
     */
    joinRoom(msgObj) {
        //房间名,用户名
        const { roomName, username } = msgObj
        const _this = this;

        ///如果聊天室不存在，则创建一个
        if (!_this.rooms [roomName]) {
            _this.rooms [roomName] = [];
        }

        //设置连接的信息（加入的房间，用户名）
        _this.initWsInfo({ roomName, username })

        //将用户加到对应聊天室中
        _this.rooms [roomName].push(_this.ws)

        //取出历史聊天记录，发送给当前登录的用户
        _this.redisClient.get(`${roomName}ChatHistory`, function (err, reply) {
            //如果取出来的是空的，则初始化聊天记录
            if (reply === null) {
                _this.redisClient.set(`${roomName}ChatHistory`, JSON.stringify({}), redis.print);
                return;
            }
            let history = JSON.parse(reply)
            for (let key in history) {
                _this.ws.send(history[key])
            }
            _this.ws.send(JSON.stringify({
                username: "系统消息",
                type: 'systemInfo',
                content: `欢迎加入[${roomName}]聊天室`
            }))
        })

        _this.sendSysInfo(roomName, `欢迎【${username}】加入聊天室,当前聊天室有${this.rooms [roomName].length}个人`)
    }

    /**
     * 发送系统消息
     * @param {*} roomName 聊天室名称
     * @param {*} content 消息内容
     * @param {*} otherInfo 其它信息
     * @param {*} action 操作类型 ['revertMsg']
     */
    sendSysInfo(roomName, content, otherInfo, action) {
        this.sendToRoom(roomName, JSON.stringify({
            username: "系统消息",
            type: "systemInfo",
            action,
            content: content,
            otherInfo,
            totalUser: this.rooms [roomName].length
        }))
    }

    /**
     * 群发到指定聊天室
     * @param { String } roomName 聊天室名称
     * @param { Object } msg 消息内容
     */
    sendToRoom(roomName, msg) {
        this.rooms[roomName].forEach(function each(client) {
            if (client.readyState === 1) {
                client.send(msg);
            }
        });
    }
}

module.exports = SocketUtil;