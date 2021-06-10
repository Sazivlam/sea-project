export default class Entry {
    constructor(id, username, eventName, timestamp, roles, trace) {
        this.Id = id;
        this.UserName = username;
        this.EventName = eventName;
        this.Timestamp = timestamp
        this.Roles = roles;
        this.Trace = trace;
    }


    toString() {
        return "(" + this.Id + "," + this.UserName + "," + this.EventName + "," + this.Timestamp + ", [" + this.Roles + "]," + ")";
    }

    toCsv() {
        if (this.Trace == true)
        {
            return ["Trace: " + this.Id]
        }
        else 
        {
            return [this.Id, this.UserName, this.EventName, this.Timestamp, "[" + this.Roles + "]"];
        }
    }
}
