var Game = function() {
    this.responses = {};
    this.game = {};
    this.colors = ['green', 'red', 'orange', 'blue', 'yellow', 'black'];
    this.state = this.buildState();
    this.turns = 0;
}

Game.prototype.buildState = function() {
    var newState = {players: {}};
    return newState;
}

Game.prototype.addPlayer = function(conn) {
    var x = Math.floor(Math.random() * 100);
    var y = Math.floor(Math.random() * 100);
    if (this.colors.length) {
        var color = this.colors.pop()
    } else {
        this.colors = ['green', 'red', 'orange', 'blue', 'yellow', 'black'];
        var color = this.colors.pop();
    }
    this.state.players[conn.id] = {id: conn.id, x: x, y: y, alive: true, kills: 0, shots: 0, color: color, dob: this.turns, bullets: []}
    this.game[x+','+y] = conn.id;
}

Game.prototype.removePlayer = function(conn) {
    var pl = this.state.players[conn.id]
    if (this.game[pl.x+','+pl.y]) {
        delete this.game[pl.x+','+pl.y];
    }
    this.state.players[conn.id].alive = false;
}

Game.prototype.handleMove = function(player, state, value) {
  var originalX = player.x;
  var originalY = player.y;
  if (value == 'east') {
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
  if (value == 'west') {
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
  if (!collision || collision === player.id){
      delete this.game[prevpos]; 
      this.game[nextpos] = player.id; 
  } else {
      state.players[collision].alive = false;
      player.alive = false;
      console.log('#'+this.turns + ': ' + player.username + " ran into " + state.players[collision].username);
      delete this.game[prevpos];
      delete this.game[nextpos];
  }
}

Game.prototype.handleShoot = function(player, state, value) {
   if (value) {
       player.shots += 1;
       var bullet = {dir: value, x: player.x, y:player.y};
       player.bullets.push(bullet);
   }
}

Game.prototype.simulate = function(responses, old) {
    this.turns += 1;
    // clone
    var state = JSON.parse(JSON.stringify(old));
    
    // process commands
    for (var cid in responses) {
           var resp = responses[cid];
           var player = state.players[cid];
           if (player.alive){
               if (resp && resp.action) {
                   if (resp.action == 'move') {
                       this.handleMove(player, state, resp.value);
                   }
                   if (resp.action == 'shoot') {
                       this.handleShoot(player, state, resp.value);
                   }
               }
           }
    }
    // loop over bullets kill old players
    for (var cid in state.players) {
        var player = state.players[cid];
        player.bullets.forEach(function(bullet) {
           for (var x = 0; x < 3; x++) {
               if (bullet.dir == 'west') {
                    bullet.x -= 1;
               }
               if (bullet.dir == 'south') {
                    bullet.y += 1;
               }
               if (bullet.dir == 'east') {
                    bullet.x += 1;
               }
               if (bullet.dir == 'north') {
                    bullet.y -= 1;
               }

               var collision = this.game[bullet.x+','+bullet.y];
               if (collision && collision !== player.id) {
                     if (state.players[collision].alive) {
                         player.kills += 1;
                         console.log('#'+this.turns + ': ' + player.username + " killed " + state.players[collision].username);
                     }
                     state.players[collision].alive = false;
                     delete this.game[bullet.x+','+bullet.y];
               }
           }
        }, this);
        player.bullets = player.bullets.filter(function(bullet){
            return !(bullet.x > 99 || bullet.x < 0 || bullet.y > 99 || bullet.y <0);
        });
        /*
        if (player.alive && (this.turns - player.dob >= 1000)) {
            player.alive = false;
            console.log('#'+this.turns + ': ' + player.username + " died of old age"); 
        }
        */
    }
    return state;
}

Game.prototype.onTurn = function() {
    this.state = this.simulate(this.responses, this.state);
}

Game.prototype.tick = function() {
    this.onTurn();
    this.responses = {}
    return {command:'state', value: this.state};
}


exports.Game = Game;
