import Log from "../js/Log/LogObject"
import Entry from "../js/Log/LogEntry";

test('Test that the singleton is working', () => {
    var log1 = new Log();
    log1.logEvent(1, "404", "name", "name", "stamp", "roles");
    var log2 = new Log();
    expect(log1).toStrictEqual(log2);
});

test('Test that entries work', () => {
    var log = new Log();
    log.discardLog();

    var entry = new Entry(1, "404", "name", "name", "stamp", "roles")

    log.logEvent(1, "404", "name", "name", "stamp", "roles");
    
    expect(log.Entries).toStrictEqual([entry]);
});



test('Test that entries work with multiple entries, in correct order', () => {
    var log = new Log();
    log.discardLog();

    var headerEntry = new Entry("Trace","ID", "Name", "Event", "Date", "Roles")
    var entry = new Entry(1, "404", "name", "name", "stamp", "roles")

    log.logEvent("Trace","ID", "Name", "Event", "Date", "Roles")
    log.logEvent(1, "404", "name", "name", "stamp", "roles");
    
    expect(log.Entries).toStrictEqual([headerEntry, entry]);
});

test('Test that discardLog deletes everything in Entries', () => {
    var log = new Log();
    
    log.logEvent("Trace","ID", "Name", "Event", "Date", "Roles")
    log.logEvent(1, "404", "name", "name", "stamp", "roles");
    
    log.logEvent("Trace","ID", "Name", "Event", "Date", "Roles")
    log.logEvent(1, "404", "name", "name", "stamp", "roles");
    
    log.discardLog();
    expect(log.Entries).toStrictEqual([]);
});
