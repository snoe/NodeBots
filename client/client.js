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
    var StatsDialog = null;
    var ReadyPlayersDialog = null;

    var gameStats = null;
    var curPlayerId = null;
    var players = {};

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
            hideDialog("ReadyPlayersDialog");
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
        var label = document.createElement("div");
        label.setAttribute("class", "loginLabel");
        label.innerHTML = "name:";
        LoginDialog.appendChild(label);
        // Create text input
        loginInput = document.createElement("input");
        loginInput.setAttribute("id", "loginName");
        loginInput.setAttribute("type", "text");
        loginInput.setAttribute("class", "loginInput");
        loginInput.setAttribute("onkeypress", "if(arguments[0].keyCode===13 && value!==''){botclient.ready();}");
        LoginDialog.appendChild(loginInput);
        // Create login button
        var loginBtn = document.createElement("button");
        loginBtn.innerHTML = "PLAY";
        loginBtn.setAttribute("class", "loginBtn");
        loginBtn.setAttribute("onclick", "if(document.getElementById('loginName').value !== ''){botclient.ready();}");
        LoginDialog.appendChild(loginBtn);
    };

    var createStatsDialog = function() {
        // Create game stats dialog
        StatsDialog = createDialog({
            cssClass: "statsDialog",
            id: "StatsDialog"
        });

        var createStatsRow = function(data) {
            var newRow = document.createElement("div");
            newRow.setAttribute("class", "statsRow");
            newRow.innerHTML = '<div class="statName">'+data.name+'</div><div class="statValue">'+data.value+'</div>';
            return newRow;
        };

        var renderDivider = false;
        for (var i in players) {
            var aPlayer = gameStats.players[i];
            if (renderDivider) {
                var divider = document.createElement("div");
                divider.setAttribute("class", "statsRowDivider");
                StatsDialog.appendChild(divider);
            }
            StatsDialog.appendChild(createStatsRow({
                name: "PLAYER:",
                value: players[i].username
            }));
            StatsDialog.appendChild(createStatsRow({
                name: "STATUS:",
                value: aPlayer.alive ? "ALIVE" : "DEAD"
            }));
            StatsDialog.appendChild(createStatsRow({
                name: "KILLS:",
                value: aPlayer.kills
            }));
            StatsDialog.appendChild(createStatsRow({
                name: "SHOTS:",
                value: aPlayer.shots
            }));
            StatsDialog.appendChild(createStatsRow({
                name: "ACCURACY:",
                value: (aPlayer.kills ? Math.floor((100/(aPlayer.shots/aPlayer.kills))) : 0) + '%'
            }));
            renderDivider = true;
        }
    };

    var createReadyPlayersDialog = function() {
        ReadyPlayersDialog = createDialog({
            cssClass: "readyPlayersDialog",
            id: "ReadyPlayersDialog"
        });

        var createStatusRow = function(player) {
            var newRow = document.createElement("div");
            newRow.setAttribute("class", "statusRow");
            newRow.innerHTML = '<div class="playerName">'+player.name+'</div><div class="'+cssClass+'">'+player.status+'</div>';
            return newRow;
        };

        for (var i in players) {
            var username = "PLAYER [" + players[i].id + "]";
            var status = "WAITING ...";
            var cssClass = "playerStatus NotReady";
            if (players[i].username) {
                username = players[i].username;
                status = "READY";
                cssClass = "playerStatus Ready";
            }
            ReadyPlayersDialog.appendChild(createStatusRow({
                name: username,
                status: status,
                cssClass: cssClass
            }));
        }
    };

    var setupPlayer = function(player) {
        if (!playerImages[player.id]) {
            playerImages[player.id] = Math.floor(Math.random()*playerImages.length);
        }
    };

    var drawPlayer = function(player) {
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
        if (state) {
            gameStats = state;
        }
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
    };

    var onUserConnected = function(newUserId) {
        if (!newUserId) {
            return;
        }
        players[newUserId] = {
            id: newUserId,
            username: null
        };
        destroyDialog("ReadyPlayersDialog");
        showDialog("ReadyPlayersDialog");
    };

    var onUserReady = function(state) {
        if (state.id) {
            players[state.id] = state;
        }
        destroyDialog("ReadyPlayersDialog");
        showDialog("ReadyPlayersDialog");
    };

    var onGameOver = function() {
        showDialog("StatsDialog");
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
        getUsername: getUsername,
        setCurrentPlayerId: setCurrentPlayerId,
        onUserConnected: onUserConnected,
        onUserReady: onUserReady,
        onGameOver: onGameOver
    };
};