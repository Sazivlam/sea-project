import Simulation from "../js/Simulation"
import { User } from "../js/Simulation"


test('graph with 1 event', () => {
    var sim = new Simulation("A(0,0,0)");
    var keys = Array.from(sim.graph.events.keys());
    expect(keys).toStrictEqual(["A"]);
});


test('graph with 2 events', () => {
    var sim = new Simulation("A(0,0,0)\n B(0,0,0)");
    var keys = Array.from(sim.graph.events.keys());
    expect(keys).toStrictEqual(["A", "B"]);
});

test('change graph', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.changeGraph("B(0,0,0)");
    var keys = Array.from(sim.graph.events.keys());
    expect(keys).toStrictEqual(["B"]);
});

test('start sim', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.startSimulation();

    expect(sim.isRunning).toStrictEqual(true);
    expect(sim.startTime).toBeDefined();
});

test('pause sim', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.startSimulation();
    sim.pauseSimulation();

    expect(sim.isRunning).toStrictEqual(false);
    expect(sim.isPaused).toStrictEqual(true);
});

test('pause sim', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.startSimulation();
    sim.pauseSimulation();
    sim.resumeSimulation();

    expect(sim.isRunning).toStrictEqual(true);
    expect(sim.isPaused).toStrictEqual(false);
});

test('stop sim', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.startSimulation();
    sim.stopSimulation();

    expect(sim.isRunning).toStrictEqual(false);
    expect(sim.stopTime).toBeDefined();
});

test('graph with 1 event', () => {
    var sim = new Simulation("A(0,0,0)");
    var user = new User(1, "test", "robot")
    sim.addUsers(user)
    expect(sim.users).toStrictEqual([user]);
});

