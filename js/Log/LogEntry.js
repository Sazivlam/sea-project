class Entry {
    constructor(id, username, eventName, timestamp, roles, newValue) {
        this.Id = id;
        this.UserName = username;
        this.EventName = eventName;
        this.Timestamp = timestamp
        this.Roles = roles;
        this.NewValue = newValue;
    }


    toString() {
        return "(" + this.Id + "," + this.UserName + "," + this.EventName + "," + this.Timestamp + ", [" + this.Roles + "]," + this.newValue + ")";
    }

    toCsv() {
        return [this.Id, this.UserName, this.EventName, this.Timestamp, "[" + this.Roles + "]", this.NewValue];
    }
}
