class Simulation {

    constructor(input) {
        this.graph = parser.parse(input);
        this.users = [];
        this.id = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.startTime = undefined
        this.stopTime = undefined
        this.ready = true
        this.log = new Log();
    }

    changeGraph(input) {
        this.graph = parser.parse(input);
    }

    executeEvent(event, userID) {
        this.graph.execute(event)
        var index = this.users.findIndex((user => user.id == userID));
        this.log.logEvent(userID, event, new Date().toLocaleString(), this.users[index].name, this.users[index].roles)
    }

    startSimulation() {
        this.isRunning = true;
        this.log.discardLog();
        this.log.logEvent("ID", "Event", "Date", "Name", "Roles")
        this.startTime = new Date().toLocaleString();
    }

    stopSimulation() {
        this.isRunning = false;
        this.isPaused = false;
        this.stopTime = new Date().toLocaleString();
    }

    pauseSimulation(){
        this.isRunning = false;
        this.isPaused = true;
    }

    resumeSimulation(){
        this.isRunning = true;
        this.isPaused = false;
    }

    addUsers(user) {
        this.users.push(user);
    }

    checkIfReady() {
        this.ready = true
        this.users.forEach(u => {
            if(!u.name || !u.id || !u.roles){
                this.ready = false
            }
        });
        return this.ready
    }

    saveLog() {
        this.log.saveLog()
    }

    discardLog() {
        this.log.discardLog()
    }

    hello() {
        if (this.isRunning) {
            console.log("Hello, i AM running :)");
        } else {
            console.log("Hello, i am NOT running :(");
        }
    }
}



class User {
    constructor(id, name, roles) {
        this.id = id;
        this.name = name;
        this.roles = roles;
    }
}
