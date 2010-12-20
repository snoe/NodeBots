var Game = function() {
    this.connections = [];
    this.responses = {};
    this.gameStarted = false;
    this.gameOver = false;
    this.turns = 0;
    this.state = {};
    this.game = {};
    this.colors = ['green', 'red', 'orange', 'blue', 'yellow', 'black'];
}

Game.prototype.buildState = function() {
    var newState = {players: {}};
    this.connections.forEach(function(conn){
        this.addPlayer(conn);
    },this);
    return newState;
}

Game.prototype.addPlayer = function(conn) {
    var x = Math.floor(Math.random() * 100);
    var y = Math.floor(Math.random() * 100);
    var color = this.colors.pop()
    this.state.players[conn.id] = {id: conn.id, x: x, y: y, alive: true, kills: 0, shots: 0, color: color, bullets: []}
    this.game[x+','+y] = conn.id;
}

Game.prototype.handleMove = function(player, state, value) {
  var originalX = player.x;
  var originalY = player.y;
  if (value == 'west') {
      player.x += 1;
      if (player.x > 99){
          player.x = 99;
      }
  }
  if (value == 'south') {
      player.y += 1;
      if (player.y > 99){
          player.y = 99;
      }
  }
  if (value == 'east') {
      player.x -= 1;
      if (player.x < 0){
          player.x = 0;
      }
  }
  if (value == 'north') {
      player.y -= 1;
      if (player.y < 0){
          player.y = 0;
      }
  }

  var prevpos = originalX+','+originalY
  var nextpos = player.x+','+player.y;

  var collision = this.game[nextpos];
  if (!collision){
      delete this.game[prevpos]; 
      this.game[nextpos] = {object:player, type:'player', id: player.id}; 
  } else {
      if (collision.type == 'player'){
        collision.object.alive = false;
      } 
      player.alive = false;
  }
}

Game.prototype.handleShoot = function(player, state, value) {
   player.shots += 1;
   var bullet = {dir: value, x: player.x, y:player.y};
   player.bullets.push(bullet);
}

Game.prototype.simulate = function(responses, old) {
    console.dir(responses);
    console.log('xxx');
    console.dir(old);
    // clone
    var state = JSON.parse(JSON.stringify(old));
    
    // process commands
    for (var cid in responses) {
           var resp = responses[cid];
           var player = state.players[cid];
           if (player.alive){
               if (resp.action == 'move') {
                   this.handleMove(player, state, resp.value);
               }
               if (resp.action == 'shoot') {
                   this.handleShoot(player, state, resp.value);
               }
           }
    }
    // loop over bullets
    for (var cid in state.players) {
        var player = state.players[cid];
        player.bullets.forEach(function(bullet) {
           for (var x = 0; x < 3; x++) {
               if (bullet.dir == 'west') {
                    bullet.x = bullet.x += 1;
               }
               if (bullet.dir == 'south') {
                    bullet.y = bullet.y += 1;
               }
               if (bullet.dir == 'east') {
                    bullet.x = bullet.x -= 1;
               }
               if (bullet.dir == 'north') {
                    bullet.y = bullet.y -= 1;
               }

               var collision = this.game[bullet.x+','+bullet.y];
               if (collision) {
                   if (collision.type == 'player'){
                     if (collision.object.alive) {
                         player.kills += 1;
                     }
                     collision.object.alive = false;
                   }
               }
           }
        }, this);
        player.bullets = player.bullets.filter(function(bullet){
            return !(bullet.x > 99 || bullet.x < 0 || bullet.y > 99 || bullet.y <0);
        });
    }
    return state;
}

Game.prototype.onEnd = function() {
    this.gameOver = true;
    console.log('GAME OVER');
}

Game.prototype.onTurn = function() {
    this.turns += 1;
    console.log('turn: ' + this.turns);
    this.state = this.simulate(this.responses, this.state);
}

Game.prototype.onStart = function() {
    console.log('begin game');
    this.gameStarted = true;
    this.turns = 0;
    this.state = this.buildState();
}

Game.prototype.numResponses = function() {
    var size = 0;
    for(var response in this.responses) {
        if (this.responses.hasOwnProperty(response)){
            size += 1;
        }
    }
    return size;
}

Game.prototype.allReceived = function(numPlayers) {
    return !this.gameOver && numPlayers && this.numResponses() == numPlayers;
}

Game.prototype.tick = function(numPlayers) {
    if (!this.allReceived(numPlayers)) {
        return;
    }

    if (!this.gameStarted) {
        this.onStart();
        this.responses = {}
        return {command:'state', value: this.state};
    }

    if (this.turns == 100){
        this.onEnd();
        return {command:'gameover'};
    }
        
    this.onTurn();
    this.responses = {}
    return {command:'state', value: this.state};
}


exports.Game = Game;
