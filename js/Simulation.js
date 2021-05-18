"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dcr_parser_1 = require("./dcr_parser");
class Simulation {
    constructor(input) {
        this.isRunning = false;
        this.graph = dcr_parser_1.parser.parse(input);
        this.users = [];
        this.id = 1;
    }
    executeEvent(event) {
        this.graph.execute(event);
    }
    startSimulation() {
        this.isRunning = true;
        this.startTime = new Date();
    }
    stopSimulation() {
        this.isRunning = false;
        this.stopTime = new Date();
    }
    addUsers(user) {
        this.users.push(user);
    }
    hello() {
        if (this.isRunning) {
            console.log("Hello, i AM running :)");
        }
        else {
            console.log("Hello, i am NOT running :(");
        }
    }
}
var sim = new Simulation((`A(0,0,0)      
B(0,1,1)        
A -->* B
B *--> A
C -->% A
D -->+ A    
D -->* B
A --><> (B, D)`));
sim.hello();
sim.startSimulation();
sim.hello();
sim.stopSimulation();
sim.hello();
