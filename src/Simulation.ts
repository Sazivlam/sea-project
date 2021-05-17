import { DCRGraph, Event } from "./dcr";
import { parser } from "./dcr_parser";
import { User } from "./User";
class Simulation {
    graph: DCRGraph;
    isRunning: boolean = false;
    id: number;
    log: any;
    users: User[];
    startTime: Date | undefined;
    stopTime: Date | undefined;

    constructor(input: string) {
        this.graph = parser.parse(input);
        this.users = [];
        this.id = 1;
        this.log = [];
    }

    executeEvent(event: Event) {
        this.graph.execute(event)
        this.log.push(event);
    }

    startSimulation() {
        this.isRunning = true;
        this.startTime = new Date();
    }

    stopSimulation() {
        this.isRunning = false;
        this.stopTime = new Date();
    }

    addUsers(user: User) {
        this.users.push(user);
    }

    saveLog(){
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




var sim = new Simulation((`A(0,0,0)      
B(0,1,1)        
A -->* B
B *--> A
C -->% A
D -->+ A    
D -->* B
A --><> (B, D)`));

sim.hello()
sim.startSimulation();
sim.hello()
sim.stopSimulation();
sim.hello();