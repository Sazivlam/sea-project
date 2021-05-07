import {DCRGraph} from "./dcr"


class Simulation{
    graph: DCRGraph;

    constructor(graph: DCRGraph){
        this.graph = graph;
    }

    hello(){
        console.log(this.graph.parentGraphTemp);
    }
}


var a = new Simulation(new DCRGraph("HEST"));
a.hello()

