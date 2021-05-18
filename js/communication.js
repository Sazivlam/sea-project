var app = {};
var connections = [];
app.peer = new Peer();
var connected = false;
var server = false;
var client = false;

//Set my id
app.peer.on('open', function (myId) {
    document.getElementById('my-id').innerHTML =
        "<div>My ID: </div>" +
        "<div>" + myId + "</div><br/>";
});

//Client part
function connect() {
    app.conn = app.peer.connect(document.getElementById('partner-id').value);
    //Connect to server
    app.conn.on('open', function () {
        if (!connected && !server) {
            console.log("Outcoming open");
            if (!connected) {
                removeConnectionBlock();
                client = true;
            }
            document.getElementById('conn-status').innerHTML = "Connection established as Client";
            document.getElementById('server-id').innerHTML =
                "<div>Server ID: </div>" +
                "<div>" + app.conn.peer + "</div><br/>";
            connections.push(app.conn);
            connected = true;
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
            console.log("New client connects");
            if (!client) {
                console.log("Incoming open");
                if (!connected) {
                    removeConnectionBlock();
                    server = true;
                }
                document.getElementById('conn-status').innerHTML = "Connection established as Server";
                connections.push(c);
                connected = true;
                updateConnectionList();
            }
        });
        //Receive client data
        app.conn.on('data', function (data) {
            if (connected && !client) {
                console.log("Incoming data");
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
function removeConnectionBlock() {
    document.getElementById('conn-block').remove();
}
function updateConnectionList() {
    var connectionListString = [];
    connectionListString.push("<div>Clients:</div>")
    connections.forEach(c => {
        if (c && c.open) {
            connectionListString.push("<div>" + c.peer + "</div>")
        }
    })
    document.getElementById('conn-list').innerHTML = connectionListString.join('') + "<br/>";
}