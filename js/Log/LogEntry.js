class LogEntry {
    constructor() {
    }


    toString() {
        return "(Stuff to file.)";
    }

    returnEntry() {
        throw new exception();
    }

    
}

class Entry {
    constructor(id, username, eventName, timestamp, role, newValue) {
        this.Id = id;
        this.UserName = username;
        this.EventName = eventName;
        this.Timestamp = timestamp
        this.Role = role;
        this.NewValue = newValue;
    }


    toString() {
        return "(" + this.Id + "," + this.UserName + "," + this.EventName + "," + this.Timestamp + "," + this.Role + "," + this.newValue + ")";
    }

    returnEntry() {
        throw new exception();
    }

    
}