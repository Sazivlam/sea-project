import Simulation from "../js/Simulation"

test('adds 1 + 2 to equal 3', () => {
    var sim = new Simulation("A(0,0,0)")
    var keys = Array.from(sim.graph.events.keys())
    expect(keys).toStrictEqual(["A"]);
});