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

        const rows = [];

        this.Entries.forEach(function (entryRow){
            rows.push(entryRow.toCsv());
        });

        let csvContent = "data:text/csv;charset=utf-8,";

        rows.forEach(function (rowEntry) {
            console.log(rowEntry)
            let row = rowEntry.join(",");
            csvContent += row + "\r\n";
        });

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "my_data.xes");
        document.body.appendChild(link); // Required for FF

        link.click(); // This will download the data file named "my_data.csv".
        return 0;
    }
}