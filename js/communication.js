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
    user = new User(myId, "server", ["Robot", "Human"])
    handleNewUser(user, true, myId)
    document.getElementById('my-id').innerHTML =
        "<div>My ID: </div>" +
        "<div id=id_num>" + myId + "</div><br/>";
        localStorage.setItem("myID", myId); 
});



//Client part
function connect() {
    app.conn = app.peer.connect(document.getElementById('peer-input-id').value);
    //Connect to server
    app.conn.on('open', function () {
        if (!connected && !server) {
            // console.log("Client: New Connection");
            connections.push(app.conn);
            handleNewUser(new User(app.conn.peer, "server",  ["Robot", "Human"]), false, myId)
            //Only for the first connection
            if (!connected) {
                document.getElementById('conn-status').innerHTML = "Connection established as Client";
                document.getElementById('btn-time').style.display = "none";
                document.getElementById('btn-start-sim').style.display = "none";
                document.getElementById('btn-stop-sim').style.display = "none";
                document.getElementById('btn-start-manual-sim').style.display = "none";
                document.getElementById('btn-stop-manual-sim').style.display = "none";
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
            // console.log(JSON.stringify(data))
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
                handleNewUser(new User(c.peer), true)
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
                executeUpdateEvent(data, true, app.conn.peer);
            }
        });
    });

function sendUpdates(c) {
    if (c && c.open) c.send({ type: 'updateHistory', data: updates });
}

function updateOthers(stateUpdate, excludeFromUpdate = null) {
    //Push update to updates list
    updates.push(stateUpdate);

    if (connections.length > 0) {
        connections.forEach(c => {
            // console.log("Update sent")
            if (c && c.open && excludeFromUpdate != c.peer) c.send(stateUpdate);
        });
    }
}

function executeUpdateEvent(data, updateOthers = false, excludeFromUpdate = null) {
    if (data.type == 'textField') {
        document.getElementById(data.id).value = data.data;
        handleTextAreaChange(updateOthers, excludeFromUpdate);
    } else if (data.type == 'eventButton') {
        handleEventButtonClick(data.id, updateOthers, excludeFromUpdate);
    } else if (data.type == 'manualSimButton') {
        handleManualSimButtonClick(data.id, updateOthers, excludeFromUpdate)
    } else if (data.type == 'newUser') {
        //Add only if not in array
        if (!sim.users.some(user => user.id === data.id.id)) {
            sim.addUsers(new User(data.id.id));
        }
        if(sim.users.some(user => user.id === data.id.id) && data.id.id === myId && client){
            index = sim.users.findIndex((user => user.id == data.id.id));
            sim.users[index].name = undefined
            sim.users[index].roles = [];
        }
    } else if (data.type == 'name') {
        index = sim.users.findIndex((user => user.id == data.id));
        sim.users[index].name = data.data;
        handleSubmitNameButton(data.data, data.id, updateOthers)
    }else if (data.type == 'roles') {
        index = sim.users.findIndex((user => user.id == data.id));
        sim.users[index].roles = data.data;

        if(data.data.includes("Robot")){
            robot = true
        }
        if(data.data.includes("Human")){
            human = true
        }
        handleSubmitNameButton(robot, human, data.id, updateOthers)

     } else if (data.type == 'updateHistory') {
        data.data.forEach(event => {
            executeUpdateEvent(event)
        })
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
        if (client){
            document.getElementById('name-input-block').style.display = "block";
        }
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
            index = sim.users.findIndex((user => user.id == c.peer));
            if(sim.users[index].name && sim.users[index].id && sim.users[index].roles){
                connectionListString.push("<div><b>Name:</b> " + sim.users[index].name + " <b>ID:</b> " + sim.users[index].id + " <b>Roles:</b> " + sim.users[index].roles + "</div>")
            }else{
                connectionListString.push("<div><b>ID:</b> " + sim.users[index].id + " Setting name and roles.</div>")
            }
        })
        document.getElementById('conn-list').innerHTML = connectionListString.join('') + "<br/>";
    } else {
        connectionListString.push("<div>Server: </div>")
        connections.forEach(c => {
            index = sim.users.findIndex((user => user.id == c.peer));
            connectionListString.push("<div><b>Name:</b> " + sim.users[index].name + " <b>ID:</b> " + sim.users[index].id + " <b>Roles:</b> " + sim.users[index].roles + "</div>")
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
        document.getElementById('btn-time').style.display = "inline";
        document.getElementById('btn-start-sim').style.display = "inline";
        document.getElementById('btn-stop-sim').style.display = "inline";
        document.getElementById('btn-start-manual-sim').style.display = "inline";
        document.getElementById('btn-stop-manual-sim').style.display = "inline";
        document.getElementById('my-roles').style.display = "none";
        document.getElementById('my-name').style.display = "none";
        document.getElementById('name-input-block').style.display = "none";
        document.getElementById('role-select-block').style.display = "none";
        sim.users = [];
        user = new User(myId, "server", ["Robot", "Human"])
        handleNewUser(user, true)
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