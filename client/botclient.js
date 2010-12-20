botclient = function() {
    var ws = new WebSocket("ws://curvedev:8000");
    var scr = document.createElement('canvas');
    var gameClt = null;
    var curPlayerId = null;

    var getPossibleActions = function() {
        return ['move', 'shoot'];
    };

    var getPossibleDirections = function() {
        return ['west', 'east', 'north', 'south'];
    };

    var onState = function(stateInfo) {};

    var setOnState = function(callback) {
        onState = callback;
    };

    var init = function() {
        var jsIncl = document.createElement('script');
        jsIncl.setAttribute("type", "text/javascript");
        jsIncl.setAttribute("src", "client.js");
        document.head.appendChild(jsIncl);
    };

    ws.onmessage = function(evt) {
        var data = JSON.parse(evt.data);
        switch (data.command) {
        case "id":
            curPlayerId = data.value;
            gameClt.setCurrentPlayerId(curPlayerId);
            break;
        case "state":
            gameClt.update(data.value);
            ws.send(JSON.stringify(onState(data.value)));
            break;
        case "gameover":
            gameClt.onGameOver();
            break;
        case "connected":
            gameClt.onUserConnected(data.value);
            break;
        case "ready":
            gameClt.onUserReady(data.value); // { command: "ready", id: ID, username: USERNAME }
            break;
        }
    };

    var renderTo = function(containerId) {
        var container = document.getElementById(containerId);
        container.style.margin="0px";
        container.style.padding="0px;";
        scr.setAttribute("width", container.clientWidth);
        scr.setAttribute("height", container.clientHeight);
        gameClt = client(scr);
        container.appendChild(scr);
    };

    var ready = function() {
        ws.send(JSON.stringify({ command: "ready", username: gameClt.getUsername() }));
    };

    var randomize = function(arr) {
        // Fisher-Yates algorithm for random shuffling the array
        var n = arr.length;
        for (var i=n-1; i>0; i--) {
            var j = Math.floor(Math.random()*(i+1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr[0];
    };

    var getRandomBehaviour = function() {
        return {
            action: randomize(getPossibleActions()),
            value: randomize(getPossibleDirections())
        };
    };

    init();

    return {
        renderTo: renderTo,
        ready: ready,
        onState: setOnState,
        getRandomBehaviour: getRandomBehaviour,
        getPossibleActions: getPossibleActions,
        getPossibleDirections: getPossibleDirections
    };
}();
