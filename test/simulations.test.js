import Log from "../js/Log/LogObject";
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

test('start sim when it started and stopped once', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.startSimulation();
    sim.stopSimulation();
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

test('stop sim when its not running', () => {
    var sim = new Simulation("A(0,0,0)");
    
    sim.stopSimulation();

    expect(sim.isRunning).toStrictEqual(false);
    expect(sim.stopTime).toBeDefined();
});

test('graph with 1 event', () => {
    var sim = new Simulation("A(0,0,0)");
    var user1 = new User(1, "test", "robot")
    sim.addUsers(user1)
    expect(sim.users).toStrictEqual([user1]);
});
// my tests 
test('graph with mutliple users ', () => {
    var sim = new Simulation("A(0,0,0)");
    var user1 = new User(1, "test1", "robot")
    var user2 = new User(2, "test2", "robot")
    var user3 = new User(3, "test3", "human")
    sim.addUsers(user1)
    sim.addUsers(user2)
    sim.addUsers(user3)
    expect(sim.users).toStrictEqual([user1,user2,user3]);
});

test('saving a log ', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.log.logEvent("1", "1", "test", "Event", "Date", "Robot")
    
    expect(sim.log).toEqual({"Entries": [{"EventName": "Event", 
    "Id": "ID", "Roles": "Roles", "Timestamp": 
    "Date", "Trace": "Trace", "UserName": "Name"}, 
    {"EventName": "Event", "Id": "1", "Roles": "Robot",
     "Timestamp": "Date", "Trace": "1", "UserName": "test"}]});
});

test('saving multiple logs', () => {
    var sim = new Simulation("A(0,0,0)");
    sim.log.logEvent("1", "1", "test", "Event1", "Date1", "Robot")
    sim.log.logEvent("2", "2", "test2", "Event2", "Date2", "Human")
    
    expect(sim.log).toEqual(
        {"Entries": [{"EventName": "Event", "Id": "ID",
         "Roles": "Roles", "Timestamp": "Date", "Trace":
          "Trace", "UserName": "Name"}, 
          {"EventName": "Event", "Id": "1", "Roles": "Robot",
           "Timestamp": "Date", "Trace": "1", "UserName": "test"}, 
           {"EventName": "Event1", "Id": "1", "Roles": "Robot",
            "Timestamp": "Date1", "Trace": "1", "UserName": "test"}, 
            {"EventName": "Event2", "Id": "2", "Roles": 
"Human", "Timestamp": "Date2", "Trace": "2", "UserName": "test2"}]}
    );
});

//test('saving a log incorrectly ', () => {
   // var sim = new Simulation("A(0,0,0)");
   // sim.log.logEvent("1", "1", "test", "Event", "Date", "lol")
    
   // expect(sim.log).toEqual({"Entries": [{"EventName": "Event", 
  //  "Id": "ID", "Roles": "Roles", "Timestamp": 
  //  "Date", "Trace": "Trace", "UserName": "Name"}, 
  //  {"EventName": "Event", "Id": "1", "Roles": "Robot",
   //  "Timestamp": "Date", "Trace": "1", "UserName": "test"}]});
//});
//test('change graph to invalid', () => {
 //   var sim = new Simulation("A(0,0,0)");
  //  var user = new User(1, "test", "robot")
  //  sim.addUsers(user)
   // sim.executeEvent(0,0,1)
   // sim.saveLog();
   // var logs = Array.from(sim.log.events.logs());
    //expect(logs).toStrictEqual(["A"]);
//});