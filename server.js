var sys = require("util")
  , ws = require('./node-websocket-server/lib/ws/server');

var Game = require('./game').Game
var game = new Game();
console.dir(game);

var server = ws.createServer({debug: true});


// Handle WebSocket Requests
server.addListener("connection", function(conn){
  conn.send(JSON.stringify({command:'id', value:conn.id, field: {x:100, y:100}}));
  game.connections.push(conn);
  game.numPlayers += 1;
  
  server.broadcast(JSON.stringify({command:"connected", value:conn.id}));

  conn.addListener("message", function(msg){
       try{
          var data = JSON.parse(msg);
          if (data.command === 'ready'){
            server.broadcast(JSON.stringify({command:"ready", value: {id:conn.id, username:data.username}}));
          }
          game.responses[conn.id] = data;
       } catch(e) {
           console.warn(e + 'dropping command for ' + conn.id + ' command: ' + msg);
       }
  });
});

server.addListener("error", function(){
  console.log(Array.prototype.join.call(arguments, ", "));
});

server.addListener("disconnect", function(conn){
  game.numPlayers -= 1;
  console.log('disconnect');
  server.broadcast("<"+conn.id+"> disconnected");
});



server.listen(8000, function() {
    setInterval(function() {
        var numPlayers = server.manager.length;
        var response = game.tick(numPlayers);
        if (response){
            server.broadcast(JSON.stringify(response));
        }
    }, 100);
});

