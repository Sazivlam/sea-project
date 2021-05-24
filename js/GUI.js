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
        row.name = "<button " + (row.enabled ? "" : "disabled") + " id='" + row.label + "' "  +" onclick=\"handleEventButtonClick(this.id, true);\">" + row.label + "</button>";
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

        document.getElementById("iter").innerHTML = iterations.join("");

        graph1.timeStep(1);
        graph1.execute(chosenEvent);
        fillDcrTable(graph1.status());

        setTimeout(startSim, 2000);

    }   
}      

function handleTextAreaChange(updateOther = false) {
    var x = document.getElementById("ta-dcr");
        try{
            graph1 = parser.parse(x.value);        
            fillDcrTable(graph1.status());
            document.getElementById("parse-error").innerHTML = "";
            updateOther ? updateOthers({
                type: 'textField',
                id: 'ta-dcr',
                data: document.getElementById('ta-dcr').value
            }) : ''
        }
        catch(err)
        {
            document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
        }
}

function handleEventButtonClick(buttondId, updateOther = false) {
    graph1.execute(buttondId);
    fillDcrTable(graph1.status());
    if(updateOther) {
        updateOthers({type: 'button', id: buttondId})
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
    
    $('#btn-conn').click(function(e) {
        connect();
    }); 

    $('#ta-dcr').keyup(function(e) {
        handleTextAreaChange(true)
    });         
    
    try{
        var x = document.getElementById("ta-dcr");
        graph1 = new Simulation(x.value).graph;                
        fillDcrTable(graph1.status());
        document.getElementById("parse-error").innerHTML = "";
    }
    catch(err)
    {
        document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }

});