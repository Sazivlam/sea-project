class Simulation {

    constructor(input) {
        this.graph = parser.parse(input);
        this.users = [];
        this.id = 1;
        this.isRunning = false;
        this.startTime = undefined
        this.stopTime = undefined
        this.users = []
        this.log = [];
    }

    executeEvent(event, userName) {
        this.graph.execute(event);
        this.log.push(this.id, userName, event, new Date().toLocaleString());
        console.log(this.log)
    }

    startSimulation() {
        this.isRunning = true;
        this.startTime = new Date().toLocaleString();
    }

    stopSimulation() {
        this.isRunning = false;
        this.stopTime = new Date().toLocaleString();
    }

    addUsers(user) {
        this.users.push(user);
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
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.roles = []
    }
}
