var app = {};
var connections = [];
// Need to know initial state to which apply all the following updates
var initialState = { type: 'textField', id: 'ta-dcr', data: "A(0,0,0)        \nB(0,1,1)        \nA -->* B\nB *--> A\nC -->% A\nD -->+ A    \nD -->* B\nA --><> (B, D)    \n  " }
var updates = [initialState];
app.peer = new Peer();

// When peerjs server is down, you can use your own!
// https://github.com/peers/peerjs-server#run-server

// app.peer = new Peer(undefined, {
//     host: 'localhost',
//     port: 9000,
//     path: '/myapp'
// });
var connected = false;
var server = false;
var client = false;
const connCheckDelayTimeMs = 300;
var myId = null;

//Set my id
app.peer.on('open', function (id) {
    myId = id;
    handleNewUser(myId, true)
    document.getElementById('my-id').innerHTML =
        "<div>My ID: </div>" +
        "<div>" + id + "</div><br/>";
});

//Client part
function connect() {
    app.conn = app.peer.connect(document.getElementById('peer-input-id').value);
    //Connect to server
    app.conn.on('open', function () {
        if (!connected && !server) {
            // console.log("Client: New Connection");
            connections.push(app.conn);
            handleNewUser(app.conn.peer, false)
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
            // console.log("Client: Received server data");
            updates.push(data);
            //Execute update but DO NOT update others
            executeUpdateEvent(data, false)
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
                // console.log("Server: New Connection");
                connections.push(c);
                handleNewUser(c.peer, true)
                //Only for the first connection
                if (!connected) {
                    document.getElementById('conn-status').innerHTML = "Connection established as Server";
                    server = true;
                    connBlockStatus(false);
                    connected = true;
                    //Start async connection checker
                    connectionChecker();
                }
                //Get the client up to date (make him apply all the changes we had)
                sendUpdates(c);
            }
        });
        //Receive client data
        app.conn.on('data', function (data) {
            if (connected && !client) {
                // console.log("Server: Received client data");
                updates.push(data);
                //Execute update AND update others
                executeUpdateEvent(data, true);
            }
        });
    });

function sendUpdates(c) {
    updates.forEach(event => {
        if (c && c.open) c.send(event);
    })
}

function updateOthers(stateUpdate) {
    //Push update to updates list
    updates.push(stateUpdate);

    if (connections.length > 0) {
        connections.forEach(c => {
            // console.log("Update sent")
            if (c && c.open) c.send(stateUpdate);
        });
    }
}

function executeUpdateEvent(data, updateOthers = false) {
    if (data.type == 'textField') {
        document.getElementById(data.id).value = data.data;
        handleTextAreaChange(updateOthers);
    } else if (data.type == 'eventButton') {
        handleEventButtonClick(data.id, updateOthers);
    } else if (data.type == 'manualSimButton') {
        handleManualSimButtonClick(data.id, updateOthers)
    } else if (data.type == 'newUser') {
        //Add only if not in array
        if (!sim.users.some(user => user.id === data.id)) {
            sim.addUsers(new User(data.id));
        }
    }
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