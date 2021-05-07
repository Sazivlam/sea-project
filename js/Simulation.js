"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dcr_1 = require("./dcr");
class Simulation {
    constructor(graph) {
        this.graph = graph;
    }
    hello() {
        console.log(this.graph.parentGraphTemp);
    }
}
var a = new Simulation(new dcr_1.DCRGraph("HEST"));
a.hello();
