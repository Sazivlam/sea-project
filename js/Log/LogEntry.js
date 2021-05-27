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

    toCsv() {
        return [this.Id, this.UserName, this.EventName, this.Timestamp, this.Role, this.NewValue];
    }

    returnEntry() {
        throw new exception();
    }
}
