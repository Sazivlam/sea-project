class Simulation {

    constructor(input) {
        this.graph = parser.parse(input);
        this.users = [];
        this.id = 1;
        this.isRunning = false;
        this.startTime = undefined
        this.stopTime = undefined
        this.ready = true
        this.log = new Log();
    }

    changeGraph(input) {
        this.graph = parser.parse(input);
    }

    executeEvent(event, userName) {
        this.graph.execute(event)
        this.log.logEvent(userName, event, new Date().toLocaleString(), "test", "undefined")
    }

    startSimulation() {
        this.isRunning = true;
        this.startTime = new Date().toLocaleString();
    }

    stopSimulation() {
        this.isRunning = false;
        this.stopTime = new Date().toLocaleString();
        this.log.saveLog()
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
        console.log(this.log);
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
