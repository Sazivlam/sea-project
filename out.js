(() => {
  // js/Log/LogEntry.js
  var Entry = class {
    constructor(id, username, eventName, timestamp, roles, trace) {
      this.Id = id;
      this.UserName = username;
      this.EventName = eventName;
      this.Timestamp = timestamp;
      this.Roles = roles;
      this.Trace = trace;
    }
    toString() {
      return "(" + this.Id + "," + this.UserName + "," + this.EventName + "," + this.Timestamp + ", [" + this.Roles + "],)";
    }
    toCsv() {
      if (this.Trace == true) {
        return ["Trace: " + this.Id];
      } else {
        return [this.Id, this.UserName, this.EventName, this.Timestamp, "[" + this.Roles + "]"];
      }
    }
  };

  // js/Log/LogObject.js
  var Log = class {
    constructor() {
      if (!!Log.instance) {
        return Log.instance;
      }
      Log.instance = this;
      this.Entries = [];
    }
    toString() {
      this.Entries.forEach(function(entryRow) {
        console.log(entryRow.toString());
      });
    }
    newTrace(traceName) {
      var whatever = new Entry(traceName, "", "", "", "", true);
      this.Entries.push(whatever);
    }
    logEvent(id, username, eventName, timestamp, role) {
      var logEntry = new Entry(id, username, eventName, timestamp, role, false);
      this.Entries.push(logEntry);
    }
    discardLog() {
      this.Entries = [];
    }
    saveLog() {
      const rows = [];
      this.Entries.forEach(function(entryRow) {
        rows.push(entryRow.toCsv());
      });
      let csvContent = "data:text/csv;charset=utf-8,";
      rows.forEach(function(rowEntry) {
        let row = rowEntry.join(",");
        csvContent += row + "\r\n";
      });
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "log.csv");
      document.body.appendChild(link);
      link.click();
    }
  };

  // js/dcr.js
  var Marking = class {
    constructor(e, p, i) {
      this.executed = e;
      this.included = p;
      this.pending = i;
      this.lastExecuted = void 0;
      this.deadline = void 0;
      this.value;
    }
    toString() {
      return "(" + (this.executed ? 1 : 0) + "," + (this.included ? 1 : 0) + "," + (this.pending ? 1 : 0) + ")";
    }
  };
  var Event = class {
    constructor(n, l, p, g = new DCRGraph()) {
      this.children = g;
      this.loading = false;
      this.parent = p;
      this.name = n;
      this.label = l;
      this.events = new Set();
      this.marking = new Marking(false, true, false);
      this.conditions = new Set();
      this.respones = new Set();
      this.milestones = new Set();
      this.includes = new Set();
      this.excludes = new Set();
    }
    get isSubProcess() {
      return this.children.events.size > 0;
    }
    enabled() {
      if (this.parent instanceof Event) {
        if (!this.parent.enabled())
          return false;
      }
      for (var e of this.events)
        if (!e.isAccepting)
          return false;
      if (!this.marking.included)
        return false;
      for (var r of this.conditions)
        if (eval(r.guard)) {
          var e = r.src;
          if (e.marking.included && !e.marking.executed)
            return false;
          if (r.delay !== void 0) {
            if (r.delay > e.marking.lastExecuted)
              return false;
          }
        }
      for (var r of this.milestones)
        if (eval(r.guard)) {
          var e = r.src;
          if (e.marking.included && e.marking.pending)
            return false;
        }
      return true;
    }
    canTimeStep(diff) {
      if (this.marking.deadline !== void 0)
        return this.marking.deadline <= diff;
    }
    timeStep(diff) {
      if (this.marking.lastExecuted !== void 0)
        this.marking.lastExecuted += diff;
      if (this.marking.deadline !== void 0)
        this.marking.deadline -= diff;
    }
    execute() {
      if (!this.enabled())
        return;
      this.marking.executed = true;
      this.marking.pending = false;
      this.marking.deadline = void 0;
      this.marking.lastExecuted = 0;
      for (var r of this.respones)
        if (eval(r.guard)) {
          var e = r.trg;
          e.marking.pending = true;
          e.marking.deadline = r.deadline;
        }
      for (var r of this.excludes)
        if (eval(r.guard)) {
          var e = r.trg;
          e.marking.included = false;
        }
      for (var r of this.includes)
        if (eval(r.guard)) {
          var e = r.trg;
          e.marking.included = true;
        }
      if (this.parent instanceof Event) {
        if (this.parent.enabled())
          this.parent.execute();
      }
      return;
    }
    isAccepting() {
      return !(this.marking.pending && this.marking.included);
    }
  };
  var DCRGraph = class {
    constructor(pg) {
      this.parent = void 0;
      this.parentGraphTemp = void 0;
      this.events = new Map();
      this.parentGraphTemp = pg;
    }
    parentGraph() {
      if (this.parent === void 0)
        return this.parentGraphTemp;
      else
        return this.parent.parent;
    }
    root() {
      if (this.parentGraph() !== void 0)
        return this.parentGraph().root();
      else
        return this;
    }
    removeEvent(o) {
      this.events.delete(o.name);
      for (var e of this.events.values()) {
        e.children.removeEvent(o);
      }
    }
    replaceEvent(o, n) {
      for (var e of this.events.values()) {
        if (e === o) {
          for (var r of o.conditions)
            n.conditions.push(r);
          for (var r of o.milestones)
            n.milestones.push(r);
          for (var r of o.respones)
            n.respones.push(r);
          for (var r of o.includes)
            n.includes.push(r);
          for (var r of o.excludes)
            n.excludes.push(r);
          delete this.events[e.name];
        }
        this.replaceInRelation(e.conditions, o, n);
        this.replaceInRelation(e.milestones, o, n);
        this.replaceInRelation(e.respones, o, n);
        this.replaceInRelation(e.includes, o, n);
        this.replaceInRelation(e.excludes, o, n);
      }
    }
    replaceInRelation(r, o, n) {
      for (var e of r)
        if (e === o) {
          r.delete(o);
          r.add(n);
        }
    }
    hasEvent(n) {
      return this.getEvent(n) !== void 0;
    }
    getEvent(n) {
      if (this.events.has(n))
        return this.events.get(n);
      for (var e of this.events.values()) {
        if (e.children.getEvent(n) !== void 0)
          return e.children.getEvent(n);
      }
      return void 0;
    }
    addLoadingEvent(n) {
      if (this.hasEvent(n))
        return this.getEvent(n);
      if (this.root().hasEvent(n))
        return this.root().getEvent(n);
      var e = this.addEvent(n);
      e.loading = true;
      return e;
    }
    addEvent(n, l = n, m = { ex: false, in: true, pe: false }, g = new DCRGraph()) {
      if (this.hasEvent(n) || this.root().hasEvent(n)) {
        if (this.hasEvent(n))
          var e = this.getEvent(n);
        else
          var e = this.root().getEvent(n);
        if (!e.loading)
          throw new Error("Event '" + n + "' is hard defined in more than one location!");
        else {
          this.removeEvent(e);
          this.root().removeEvent(e);
          e.label = l;
          e.parent = this;
          e.children = g;
        }
      } else {
        var e = new Event(n, l, this, g);
      }
      this.events.set(n, e);
      g.parent = e;
      e.marking.executed = m.ex;
      e.marking.included = m.in;
      e.marking.pending = m.pe;
      if (m.deadline !== void 0)
        e.marking.deadline = m.deadline;
      if (m.lastExecuted !== void 0)
        e.marking.lastExecuted = m.lastExecuted;
      return e;
    }
    addCondition(src, trg, delay = void 0, guard = true) {
      if (!this.root().hasEvent(src))
        var eSrc = this.addLoadingEvent(src);
      else
        var eSrc = this.root().getEvent(src);
      if (!this.root().hasEvent(trg))
        var eTrg = this.addLoadingEvent(trg);
      else
        var eTrg = this.root().getEvent(trg);
      eTrg.conditions.add({ src: eSrc, delay, guard });
    }
    addMilestone(src, trg, guard = true) {
      if (!this.root().hasEvent(src))
        var eSrc = this.addLoadingEvent(src);
      else
        var eSrc = this.root().getEvent(src);
      if (!this.root().hasEvent(trg))
        var eTrg = this.addLoadingEvent(trg);
      else
        var eTrg = this.root().getEvent(trg);
      eTrg.milestones.add({ src: eSrc, guard });
    }
    addResponse(src, trg, deadline = void 0, guard = true) {
      if (!this.root().hasEvent(src))
        var eSrc = this.addLoadingEvent(src);
      else
        var eSrc = this.root().getEvent(src);
      if (!this.root().hasEvent(trg))
        var eTrg = this.addLoadingEvent(trg);
      else
        var eTrg = this.root().getEvent(trg);
      eSrc.respones.add({ trg: eTrg, deadline, guard });
    }
    addInclude(src, trg, guard = true) {
      if (!this.root().hasEvent(src))
        var eSrc = this.addLoadingEvent(src);
      else
        var eSrc = this.root().getEvent(src);
      if (!this.root().hasEvent(trg))
        var eTrg = this.addLoadingEvent(trg);
      else
        var eTrg = this.root().getEvent(trg);
      eSrc.includes.add({ trg: eTrg, guard });
    }
    addExclude(src, trg, guard = true) {
      if (!this.root().hasEvent(src))
        var eSrc = this.addLoadingEvent(src);
      else
        var eSrc = this.root().getEvent(src);
      if (!this.root().hasEvent(trg))
        var eTrg = this.addLoadingEvent(trg);
      else
        var eTrg = this.root().getEvent(trg);
      eSrc.excludes.add({ trg: eTrg, guard });
    }
    execute(e) {
      if (!this.hasEvent(e))
        return;
      this.getEvent(e).execute();
    }
    isAccepting() {
      for (var e of this.events.values())
        if (!e.isAccepting())
          return false;
      return true;
    }
    canTimeStep(diff) {
      for (var e of this.events.values())
        if (!e.canTimeStep(diff))
          return false;
      return true;
    }
    timeStep(diff) {
      for (var e of this.events.values())
        e.timeStep(diff);
    }
    status() {
      var result = [];
      for (var e of this.events.values()) {
        result.push({ executed: e.marking.executed, pending: e.marking.pending, included: e.marking.included, enabled: e.enabled(), name: e.name, lastExecuted: e.marking.lastExecuted, deadline: e.marking.deadline, label: e.label });
        for (var s of e.children.status()) {
          result.push({ executed: s.executed, pending: s.pending, included: s.included, enabled: s.enabled, name: s.name, lastExecuted: s.lastExecuted, deadline: s.deadline, label: e.label + "." + s.label });
        }
      }
      return result;
    }
  };

  // js/dcr_parser.js
  var dcr_parser_default = parser = function() {
    "use strict";
    function peg$subclass(child, parent) {
      function ctor() {
        this.constructor = child;
      }
      ctor.prototype = parent.prototype;
      child.prototype = new ctor();
    }
    function peg$SyntaxError(message, expected, found, location2) {
      this.message = message;
      this.expected = expected;
      this.found = found;
      this.location = location2;
      this.name = "SyntaxError";
      if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(this, peg$SyntaxError);
      }
    }
    peg$subclass(peg$SyntaxError, Error);
    peg$SyntaxError.buildMessage = function(expected, found) {
      var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return '"' + literalEscape(expectation.text) + '"';
        },
        "class": function(expectation) {
          var escapedParts = "", i;
          for (i = 0; i < expectation.parts.length; i++) {
            escapedParts += expectation.parts[i] instanceof Array ? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1]) : classEscape(expectation.parts[i]);
          }
          return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },
        any: function(expectation) {
          return "any character";
        },
        end: function(expectation) {
          return "end of input";
        },
        other: function(expectation) {
          return expectation.description;
        }
      };
      function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
      }
      function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
      }
      function describeExpected(expected2) {
        var descriptions = new Array(expected2.length), i, j;
        for (i = 0; i < expected2.length; i++) {
          descriptions[i] = describeExpectation(expected2[i]);
        }
        descriptions.sort();
        if (descriptions.length > 0) {
          for (i = 1, j = 1; i < descriptions.length; i++) {
            if (descriptions[i - 1] !== descriptions[i]) {
              descriptions[j] = descriptions[i];
              j++;
            }
          }
          descriptions.length = j;
        }
        switch (descriptions.length) {
          case 1:
            return descriptions[0];
          case 2:
            return descriptions[0] + " or " + descriptions[1];
          default:
            return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
      }
      function describeFound(found2) {
        return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
      }
      return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    function peg$parse(input, options) {
      options = options !== void 0 ? options : {};
      var peg$FAILED = {}, peg$startRuleFunctions = { File: peg$parseFile }, peg$startRuleFunction = peg$parseFile, peg$c0 = function(g) {
        return g;
      }, peg$c1 = function() {
        graphs.push(new DCRGraph(top()));
      }, peg$c2 = function() {
        return graphs.pop();
      }, peg$c3 = "{", peg$c4 = peg$literalExpectation("{", false), peg$c5 = "}", peg$c6 = peg$literalExpectation("}", false), peg$c7 = function(n, l, m, g) {
        top().addEvent(n, l, m, g);
      }, peg$c8 = function(n, m, g) {
        top().addEvent(n, n, m, g);
      }, peg$c9 = function(n, l, m) {
        top().addEvent(n, l, m);
      }, peg$c10 = function(n, m) {
        top().addEvent(n, n, m);
      }, peg$c11 = "()", peg$c12 = peg$literalExpectation("()", false), peg$c13 = function() {
        return { ex: false, in: true, pe: false };
      }, peg$c14 = "(", peg$c15 = peg$literalExpectation("(", false), peg$c16 = ")", peg$c17 = peg$literalExpectation(")", false), peg$c18 = function(b1, b2, b3) {
        return { ex: b1, in: b2, pe: b3 };
      }, peg$c19 = "-", peg$c20 = peg$literalExpectation("-", false), peg$c21 = "->*", peg$c22 = peg$literalExpectation("->*", false), peg$c23 = function(es1, d, g, es2) {
        for (var e1 of es1)
          for (var e2 of es2)
            top().addCondition(e1, e2, d, g);
      }, peg$c24 = "-><>", peg$c25 = peg$literalExpectation("-><>", false), peg$c26 = function(es1, g, es2) {
        for (var e1 of es1)
          for (var e2 of es2)
            top().addMilestone(e1, e2, g);
      }, peg$c27 = "*-", peg$c28 = peg$literalExpectation("*-", false), peg$c29 = "->", peg$c30 = peg$literalExpectation("->", false), peg$c31 = function(es1, d, g, es2) {
        for (var e1 of es1)
          for (var e2 of es2)
            top().addResponse(e1, e2, d, g);
      }, peg$c32 = "->+", peg$c33 = peg$literalExpectation("->+", false), peg$c34 = function(es1, g, es2) {
        for (var e1 of es1)
          for (var e2 of es2)
            top().addInclude(e1, e2, g);
      }, peg$c35 = "->%", peg$c36 = peg$literalExpectation("->%", false), peg$c37 = function(es1, g, es2) {
        for (var e1 of es1)
          for (var e2 of es2)
            top().addExclude(e1, e2, g);
      }, peg$c38 = function(i) {
        return i;
      }, peg$c39 = function() {
        return void 0;
      }, peg$c40 = "[", peg$c41 = peg$literalExpectation("[", false), peg$c42 = "]", peg$c43 = peg$literalExpectation("]", false), peg$c44 = function(exp) {
        return exp;
      }, peg$c45 = function() {
        return true;
      }, peg$c46 = "", peg$c47 = function(n) {
        return [n];
      }, peg$c48 = function(ns) {
        return ns;
      }, peg$c49 = function(n, ns) {
        ns.push(n);
        return ns;
      }, peg$c50 = " ", peg$c51 = peg$literalExpectation(" ", false), peg$c52 = function(t, ws, n) {
        return t.concat(ws.join(""), n);
      }, peg$c53 = /^[a-z]/, peg$c54 = peg$classExpectation([["a", "z"]], false, false), peg$c55 = /^[A-Z]/, peg$c56 = peg$classExpectation([["A", "Z"]], false, false), peg$c57 = /^[0-9]/, peg$c58 = peg$classExpectation([["0", "9"]], false, false), peg$c59 = "_", peg$c60 = peg$literalExpectation("_", false), peg$c61 = function(str) {
        return str.join("");
      }, peg$c62 = "<", peg$c63 = peg$literalExpectation("<", false), peg$c64 = ">", peg$c65 = peg$literalExpectation(">", false), peg$c66 = function(lab) {
        return lab.join("");
      }, peg$c67 = "0", peg$c68 = peg$literalExpectation("0", false), peg$c69 = function() {
        return false;
      }, peg$c70 = "1", peg$c71 = peg$literalExpectation("1", false), peg$c72 = function() {
        return true;
      }, peg$c73 = "false", peg$c74 = peg$literalExpectation("false", false), peg$c75 = "true", peg$c76 = peg$literalExpectation("true", false), peg$c77 = "f", peg$c78 = peg$literalExpectation("f", false), peg$c79 = "t", peg$c80 = peg$literalExpectation("t", false), peg$c81 = peg$otherExpectation("Integer"), peg$c82 = function() {
        return parseInt(text(), 10);
      }, peg$c83 = ";", peg$c84 = peg$literalExpectation(";", false), peg$c85 = "\r\n", peg$c86 = peg$literalExpectation("\r\n", false), peg$c87 = "\n", peg$c88 = peg$literalExpectation("\n", false), peg$c89 = peg$anyExpectation(), peg$c90 = ",", peg$c91 = peg$literalExpectation(",", false), peg$c92 = "	", peg$c93 = peg$literalExpectation("	", false), peg$currPos = 0, peg$savedPos = 0, peg$posDetailsCache = [{ line: 1, column: 1 }], peg$maxFailPos = 0, peg$maxFailExpected = [], peg$silentFails = 0, peg$result;
      if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
      function text() {
        return input.substring(peg$savedPos, peg$currPos);
      }
      function location2() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
      }
      function expected(description, location3) {
        location3 = location3 !== void 0 ? location3 : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location3);
      }
      function error(message, location3) {
        location3 = location3 !== void 0 ? location3 : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location3);
      }
      function peg$literalExpectation(text2, ignoreCase) {
        return { type: "literal", text: text2, ignoreCase };
      }
      function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts, inverted, ignoreCase };
      }
      function peg$anyExpectation() {
        return { type: "any" };
      }
      function peg$endExpectation() {
        return { type: "end" };
      }
      function peg$otherExpectation(description) {
        return { type: "other", description };
      }
      function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos], p;
        if (details) {
          return details;
        } else {
          p = pos - 1;
          while (!peg$posDetailsCache[p]) {
            p--;
          }
          details = peg$posDetailsCache[p];
          details = {
            line: details.line,
            column: details.column
          };
          while (p < pos) {
            if (input.charCodeAt(p) === 10) {
              details.line++;
              details.column = 1;
            } else {
              details.column++;
            }
            p++;
          }
          peg$posDetailsCache[pos] = details;
          return details;
        }
      }
      function peg$computeLocation(startPos, endPos) {
        var startPosDetails = peg$computePosDetails(startPos), endPosDetails = peg$computePosDetails(endPos);
        return {
          start: {
            offset: startPos,
            line: startPosDetails.line,
            column: startPosDetails.column
          },
          end: {
            offset: endPos,
            line: endPosDetails.line,
            column: endPosDetails.column
          }
        };
      }
      function peg$fail(expected2) {
        if (peg$currPos < peg$maxFailPos) {
          return;
        }
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected2);
      }
      function peg$buildSimpleError(message, location3) {
        return new peg$SyntaxError(message, null, null, location3);
      }
      function peg$buildStructuredError(expected2, found, location3) {
        return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected2, found), expected2, found, location3);
      }
      function peg$parseFile() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseDCRGraph();
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c0(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parseDCRGraph() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
        s0 = peg$currPos;
        peg$savedPos = peg$currPos;
        s1 = peg$c1();
        if (s1) {
          s1 = peg$FAILED;
        } else {
          s1 = void 0;
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseRelation();
          if (s2 === peg$FAILED) {
            s2 = peg$parseEvent();
            if (s2 === peg$FAILED) {
              s2 = peg$parseEmpty();
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$currPos;
            s5 = peg$parse_();
            if (s5 !== peg$FAILED) {
              s6 = peg$parseNxt();
              if (s6 !== peg$FAILED) {
                s7 = peg$parse_();
                if (s7 !== peg$FAILED) {
                  s8 = peg$parseRelation();
                  if (s8 === peg$FAILED) {
                    s8 = peg$parseEvent();
                  }
                  if (s8 !== peg$FAILED) {
                    s9 = peg$parse_();
                    if (s9 !== peg$FAILED) {
                      s5 = [s5, s6, s7, s8, s9];
                      s4 = s5;
                    } else {
                      peg$currPos = s4;
                      s4 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
            if (s4 === peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseEOL();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            }
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$currPos;
              s5 = peg$parse_();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseNxt();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parse_();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseRelation();
                    if (s8 === peg$FAILED) {
                      s8 = peg$parseEvent();
                    }
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parse_();
                      if (s9 !== peg$FAILED) {
                        s5 = [s5, s6, s7, s8, s9];
                        s4 = s5;
                      } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s4;
                      s4 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
              if (s4 === peg$FAILED) {
                s4 = peg$currPos;
                s5 = peg$parse_();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parseEOL();
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      s5 = [s5, s6, s7];
                      s4 = s5;
                    } else {
                      peg$currPos = s4;
                      s4 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c2();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parseEvent() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
        s0 = peg$currPos;
        s1 = peg$parseName();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseLabel();
            if (s3 !== peg$FAILED) {
              s4 = peg$parse_();
              if (s4 !== peg$FAILED) {
                s5 = peg$parseMarking();
                if (s5 !== peg$FAILED) {
                  s6 = peg$parse__();
                  if (s6 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 123) {
                      s7 = peg$c3;
                      peg$currPos++;
                    } else {
                      s7 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$c4);
                      }
                    }
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parse__();
                      if (s8 !== peg$FAILED) {
                        s9 = peg$parseDCRGraph();
                        if (s9 !== peg$FAILED) {
                          s10 = peg$parse__();
                          if (s10 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 125) {
                              s11 = peg$c5;
                              peg$currPos++;
                            } else {
                              s11 = peg$FAILED;
                              if (peg$silentFails === 0) {
                                peg$fail(peg$c6);
                              }
                            }
                            if (s11 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c7(s1, s3, s5, s9);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseName();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseMarking();
              if (s3 !== peg$FAILED) {
                s4 = peg$parse__();
                if (s4 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 123) {
                    s5 = peg$c3;
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c4);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse__();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parseDCRGraph();
                      if (s7 !== peg$FAILED) {
                        s8 = peg$parse__();
                        if (s8 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 125) {
                            s9 = peg$c5;
                            peg$currPos++;
                          } else {
                            s9 = peg$FAILED;
                            if (peg$silentFails === 0) {
                              peg$fail(peg$c6);
                            }
                          }
                          if (s9 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c8(s1, s3, s7);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseName();
            if (s1 !== peg$FAILED) {
              s2 = peg$parse_();
              if (s2 !== peg$FAILED) {
                s3 = peg$parseLabel();
                if (s3 !== peg$FAILED) {
                  s4 = peg$parse_();
                  if (s4 !== peg$FAILED) {
                    s5 = peg$parseMarking();
                    if (s5 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c9(s1, s3, s5);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseName();
              if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                  s3 = peg$parseMarking();
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c10(s1, s3);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            }
          }
        }
        return s0;
      }
      function peg$parseMarking() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c11) {
          s1 = peg$c11;
          peg$currPos += 2;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c12);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c13();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c14;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c15);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              s3 = peg$parseBool();
              if (s3 !== peg$FAILED) {
                s4 = peg$parseSep();
                if (s4 !== peg$FAILED) {
                  s5 = peg$parseBool();
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parseSep();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parseBool();
                      if (s7 !== peg$FAILED) {
                        s8 = peg$parse_();
                        if (s8 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 41) {
                            s9 = peg$c16;
                            peg$currPos++;
                          } else {
                            s9 = peg$FAILED;
                            if (peg$silentFails === 0) {
                              peg$fail(peg$c17);
                            }
                          }
                          if (s9 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c18(s3, s5, s7);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseEmpty();
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c13();
            }
            s0 = s1;
          }
        }
        return s0;
      }
      function peg$parseRelation() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8;
        s0 = peg$currPos;
        s1 = peg$parseEventids();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
              s3 = peg$c19;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c20);
              }
            }
            if (s3 !== peg$FAILED) {
              s4 = peg$parseTime();
              if (s4 !== peg$FAILED) {
                s5 = peg$parseGuard();
                if (s5 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 3) === peg$c21) {
                    s6 = peg$c21;
                    peg$currPos += 3;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c22);
                    }
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parseEventids();
                      if (s8 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c23(s1, s4, s5, s8);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseEventids();
          if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 45) {
                s3 = peg$c19;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c20);
                }
              }
              if (s3 !== peg$FAILED) {
                s4 = peg$parseGuard();
                if (s4 !== peg$FAILED) {
                  if (input.substr(peg$currPos, 4) === peg$c24) {
                    s5 = peg$c24;
                    peg$currPos += 4;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c25);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (s6 !== peg$FAILED) {
                      s7 = peg$parseEventids();
                      if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c26(s1, s4, s7);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseEventids();
            if (s1 !== peg$FAILED) {
              s2 = peg$parse_();
              if (s2 !== peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c27) {
                  s3 = peg$c27;
                  peg$currPos += 2;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c28);
                  }
                }
                if (s3 !== peg$FAILED) {
                  s4 = peg$parseTime();
                  if (s4 !== peg$FAILED) {
                    s5 = peg$parseGuard();
                    if (s5 !== peg$FAILED) {
                      if (input.substr(peg$currPos, 2) === peg$c29) {
                        s6 = peg$c29;
                        peg$currPos += 2;
                      } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$c30);
                        }
                      }
                      if (s6 !== peg$FAILED) {
                        s7 = peg$parse_();
                        if (s7 !== peg$FAILED) {
                          s8 = peg$parseEventids();
                          if (s8 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c31(s1, s4, s5, s8);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parseEventids();
              if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 45) {
                    s3 = peg$c19;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c20);
                    }
                  }
                  if (s3 !== peg$FAILED) {
                    s4 = peg$parseGuard();
                    if (s4 !== peg$FAILED) {
                      if (input.substr(peg$currPos, 3) === peg$c32) {
                        s5 = peg$c32;
                        peg$currPos += 3;
                      } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$c33);
                        }
                      }
                      if (s5 !== peg$FAILED) {
                        s6 = peg$parse_();
                        if (s6 !== peg$FAILED) {
                          s7 = peg$parseEventids();
                          if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c34(s1, s4, s7);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseEventids();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parse_();
                  if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 45) {
                      s3 = peg$c19;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$c20);
                      }
                    }
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parseGuard();
                      if (s4 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 3) === peg$c35) {
                          s5 = peg$c35;
                          peg$currPos += 3;
                        } else {
                          s5 = peg$FAILED;
                          if (peg$silentFails === 0) {
                            peg$fail(peg$c36);
                          }
                        }
                        if (s5 !== peg$FAILED) {
                          s6 = peg$parse_();
                          if (s6 !== peg$FAILED) {
                            s7 = peg$parseEventids();
                            if (s7 !== peg$FAILED) {
                              peg$savedPos = s0;
                              s1 = peg$c37(s1, s4, s7);
                              s0 = s1;
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              }
            }
          }
        }
        return s0;
      }
      function peg$parseTime() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c14;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c15);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseInteger();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s3 = peg$c16;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c17);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c38(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseEmpty();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c39();
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parseGuard() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c40;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c41);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$parseExpression();
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s3 = peg$c42;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c43);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c44(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseEmpty();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c45();
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parseExpression() {
        var s0;
        s0 = peg$c46;
        return s0;
      }
      function peg$parseEventids() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parseName();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c47(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c14;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c15);
            }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parseNames();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s3 = peg$c16;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c17);
                }
              }
              if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c48(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
        return s0;
      }
      function peg$parseNames() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parseName();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseSep();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseNames();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c49(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parseName();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c47(s1);
          }
          s0 = s1;
        }
        return s0;
      }
      function peg$parseName() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parseText();
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (input.charCodeAt(peg$currPos) === 32) {
            s3 = peg$c50;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c51);
            }
          }
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              if (input.charCodeAt(peg$currPos) === 32) {
                s3 = peg$c50;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c51);
                }
              }
            }
          } else {
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parseName();
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c52(s1, s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$parseText();
        }
        return s0;
      }
      function peg$parseText() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        if (peg$c53.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c54);
          }
        }
        if (s2 === peg$FAILED) {
          if (peg$c55.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c56);
            }
          }
          if (s2 === peg$FAILED) {
            if (peg$c57.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c58);
              }
            }
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 95) {
                s2 = peg$c59;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c60);
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c53.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c54);
              }
            }
            if (s2 === peg$FAILED) {
              if (peg$c55.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c56);
                }
              }
              if (s2 === peg$FAILED) {
                if (peg$c57.test(input.charAt(peg$currPos))) {
                  s2 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c58);
                  }
                }
                if (s2 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 95) {
                    s2 = peg$c59;
                    peg$currPos++;
                  } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c60);
                    }
                  }
                }
              }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c61(s1);
        }
        s0 = s1;
        return s0;
      }
      function peg$parseLabel() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 60) {
          s1 = peg$c62;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c63);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (peg$c53.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c54);
            }
          }
          if (s3 === peg$FAILED) {
            if (peg$c55.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c56);
              }
            }
            if (s3 === peg$FAILED) {
              if (peg$c57.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c58);
                }
              }
              if (s3 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 95) {
                  s3 = peg$c59;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c60);
                  }
                }
                if (s3 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 45) {
                    s3 = peg$c19;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c20);
                    }
                  }
                  if (s3 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 32) {
                      s3 = peg$c50;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$c51);
                      }
                    }
                  }
                }
              }
            }
          }
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              if (peg$c53.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c54);
                }
              }
              if (s3 === peg$FAILED) {
                if (peg$c55.test(input.charAt(peg$currPos))) {
                  s3 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c56);
                  }
                }
                if (s3 === peg$FAILED) {
                  if (peg$c57.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c58);
                    }
                  }
                  if (s3 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 95) {
                      s3 = peg$c59;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$c60);
                      }
                    }
                    if (s3 === peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 45) {
                        s3 = peg$c19;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$c20);
                        }
                      }
                      if (s3 === peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 32) {
                          s3 = peg$c50;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) {
                            peg$fail(peg$c51);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 62) {
              s3 = peg$c64;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c65);
              }
            }
            if (s3 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c66(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parseBool() {
        var s0, s1;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 48) {
          s1 = peg$c67;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c68);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c69();
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 49) {
            s1 = peg$c70;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c71);
            }
          }
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c72();
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 5) === peg$c73) {
              s1 = peg$c73;
              peg$currPos += 5;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c74);
              }
            }
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c69();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              if (input.substr(peg$currPos, 4) === peg$c75) {
                s1 = peg$c75;
                peg$currPos += 4;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c76);
                }
              }
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c72();
              }
              s0 = s1;
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 102) {
                  s1 = peg$c77;
                  peg$currPos++;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$c78);
                  }
                }
                if (s1 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c69();
                }
                s0 = s1;
                if (s0 === peg$FAILED) {
                  s0 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 116) {
                    s1 = peg$c79;
                    peg$currPos++;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$c80);
                    }
                  }
                  if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c72();
                  }
                  s0 = s1;
                }
              }
            }
          }
        }
        return s0;
      }
      function peg$parseInteger() {
        var s0, s1, s2, s3;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (peg$c57.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c58);
            }
          }
          if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
              s2.push(s3);
              if (peg$c57.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$c58);
                }
              }
            }
          } else {
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c82();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c81);
          }
        }
        return s0;
      }
      function peg$parseNxt() {
        var s0;
        s0 = peg$parseEOL();
        if (s0 === peg$FAILED) {
          s0 = peg$parseEOF();
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 59) {
              s0 = peg$c83;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c84);
              }
            }
          }
        }
        return s0;
      }
      function peg$parseEOL() {
        var s0;
        if (input.substr(peg$currPos, 2) === peg$c85) {
          s0 = peg$c85;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c86);
          }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 10) {
            s0 = peg$c87;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c88);
            }
          }
        }
        return s0;
      }
      function peg$parseEOF() {
        var s0, s1;
        s0 = peg$currPos;
        peg$silentFails++;
        if (input.length > peg$currPos) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c89);
          }
        }
        peg$silentFails--;
        if (s1 === peg$FAILED) {
          s0 = void 0;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parseSep() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s2 = peg$c90;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c91);
            }
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parse_();
            if (s3 !== peg$FAILED) {
              s1 = [s1, s2, s3];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parse_() {
        var s0, s1;
        s0 = [];
        if (input.charCodeAt(peg$currPos) === 32) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c51);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 9) {
            s1 = peg$c92;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c93);
            }
          }
        }
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (input.charCodeAt(peg$currPos) === 32) {
            s1 = peg$c50;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c51);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 9) {
              s1 = peg$c92;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c93);
              }
            }
          }
        }
        return s0;
      }
      function peg$parse__() {
        var s0, s1;
        s0 = [];
        if (input.charCodeAt(peg$currPos) === 32) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$c51);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 9) {
            s1 = peg$c92;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c93);
            }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$parseEOL();
          }
        }
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (input.charCodeAt(peg$currPos) === 32) {
            s1 = peg$c50;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$c51);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 9) {
              s1 = peg$c92;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$c93);
              }
            }
            if (s1 === peg$FAILED) {
              s1 = peg$parseEOL();
            }
          }
        }
        return s0;
      }
      function peg$parseEmpty() {
        var s0;
        s0 = peg$c46;
        return s0;
      }
      var graphs = [];
      var top = function() {
        return graphs[graphs.length - 1];
      };
      peg$result = peg$startRuleFunction();
      if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
          peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
      }
    }
    return {
      SyntaxError: peg$SyntaxError,
      parse: peg$parse
    };
  }();

  // js/Simulation.js
  var Simulation = class {
    constructor(input) {
      this.graph = dcr_parser_default.parse(input);
      this.users = [];
      this.id = 1;
      this.isRunning = false;
      this.isPaused = false;
      this.startTime = void 0;
      this.stopTime = void 0;
      this.ready = true;
      this.log = new Log();
    }
    changeGraph(input) {
      this.graph = dcr_parser_default.parse(input);
    }
    executeEvent(event, userID) {
      this.graph.execute(event);
      var index2 = this.users.findIndex((user2) => user2.id == userID);
      this.log.logEvent(userID, this.users[index2].name, event, new Date().toLocaleString(), this.users[index2].roles);
    }
    startSimulation() {
      this.isRunning = true;
      this.log.discardLog();
      this.log.logEvent("ID", "Name", "Event", "Date", "Roles");
      this.log.newTrace("Nyt trace");
      this.startTime = new Date().toLocaleString();
    }
    stopSimulation() {
      this.isRunning = false;
      this.isPaused = false;
      this.stopTime = new Date().toLocaleString();
    }
    pauseSimulation() {
      this.isRunning = false;
      this.isPaused = true;
    }
    resumeSimulation() {
      this.isRunning = true;
      this.isPaused = false;
    }
    addUsers(user2) {
      this.users.push(user2);
    }
    checkIfReady() {
      this.ready = true;
      this.users.forEach((u) => {
        if (!u.name || !u.id || !u.roles) {
          this.ready = false;
        }
      });
      return this.ready;
    }
    saveLog() {
      this.log.saveLog();
    }
    discardLog() {
      this.log.discardLog();
    }
    hello() {
      if (this.isRunning) {
        console.log("Hello, i AM running :)");
      } else {
        console.log("Hello, i am NOT running :(");
      }
    }
  };
  var User = class {
    constructor(id, name, roles) {
      this.id = id;
      this.name = name;
      this.roles = roles;
    }
  };

  // js/dynamic_table.js
  var dynamicTable = function() {
    var _tableId, _table, _fields, _headers, _defaultText;
    function _buildRowColumns(names, item) {
      var row = "<tr>";
      if (names && names.length > 0) {
        $.each(names, function(index2, name) {
          var c = item ? item[name + ""] : name;
          row += "<td>" + c + "</td>";
        });
      }
      row += "</tr>";
      return row;
    }
    function _setHeaders() {
      _headers = _headers == null || _headers.length < 1 ? _fields : _headers;
      var h = _buildRowColumns(_headers);
      if (_table.children("thead").length < 1)
        _table.prepend("<thead></thead>");
      _table.children("thead").html(h);
    }
    function _setNoItemsInfo() {
      if (_table.length < 1)
        return;
      var colspan = _headers != null && _headers.length > 0 ? 'colspan="' + _headers.length + '"' : "";
      var content = '<tr class="no-items"><td ' + colspan + ' style="text-align:center">' + _defaultText + "</td></tr>";
      if (_table.children("tbody").length > 0)
        _table.children("tbody").html(content);
      else
        _table.append("<tbody>" + content + "</tbody>");
    }
    function _removeNoItemsInfo() {
      var c = _table.children("tbody").children("tr");
      if (c.length == 1 && c.hasClass("no-items"))
        _table.children("tbody").empty();
    }
    return {
      config: function(tableId, fields, headers, defaultText) {
        _tableId = tableId;
        _table = $("#" + tableId);
        _fields = fields || null;
        _headers = headers || null;
        _defaultText = defaultText || "No items to list...";
        _setHeaders();
        _setNoItemsInfo();
        return this;
      },
      load: function(data, append) {
        if (_table.length < 1)
          return;
        _setHeaders();
        _removeNoItemsInfo();
        if (data && data.length > 0) {
          var rows = "";
          $.each(data, function(index2, item) {
            rows += _buildRowColumns(_fields, item);
          });
          var mthd = append ? "append" : "html";
          _table.children("tbody")[mthd](rows);
        } else {
          _setNoItemsInfo();
        }
        return this;
      },
      clear: function() {
        _setNoItemsInfo();
        return this;
      }
    };
  }();

  // js/communication.js
  var app = {};
  var connections = [];
  var initialState = { type: "textField", id: "ta-dcr", data: "A(0,0,0)        \nB(0,1,1)        \nA -->* B\nB *--> A\nC -->% A\nD -->+ A    \nD -->* B\nA --><> (B, D)    \n  " };
  var updates = [initialState];
  app.peer = new Peer();
  var connected = false;
  var server = false;
  var client = false;
  var connCheckDelayTimeMs = 300;
  var myId = null;
  app.peer.on("open", function(id) {
    myId = id;
    user = new User(myId, "server", ["Robot", "Human"]);
    handleNewUser(user, true, myId);
    document.getElementById("my-id").innerHTML = "<div>My ID: </div><div id=id_num>" + myId + "</div><br/>";
    localStorage.setItem("myID", myId);
  });
  function connect() {
    app.conn = app.peer.connect(document.getElementById("peer-input-id").value);
    app.conn.on("open", function() {
      if (!connected && !server) {
        connections.push(app.conn);
        handleNewUser(new User(app.conn.peer, "server", ["Robot", "Human"]), false, myId);
        if (!connected) {
          document.getElementById("conn-status").innerHTML = "Connection established as Client";
          document.getElementById("btn-time").style.display = "none";
          document.getElementById("btn-start-sim").style.display = "none";
          document.getElementById("btn-stop-sim").style.display = "none";
          document.getElementById("btn-start-manual-sim").style.display = "none";
          document.getElementById("btn-stop-manual-sim").style.display = "none";
          client = true;
          connBlockStatus(false);
          connected = true;
          connectionChecker();
        }
      }
    });
    app.conn.on("data", function(data) {
      if (connected && !server) {
        updates.push(data);
        executeUpdateEvent(data, false);
      }
    });
  }
  app.peer.on("connection", function(c) {
    app.conn = c;
    app.conn.on("open", function(incomingPeerId) {
      if (sim.isRunning || sim.isPaused) {
        c.send({ type: "simRunningServer" });
      } else {
        if (!client) {
          connections.push(c);
          handleNewUser(new User(c.peer), true);
          if (!connected) {
            document.getElementById("conn-status").innerHTML = "Connection established as Server";
            server = true;
            connBlockStatus(false);
            connected = true;
            connectionChecker();
          }
          sendUpdates(c);
        }
      }
    });
    app.conn.on("data", function(data) {
      if (connected && !client) {
        updates.push(data);
        executeUpdateEvent(data, true, c.peer);
      }
    });
  });
  function sendUpdates(c) {
    if (c && c.open)
      c.send({ type: "updateHistory", data: updates });
  }
  function updateOthers(stateUpdate, excludeFromUpdate = null) {
    updates.push(stateUpdate);
    if (connections.length > 0) {
      connections.forEach((c) => {
        if (c && c.open && excludeFromUpdate != c.peer)
          c.send(stateUpdate);
      });
    }
  }
  function executeUpdateEvent(data, updateOthers2 = false, excludeFromUpdate = null) {
    if (data.type == "textField") {
      document.getElementById(data.id).value = data.data;
      handleTextAreaChange(updateOthers2, excludeFromUpdate);
    } else if (data.type == "eventButton") {
      handleEventButtonClick(data.id, data.data, updateOthers2, excludeFromUpdate);
    } else if (data.type == "manualSimButton") {
      handleManualSimButtonClick(data.id, updateOthers2, excludeFromUpdate);
    } else if (data.type == "newUser") {
      if (!sim.users.some((user2) => user2.id === data.id.id)) {
        sim.addUsers(new User(data.id.id));
      }
      if (sim.users.some((user2) => user2.id === data.id.id) && data.id.id === myId && client) {
        index = sim.users.findIndex((user2) => user2.id == data.id.id);
        sim.users[index].name = void 0;
        sim.users[index].roles = [];
      }
    } else if (data.type == "name") {
      index = sim.users.findIndex((user2) => user2.id == data.id);
      sim.users[index].name = data.data;
      handleSubmitNameButton(data.data, data.id, updateOthers2, excludeFromUpdate);
    } else if (data.type == "roles") {
      index = sim.users.findIndex((user2) => user2.id == data.id);
      sim.users[index].roles = data.data;
      if (data.data.includes("Robot")) {
        robot = true;
      }
      if (data.data.includes("Human")) {
        human = true;
      }
      handleRoleSubmitButton(robot, human, data.id, updateOthers2, excludeFromUpdate);
    } else if (data.type == "updateHistory") {
      data.data.forEach((event) => {
        executeUpdateEvent(event);
      });
      document.getElementById("btn-save-log").style.display = "none";
      document.getElementById("btn-discard-log").style.display = "none";
      document.getElementById("sim-status").style.display = "none";
    } else if (data.type == "simRunningServer") {
      document.getElementById("cant-connect").innerHTML = "Server is currently running a simulation; please connect once it has finished.";
      client = false;
      connected = false;
      connections = [];
      connBlockStatus(true);
    }
  }
  function connBlockStatus(status) {
    if (status) {
      document.getElementById("conn-status").style.display = "none";
      document.getElementById("peer-input-block").style.display = "block";
      document.getElementById("conn-list").style.display = "none";
      document.getElementById("server-id").style.display = "none";
      document.getElementById("name-input-block").style.display = "none";
      document.getElementById("btn-start-sim").style.display = "inline";
      document.getElementById("btn-stop-sim").style.display = "inline";
      document.getElementById("btn-start-manual-sim").style.display = "inline";
      document.getElementById("btn-stop-manual-sim").style.display = "inline";
      document.getElementById("my-roles").style.display = "none";
      document.getElementById("my-name").style.display = "none";
      document.getElementById("role-select-block").style.display = "none";
      document.getElementById("btn-save-log").style.display = "none";
      document.getElementById("btn-discard-log").style.display = "none";
      document.getElementById("sim-status").style.display = "none";
      document.getElementById("cant-start").style.display = "none";
    } else {
      if (client) {
        document.getElementById("name-input-block").style.display = "block";
        document.getElementById("btn-save-log").style.display = "none";
        document.getElementById("btn-discard-log").style.display = "none";
        document.getElementById("sim-status").style.display = "none";
      }
      document.getElementById("conn-status").style.display = "block";
      document.getElementById("peer-input-block").style.display = "none";
      if (server) {
        document.getElementById("conn-list").style.display = "block";
      } else {
        document.getElementById("server-id").style.display = "block";
      }
    }
  }
  function updateConnectionList() {
    var connectionListString = [];
    if (server) {
      connectionListString.push("<div>Clients:</div>");
      connections.forEach((c) => {
        index = sim.users.findIndex((user2) => user2.id == c.peer);
        if (sim.users[index].name && sim.users[index].id && sim.users[index].roles) {
          connectionListString.push("<div><b>Name:</b> " + sim.users[index].name + " <b>ID:</b> " + sim.users[index].id + " <b>Roles:</b> " + sim.users[index].roles + "</div>");
        } else {
          connectionListString.push("<div><b>ID:</b> " + sim.users[index].id + " Setting name and roles.</div>");
        }
      });
      document.getElementById("conn-list").innerHTML = connectionListString.join("") + "<br/>";
    } else {
      connectionListString.push("<div>Server: </div>");
      connections.forEach((c) => {
        index = sim.users.findIndex((user2) => user2.id == c.peer);
        connectionListString.push("<div><b>Name:</b> " + sim.users[index].name + " <b>ID:</b> " + sim.users[index].id + " <b>Roles:</b> " + sim.users[index].roles + "</div>");
      });
      document.getElementById("server-id").innerHTML = connectionListString.join("") + "<br/>";
    }
  }
  async function connectionChecker() {
    if (connections.length == 0) {
      connected = false;
      server = false;
      client = false;
      document.getElementById("btn-start-sim").style.display = "inline";
      document.getElementById("btn-stop-sim").style.display = "inline";
      document.getElementById("btn-start-manual-sim").style.display = "inline";
      document.getElementById("btn-stop-manual-sim").style.display = "inline";
      document.getElementById("my-roles").style.display = "none";
      document.getElementById("my-name").style.display = "none";
      document.getElementById("name-input-block").style.display = "none";
      document.getElementById("role-select-block").style.display = "none";
      document.getElementById("btn-save-log").style.display = "none";
      document.getElementById("btn-discard-log").style.display = "none";
      document.getElementById("sim-status").style.display = "none";
      document.getElementById("cant-start").style.display = "none";
      sim.users = [];
      user = new User(myId, "server", ["Robot", "Human"]);
      handleNewUser(user, true);
      connBlockStatus(true);
    } else {
      var newConnections = [];
      connections.forEach((c) => {
        if (c && c.open) {
          newConnections.push(c);
        }
      });
      connections = newConnections;
      updateConnectionList();
      if (connected) {
        setTimeout(connectionChecker, connCheckDelayTimeMs);
      }
    }
  }

  // js/utilities.js
  function download(content, fileName, mimeType) {
    var a = document.createElement("a");
    mimeType = mimeType || "application/octet-stream";
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(new Blob([content], {
        type: mimeType
      }), fileName);
    } else if (URL && "download" in a) {
      a.href = URL.createObjectURL(new Blob([content], {
        type: mimeType
      }));
      a.setAttribute("download", fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      location.href = "data:application/octet-stream," + encodeURIComponent(content);
    }
  }

  // js/GUI.js
  var taskTable;
  var isRunning = false;
  var numIter = 0;
  var iterations = [];
  function fillDcrTable(status) {
    for (var row of status) {
      row.executed = row.executed ? "V:" + row.lastExecuted : "";
      row.pending = row.pending ? "!" + (row.deadline === void 0 ? "" : ":" + row.deadline) : "";
      row.included = row.included ? "" : "%";
      row.name = "<button " + (row.enabled ? "" : "disabled") + " id='" + row.label + "' >" + row.label + "</button>";
    }
    taskTable.load(status);
    for (var row of status) {
      document.getElementById(row.label).addEventListener("click", function() {
        handleEventButtonClick(this.id, myId, true, myId);
      });
    }
    updateAccepting(sim.graph.isAccepting());
  }
  function updateAccepting(status) {
    document.getElementById("accepting").innerHTML = status ? "Accepting" : "Not accepting";
  }
  function startSim() {
    if (isRunning) {
      numIter++;
      var names = [];
      for (var row of sim.graph.status()) {
        if (row.enabled) {
          names.push(row.name);
        }
      }
      chosenEvent = _.sample(names);
      var today = new Date();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var myIDD = localStorage.getItem("myID");
      iterations.push("Time : " + time + ", User ID :" + myIDD + " , Executed Event: " + chosenEvent + "<br />");
      document.getElementById("iter").innerHTML = iterations.join("");
      sim.graph.timeStep(1);
      sim.executeEvent(chosenEvent);
      fillDcrTable(sim.graph.status());
      setTimeout(startSim, 2e3);
    }
  }
  function handleTextAreaChange(updateOther = false, excludeFromUpdate = null) {
    var x = document.getElementById("ta-dcr");
    try {
      sim.changeGraph(x.value);
      fillDcrTable(sim.graph.status());
      document.getElementById("parse-error").innerHTML = "";
      if (updateOther) {
        updateOthers({
          type: "textField",
          id: "ta-dcr",
          data: document.getElementById("ta-dcr").value
        }, excludeFromUpdate);
      }
    } catch (err) {
      document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }
  }
  function handleEventButtonClick(buttondId, userID, updateOther = false, excludeFromUpdate = null) {
    if (sim.isRunning) {
      sim.graph.timeStep(1);
      sim.executeEvent(buttondId, userID);
      if (updateOther) {
        updateOthers({ type: "eventButton", id: buttondId, data: userID }, excludeFromUpdate);
      }
      var today = new Date();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var myIDD = localStorage.getItem("myID");
      iterations.push("Time : " + time + ", User ID :" + userID + " , Executed Event: " + buttondId + "<br />");
      document.getElementById("iter").innerHTML = iterations.join("");
    }
    fillDcrTable(sim.graph.status());
  }
  function handleNewUser(user2, updateOther = false, excludeFromUpdate = null) {
    sim.addUsers(user2);
    if (updateOther) {
      updateOthers({ type: "newUser", id: user2 }, excludeFromUpdate);
    }
  }
  function handleManualSimButtonClick2(buttonID, updateOther = false, excludeFromUpdate = null) {
    if (buttonID == "btn-start-manual-sim") {
      document.getElementById("sim-status").innerHTML = "Simulation running.";
      if (server || !server && !client) {
        document.getElementById("btn-pause-manual-sim").style.display = "block";
        document.getElementById("btn-stop-manual-sim").style.display = "block";
        document.getElementById("btn-start-manual-sim").style.display = "none";
      }
      if (!server && !client) {
        document.getElementById("peer-input-block").style.display = "none";
      }
      document.getElementById("btn-save-log").style.display = "none";
      document.getElementById("btn-discard-log").style.display = "none";
      sim.startSimulation();
    } else if (buttonID == "btn-stop-manual-sim") {
      if (server || !server && !client) {
        document.getElementById("btn-pause-manual-sim").style.display = "none";
        document.getElementById("btn-stop-manual-sim").style.display = "none";
        document.getElementById("btn-start-manual-sim").style.display = "block";
      }
      if (!server && !client) {
        document.getElementById("peer-input-block").style.display = "block";
      }
      document.getElementById("sim-status").innerHTML = "Simulation finished.";
      document.getElementById("btn-save-log").style.display = "block";
      document.getElementById("btn-discard-log").style.display = "block";
      sim.stopSimulation();
    } else if (buttonID == "btn-pause-manual-sim") {
      if (server || !server && !client) {
        document.getElementById("btn-resume-manual-sim").style.display = "block";
        document.getElementById("btn-pause-manual-sim").style.display = "none";
      }
      document.getElementById("sim-status").innerHTML = "Simulation paused.";
      sim.pauseSimulation();
    } else if (buttonID == "btn-resume-manual-sim") {
      if (server || !server && !client) {
        document.getElementById("btn-resume-manual-sim").style.display = "none";
        document.getElementById("btn-pause-manual-sim").style.display = "block";
      }
      document.getElementById("sim-status").innerHTML = "Simulation running.";
      sim.resumeSimulation();
    }
    fillDcrTable(sim.graph.status());
    if (updateOther) {
      updateOthers({ type: "manualSimButton", id: buttonID }, excludeFromUpdate);
    }
  }
  function handleSubmitNameButton2(name = null, id = null, updateOther = false, excludeFromUpdate = null) {
    if (name.trim().length == 0) {
      document.getElementById("input-error").innerHTML = "Name must not be empty.</br>";
    } else {
      document.getElementById("input-error").innerHTML = "";
      index = sim.users.findIndex((user2) => user2.id == id);
      sim.users[index].name = name;
      if (id === myId) {
        document.getElementById("name-input-block").style.display = "none";
        document.getElementById("my-name").style.display = "block";
        document.getElementById("my-name").innerHTML = "<div>My Name: </div><div>" + name + "</div><br/>";
        document.getElementById("role-select-block").style.display = "block";
      }
      if (updateOther) {
        updateOthers({ type: "name", id, data: name }, excludeFromUpdate);
      }
    }
  }
  function handleRoleSubmitButton2(robot2, human2, id = null, updateOther = false, excludeFromUpdate = null) {
    if (!human2 && !robot2) {
      document.getElementById("input-error").innerHTML = "At least one role must be selected.</br>";
    } else {
      document.getElementById("input-error").innerHTML = "";
      index = sim.users.findIndex((user2) => user2.id === id);
      if (id === myId) {
        if (robot2) {
          sim.users[index].roles.push("Robot");
        }
        if (human2) {
          sim.users[index].roles.push("Human");
        }
        document.getElementById("role-select-block").style.display = "none";
        document.getElementById("my-roles").style.display = "block";
        document.getElementById("my-roles").innerHTML = "<div>My Roles: </div><div>" + sim.users[index].roles + "</div><br/>";
        document.getElementById("sim-status").style.display = "block";
        document.getElementById("sim-status").innerHTML = "Waiting for server to start simulation.";
      }
      if (updateOther) {
        updateOthers({ type: "roles", id, data: sim.users[index].roles }, excludeFromUpdate);
      }
    }
  }
  $(document).ready(function(e) {
    taskTable = dynamicTable.config("task-table", ["executed", "included", "pending", "enabled", "name"], ["Executed", "Included", "Pending", "Enabled", "Name"], "There are no items to list...");
    $("#btn-time").click(function(e2) {
      sim.graph.timeStep(1);
      fillDcrTable(sim.graph.status());
    });
    $("#btn-start-sim").click(function(e2) {
      document.getElementById("cant-start").innerHTML = "";
      if (!sim.checkIfReady()) {
        document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
      } else {
        document.getElementById("iter").innerHTML = "";
        isRunning = true;
        numIter = 0;
        startSim();
      }
    });
    $("#btn-stop-sim").click(function(e2) {
      isRunning = false;
    });
    $("#btn-start-manual-sim").click(function(e2) {
      if (!sim.checkIfReady()) {
        document.getElementById("cant-start").innerHTML = "There are connected users with no name and/or roles set.";
      } else {
        document.getElementById("cant-start").innerHTML = "";
        handleManualSimButtonClick2(this.id, true, myId);
      }
    });
    $("#btn-stop-manual-sim").click(function(e2) {
      handleManualSimButtonClick2(this.id, true, myId);
    });
    $("#btn-pause-manual-sim").click(function(e2) {
      handleManualSimButtonClick2(this.id, true, myId);
    });
    $("#btn-resume-manual-sim").click(function(e2) {
      handleManualSimButtonClick2(this.id, true, myId);
    });
    $("#btn-save-log").click(function(e2) {
      sim.saveLog();
    });
    $("#btn-discard-log").click(function(e2) {
      sim.discardLog();
      document.getElementById("btn-save-log").style.display = "none";
      document.getElementById("btn-discard-log").style.display = "none";
    });
    $("#btn-download-model").click(function(e2) {
      var content = document.getElementById("ta-dcr").value;
      download(content, "model.txt", "text/csv;encoding:utf-8");
    });
    $("#btn-conn").click(function(e2) {
      document.getElementById("cant-connect").innerHTML = "";
      connect();
    });
    $("#btn-subname").click(function(e2) {
      var name = document.getElementById("name-input-id").value;
      handleSubmitNameButton2(name, myId, true, myId);
    });
    $("#btn-role").click(function(e2) {
      var robot2 = document.getElementById("robot").checked;
      var human2 = document.getElementById("human").checked;
      handleRoleSubmitButton2(robot2, human2, myId, true, myId);
    });
    $("#ta-dcr").keyup(function(e2) {
      handleTextAreaChange(true, myId);
    });
    try {
      var x = document.getElementById("ta-dcr");
      sim = new Simulation(x.value);
      fillDcrTable(sim.graph.status());
      document.getElementById("parse-error").innerHTML = "";
    } catch (err) {
      document.getElementById("parse-error").innerHTML = err.message + "</br>" + JSON.stringify(err.location);
    }
  });
})();
