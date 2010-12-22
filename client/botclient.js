botclient = function() {
    var scr = document.createElement('canvas');
    var gameClt = null;
    var curPlayerId = null;
    var ws = null;

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


    var renderTo = function(containerId) {
        var container = document.getElementById(containerId);
        container.style.margin="0px";
        container.style.padding="0px;";
        scr.setAttribute("width", container.clientWidth - 300);
        scr.setAttribute("height", container.clientHeight);
        gameClt = client(scr);
        container.appendChild(scr);
    };

    var ready = function() {
        ws = new WebSocket("ws://" + gameClt.getServerName());
        ws.onopen = function(evt) {
            console.log('Connected');
        }

        ws.onmessage = function(evt) {
            var data = JSON.parse(evt.data);
            switch (data.command) {
            case "id":
                console.log('received:', data.command);
                curPlayerId = data.value;
                gameClt.setCurrentPlayerId(curPlayerId);
                ws.send(JSON.stringify({ command: "ready", username: gameClt.getUsername() }));
                break;
            case "state":
                gameClt.update(data.value);
                if (data.value.players[curPlayerId].alive) {
                    var action = onState(data.value);
                    ws.send(JSON.stringify({command: 'action', value: action}));
                }
                break;
            }
        };
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

    var getPlayerId = function() {
        return curPlayerId;
    };

    init();

    return {
        getPlayerId: getPlayerId,
        renderTo: renderTo,
        ready: ready,
        onState: setOnState,
        randomize: randomize,
    };
}();
