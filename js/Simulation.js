"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dcr_parser_1 = require("./dcr_parser");
class Simulation {
    constructor(input) {
        this.isRunning = false;
        this.graph = dcr_parser_1.parser.parse(input);
    }
    executeEvent(event) {
        this.graph.execute(event);
    }
    startSimulation() {
        this.isRunning = true;
    }
    stopSimulation() {
        this.isRunning = false;
    }
    hello() {
        console.log("im a running");
    }
    update_graph() {
    }
}
var a = new Simulation((`A(0,0,0)      
B(0,1,1)        
A -->* B
B *--> A
C -->% A
D -->+ A    
D -->* B
A --><> (B, D)`));
a.hello();
