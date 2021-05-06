var taskTable;
var isRunning = false;
var numIter = 0;
var iterations = [];

function fillDcrTable(status) {
    for (var row of status)
    {
        row.executed = (row.executed ? "V:" + row.lastExecuted : "");            
        row.pending = (row.pending ? "!" + (row.deadline === undefined ? "" : ":" + row.deadline) : "");            
        row.included = (row.included ? "" : "%");       
        row.name = "<button " + (row.enabled ? "" : "disabled") + " onclick=\"graph1.execute('" + row.name + "');fillDcrTable(graph1.status());\">" + row.label + "</button>";
    }
    taskTable.load(status);
    updateAccepting(graph1.isAccepting());
}

function updateAccepting(status) {
    document.getElementById("accepting").innerHTML = (status ? "Accepting" : "Not accepting");
}

function startSim() {
    if (isRunning){
        numIter ++;
        
        var names = [];
        for (var row of graph1.status())
        {
            if (row.enabled){
                names.push(row.name);
            }
        }

        chosenEvent = _.sample(names)

        iterations.push("Iteration: " + numIter + "; Executed Event: " + chosenEvent + "<br />")

        document.getElementById("iter").innerHTML = iterations;

        graph1.timeStep(1);
        graph1.execute(chosenEvent);
        fillDcrTable(graph1.status());

        setTimeout(startSim, 2000);

    }   
}       

$(document).ready(function(e) {    
    taskTable = dynamicTable.config('task-table', 
    ['executed', 'included', 'pending', 'enabled', 'name'], 
    ['Executed', 'Included', 'Pending', 'Enabled', 'Name'], 
    'There are no items to list...'); 

    $('#btn-time').click(function(e) {
        graph1.timeStep(1);
        fillDcrTable(graph1.status());
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

    $('#ta-dcr').keyup(function(e) {
        var x = document.getElementById("ta-dcr");
        try{
            graph1 = parser.parse(x.value);        
            fillDcrTable(graph1.status());
            document.getElementById("parse-error").innerHTML = "";
        }
        catch(err)
        {
            document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
        }
    });         
    
    try{
        var x = document.getElementById("ta-dcr");
        graph1 = parser.parse(x.value);                
        fillDcrTable(graph1.status());
        document.getElementById("parse-error").innerHTML = "";
    }
    catch(err)
    {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }

});