class Log {
    constructor() {

        //Singleton-pattern
        if (!!Log.instance) {
            return Log.instance;
        }
        Log.instance = this;

        this.Entries = new Array();
    }

    // For testing purposes
    toString() {
        this.Entries.forEach(function (entryRow){
            console.log(entryRow.toString());
        });
    }
    
    
    // To log events, whenever anything is done in the graph.
    logEvent(id, eventName, timestamp, role, newValue)
    {
        console.log("executing");
        var logEntry = new Entry(id, eventName, timestamp, role, newValue);
        this.Entries.push(logEntry);
    }

    discardLog() {
        this.Entries = new Array();
    }

    
    // Call to save the log.
    saveLog() {
        const rows = [];

        this.Entries.forEach(function (entryRow){
            rows.push(entryRow.toCsv());
        });

        let csvContent = "data:text/csv;charset=utf-8,";

        rows.forEach(function (rowEntry) {
            let row = rowEntry.join(",");
            csvContent += row + "\r\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "log.csv");
        document.body.appendChild(link); // Required for FF

        link.click(); // This will download the data file named "my_data.csv".
    }
}