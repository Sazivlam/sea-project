var app = {};
var connections = [];
app.peer = new Peer();
var connected = false;
var server = false;
var client = false;
const connCheckDelayTimeMs = 300;

//Set my id
app.peer.on('open', function (myId) {
    document.getElementById('my-id').innerHTML =
        "<div>My ID: </div>" +
        "<div>" + myId + "</div><br/>";
});

//Client part
function connect() {
    app.conn = app.peer.connect(document.getElementById('peer-input-id').value);
    //Connect to server
    app.conn.on('open', function () {
        if (!connected && !server) {
            // console.log("Outcoming open");
            connections.push(app.conn);
            //Only for the first connection
            if (!connected) {
                document.getElementById('conn-status').innerHTML = "Connection established as Client";
                client = true;
                connBlockStatus(false);
                connected = true;
                //Start async connection checker
                connectionChecker();
            }
        }
    });
    //Receive server data
    app.conn.on('data', function (data) {
        if (connected && !server) {
            console.log("Outcoming data");
            document.getElementById('ta-dcr').value = data;
            handleTextAreaChange();
        }
    });
}

//Server part
app.peer.on('connection',
    function (c) {
        app.conn = c;
        //New client connects
        app.conn.on('open', function (incomingPeerId) {
            // console.log("New client connects");
            if (!client) {
                // console.log("Incoming open");
                connections.push(c);
                //Only for the first connection
                if (!connected) {
                    document.getElementById('conn-status').innerHTML = "Connection established as Server";
                    server = true;
                    connBlockStatus(false);
                    connected = true;
                    //Start async connection checker
                    connectionChecker();
                }
                updateOthers();
            }
        });
        //Receive client data
        app.conn.on('data', function (data) {
            if (connected && !client) {
                // console.log("Incoming data");
                document.getElementById('ta-dcr').value = data;
                handleTextAreaChange();
                //Update all clients
                if (server) {
                    updateOthers();
                }
            }
        });
    });

function updateOthers() {
    console.log("send message")
    var newmes = document.getElementById('ta-dcr').value;
    connections.forEach(c => {
        if (c && c.open) c.send(newmes);
    });

}
function connBlockStatus(status) {
    if (status) {
        //When every connection is lost
        document.getElementById('conn-status').style.display = "none";
        document.getElementById('peer-input-block').style.display = "block";
        document.getElementById('conn-list').style.display = "none";
        document.getElementById('server-id').style.display = "none";
    } else {
        //When first connection established
        document.getElementById('conn-status').style.display = "block";
        document.getElementById('peer-input-block').style.display = "none";
        if (server) {
            document.getElementById('conn-list').style.display = "block";
        } else {
            document.getElementById('server-id').style.display = "block";
        }
    }
}
function updateConnectionList() {
    var connectionListString = [];
    if (server) {
        connectionListString.push("<div>Clients:</div>")
        connections.forEach(c => {
            connectionListString.push("<div>" + c.peer + "</div>")
        })
        document.getElementById('conn-list').innerHTML = connectionListString.join('') + "<br/>";
    } else {
        connectionListString.push("<div>Server ID: </div>")
        connections.forEach(c => {
            connectionListString.push("<div>" + c.peer + "</div>")
        })
        document.getElementById('server-id').innerHTML = connectionListString.join('') + "<br/>";
    }
}

async function connectionChecker() {
    // console.log("check");
    if (connections.length == 0) {
        connected = false;
        server = false;
        client = false;
        connBlockStatus(true);
    } else {
        var newConnections = [];
        connections.forEach(c => {
            if (c && c.open) {
                newConnections.push(c);
            }
        });
        connections = newConnections;
        updateConnectionList();
        //Run again only if there are active connections
        if (connected) {
            setTimeout(connectionChecker, connCheckDelayTimeMs);
        }
    }
}