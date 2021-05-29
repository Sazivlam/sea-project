var taskTable;
var isRunning = false;
var numIter = 0;
var iterations = [];

function fillDcrTable(status) {
    for (var row of status) {
        row.executed = (row.executed ? "V:" + row.lastExecuted : "");
        row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");
        row.included = (row.included ? "" : "%");
        row.name = "<button " + (row.enabled ? "" : "disabled") + " id='" + row.label + "' " + " onclick=\"handleEventButtonClick(this.id, true);\">" + row.label + "</button>";
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

        iterations.push("Iteration: " + numIter + "; Executed Event: " + chosenEvent + "<br />")

        document.getElementById("iter").innerHTML = iterations.join("");

        sim.graph.timeStep(1);
        sim.executeEvent(chosenEvent);
        fillDcrTable(sim.graph.status());

        setTimeout(startSim, 2000);

    }
}

function handleTextAreaChange(updateOther = false) {
    var x = document.getElementById("ta-dcr");
    try {
        sim.changeGraph(x.value);
        fillDcrTable(sim.graph.status());
        document.getElementById("parse-error").innerHTML = "";
        if(updateOther) {
            updateOthers({
                type: 'textField',
                id: 'ta-dcr',
                data: document.getElementById('ta-dcr').value
            })
        }
    }
    catch (err) {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }
}

function handleEventButtonClick(buttondId, updateOther = false) {
    if (sim.isRunning) {
        sim.executeEvent(buttondId);
        if (updateOther) {
            updateOthers({ type: 'eventButton', id: buttondId })
        }
    }
    fillDcrTable(sim.graph.status());
}

function handleNewUser(user, updateOther = false) {
    sim.addUsers(user);
    if (updateOther) {
        updateOthers({ type: 'newUser', id: user })
    }
}

function handleManualSimButtonClick(buttonID, updateOther = false) {
    if (buttonID == 'btn-start-manual-sim') {
        sim.startSimulation()
    } else if (buttonID == 'btn-stop-manual-sim') {
        sim.stopSimulation()
    }
    fillDcrTable(sim.graph.status())

    if (updateOther) {
        updateOthers({ type: 'manualSimButton', id: buttonID })
    }
}

function handleSubmitNameButton(name = null, id = null, updateOther = false) {
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
            updateOthers({ type: 'name', id: id, data: name })
        }
    }
    
}

function handleRoleSubmitButton(robot, human, id = null, updateOther = false) {
    if(!human && !robot){
        document.getElementById("input-error").innerHTML = "At least one role must be selected.</br>";
    }else{
        document.getElementById("input-error").innerHTML = "";
        index = sim.users.findIndex((user => user.id == id));

        if(robot){
            sim.users[index].roles.push("Robot");
        }
        if(human){
            sim.users[index].roles.push("Human");
        }

        if (id === myId){
            document.getElementById('role-select-block').style.display = "none";
            document.getElementById('my-roles').style.display = "block";
            document.getElementById('my-roles').innerHTML =
            "<div>My Roles: </div>" +
            "<div>" + sim.users[index].roles + "</div><br/>";
        }

        if (updateOther) {
            updateOthers({ type: 'roles', id: id, data: sim.users[index].roles })
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
            handleManualSimButtonClick(this.id, true);
        }
    });
    $('#btn-stop-manual-sim').click(function (e) {
        handleManualSimButtonClick(this.id, true);
    });

    $('#btn-conn').click(function (e) {
        connect();
    });

    $('#btn-subname').click(function (e) {
        var name = document.getElementById("name-input-id").value;
        handleSubmitNameButton(name, myId, true);
    });

     $('#btn-role').click(function (e) {
        var robot = document.getElementById("robot").checked;
        var human = document.getElementById("human").checked;
        handleRoleSubmitButton(robot, human, myId, true);
    });

    $('#ta-dcr').keyup(function (e) {
        handleTextAreaChange(true)
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