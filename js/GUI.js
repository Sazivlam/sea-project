import Simulation from './Simulation';
import { dynamicTable } from "./dynamic_table"
import { updateOthers, connect, myId, server, client} from "./communication"
import download from "./utilities"
var taskTable;
var iterations = [];
var currentTrace = 1;
var currentIter = 1;
var chosenTraces;
var chosenIters;
var autoFunc;


function fillDcrTable(status) {
    for (var row of status) {
        row.executed = (row.executed ? "V:" + row.lastExecuted : "");
        row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");
        row.included = (row.included ? "" : "%");
        row.name = "<button class='mdc-button mdc-button--raised'" + (row.enabled ? "" : "disabled") + " id='" + row.label + "' style='background-color:" + (row.enabled ? "#cf5c36" : "silver") + "'" + ">" + row.label + "</button>";
    }
    taskTable.load(status);
    for (var row of status){
        document.getElementById(row.label).addEventListener("click", function() {
            handleEventButtonClick(this.id, myId, true, myId)          
        });
    }
    updateAccepting(sim.graph.isAccepting());
}

function updateAccepting(status) {
    document.getElementById("accepting").innerHTML = (status ? "Accepting" : "Not accepting");
}

function executeRandomEvents() {
    if (sim.isRunning) {
        if (currentTrace <= chosenTraces){
            if(currentIter <= chosenIters){
                var names = [];
                for (var row of sim.graph.status()) {
                    if (row.enabled) {
                        names.push(row.name);
                    }
                }
            
                chosenEvent = _.sample(names)
                
                handleEventButtonClick(chosenEvent, myId, true, myId)

                autoFunc = setTimeout(executeRandomEvents, 1000);

                currentIter++
            } else{
                currentIter = 1;
                currentTrace += 1;
                if(currentTrace <= chosenTraces){
                    iterations = [];
                    document.getElementById("iter").innerHTML = "";
                    handleNextTrace(true, myId)
                }
                autoFunc = setTimeout(executeRandomEvents, 1000);
            }
        }else{
            handleSimButtonClick('btn-stop-auto-sim', true, myId);
        }        
    }else{
        autoFunc = setTimeout(executeRandomEvents, 1000);
    }
}

export function handleTextAreaChange(updateOther = false, excludeFromUpdate = null) {
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

export function handleEventButtonClick(buttondId, userID, updateOther = false, excludeFromUpdate = null) {
    if (sim.isRunning) {
        sim.graph.timeStep(1);
        sim.executeEvent(currentTrace, buttondId, userID);
        if (updateOther) {
            updateOthers({ type: 'eventButton', id: buttondId, data: userID }, excludeFromUpdate)
        }

        var index = sim.users.findIndex((user => user.id == userID));
        iterations.push("User ID: " + userID + ", Name: " + sim.users[index].name + ", Executed Event: " + buttondId + ", Time: " + new Date().toLocaleTimeString() + "<br />")

        document.getElementById("iter").innerHTML = iterations.join("");

    }
    fillDcrTable(sim.graph.status());
}


export function handleNewUser(user, updateOther = false, excludeFromUpdate = null) {
    sim.addUsers(user);
    if (updateOther) {
        updateOthers({ type: 'newUser', id: user }, excludeFromUpdate)
    }
}

export function handleNextTrace(updateOther = false, excludeFromUpdate = null) {
    handleTextAreaChange(true, myId)
    if (client){
        currentTrace ++;
        iterations = [];
    }
    if (updateOther) {
        updateOthers({ type: 'nextTrace'}, excludeFromUpdate)
    }
}

export function handleSimButtonClick(buttonID, updateOther = false, excludeFromUpdate = null) {
    if (buttonID == 'btn-start-manual-sim') {
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        document.getElementById("ta-dcr").disabled = true;
        if(server || (!server && !client)){
            document.getElementById('btn-pause-manual-sim').style.display = "block";
            document.getElementById('btn-stop-manual-sim').style.display = "block";
            document.getElementById('btn-start-manual-sim').style.display = "none";
            document.getElementById('btn-start-auto-sim').style.display = "none";
        }
        if (!server && !client) {
            document.getElementById('peer-input-block').style.display = "none";
        }
        iterations = [];
        document.getElementById("iter").innerHTML = "";
        document.getElementById('btn-save-log').style.display = "none";
        document.getElementById('btn-discard-log').style.display = "none";
        currentTrace = 1;
        currentIter = 1;
        handleTextAreaChange(true, myId)
        sim.startSimulation()
    } else if (buttonID == 'btn-start-auto-sim') {
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        document.getElementById("ta-dcr").disabled = true;
        if(server || (!server && !client)){
            document.getElementById('btn-pause-auto-sim').style.display = "block";
            document.getElementById('btn-stop-auto-sim').style.display = "block";
            document.getElementById('btn-start-manual-sim').style.display = "none";
            document.getElementById('btn-start-auto-sim').style.display = "none";
            executeRandomEvents();
        }
        if(!server && !client){
            document.getElementById('peer-input-block').style.display = "none";
        }
        iterations = [];
        document.getElementById("iter").innerHTML = "";
        document.getElementById('btn-save-log').style.display = "none";
        document.getElementById('btn-discard-log').style.display = "none";
        currentTrace = 1;
        currentIter = 1;
        handleTextAreaChange(true, myId)
        sim.startSimulation()
    } else if (buttonID == 'btn-stop-manual-sim') {
        document.getElementById("ta-dcr").disabled = false;
        if(server || (!server && !client)){
            
            document.getElementById('btn-pause-manual-sim').style.display = "none";
            document.getElementById('btn-stop-manual-sim').style.display = "none";
            document.getElementById('btn-start-manual-sim').style.display = "block";
            document.getElementById('btn-start-auto-sim').style.display = "block";
            document.getElementById('btn-resume-manual-sim').style.display = "none";
        }
         if(!server && !client){
            document.getElementById('peer-input-block').style.display = "block";
        }
        document.getElementById("sim-status").innerHTML = "Simulation finished.";
        document.getElementById('btn-save-log').style.display = "block";
        document.getElementById('btn-discard-log').style.display = "block";
        sim.stopSimulation()
    } else if (buttonID == 'btn-stop-auto-sim') {
        document.getElementById("ta-dcr").disabled = false;
        if(server || (!server && !client)){
            document.getElementById('btn-pause-auto-sim').style.display = "none";
            document.getElementById('btn-stop-auto-sim').style.display = "none";
            document.getElementById('btn-start-manual-sim').style.display = "block";
            document.getElementById('btn-start-auto-sim').style.display = "block";
            document.getElementById('btn-resume-auto-sim').style.display = "none";
            clearTimeout(autoFunc)
        }
        if (!server && !client) {
            document.getElementById('peer-input-block').style.display = "block";
        }
        document.getElementById("sim-status").innerHTML = "Simulation finished.";
        document.getElementById('btn-save-log').style.display = "block";
        document.getElementById('btn-discard-log').style.display = "block";
        sim.stopSimulation()
    } else if (buttonID == 'btn-pause-manual-sim') {
        if (server || (!server && !client)) {
            document.getElementById('btn-resume-manual-sim').style.display = "block";
            document.getElementById('btn-pause-manual-sim').style.display = "none";
        }
        document.getElementById("sim-status").innerHTML = "Simulation paused.";
        sim.pauseSimulation()
    } else if (buttonID == 'btn-pause-auto-sim') {
        if(server || (!server && !client)){
            document.getElementById('btn-resume-auto-sim').style.display = "block";
            document.getElementById('btn-pause-auto-sim').style.display = "none";
            clearTimeout(autoFunc)
        }
        document.getElementById("sim-status").innerHTML = "Simulation paused.";
        sim.pauseSimulation()
    } else if (buttonID == 'btn-resume-manual-sim') {
        if (server || (!server && !client)) {
            document.getElementById('btn-resume-manual-sim').style.display = "none";
            document.getElementById('btn-pause-manual-sim').style.display = "block";
        }
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        sim.resumeSimulation()
    } else if (buttonID == 'btn-resume-auto-sim') {
        if(server || (!server && !client)){
            document.getElementById('btn-resume-auto-sim').style.display = "none";
            document.getElementById('btn-pause-auto-sim').style.display = "block";
            executeRandomEvents();
        }
        document.getElementById("sim-status").innerHTML = "Simulation running.";
        sim.resumeSimulation()
    }
    fillDcrTable(sim.graph.status())

    if (updateOther) {
        updateOthers({ type: 'simButton', id: buttonID }, true, excludeFromUpdate)
    }
}

export function handleSubmitNameButton(name = null, id = null, updateOther = false, excludeFromUpdate = null) {
    if (name.trim().length == 0) {
        document.getElementById("input-error").innerHTML = "Name must not be empty.</br>";
    } else {
        document.getElementById("input-error").innerHTML = "";
        index = sim.users.findIndex((user => user.id == id));
        sim.users[index].name = name

        if (id === myId) {
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

export function handleRoleSubmitButton(robot, human, id = null, updateOther = false, excludeFromUpdate = null) {
    if (!human && !robot) {
        document.getElementById("input-error").innerHTML = "At least one role must be selected.</br>";
    } else {
        document.getElementById("input-error").innerHTML = "";
        index = sim.users.findIndex((user => user.id === id));

        if (id === myId) {
            if (robot) {
                sim.users[index].roles.push("Robot");
            }
            if (human) {
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

    $('#btn-start-auto-sim').click(function (e) {
         if (!sim.checkIfReady() ) {
            document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
        } else if (document.getElementById("parse-error").innerHTML !== "") {
            document.getElementById("cant-start").innerHTML = "The specified graph is invalid.";
        } else{
            document.getElementById("cant-start").innerHTML = "";
            document.getElementById('peer-input-block').style.display = "none";
            document.getElementById('trace-input-block').style.display = "block";
            document.getElementById('btn-start-manual-sim').style.display = "none";
            document.getElementById('btn-start-auto-sim').style.display = "none";
        }
    });

    $('#btn-stop-auto-sim').click(function (e) {
        handleSimButtonClick(this.id, true, myId);
    });

    $('#btn-pause-auto-sim').click(function (e) {
        handleSimButtonClick(this.id, true, myId);
    });

    $('#btn-resume-auto-sim').click(function (e) {
        handleSimButtonClick(this.id, true, myId);
    });

    $('#btn-start-manual-sim').click(function (e) {
        if (!sim.checkIfReady() ) {
            document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
        } else if (document.getElementById("parse-error").innerHTML !== "") {
            document.getElementById("cant-start").innerHTML = "The specified graph is invalid.";
        } else  {
            document.getElementById("cant-start").innerHTML = "";
            handleSimButtonClick(this.id, true, myId);
        }
    });

    $('#btn-stop-manual-sim').click(function (e) {
        
        
        handleSimButtonClick(this.id, true, myId);
  });

    $('#btn-pause-manual-sim').click(function (e) {
        handleSimButtonClick(this.id, true, myId);
    });

    $('#btn-resume-manual-sim').click(function (e) {
        handleSimButtonClick(this.id, true, myId);
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

    $('#btn-trace-submit').click(function (e) {
        if(document.getElementById("trace-input-id").value < 1 || document.getElementById("trace-input-id").value === undefined){
            document.getElementById("input-error").innerHTML = "Minimum number of traces is 1.</br>";
        }else{
            document.getElementById("input-error").innerHTML = "";
            chosenTraces = document.getElementById("trace-input-id").value;
            document.getElementById('trace-input-block').style.display = "none";
            document.getElementById('iter-input-block').style.display = "block";
        }
    });

    $('#btn-iter-submit').click(function (e) {
        if(document.getElementById("iter-input-id").value < 1 || document.getElementById("iter-input-id").value === undefined){
            document.getElementById("input-error").innerHTML = "Minimum number of iterations is 1.</br>";
        }else{
            document.getElementById("input-error").innerHTML = "";
            chosenIters = document.getElementById("iter-input-id").value;
            document.getElementById('iter-input-block').style.display = "none";
            handleSimButtonClick('btn-start-auto-sim', true, myId);
        }
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