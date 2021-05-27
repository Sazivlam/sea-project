var taskTable;
var isRunning = false;
var numIter = 0;
var iterations = [];

function fillDcrTable(status) {
    if (sim.isRunning){
        for (var row of status)
        {
            row.executed = (row.executed ? "V:" + row.lastExecuted : "");            
            row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");            
            row.included = (row.included ? "" : "%");   
            id = document.getElementById('id_num').innerHTML;
            row.name = "<button " + (row.enabled ? "" : "disabled") + " onclick=\"sim.executeEvent('" + row.name + "','" + id + "');fillDcrTable(sim.graph.status());\">" + row.label + "</button>";
        }
        taskTable.load(status);
        updateAccepting(sim.graph.isAccepting());
    } else {
        for (var row of status)
        {
            row.executed = (row.executed ? "V:" + row.lastExecuted : "");            
            row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");            
            row.included = (row.included ? "" : "%");       
            row.name = "<button " + (row.enabled ? "" : "disabled") + " onclick=\"fillDcrTable(sim.graph.status());\">" + row.label + "</button>";
        }
        taskTable.load(status);
        updateAccepting(sim.graph.isAccepting());
    }

}

function updateAccepting(status) {
    document.getElementById("accepting").innerHTML = (status ? "Accepting" : "Not accepting");
}

function startSim() {
    if (isRunning){
        numIter ++;
        
        var names = [];
        for (var row of sim.graph.status())
        {
            if (row.enabled){
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
        try{
            sim = new Simulation(x.value)
            fillDcrTable(sim.graph.status());
            document.getElementById("parse-error").innerHTML = "";
            updateOther ? updateOthers() : ''
        }
        catch(err)
        {
            document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
        }
}

$(document).ready(function(e) {    
    taskTable = dynamicTable.config('task-table', 
    ['executed', 'included', 'pending', 'enabled', 'name'], 
    ['Executed', 'Included', 'Pending', 'Enabled', 'Name'], 
    'There are no items to list...'); 

    $('#btn-time').click(function(e) {
        sim.graph.timeStep(1);
        fillDcrTable(sim.graph.status());
    });    
    
    $('#btn-start-sim').click(function(e) {
        document.getElementById("iter").innerHTML = "";
        isRunning = true;
        numIter = 0;
        startSim();
    }); 

    $('#btn-stop-sim').click(function(e) {
        isRunning = false;
    });

    $('#btn-start-manual-sim').click(function(e) {
        sim.startSimulation()
        fillDcrTable(sim.graph.status())
    }); 
    $('#btn-stop-manual-sim').click(function(e) {
        sim.stopSimulation()
        fillDcrTable(sim.graph.status())
    }); 
    
    $('#btn-conn').click(function(e) {
        connect();
    }); 

    $('#ta-dcr').keyup(function(e) {
        handleTextAreaChange(true)
    });         
    
    try{
        var x = document.getElementById("ta-dcr");
        sim = new Simulation(x.value)

        fillDcrTable(sim.graph.status());
        document.getElementById("parse-error").innerHTML = "";
    }
    catch(err)
    {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }



});