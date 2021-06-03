var taskTable;
var isRunning = false;
var numIter = 0;
var iterations = [];



function fillDcrTable(status) {
    for (var row of status) {
        row.executed = (row.executed ? "V:" + row.lastExecuted : "");
        row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");
        row.included = (row.included ? "" : "%");
        row.name = "<button " + (row.enabled ? "" : "disabled") + " id='" + row.label + "' " + " onclick=\"handleEventButtonClick(this.id, myId, true, myId);\">" + row.label + "</button>";
    }
    taskTable.load(status);
    updateAccepting(sim.graph.isAccepting());
}

function updateAccepting(status) {
    document.getElementById("accepting").innerHTML = (status ? "Accepting" : "Not accepting");
}

function startSim() {
    if (isRunning) {
        numIter++;

        var names = [];
        for (var row of sim.graph.status()) {
            if (row.enabled) {
                names.push(row.name);
            }
        }
         
        chosenEvent = _.sample(names)
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        var myIDD = localStorage.getItem("myID");  
        iterations.push("Time : " + time +  ", User ID :" + myIDD +  " , Executed Event: " + chosenEvent +  "<br />")

        document.getElementById("iter").innerHTML = iterations.join("");

        sim.graph.timeStep(1);
        sim.executeEvent(chosenEvent);
        fillDcrTable(sim.graph.status());

        setTimeout(startSim, 2000);

    }
}

function handleTextAreaChange(updateOther = false, excludeFromUpdate = null) {
    var x = document.getElementById("ta-dcr");
    try {
        sim.changeGraph(x.value);
        fillDcrTable(sim.graph.status());
        document.getElementById("parse-error").innerHTML = "";
        if (updateOther) {
            updateOthers({
                type: 'textField',
                id: 'ta-dcr',
                data: document.getElementById('ta-dcr').value
            }, excludeFromUpdate)
        }
    }
    catch (err) {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }
}

function handleEventButtonClick(buttondId, userID, updateOther = false, excludeFromUpdate = null) {
    if (sim.isRunning) {
        sim.graph.timeStep(1);
        sim.executeEvent(buttondId, userID);
        if (updateOther) {
            updateOthers({ type: 'eventButton', id: buttondId, data: userID }, excludeFromUpdate)
        }
    }
    fillDcrTable(sim.graph.status());
}

function handleNewUser(user, updateOther = false, excludeFromUpdate = null) {
    sim.addUsers(user);
    if (updateOther) {
        updateOthers({ type: 'newUser', id: user }, excludeFromUpdate)
    }
}

function handleManualSimButtonClick(buttonID, updateOther = false, excludeFromUpdate = null) {
    if (buttonID == 'btn-start-manual-sim') {
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        if(server || (!server && !client)){
            document.getElementById('btn-pause-manual-sim').style.display = "block";
            document.getElementById('btn-stop-manual-sim').style.display = "block";
            document.getElementById('btn-start-manual-sim').style.display = "none";
        }
        if(!server && !client){
            document.getElementById('peer-input-block').style.display = "none";
        }
        document.getElementById('btn-save-log').style.display = "none";
        document.getElementById('btn-discard-log').style.display = "none";
        sim.startSimulation()
    } else if (buttonID == 'btn-stop-manual-sim') {
        if(server || (!server && !client)){
            document.getElementById('btn-pause-manual-sim').style.display = "none";
            document.getElementById('btn-stop-manual-sim').style.display = "none";
            document.getElementById('btn-start-manual-sim').style.display = "block";
        }
         if(!server && !client){
            document.getElementById('peer-input-block').style.display = "block";
        }
        document.getElementById("sim-status").innerHTML = "Simulation finished.";
        document.getElementById('btn-save-log').style.display = "block";
        document.getElementById('btn-discard-log').style.display = "block";
        sim.stopSimulation()
    } else if (buttonID == 'btn-pause-manual-sim') {
        if(server || (!server && !client)){
            document.getElementById('btn-resume-manual-sim').style.display = "block";
            document.getElementById('btn-pause-manual-sim').style.display = "none";
        }
        document.getElementById("sim-status").innerHTML = "Simulation paused.";
        sim.pauseSimulation()
    } else if (buttonID == 'btn-resume-manual-sim') {
        if(server || (!server && !client)){
            document.getElementById('btn-resume-manual-sim').style.display = "none";
            document.getElementById('btn-pause-manual-sim').style.display = "block";
        }
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        sim.resumeSimulation()
    }
    fillDcrTable(sim.graph.status())

    if (updateOther) {
        updateOthers({ type: 'manualSimButton', id: buttonID }, excludeFromUpdate)
    }
}

function handleSubmitNameButton(name = null, id = null, updateOther = false, excludeFromUpdate = null) {
    if(name.trim().length == 0){
        document.getElementById("input-error").innerHTML = "Name must not be empty.</br>";
    }else{
        document.getElementById("input-error").innerHTML = "";
        index = sim.users.findIndex((user => user.id == id));
        sim.users[index].name = name

        if (id === myId){
            document.getElementById('name-input-block').style.display = "none";
            document.getElementById('my-name').style.display = "block";
            document.getElementById('my-name').innerHTML =
            "<div>My Name: </div>" +
            "<div>" + name + "</div><br/>";
            document.getElementById('role-select-block').style.display = "block";
        }
        if (updateOther) {
            updateOthers({ type: 'name', id: id, data: name }, excludeFromUpdate)
        }
    }
    
}

function handleRoleSubmitButton(robot, human, id = null, updateOther = false, excludeFromUpdate = null) {
    if(!human && !robot){
        document.getElementById("input-error").innerHTML = "At least one role must be selected.</br>";
    }else{
        document.getElementById("input-error").innerHTML = "";
        index = sim.users.findIndex((user => user.id === id));

        if (id === myId){
            if(robot){
            sim.users[index].roles.push("Robot");
            }
            if(human){
                sim.users[index].roles.push("Human");
            }

            document.getElementById('role-select-block').style.display = "none";
            document.getElementById('my-roles').style.display = "block";
            document.getElementById('my-roles').innerHTML =
            "<div>My Roles: </div>" +
            "<div>" + sim.users[index].roles + "</div><br/>";
            document.getElementById('sim-status').style.display = "block";
            document.getElementById("sim-status").innerHTML = "Waiting for server to start simulation.";
        }

        if (updateOther) {
            updateOthers({ type: 'roles', id: id, data: sim.users[index].roles }, excludeFromUpdate)
        }
    }
    
}

$(document).ready(function (e) {
    taskTable = dynamicTable.config('task-table',
        ['executed', 'included', 'pending', 'enabled', 'name'],
        ['Executed', 'Included', 'Pending', 'Enabled', 'Name'],
        'There are no items to list...');

    $('#btn-time').click(function (e) {
        sim.graph.timeStep(1);
        fillDcrTable(sim.graph.status());
    });

    $('#btn-start-sim').click(function (e) {
        document.getElementById("cant-start").innerHTML = "";
        if(!sim.checkIfReady()){
            document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
        }else{
            document.getElementById("iter").innerHTML = "";
            isRunning = true;
            numIter = 0;
            startSim();
        }
    });

    $('#btn-stop-sim').click(function (e) {
        isRunning = false;
    });

    $('#btn-start-manual-sim').click(function (e) {
        if(!sim.checkIfReady()){
            document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
        }else{
            document.getElementById("cant-start").innerHTML = "";
            handleManualSimButtonClick(this.id, true, myId);
        }
    });

    $('#btn-stop-manual-sim').click(function (e) {
        handleManualSimButtonClick(this.id, true, myId);
    });

    $('#btn-pause-manual-sim').click(function (e) {
        handleManualSimButtonClick(this.id, true, myId);
    });

    $('#btn-resume-manual-sim').click(function (e) {
        handleManualSimButtonClick(this.id, true, myId);
    });

     $('#btn-save-log').click(function (e) {
        sim.saveLog()
    });

    $('#btn-discard-log').click(function (e) {
        sim.discardLog()
        document.getElementById('btn-save-log').style.display = "none";
        document.getElementById('btn-discard-log').style.display = "none";
    });

    $('#btn-download-model').click(function (e) {
        var content = document.getElementById("ta-dcr").value;
        download(content, 'model.txt', 'text/csv;encoding:utf-8');
    })

    $('#btn-conn').click(function (e) {
        document.getElementById("cant-connect").innerHTML = "";
        connect();
    });

    $('#btn-subname').click(function (e) {
        var name = document.getElementById("name-input-id").value;
        handleSubmitNameButton(name, myId, true, myId);
    });

     $('#btn-role').click(function (e) {
        var robot = document.getElementById("robot").checked;
        var human = document.getElementById("human").checked;
        handleRoleSubmitButton(robot, human, myId, true, myId);
    });

    $('#ta-dcr').keyup(function (e) {
        handleTextAreaChange(true, myId)
    });

    try {
        var x = document.getElementById("ta-dcr");
        sim = new Simulation(x.value)

        fillDcrTable(sim.graph.status());
        document.getElementById("parse-error").innerHTML = "";
    }
    catch (err) {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }



});