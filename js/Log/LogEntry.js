class Entry {
    constructor(trace, id, username, eventName, timestamp, roles) {
        this.Id = id;
        this.UserName = username;
        this.EventName = eventName;
        this.Timestamp = timestamp
        this.Roles = roles;
        this.Trace = trace;
    }


    toString() {
        return "(" + this.Trace + "," + this.Id + "," + this.UserName + "," + this.EventName + "," + this.Timestamp + ", [" + this.Roles + "]," + ")";
    }

    toCsv() {
        return [this.Trace, this.Id, this.UserName, this.EventName, this.Timestamp, "[" + this.Roles + "]"];
    }
}
