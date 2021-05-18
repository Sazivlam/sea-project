class Log {
    constructor() {
        this.LogID = 0;
        this.Date = 0;
        this.Entries = new Array();
    }


    createInstance() {
        var object = new Log();
        return object;
    }

    toString() {
        //return "(" + (executed ? 1 : 0) + "," + (included ? 1 : 0) + "," + (pending ? 1 : 0) + ")";
    }
    
    
    executeEvent(id, eventName, timestamp, role, newValue)
    {
        console.log("executing");
        var logEntry = new Entry(id, eventName, timestamp, role, newValue);
        this.Entries.push(logEntry);
        this.saveLog();
        
        return 0;
    }

    
    saveLog() {
        console.log("What up");
        console.log(this.Entries[0].toString());

        
        return 0;
    }
}