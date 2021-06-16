import Simulation from "../js/Simulation"

test('graph with 1 event', () => {
    var sim = new Simulation("A(0,0,0)")
    var keys = Array.from(sim.graph.events.keys())
    expect(keys).toStrictEqual(["A"]);
});

