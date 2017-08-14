var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/chat', function(req, res){
  res.sendFile(__dirname+"/index.html");
});

app.get('/chat/main.css', function(req, res){
  res.sendFile(__dirname+"/main.css");
});

var online = {}; // 保存所有在线的用户昵称

function isUsed(newNickname){
    for(var id in online){
        if(online[id]!=="" && online[id]===newNickname){
            return true;
        }
    }
    return false;
}

function getIdByName(nickname){
    for(var id in online){
        if(online[id]!=="" && online[id]===nickname){
            return id;
        }
    }
    return null;
}

io.on("connection",function(socket){
    socket.broadcast.emit("user in","a user in");
    online[socket.id] = '';
    socket.on("nickname",function(nickname){
        if(isUsed(nickname)){
            socket.emit("nickname check","used");
        }else{
            socket.emit("nickname check","ok");
            online[socket.id] = nickname;
            console.log("new user");
            console.log(online);
            // 通知其他人
            io.emit("online",online);
        }
    });
    socket.on("disconnect",function(){
        if(socket.id in online){
            delete online[socket.id];
            console.log("user leave");
            console.log(online);
        }
        socket.broadcast.emit("user out","a user leave");
        io.emit("online",online);
    });
    socket.on("chat message",function(msg){
        socket.broadcast.emit("chat message",msg);
    });
    // 转发密语
    socket.on("whisper message",function(msg){
        var toId = getIdByName(msg.to);
        console.log("id: "+toId);
        io.sockets.sockets[toId].emit("whisper message",msg);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
