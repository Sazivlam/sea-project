class Log {
    constructor() {
        this.LogID = 0;
        this.Date = 0;
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
        
        return 0;
    }

    
    // Call to save the log.
    saveLog() {
        console.log("What up");
        console.log(this.Entries[0].toString());

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
        return 0;
    }
}