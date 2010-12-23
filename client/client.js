client = function(scr) {
    var ctx = null;
    var numOfCells = 100;
    var cellWidth = scr.width/numOfCells;
    var cellHeight = scr.height/numOfCells;
    var radius = Math.round(Math.sqrt((Math.pow(cellWidth,2)+Math.pow(cellHeight,2))));
    var background = new Image();
    var playerColors = ['green', 'red', 'orange', 'blue', 'yellow', 'black'];
    var playerImages = [];
    var weaponImages = [];
    var playerWeapons = {};

    var LoginDialog = null;
    var loginInput = null;

    var curPlayerId = null;

    var init = function() {
        ctx = scr.getContext("2d");
        setupScreen();
    };

    var setupScreen = function(state) {
        background.onload = function() {
            ctx.drawImage(background, 0, 0, scr.width, scr.height);
            showDialog("LoginDialog");
            refreshScreen(state);
        };

        if (!background.src) {
            background.src = "images/theme2.jpg";
            for (var i=1; i<=6; i++) {
                var newImg = new Image();
                newImg.src = "images/weapon"+i+".png";
                weaponImages.push(newImg);
            }
            for (var i=2; i<=3; i++) {
                var newImg = new Image();
                newImg.src = "images/ship"+i+".png";
                playerImages.push(newImg);
            }
        } else {
            hideDialog("LoginDialog");
            ctx.drawImage(background, 0, 0, scr.width, scr.height);
            refreshScreen(state);
        }
    };

    var createDialog = function(attributes) {
        var newDialog = document.createElement("div");
        newDialog.setAttribute("class", "dialog " + attributes.cssClass);
        newDialog.setAttribute("id", attributes.id);
        scr.parentNode.appendChild(newDialog);
        return newDialog;
    };

    var destroyDialog = function(dialogName) {
        var dialog = eval(dialogName);
        if (!dialog) {
            return;
        }
        eval(dialogName + " = null;");
        var domNode = document.getElementById(dialogName);
        if (domNode) {
            domNode.parentNode.removeChild(domNode);
        }
    };

    var showDialog = function(dialogName) {
        var dialog = eval(dialogName);
        if (!dialog) {
            eval("create" + dialogName + "()");
            dialog = eval(dialogName);
        }
        dialog.style.top = (scr.offsetTop+scr.height-dialog.offsetHeight)/2+'px';
        dialog.style.left = (scr.offsetLeft+scr.width-dialog.offsetWidth)/2+'px';
        dialog.style.display = "block";
    };

    var hideDialog = function(dialogName) {
        var dialog = eval(dialogName);
        if (!dialog) {
            return;
        }
        dialog.style.display = "none";
    };

    var createLoginDialog = function() {
        // Create Loing prompt dialog
        LoginDialog = createDialog({
            cssClass: "loginDialog",
            id: "LoginDialog"
        });

        // Create label
        var serverLabel = document.createElement("div");
        serverLabel.setAttribute("class", "loginLabel");
        serverLabel.innerHTML = "server:port :";
        LoginDialog.appendChild(serverLabel);

        loginServer = document.createElement('input');
        loginServer.setAttribute("id", "loginServer");
        loginServer.setAttribute("value", "localhost:8000");
        loginServer.setAttribute("type", "text");
        loginServer.setAttribute("class", "loginInput");
        LoginDialog.appendChild(loginServer);

        LoginDialog.appendChild(document.createElement('br'));
        // Create label
        var label = document.createElement("div");
        label.setAttribute("class", "loginLabel");
        label.innerHTML = "name:";
        LoginDialog.appendChild(label);
        // Create text input
        loginInput = document.createElement("input");
        loginInput.setAttribute("id", "loginName");
        loginInput.setAttribute("type", "text");
        loginInput.setAttribute("class", "loginInput");
        LoginDialog.appendChild(loginInput);
        // Create login button
        var loginBtn = document.createElement("button");
        loginBtn.innerHTML = "PLAY";
        loginBtn.setAttribute("class", "loginBtn");
        loginBtn.setAttribute("onclick", "if(document.getElementById('loginName').value !== ''){botclient.ready();}");
        LoginDialog.appendChild(loginBtn);
    };

    var setupPlayer = function(player) {
        if (!playerImages[player.id]) {
            playerImages[player.id] = Math.floor(Math.random()*playerImages.length);
        }
    };

    var drawPlayer = function(player) {
        if (player.alive) {
            var xCoord = player.x*cellWidth;
            var yCoord = player.y*cellHeight;
            ctx.strokeStyle = "rgba(250,0,0,0.3)";
            if (player.id===curPlayerId) {
                for (var i=radius; i>0; i--) {
                    ctx.beginPath();
                    ctx.arc(xCoord, yCoord, i, 0, Math.PI*2, false);
                    i===radius ? ctx.stroke() : ctx.fill();
                    ctx.fillStyle = "rgba(250,250,250,"+1/radius+")";
                }
            }
            ctx.drawImage(player.image, xCoord-cellWidth, yCoord-cellHeight, cellWidth*2, cellHeight*2);
        }
    };

    var assignWeapon = function(player) {
        if (!playerWeapons[player.id]) {
            playerWeapons[player.id] = Math.floor(Math.random()*weaponImages.length);
        }
    };

    var drawBullet = function(player, bullet) {
        var bX = bullet.x*cellWidth;
        var bY = bullet.y*cellHeight;
        var bWidth = cellWidth;
        var bHeight = cellHeight*3;

        assignWeapon(player);
        ctx.save();
        switch (bullet.dir) {
        case "north":
            ctx.translate(bX-(bWidth/2), bY);
            break;
        case "south":
            ctx.rotate(Math.PI);
            ctx.translate(-(bX+(bWidth/2)), -bY);
            break;
        case "east":
            ctx.rotate(Math.PI*3/2);
            ctx.translate(-(bY+(bWidth/2)), bX);
            break;
        case "west":
            ctx.rotate(Math.PI/2);
            ctx.translate(bY-(bWidth/2), -bX);
            break;
        }
        ctx.drawImage(weaponImages[playerWeapons[player.id]], 0, 0, bWidth, bHeight);
        ctx.restore();
        ctx.save();
    };

    var update = function(state) {
        setupScreen(state);
    };

    var refreshScreen = function(state) {
        if (!state) {
            return;
        }
        for (var i in state.players) {
            var player = state.players[i];

            function findColorIndex(color) {
                for (var i=0; i<playerColors.length; i++) {
                    if (playerColors[i] === color) {
                        return i;
                    }
                }
            };

            for (var i=0; i<playerColors.length; i++) {
                player.image = playerImages[(findColorIndex(player.color) % playerImages.length)];
            }

            drawPlayer(player);
            for (var j in player.bullets) {
                drawBullet(player, player.bullets[j]);
            }
        };
        updateStats(state);
    };

    var updateStat = function(pl, order) {
        var div = document.getElementById(pl.id);
        if (!div) {
            div = document.createElement('div');

            div.setAttribute('id', pl.id);
            document.getElementById('statHolder').appendChild(div);
        }
        div.setAttribute('class', 'stat ' + (pl.alive ? "ALIVE" : "DEAD"));
        div.setAttribute('style', '-webkit-box-ordinal-group: ' +order +';');
        div.innerHTML = "Player: " + pl.username +
                        "<br>Kills: " + pl.kills + 
                        "<br>Shots: " + pl.shots +
                        "<br>DOB: " + pl.dob +
                        "<br>" + (pl.alive ? "ALIVE" : "DEAD");

    };

    var updateStats = function(state) {
        var mypl = state.players[curPlayerId];
        updateStat(mypl, 1);

        var players = [];
        for (var pid in state.players) {
            var pl = state.players[pid];
            players.push(pl);
        }
        players.sort(function(a,b) {
            if (a.dob > b.dob) {
            return -1;
            } else if (b.dob > a.dob) {
            return 1;
            }
            return 0;
        });	
        for (var j=0; j<players.length; j++){
            var pl = players[j];
            if (pl.id === curPlayerId) {
                continue;
            }
            updateStat(pl, j);
        }

    };

    var getServerName = function() {
        return loginServer.value;
    };
    var getUsername = function() {
        return loginInput.value;
    };

    var setCurrentPlayerId = function(id) {
        curPlayerId = id;
    };

    init();

    return {
        update: update,
        getServerName: getServerName,
        getUsername: getUsername,
        setCurrentPlayerId: setCurrentPlayerId,
    };
};
