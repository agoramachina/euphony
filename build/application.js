(function(window) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    window.btoa || (window.btoa = function encode64(input) {
        input = escape(input);
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = (chr1 & 3) << 4 | chr2 >> 4;
            enc3 = (chr2 & 15) << 2 | chr3 >> 6;
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64
            } else if (isNaN(chr3)) {
                enc4 = 64
            }
            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = ""
        } while (i < input.length);
        return output
    });
    window.atob || (window.atob = function(input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
            alert("There were invalid base64 characters in the input text.\n" + "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" + "Expect errors in decoding.")
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2)
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3)
            }
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = ""
        } while (i < input.length);
        return unescape(output)
    })
})(this);
var Base64Binary = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    decodeArrayBuffer: function(input) {
        var bytes = Math.ceil(3 * input.length / 4);
        var ab = new ArrayBuffer(bytes);
        this.decode(input, ab);
        return ab
    },
    decode: function(input, arrayBuffer) {
        var lkey1 = this._keyStr.indexOf(input.charAt(input.length - 1));
        var lkey2 = this._keyStr.indexOf(input.charAt(input.length - 1));
        var bytes = Math.ceil(3 * input.length / 4);
        if (lkey1 == 64) bytes--;
        if (lkey2 == 64) bytes--;
        var uarray;
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var j = 0;
        if (arrayBuffer) uarray = new Uint8Array(arrayBuffer);
        else uarray = new Uint8Array(bytes);
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        for (i = 0; i < bytes; i += 3) {
            enc1 = this._keyStr.indexOf(input.charAt(j++));
            enc2 = this._keyStr.indexOf(input.charAt(j++));
            enc3 = this._keyStr.indexOf(input.charAt(j++));
            enc4 = this._keyStr.indexOf(input.charAt(j++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            uarray[i] = chr1;
            if (enc3 != 64) uarray[i + 1] = chr2;
            if (enc4 != 64) uarray[i + 2] = chr3
        }
        return uarray
    }
};

function Stream(str) {
    var position = 0;

    function read(length) {
        var result = str.substr(position, length);
        position += length;
        return result
    }

    function readInt32() {
        var result = (str.charCodeAt(position) << 24) + (str.charCodeAt(position + 1) << 16) + (str.charCodeAt(position + 2) << 8) + str.charCodeAt(position + 3);
        position += 4;
        return result
    }

    function readInt16() {
        var result = (str.charCodeAt(position) << 8) + str.charCodeAt(position + 1);
        position += 2;
        return result
    }

    function readInt8() {
        var result = str.charCodeAt(position);
        position += 1;
        return result
    }

    function eof() {
        return position >= str.length
    }

    function readVarInt() {
        var result = 0;
        while (true) {
            var b = readInt8();
            if (b & 128) {
                result += b & 127;
                result <<= 7
            } else {
                return result + b
            }
        }
    }
    return {
        eof: eof,
        read: read,
        readInt32: readInt32,
        readInt16: readInt16,
        readInt8: readInt8,
        readVarInt: readVarInt
    }
}

function MidiFile(data) {
    function readChunk(stream) {
        var id = stream.read(4);
        var length = stream.readInt32();
        return {
            id: id,
            length: length,
            data: stream.read(length)
        }
    }
    var lastEventTypeByte;

    function readEvent(stream) {
        var event = {};
        event.deltaTime = stream.readVarInt();
        var eventTypeByte = stream.readInt8();
        if ((eventTypeByte & 240) == 240) {
            if (eventTypeByte == 255) {
                event.type = "meta";
                var subtypeByte = stream.readInt8();
                var length = stream.readVarInt();
                switch (subtypeByte) {
                    case 0:
                        event.subtype = "sequenceNumber";
                        if (length != 2) throw "Expected length for sequenceNumber event is 2, got " + length;
                        event.number = stream.readInt16();
                        return event;
                    case 1:
                        event.subtype = "text";
                        event.text = stream.read(length);
                        return event;
                    case 2:
                        event.subtype = "copyrightNotice";
                        event.text = stream.read(length);
                        return event;
                    case 3:
                        event.subtype = "trackName";
                        event.text = stream.read(length);
                        return event;
                    case 4:
                        event.subtype = "instrumentName";
                        event.text = stream.read(length);
                        return event;
                    case 5:
                        event.subtype = "lyrics";
                        event.text = stream.read(length);
                        return event;
                    case 6:
                        event.subtype = "marker";
                        event.text = stream.read(length);
                        return event;
                    case 7:
                        event.subtype = "cuePoint";
                        event.text = stream.read(length);
                        return event;
                    case 32:
                        event.subtype = "midiChannelPrefix";
                        if (length != 1) throw "Expected length for midiChannelPrefix event is 1, got " + length;
                        event.channel = stream.readInt8();
                        return event;
                    case 47:
                        event.subtype = "endOfTrack";
                        if (length != 0) throw "Expected length for endOfTrack event is 0, got " + length;
                        return event;
                    case 81:
                        event.subtype = "setTempo";
                        if (length != 3) throw "Expected length for setTempo event is 3, got " + length;
                        event.microsecondsPerBeat = (stream.readInt8() << 16) + (stream.readInt8() << 8) + stream.readInt8();
                        return event;
                    case 84:
                        event.subtype = "smpteOffset";
                        if (length != 5) throw "Expected length for smpteOffset event is 5, got " + length;
                        var hourByte = stream.readInt8();
                        event.frameRate = {
                            0: 24,
                            32: 25,
                            64: 29,
                            96: 30
                        }[hourByte & 96];
                        event.hour = hourByte & 31;
                        event.min = stream.readInt8();
                        event.sec = stream.readInt8();
                        event.frame = stream.readInt8();
                        event.subframe = stream.readInt8();
                        return event;
                    case 88:
                        event.subtype = "timeSignature";
                        if (length != 4) throw "Expected length for timeSignature event is 4, got " + length;
                        event.numerator = stream.readInt8();
                        event.denominator = Math.pow(2, stream.readInt8());
                        event.metronome = stream.readInt8();
                        event.thirtyseconds = stream.readInt8();
                        return event;
                    case 89:
                        event.subtype = "keySignature";
                        if (length != 2) throw "Expected length for keySignature event is 2, got " + length;
                        event.key = stream.readInt8();
                        event.scale = stream.readInt8();
                        return event;
                    case 127:
                        event.subtype = "sequencerSpecific";
                        event.data = stream.read(length);
                        return event;
                    default:
                        event.subtype = "unknown";
                        event.data = stream.read(length);
                        return event
                }
                event.data = stream.read(length);
                return event
            } else if (eventTypeByte == 240) {
                event.type = "sysEx";
                var length = stream.readVarInt();
                event.data = stream.read(length);
                return event
            } else if (eventTypeByte == 247) {
                event.type = "dividedSysEx";
                var length = stream.readVarInt();
                event.data = stream.read(length);
                return event
            } else {
                throw "Unrecognised MIDI event type byte: " + eventTypeByte
            }
        } else {
            var param1;
            if ((eventTypeByte & 128) == 0) {
                param1 = eventTypeByte;
                eventTypeByte = lastEventTypeByte
            } else {
                param1 = stream.readInt8();
                lastEventTypeByte = eventTypeByte
            }
            var eventType = eventTypeByte >> 4;
            event.channel = eventTypeByte & 15;
            event.type = "channel";
            switch (eventType) {
                case 8:
                    event.subtype = "noteOff";
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    return event;
                case 9:
                    event.noteNumber = param1;
                    event.velocity = stream.readInt8();
                    if (event.velocity == 0) {
                        event.subtype = "noteOff"
                    } else {
                        event.subtype = "noteOn"
                    }
                    return event;
                case 10:
                    event.subtype = "noteAftertouch";
                    event.noteNumber = param1;
                    event.amount = stream.readInt8();
                    return event;
                case 11:
                    event.subtype = "controller";
                    event.controllerType = param1;
                    event.value = stream.readInt8();
                    return event;
                case 12:
                    event.subtype = "programChange";
                    event.programNumber = param1;
                    return event;
                case 13:
                    event.subtype = "channelAftertouch";
                    event.amount = param1;
                    return event;
                case 14:
                    event.subtype = "pitchBend";
                    event.value = param1 + (stream.readInt8() << 7);
                    return event;
                default:
                    throw "Unrecognised MIDI event type: " + eventType
            }
        }
    }
    stream = Stream(data);
    var headerChunk = readChunk(stream);
    if (headerChunk.id != "MThd" || headerChunk.length != 6) {
        throw "Bad .mid file - header not found"
    }
    var headerStream = Stream(headerChunk.data);
    var formatType = headerStream.readInt16();
    var trackCount = headerStream.readInt16();
    var timeDivision = headerStream.readInt16();
    if (timeDivision & 32768) {
        throw "Expressing time division in SMTPE frames is not supported yet"
    } else {
        ticksPerBeat = timeDivision
    }
    var header = {
        formatType: formatType,
        trackCount: trackCount,
        ticksPerBeat: ticksPerBeat
    };
    var tracks = [];
    for (var i = 0; i < header.trackCount; i++) {
        tracks[i] = [];
        var trackChunk = readChunk(stream);
        if (trackChunk.id != "MTrk") {
            throw "Unexpected chunk - expected MTrk, got " + trackChunk.id
        }
        var trackStream = Stream(trackChunk.data);
        while (!trackStream.eof()) {
            var event = readEvent(trackStream);
            tracks[i].push(event)
        }
    }
    return {
        header: header,
        tracks: tracks
    }
}
var clone = function(o) {
    if (typeof o != "object") return o;
    if (o == null) return o;
    var ret = typeof o.length == "number" ? [] : {};
    for (var key in o) ret[key] = clone(o[key]);
    return ret
};

function Replayer(midiFile, timeWarp, eventProcessor) {
    var trackStates = [];
    var beatsPerMinute = 120;
    var ticksPerBeat = midiFile.header.ticksPerBeat;
    for (var i = 0; i < midiFile.tracks.length; i++) {
        trackStates[i] = {
            nextEventIndex: 0,
            ticksToNextEvent: midiFile.tracks[i].length ? midiFile.tracks[i][0].deltaTime : null
        }
    }

    function getNextEvent() {
        var ticksToNextEvent = null;
        var nextEventTrack = null;
        var nextEventIndex = null;
        for (var i = 0; i < trackStates.length; i++) {
            if (trackStates[i].ticksToNextEvent != null && (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent)) {
                ticksToNextEvent = trackStates[i].ticksToNextEvent;
                nextEventTrack = i;
                nextEventIndex = trackStates[i].nextEventIndex
            }
        }
        if (nextEventTrack != null) {
            var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
            if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) {
                trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime
            } else {
                trackStates[nextEventTrack].ticksToNextEvent = null
            }
            trackStates[nextEventTrack].nextEventIndex += 1;
            for (var i = 0; i < trackStates.length; i++) {
                if (trackStates[i].ticksToNextEvent != null) {
                    trackStates[i].ticksToNextEvent -= ticksToNextEvent
                }
            }
            return {
                ticksToEvent: ticksToNextEvent,
                event: nextEvent,
                track: nextEventTrack
            }
        } else {
            return null
        }
    }
    var midiEvent;
    var temporal = [];

    function processEvents() {
        function processNext() {
            if (midiEvent.ticksToEvent > 0) {
                var beatsToGenerate = midiEvent.ticksToEvent / ticksPerBeat;
                var secondsToGenerate = beatsToGenerate / (beatsPerMinute / 60)
            }
            var time = secondsToGenerate * 1e3 * timeWarp || 0;
            temporal.push([midiEvent, time]);
            midiEvent = getNextEvent()
        }
        if (midiEvent = getNextEvent()) {
            while (midiEvent) processNext(true)
        }
    }
    processEvents();
    return {
        getData: function() {
            return clone(temporal)
        }
    }
}
if (typeof DOMLoader === "undefined") DOMLoader = {};
(function() {
    "use strict";
    if (typeof window.XMLHttpRequest === "undefined") {
        (function() {
            var factories = [function() {
                return new ActiveXObject("Msxml2.XMLHTTP")
            }, function() {
                return new ActiveXObject("Msxml3.XMLHTTP")
            }, function() {
                return new ActiveXObject("Microsoft.XMLHTTP")
            }];
            for (var i = 0; i < factories.length; i++) {
                try {
                    factories[i]()
                } catch (e) {
                    continue
                }
                break
            }
            window.XMLHttpRequest = factories[i]
        })()
    }
    if (typeof(new XMLHttpRequest).responseText === "undefined") {
        var IEBinaryToArray_ByteStr_Script = "<!-- IEBinaryToArray_ByteStr -->\r\n" + "<script type='text/vbscript'>\r\n" + "Function IEBinaryToArray_ByteStr(Binary)\r\n" + "   IEBinaryToArray_ByteStr = CStr(Binary)\r\n" + "End Function\r\n" + "Function IEBinaryToArray_ByteStr_Last(Binary)\r\n" + "   Dim lastIndex\r\n" + "   lastIndex = LenB(Binary)\r\n" + "   if lastIndex mod 2 Then\r\n" + "       IEBinaryToArray_ByteStr_Last = Chr( AscB( MidB( Binary, lastIndex, 1 ) ) )\r\n" + "   Else\r\n" + "       IEBinaryToArray_ByteStr_Last = " + '""' + "\r\n" + "   End If\r\n" + "End Function\r\n" + "</script>\r\n";
        document.write(IEBinaryToArray_ByteStr_Script);
        DOMLoader.sendRequest = function(config) {
            function getResponseText(binary) {
                var byteMapping = {};
                for (var i = 0; i < 256; i++) {
                    for (var j = 0; j < 256; j++) {
                        byteMapping[String.fromCharCode(i + j * 256)] = String.fromCharCode(i) + String.fromCharCode(j)
                    }
                }
                var rawBytes = IEBinaryToArray_ByteStr(binary);
                var lastChr = IEBinaryToArray_ByteStr_Last(binary);
                return rawBytes.replace(/[\s\S]/g, function(match) {
                    return byteMapping[match]
                }) + lastChr
            }
            var req = new XMLHttpRequest;
            req.open("GET", config.url, true);
            req.setRequestHeader("Accept-Charset", "x-user-defined");
            if (config.responseType) req.responseType = config.responseType;
            if (config.error) req.onerror = config.error;
            if (config.progress) req.onprogress = config.progress;
            req.onreadystatechange = function(event) {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        req.responseText = getResponseText(req.responseBody)
                    } else {
                        req = false
                    }
                    if (config.callback) config.callback(req)
                }
            };
            req.send(null);
            return req
        }
    } else {
        DOMLoader.sendRequest = function(config) {
            var req = new XMLHttpRequest;
            req.open("GET", config.url, true);
            if (req.overrideMimeType) req.overrideMimeType("text/plain; charset=x-user-defined");
            if (config.responseType) req.responseType = config.responseType;
            if (config.error) req.onerror = config.error;
            if (config.progress) req.onprogress = config.progress;
            req.onreadystatechange = function(event) {
                if (req.readyState === 4) {
                    if (req.status !== 200) req = false;
                    if (config.callback) config.callback(req)
                }
            };
            req.send("");
            return req
        }
    }
})();
if (typeof DOMLoader === "undefined") DOMLoader = {};
DOMLoader.script = function() {
    this.loaded = {};
    this.loading = {};
    return this
};
DOMLoader.script.prototype.add = function(config) {
    var that = this;
    var srcs = config.srcs;
    if (typeof srcs === "undefined") {
        srcs = [{
            src: config.src,
            verify: config.verify
        }]
    }
    var doc = document.getElementsByTagName("head")[0];
    var testElement = function(element, test) {
        if (that.loaded[element.src]) return;
        if (test && !eval(test)) return;
        that.loaded[element.src] = true;
        if (that.loading[element.src]) that.loading[element.src]();
        delete that.loading[element.src];
        if (element.callback) element.callback();
        if (typeof getNext !== "undefined") getNext()
    };
    var batchTest = [];
    var addElement = function(element) {
        if (/([\w\d.\[\]])$/.test(element.verify)) {
            element.test = "(typeof(" + element.verify + ') !== "undefined")';
            batchTest.push(element.test)
        }
        var script = document.createElement("script");
        script.onreadystatechange = function() {
            if (this.readyState !== "loaded" && this.readyState !== "complete") return;
            testElement(element)
        };
        script.onload = function() {
            testElement(element)
        };
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", element.src);
        doc.appendChild(script);
        that.loading[element.src] = function() {}
    };
    var onLoad = function(element) {
        if (element) {
            testElement(element, element.test)
        } else {
            for (var n = 0; n < srcs.length; n++) {
                testElement(srcs[n], srcs[n].test)
            }
        }
        if (!config.strictOrder && eval(batchTest.join(" && "))) {
            if (config.callback) config.callback()
        } else {
            setTimeout(function() {
                onLoad(element)
            }, 10)
        }
    };
    if (config.strictOrder) {
        var ID = -1;
        var getNext = function() {
            ID++;
            if (!srcs[ID]) {
                if (config.callback) config.callback()
            } else {
                var element = srcs[ID];
                var src = element.src;
                if (that.loading[src]) {
                    that.loading[src] = function() {
                        if (element.callback) element.callback();
                        getNext()
                    }
                } else if (!that.loaded[src]) {
                    addElement(element);
                    onLoad(element)
                } else {
                    getNext()
                }
            }
        };
        getNext()
    } else {
        for (var ID = 0; ID < srcs.length; ID++) {
            if (that.loaded[srcs[ID].src]) return;
            addElement(srcs[ID])
        }
        onLoad()
    }
};
DOMLoader.script = new DOMLoader.script;
if (typeof MIDI === "undefined") var MIDI = {};
(function() {
    "use strict";
    var supports = {};
    var canPlayThrough = function(src) {
        var audio = new Audio;
        var mime = src.split(";")[0];
        audio.id = "audio";
        audio.setAttribute("preload", "auto");
        audio.setAttribute("audiobuffer", true);
        audio.addEventListener("canplaythrough", function() {
            supports[mime] = true
        }, false);
        audio.src = "data:" + src;
        document.body.appendChild(audio)
    };
    MIDI.audioDetect = function(callback) {
        if (typeof Audio === "undefined") return callback({});
        var audio = new Audio;
        if (typeof audio.canPlayType === "undefined") return callback(supports);
        var vorbis = audio.canPlayType('audio/ogg; codecs="vorbis"');
        vorbis = vorbis === "probably" || vorbis === "maybe";
        var mpeg = audio.canPlayType("audio/mpeg");
        mpeg = mpeg === "probably" || mpeg === "maybe";
        if (!vorbis && !mpeg) {
            callback(supports);
            return
        }
        if (vorbis) canPlayThrough("audio/ogg;base64,T2dnUwACAAAAAAAAAADqnjMlAAAAAOyyzPIBHgF2b3JiaXMAAAAAAUAfAABAHwAAQB8AAEAfAACZAU9nZ1MAAAAAAAAAAAAA6p4zJQEAAAANJGeqCj3//////////5ADdm9yYmlzLQAAAFhpcGguT3JnIGxpYlZvcmJpcyBJIDIwMTAxMTAxIChTY2hhdWZlbnVnZ2V0KQAAAAABBXZvcmJpcw9CQ1YBAAABAAxSFCElGVNKYwiVUlIpBR1jUFtHHWPUOUYhZBBTiEkZpXtPKpVYSsgRUlgpRR1TTFNJlVKWKUUdYxRTSCFT1jFloXMUS4ZJCSVsTa50FkvomWOWMUYdY85aSp1j1jFFHWNSUkmhcxg6ZiVkFDpGxehifDA6laJCKL7H3lLpLYWKW4q91xpT6y2EGEtpwQhhc+211dxKasUYY4wxxsXiUyiC0JBVAAABAABABAFCQ1YBAAoAAMJQDEVRgNCQVQBABgCAABRFcRTHcRxHkiTLAkJDVgEAQAAAAgAAKI7hKJIjSZJkWZZlWZameZaouaov+64u667t6roOhIasBACAAAAYRqF1TCqDEEPKQ4QUY9AzoxBDDEzGHGNONKQMMogzxZAyiFssLqgQBKEhKwKAKAAAwBjEGGIMOeekZFIi55iUTkoDnaPUUcoolRRLjBmlEluJMYLOUeooZZRCjKXFjFKJscRUAABAgAMAQICFUGjIigAgCgCAMAYphZRCjCnmFHOIMeUcgwwxxiBkzinoGJNOSuWck85JiRhjzjEHlXNOSuekctBJyaQTAAAQ4AAAEGAhFBqyIgCIEwAwSJKmWZomipamiaJniqrqiaKqWp5nmp5pqqpnmqpqqqrrmqrqypbnmaZnmqrqmaaqiqbquqaquq6nqrZsuqoum65q267s+rZru77uqapsm6or66bqyrrqyrbuurbtS56nqqKquq5nqq6ruq5uq65r25pqyq6purJtuq4tu7Js664s67pmqq5suqotm64s667s2rYqy7ovuq5uq7Ks+6os+75s67ru2rrwi65r66os674qy74x27bwy7ouHJMnqqqnqq7rmarrqq5r26rr2rqmmq5suq4tm6or26os67Yry7aumaosm64r26bryrIqy77vyrJui67r66Ys67oqy8Lu6roxzLat+6Lr6roqy7qvyrKuu7ru+7JuC7umqrpuyrKvm7Ks+7auC8us27oxuq7vq7It/KosC7+u+8Iy6z5jdF1fV21ZGFbZ9n3d95Vj1nVhWW1b+V1bZ7y+bgy7bvzKrQvLstq2scy6rSyvrxvDLux8W/iVmqratum6um7Ksq/Lui60dd1XRtf1fdW2fV+VZd+3hV9pG8OwjK6r+6os68Jry8ov67qw7MIvLKttK7+r68ow27qw3L6wLL/uC8uq277v6rrStXVluX2fsSu38QsAABhwAAAIMKEMFBqyIgCIEwBAEHIOKQahYgpCCKGkEEIqFWNSMuakZM5JKaWUFEpJrWJMSuaclMwxKaGUlkopqYRSWiqlxBRKaS2l1mJKqcVQSmulpNZKSa2llGJMrcUYMSYlc05K5pyUklJrJZXWMucoZQ5K6iCklEoqraTUYuacpA46Kx2E1EoqMZWUYgupxFZKaq2kFGMrMdXUWo4hpRhLSrGVlFptMdXWWqs1YkxK5pyUzDkqJaXWSiqtZc5J6iC01DkoqaTUYiopxco5SR2ElDLIqJSUWiupxBJSia20FGMpqcXUYq4pxRZDSS2WlFosqcTWYoy1tVRTJ6XFklKMJZUYW6y5ttZqDKXEVkqLsaSUW2sx1xZjjqGkFksrsZWUWmy15dhayzW1VGNKrdYWY40x5ZRrrT2n1mJNMdXaWqy51ZZbzLXnTkprpZQWS0oxttZijTHmHEppraQUWykpxtZara3FXEMpsZXSWiypxNhirLXFVmNqrcYWW62ltVprrb3GVlsurdXcYqw9tZRrrLXmWFNtBQAADDgAAASYUAYKDVkJAEQBAADGMMYYhEYpx5yT0ijlnHNSKucghJBS5hyEEFLKnINQSkuZcxBKSSmUklJqrYVSUmqttQIAAAocAAACbNCUWByg0JCVAEAqAIDBcTRNFFXVdX1fsSxRVFXXlW3jVyxNFFVVdm1b+DVRVFXXtW3bFn5NFFVVdmXZtoWiqrqybduybgvDqKqua9uybeuorqvbuq3bui9UXVmWbVu3dR3XtnXd9nVd+Bmzbeu2buu+8CMMR9/4IeTj+3RCCAAAT3AAACqwYXWEk6KxwEJDVgIAGQAAgDFKGYUYM0gxphhjTDHGmAAAgAEHAIAAE8pAoSErAoAoAADAOeecc84555xzzjnnnHPOOeecc44xxhhjjDHGGGOMMcYYY4wxxhhjjDHGGGOMMcYYY0wAwE6EA8BOhIVQaMhKACAcAABACCEpKaWUUkoRU85BSSmllFKqFIOMSkoppZRSpBR1lFJKKaWUIqWgpJJSSimllElJKaWUUkoppYw6SimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaWUUkoppZRSSimllFJKKaVUSimllFJKKaWUUkoppRQAYPLgAACVYOMMK0lnhaPBhYasBAByAwAAhRiDEEJpraRUUkolVc5BKCWUlEpKKZWUUqqYgxBKKqmlklJKKbXSQSihlFBKKSWUUkooJYQQSgmhlFRCK6mEUkoHoYQSQimhhFRKKSWUzkEoIYUOQkmllNRCSB10VFIpIZVSSiklpZQ6CKGUklJLLZVSWkqpdBJSKamV1FJqqbWSUgmhpFZKSSWl0lpJJbUSSkklpZRSSymFVFJJJYSSUioltZZaSqm11lJIqZWUUkqppdRSSiWlkEpKqZSSUmollZRSaiGVlEpJKaTUSimlpFRCSamlUlpKLbWUSkmptFRSSaWUlEpJKaVSSksppRJKSqmllFpJKYWSUkoplZJSSyW1VEoKJaWUUkmptJRSSymVklIBAEAHDgAAAUZUWoidZlx5BI4oZJiAAgAAQABAgAkgMEBQMApBgDACAQAAAADAAAAfAABHARAR0ZzBAUKCwgJDg8MDAAAAAAAAAAAAAACAT2dnUwAEAAAAAAAAAADqnjMlAgAAADzQPmcBAQA=");
        if (mpeg) canPlayThrough("audio/mpeg;base64,/+MYxAAAAANIAUAAAASEEB/jwOFM/0MM/90b/+RhST//w4NFwOjf///PZu////9lns5GFDv//l9GlUIEEIAAAgIg8Ir/JGq3/+MYxDsLIj5QMYcoAP0dv9HIjUcH//yYSg+CIbkGP//8w0bLVjUP///3Z0x5QCAv/yLjwtGKTEFNRTMuOTeqqqqqqqqqqqqq/+MYxEkNmdJkUYc4AKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
        var time = (new Date).getTime();
        var interval = window.setInterval(function() {
            for (var key in supports) {}
            var now = (new Date).getTime();
            var maxExecution = now - time > 5e3;
            if (key || maxExecution) {
                window.clearInterval(interval);
                callback(supports)
            }
        }, 1)
    }
})();
if (typeof MIDI === "undefined") var MIDI = {};
if (typeof MIDI.Soundfont === "undefined") MIDI.Soundfont = {};
(function() {
    "use strict";
    var plugins = {
        "#webaudio": true,
        "#html5": true,
        "#java": true,
        "#flash": true
    };
    MIDI.loadPlugin = function(callback, instrument) {
        var type;
        var loader = window.loader;
        var instrument = instrument || "";
        MIDI.audioDetect(function(types) {
            if (typeof type === "undefined") {
                if (plugins[window.location.hash]) {
                    type = window.location.hash
                } else {
                    type = ""
                }
            }
            if (type === "") {
                var isSafari = navigator.userAgent.toLowerCase().indexOf("safari") !== -1;
                if (window.webkitAudioContext) {
                    type = "#webaudio"
                } else if (window.Audio) {
                    type = "#html5"
                } else {
                    type = "#flash"
                }
            }
            var filetype = types["audio/ogg"] ? "ogg" : "mp3";
            var filesize = filetype === "ogg" ? 3958964 : 3152665;
            switch (type) {
                case "#java":
                    if (loader) loader.message("Soundfont (500KB)<br>Java Interface...");
                    MIDI.Java.connect(callback);
                    break;
                case "#flash":
                    if (loader) loader.message("Soundfont (2MB)<br>Flash Interface...");
                    DOMLoader.script.add({
                        src: "./inc/SoundManager2/script/soundmanager2-jsmin.js",
                        verify: "SoundManager",
                        callback: function() {
                            MIDI.Flash.connect(callback)
                        }
                    });
                    break;
                case "#html5":
                    DOMLoader.sendRequest({
                        url: "./soundfont/soundfont-" + filetype + ".js",
                        callback: function(response) {
                            MIDI.Soundfont = JSON.parse(response.responseText);
                            MIDI.HTML5.connect(callback)
                        },
                        progress: function(evt) {
                            var percent = Math.round(evt.loaded / filesize * 100);
                            if (loader) loader.message("Downloading: " + (percent + "%"))
                        }
                    });
                    break;
                case "#webaudio":
                    DOMLoader.sendRequest({
                        url: "./soundfont/soundfont-" + filetype + instrument + ".js",
                        callback: function(response) {
                            MIDI.Soundfont = JSON.parse(response.responseText);
                            MIDI.WebAudioAPI.connect(callback)
                        },
                        progress: function(evt) {
                            var percent = Math.round(evt.loaded / filesize * 100);
                            if (loader) loader.message("Downloading: " + (percent + "%"))
                        }
                    });
                    break;
                default:
                    break
            }
        })
    }
})();
if (typeof MIDI === "undefined") var MIDI = {};
if (typeof MIDI.Plugin === "undefined") MIDI.Plugin = {};
(function() {
    "use strict";
    if (typeof MIDI.WebAudioAPI === "undefined") MIDI.WebAudioAPI = {};
    if (window.AudioContext || window.webkitAudioContext)(function() {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        var root = MIDI.WebAudioAPI;
        var ctx;
        var sources = {};
        var masterVolume = 1;
        var audioBuffers = {};
        var audioLoader = function(urlList, index, bufferList, oncomplete) {
            var url = urlList[index];
            var base64 = MIDI.Soundfont[url].split(",")[1];
            var buffer = Base64Binary.decodeArrayBuffer(base64);
            ctx.decodeAudioData(buffer, function(buffer) {
                var msg = url;
                while (msg.length < 3) msg += "&nbsp;";
                if (typeof loader !== "undefined") {
                    loader.message("Processing: " + (index / 87 * 100 >> 0) + "%<br>")
                }
                buffer.id = url;
                bufferList[index] = buffer;
                if (bufferList.length === urlList.length) {
                    while (bufferList.length) {
                        buffer = bufferList.pop();
                        var nodeId = MIDI.keyToNote[buffer.id];
                        audioBuffers[nodeId] = buffer
                    }
                    oncomplete()
                }
            })
        };
        root.setVolume = function(n) {
            masterVolume = n
        };
        root.programChange = function(instrument) {};
        root.noteOn = function(channel, note, velocity, delay) {
            if (!audioBuffers[note]) return;
            if (delay < ctx.currentTime) delay += ctx.currentTime;
            var source = ctx.createBufferSource();
            sources[channel + "" + note] = source;
            source.buffer = audioBuffers[note];
            source.connect(ctx.destination);
            var gainNode = ctx.createGainNode ? ctx.createGainNode() : ctx.createGain();
            var value = -.5 + velocity / 100 * 2;
            var minus = (1 - masterVolume) * 2;
            gainNode.connect(ctx.destination);
            gainNode.gain.value = Math.max(-1, value - minus);
            source.connect(gainNode);
            if (source.start) {
                source.start(delay || 0)
            } else {
                source.noteOn(delay || 0)
            }
            return source
        };
        root.chordOn = function(channel, chord, velocity, delay) {
            var ret = {},
                note;
            for (var n = 0, length = chord.length; n < length; n++) {
                ret[note = chord[n]] = root.noteOn(channel, note, velocity, delay)
            }
            return ret
        };
        root.noteOff = function(channel, note, delay) {};
        root.chordOff = function(channel, chord, delay) {};
        root.connect = function(callback) {
            MIDI.lang = "WebAudioAPI";
            MIDI.setVolume = root.setVolume;
            MIDI.programChange = root.programChange;
            MIDI.noteOn = root.noteOn;
            MIDI.noteOff = root.noteOff;
            MIDI.chordOn = root.chordOn;
            MIDI.chordOff = root.chordOff;
            MIDI.Player.ctx = ctx = new AudioContext;
            var urlList = [];
            var keyToNote = MIDI.keyToNote;
            for (var key in keyToNote) urlList.push(key);
            var bufferList = [];
            for (var i = 0; i < urlList.length; i++) {
                audioLoader(urlList, i, bufferList, callback)
            }
        }
    })();
    if (window.Audio)(function() {
        var root = MIDI.HTML5 = {};
        var note2id = {};
        var volume = 1;
        var channel_nid = -1;
        var channel_map = {};
        var channels = [];
        var notes = {};
        for (var nid = 0; nid < 12; nid++) {
            channels[nid] = new Audio
        }
        var playChannel = function(id) {
            var note = notes[id];
            if (!note) return;
            var nid = (channel_nid + 1) % channels.length;
            var time = (new Date).getTime();
            var audio = channels[nid];
            channel_map[note.id] = audio;
            audio.src = MIDI.Soundfont[note.id];
            audio.volume = volume;
            audio.play();
            channel_nid = nid
        };
        root.programChange = function() {};
        root.setVolume = function(n) {
            volume = n
        };
        root.noteOn = function(channel, note, velocity, delay) {
            var id = note2id[note];
            if (!notes[id]) return;
            if (delay) {
                var interval = window.setTimeout(function() {
                    playChannel(id)
                }, delay * 1e3);
                return interval
            } else {
                playChannel(id)
            }
        };
        root.noteOff = function(channel, note, delay) {};
        root.chordOn = function(channel, chord, velocity, delay) {
            for (var key in chord) {
                var n = chord[key];
                var id = note2id[n];
                if (!notes[id]) continue;
                playChannel(id)
            }
        };
        root.chordOff = function(channel, chord, delay) {};
        root.stopAllNotes = function() {
            for (var nid = 0, length = channels.length; nid < length; nid++) {
                channels[nid].pause()
            }
        };
        root.connect = function(callback) {
            var loading = {};
            for (var key in MIDI.keyToNote) {
                note2id[MIDI.keyToNote[key]] = key;
                notes[key] = {
                    id: key
                }
            }
            MIDI.lang = "HTML5";
            MIDI.setVolume = root.setVolume;
            MIDI.programChange = root.programChange;
            MIDI.noteOn = root.noteOn;
            MIDI.noteOff = root.noteOff;
            MIDI.chordOn = root.chordOn;
            MIDI.chordOff = root.chordOff;
            if (callback) callback()
        }
    })();
    (function() {
        var root = MIDI.Flash = {};
        var noteReverse = {};
        var notes = {};
        root.programChange = function() {};
        root.setVolume = function(channel, note) {};
        root.noteOn = function(channel, note, velocity, delay) {
            var id = noteReverse[note];
            if (!notes[id]) return;
            if (delay) {
                var interval = window.setTimeout(function() {
                    notes[id].play({
                        volume: velocity * 2
                    })
                }, delay * 1e3);
                return interval
            } else {
                notes[id].play({
                    volume: velocity * 2
                })
            }
        };
        root.noteOff = function(channel, note, delay) {};
        root.chordOn = function(channel, chord, velocity, delay) {
            for (var key in chord) {
                var n = chord[key];
                var id = noteReverse[n];
                if (notes[id]) {
                    notes[id].play({
                        volume: velocity * 2
                    })
                }
            }
        };
        root.chordOff = function(channel, chord, delay) {};
        root.stopAllNotes = function() {};
        root.connect = function(callback) {
            soundManager.flashVersion = 9;
            soundManager.useHTML5Audio = true;
            soundManager.url = "../../swf/";
            soundManager.useHighPerformance = true;
            soundManager.wmode = "transparent";
            soundManager.flashPollingInterval = 1;
            soundManager.debugMode = false;
            soundManager.onload = function() {
                var loaded = [];
                var onload = function() {
                    loaded.push(this.sID);
                    if (typeof loader === "undefined") return;
                    loader.message("Processing: " + this.sID)
                };
                for (var i = 10; i < 65 + 10; i++) {
                    var id = noteReverse[i + 26];
                    notes[id] = soundManager.createSound({
                        id: id,
                        url: "./soundfont/mp3/" + id + ".mp3",
                        multiShot: true,
                        autoLoad: true,
                        onload: onload
                    })
                }
                MIDI.lang = "Flash";
                MIDI.setVolume = root.setVolume;
                MIDI.programChange = root.programChange;
                MIDI.noteOn = root.noteOn;
                MIDI.noteOff = root.noteOff;
                MIDI.chordOn = root.chordOn;
                MIDI.chordOff = root.chordOff;
                var interval = window.setInterval(function() {
                    if (loaded.length !== 65) return;
                    window.clearInterval(interval);
                    if (callback) callback()
                }, 25)
            };
            soundManager.onerror = function() {};
            for (var key in MIDI.keyToNote) {
                noteReverse[MIDI.keyToNote[key]] = key
            }
        }
    })();
    (function() {
        var root = MIDI.Java = {};
        root.connect = function(callback) {
            MIDI.Plugin = false;
            if (!window.navigator.javaEnabled()) {
                MIDI.Flash.connect(callback);
                return
            }
            MIDI.Java.callback = callback;
            var iframe = document.createElement("iframe");
            iframe.name = "MIDIFrame";
            iframe.src = "inc/midibridge/index.html";
            iframe.width = 1;
            iframe.height = 1;
            document.body.appendChild(iframe)
        };
        root.confirm = function(plugin) {
            MIDI.programChange = function(program) {
                plugin.sendMidiEvent(192, 0, program, 0)
            };
            MIDI.setVolume = function(n) {};
            MIDI.noteOn = function(channel, note, velocity, delay) {
                if (delay) {
                    var interval = window.setTimeout(function() {
                        plugin.sendMidiEvent(144, channel, note, velocity)
                    }, delay * 1e3);
                    return interval
                } else {
                    plugin.sendMidiEvent(144, channel, note, velocity)
                }
            };
            MIDI.noteOff = function(channel, note, delay) {
                if (delay) {
                    var interval = window.setTimeout(function() {
                        plugin.sendMidiEvent(128, channel, note, 0)
                    }, delay * 1e3);
                    return interval
                } else {
                    plugin.sendMidiEvent(128, channel, note, 0)
                }
            };
            MIDI.chordOn = function(channel, chord, velocity, delay) {
                for (var key in chord) {
                    var n = chord[key];
                    plugin.sendMidiEvent(144, channel, n, 100)
                }
            };
            MIDI.chordOff = function(channel, chord, delay) {
                for (var key in chord) {
                    var n = chord[key];
                    plugin.sendMidiEvent(128, channel, n, 100)
                }
            };
            MIDI.stopAllNotes = function() {};
            MIDI.getInstruments = function() {
                return []
            };
            if (plugin.ready) {
                MIDI.lang = "Java";
                if (MIDI.Java.callback) {
                    MIDI.Java.callback()
                }
            } else {
                MIDI.Flash.connect(MIDI.Java.callback)
            }
        }
    })();
    MIDI.instruments = function(arr) {
        var instruments = {};
        for (var key in arr) {
            var list = arr[key];
            for (var n = 0, length = list.length; n < length; n++) {
                var instrument = list[n];
                if (!instrument) continue;
                var num = parseInt(instrument.substr(0, instrument.indexOf(" ")), 10);
                instrument = instrument.replace(num + " ", "");
                instruments[--num] = {
                    instrument: instrument,
                    category: key
                };
                instruments[instrument] = {
                    number: num,
                    category: key
                }
            }
        }
        return instruments
    }({
        Piano: ["1 Acoustic Grand Piano", "2 Bright Acoustic Piano", "3 Electric Grand Piano", "4 Honky-tonk Piano", "5 Electric Piano 1", "6 Electric Piano 2", "7 Harpsichord", "8 Clavinet"],
        "Chromatic Percussion": ["9 Celesta", "10 Glockenspiel", "11 Music Box", "12 Vibraphone", "13 Marimba", "14 Xylophone", "15 Tubular Bells", "16 Dulcimer"],
        Organ: ["17 Drawbar Organ", "18 Percussive Organ", "19 Rock Organ", "20 Church Organ", "21 Reed Organ", "22 Accordion", "23 Harmonica", "24 Tango Accordion"],
        Guitar: ["25 Acoustic Guitar (nylon)", "26 Acoustic Guitar (steel)", "27 Electric Guitar (jazz)", "28 Electric Guitar (clean)", "29 Electric Guitar (muted)", "30 Overdriven Guitar", "31 Distortion Guitar", "32 Guitar Harmonics"],
        Bass: ["33 Acoustic Bass", "34 Electric Bass (finger)", "35 Electric Bass (pick)", "36 Fretless Bass", "37 Slap Bass 1", "38 Slap Bass 2", "39 Synth Bass 1", "40 Synth Bass 2"],
        Strings: ["41 Violin", "42 Viola", "43 Cello", "44 Contrabass", "45 Tremolo Strings", "46 Pizzicato Strings", "47 Orchestral Harp", "48 Timpani"],
        Ensemble: ["49 String Ensemble 1", "50 String Ensemble 2", "51 Synth Strings 1", "52 Synth Strings 2", "53 Choir Aahs", "54 Voice Oohs", "55 Synth Choir", "56 Orchestra Hit"],
        Brass: ["57 Trumpet", "58 Trombone", "59 Tuba", "60 Muted Trumpet", "61 French Horn", "62 Brass Section", "63 Synth Brass 1", "64 Synth Brass 2"],
        Reed: ["65 Soprano Sax", "66 Alto Sax", "67 Tenor Sax", "68 Baritone Sax", "69 Oboe", "70 English Horn", "71 Bassoon", "72 Clarinet"],
        Pipe: ["73 Piccolo", "74 Flute", "75 Recorder", "76 Pan Flute", "77 Blown Bottle", "78 Shakuhachi", "79 Whistle", "80 Ocarina"],
        "Synth Lead": ["81 Lead 1 (square)", "82 Lead 2 (sawtooth)", "83 Lead 3 (calliope)", "84 Lead 4 (chiff)", "85 Lead 5 (charang)", "86 Lead 6 (voice)", "87 Lead 7 (fifths)", "88 Lead 8 (bass + lead)"],
        "Synth Pad": ["89 Pad 1 (new age)", "90 Pad 2 (warm)", "91 Pad 3 (polysynth)", "92 Pad 4 (choir)", "93 Pad 5 (bowed)", "94 Pad 6 (metallic)", "95 Pad 7 (halo)", "96 Pad 8 (sweep)"],
        "Synth Effects": ["97 FX 1 (rain)", "98 FX 2 (soundtrack)", "99 FX 3 (crystal)", "100 FX 4 (atmosphere)", "101 FX 5 (brightness)", "102 FX 6 (goblins)", "103 FX 7 (echoes)", "104 FX 8 (sci-fi)"],
        Ethnic: ["105 Sitar", "106 Banjo", "107 Shamisen", "108 Koto", "109 Kalimba", "110 Bagpipe", "111 Fiddle", "112 Shanai"],
        Percussive: ["113 Tinkle Bell", "114 Agogo", "115 Steel Drums", "116 Woodblock", "117 Taiko Drum", "118 Melodic Tom", "119 Synth Drum"],
        "Sound effects": ["120 Reverse Cymbal", "121 Guitar Fret Noise", "122 Breath Noise", "123 Seashore", "124 Bird Tweet", "125 Telephone Ring", "126 Helicopter", "127 Applause", "128 Gunshot"]
    });
    MIDI.channels = function() {
        var channels = {};
        for (var n = 0; n < 16; n++) {
            channels[n] = {
                instrument: 0,
                mute: false,
                mono: false,
                omni: false,
                solo: false
            }
        }
        return channels
    }();
    MIDI.keyToNote = {};
    MIDI.noteToKey = {};
    (function() {
        var A0 = 21;
        var C8 = 108;
        var number2key = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        for (var n = A0; n <= C8; n++) {
            var octave = (n - 12) / 12 >> 0;
            var name = number2key[n % 12] + octave;
            MIDI.keyToNote[name] = n;
            MIDI.noteToKey[n] = name
        }
    })()
})();
MIDI.pianoKeyOffset = 21;
if (typeof MIDI === "undefined") var MIDI = {};
if (typeof MIDI.Player === "undefined") MIDI.Player = {};
(function() {
    "use strict";
    var root = MIDI.Player;
    root.callback = undefined;
    root.currentTime = 0;
    root.endTime = 0;
    root.restart = 0;
    root.playing = false;
    root.timeWarp = 1;
    root.start = root.resume = function() {
        if (root.currentTime < -1) root.currentTime = -1;
        startAudio(root.currentTime)
    };
    root.pause = function() {
        var tmp = root.restart;
        stopAudio();
        root.restart = tmp
    };
    root.stop = function() {
        stopAudio();
        root.restart = 0;
        root.currentTime = 0
    };
    root.addListener = function(callback) {
        onMidiEvent = callback
    };
    root.removeListener = function() {
        onMidiEvent = undefined
    };
    root.clearAnimation = function() {
        if (root.interval) {
            window.clearInterval(root.interval)
        }
    };
    root.setAnimation = function(config) {
        var callback = typeof config === "function" ? config : config.callback;
        var delay = config.delay || 100;
        var currentTime = 0;
        var tOurTime = 0;
        var tTheirTime = 0;
        root.clearAnimation();
        root.interval = window.setInterval(function() {
            if (root.endTime === 0) return;
            if (root.playing) {
                currentTime = tTheirTime == root.currentTime ? tOurTime - (new Date).getTime() : 0;
                if (root.currentTime === 0) {
                    currentTime = 0
                } else {
                    currentTime = root.currentTime - currentTime
                }
                if (tTheirTime != root.currentTime) {
                    tOurTime = (new Date).getTime();
                    tTheirTime = root.currentTime
                }
            } else {
                currentTime = root.currentTime
            }
            var endTime = root.endTime;
            var percent = currentTime / endTime;
            var total = currentTime / 1e3;
            var minutes = total / 60;
            var seconds = total - minutes * 60;
            var t1 = minutes * 60 + seconds;
            var t2 = endTime / 1e3;
            if (t2 - t1 < -1) return;
            callback({
                now: t1,
                end: t2,
                events: noteRegistrar
            })
        }, delay)
    };
    var loadMidiFile = function() {
        root.replayer = new Replayer(MidiFile(root.currentData), root.timeWarp);
        root.data = root.replayer.getData();
        root.endTime = getLength()
    };
    root.loadFile = function(file, callback) {
        root.stop();
        if (file.indexOf("base64,") !== -1) {
            var data = window.atob(file.split(",")[1]);
            root.currentData = data;
            loadMidiFile();
            if (callback) callback(data);
            return
        }
        var fetch = new XMLHttpRequest;
        fetch.open("GET", file);
        fetch.overrideMimeType("text/plain; charset=x-user-defined");
        fetch.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                var t = this.responseText || "";
                var ff = [];
                var mx = t.length;
                var scc = String.fromCharCode;
                for (var z = 0; z < mx; z++) {
                    ff[z] = scc(t.charCodeAt(z) & 255)
                }
                var data = window.atob(ff.join(""));
                root.currentData = data;
                loadMidiFile();
                if (callback) callback(data)
            }
        };
        fetch.send()
    };
    var eventQueue = [];
    var queuedTime;
    var startTime = 0;
    var noteRegistrar = {};
    var onMidiEvent = undefined;
    var scheduleTracking = function(channel, note, currentTime, offset, message, velocity) {
        var interval = window.setInterval(function() {
            window.clearInterval(interval);
            var data = {
                channel: channel,
                note: note,
                now: currentTime,
                end: root.endTime,
                message: message,
                velocity: velocity
            };
            if (message === 128) {
                delete noteRegistrar[note]
            } else {
                noteRegistrar[note] = data
            }
            if (onMidiEvent) {
                onMidiEvent(data)
            }
            root.currentTime = currentTime;
            if (root.currentTime === queuedTime && queuedTime < root.endTime) {
                startAudio(queuedTime, true)
            }
        }, currentTime - offset);
        return interval
    };
    var getContext = function() {
        if (MIDI.lang === "WebAudioAPI") {
            return MIDI.Player.ctx
        } else if (!root.ctx) {
            root.ctx = {
                currentTime: 0
            }
        }
        return root.ctx
    };
    var getLength = function() {
        var data = root.data;
        var length = data.length;
        var totalTime = .5;
        for (var n = 0; n < length; n++) {
            totalTime += data[n][1]
        }
        return totalTime
    };
    var startAudio = function(currentTime, fromCache) {
        if (!root.replayer) return;
        if (!fromCache) {
            if (typeof currentTime === "undefined") currentTime = root.restart;
            if (root.playing) stopAudio();
            root.playing = true;
            root.data = root.replayer.getData();
            root.endTime = getLength()
        }
        var note;
        var offset = 0;
        var messages = 0;
        var data = root.data;
        var ctx = getContext();
        var length = data.length;
        queuedTime = .5;
        startTime = ctx.currentTime;
        for (var n = 0; n < length && messages < 100; n++) {
            queuedTime += data[n][1];
            if (queuedTime <= currentTime) {
                offset = queuedTime;
                continue
            }
            currentTime = queuedTime - offset;
            var event = data[n][0].event;
            if (event.type !== "channel") continue;
            var channel = event.channel;
            switch (event.subtype) {
                case "noteOn":
                    if (MIDI.channels[channel].mute) break;
                    note = event.noteNumber - (root.MIDIOffset || 0);
                    eventQueue.push({
                        event: event,
                        source: MIDI.noteOn(channel, event.noteNumber, event.velocity, currentTime / 1e3 + ctx.currentTime),
                        interval: scheduleTracking(channel, note, queuedTime, offset, 144, event.velocity)
                    });
                    messages++;
                    break;
                case "noteOff":
                    if (MIDI.channels[channel].mute) break;
                    note = event.noteNumber - (root.MIDIOffset || 0);
                    eventQueue.push({
                        event: event,
                        source: MIDI.noteOff(channel, event.noteNumber, currentTime / 1e3 + ctx.currentTime),
                        interval: scheduleTracking(channel, note, queuedTime, offset - 10, 128)
                    });
                    break;
                default:
                    break
            }
        }
    };
    var stopAudio = function() {
        var ctx = getContext();
        root.playing = false;
        root.restart += (ctx.currentTime - startTime) * 1e3;
        while (eventQueue.length) {
            var o = eventQueue.pop();
            window.clearInterval(o.interval);
            if (!o.source) continue;
            if (typeof o.source === "number") {
                window.clearTimeout(o.source)
            } else {
                var source = o.source;
                source.disconnect(0);
                source.noteOff(0)
            }
        }
        for (var key in noteRegistrar) {
            var o = noteRegistrar[key];
            if (noteRegistrar[key].message === 144 && onMidiEvent) {
                onMidiEvent({
                    channel: o.channel,
                    note: o.note,
                    now: o.now,
                    end: o.end,
                    message: 128,
                    velocity: o.velocity
                })
            }
        }
        noteRegistrar = {}
    }
})();
if (!window.Color) Color = {};
if (!window.Color.Space) Color.Space = {};
(function() {
    var DEG_RAD = Math.PI / 180;
    var RAD_DEG = 1 / DEG_RAD;
    var shortcuts = {};
    var root = Color.Space = function(color, route) {
        if (shortcuts[route]) {
            route = shortcuts[route]
        }
        var arr = route.split(">");
        var key = "";
        for (var n = 0; n < arr.length; n++) {
            if (n > 1) {
                key = key.split("_");
                key.shift();
                key = key.join("_")
            }
            key += (n == 0 ? "" : "_") + arr[n];
            if (n > 0) color = root[key](color)
        }
        return color
    };
    root.STRING_HEX = function(o) {
        return parseInt("0x" + o)
    };
    root.HEX_STRING = function(o, maxLength) {
        if (!maxLength) maxLength = 6;
        if (!o) o = 0;
        var z = o.toString(16);
        var n = z.length;
        while (n < maxLength) {
            z = "0" + z;
            n++
        }
        var n = z.length;
        while (n > maxLength) {
            z = z.substr(1);
            n--
        }
        return z
    };
    root.HEX_RGB = function(o) {
        return {
            R: o >> 16,
            G: o >> 8 & 255,
            B: o & 255
        }
    };
    root.RGB_HEX = function(o) {
        if (o.R < 0) o.R = 0;
        if (o.G < 0) o.G = 0;
        if (o.B < 0) o.B = 0;
        if (o.R > 255) o.R = 255;
        if (o.G > 255) o.G = 255;
        if (o.B > 255) o.B = 255;
        return o.R << 16 | o.G << 8 | o.B
    };
    root.RGB_HSL = function(o) {
        var _R = o.R / 255,
            _G = o.G / 255,
            _B = o.B / 255,
            min = Math.min(_R, _G, _B),
            max = Math.max(_R, _G, _B),
            D = max - min,
            H, S, L = (max + min) / 2;
        if (D == 0) {
            H = 0;
            S = 0
        } else {
            if (L < .5) S = D / (max + min);
            else S = D / (2 - max - min);
            var DR = ((max - _R) / 6 + D / 2) / D;
            var DG = ((max - _G) / 6 + D / 2) / D;
            var DB = ((max - _B) / 6 + D / 2) / D;
            if (_R == max) H = DB - DG;
            else if (_G == max) H = 1 / 3 + DR - DB;
            else if (_B == max) H = 2 / 3 + DG - DR;
            if (H < 0) H += 1;
            if (H > 1) H -= 1
        }
        return {
            H: H * 360,
            S: S * 100,
            L: L * 100
        }
    };
    root.HSL_RGB = function(o) {
        var H = o.H / 360,
            S = o.S / 100,
            L = o.L / 100,
            R, G, B, _1, _2;

        function Hue_2_RGB(v1, v2, vH) {
            if (vH < 0) vH += 1;
            if (vH > 1) vH -= 1;
            if (6 * vH < 1) return v1 + (v2 - v1) * 6 * vH;
            if (2 * vH < 1) return v2;
            if (3 * vH < 2) return v1 + (v2 - v1) * (2 / 3 - vH) * 6;
            return v1
        }
        if (S == 0) {
            R = L * 255;
            G = L * 255;
            B = L * 255
        } else {
            if (L < .5) _2 = L * (1 + S);
            else _2 = L + S - S * L;
            _1 = 2 * L - _2;
            R = 255 * Hue_2_RGB(_1, _2, H + 1 / 3);
            G = 255 * Hue_2_RGB(_1, _2, H);
            B = 255 * Hue_2_RGB(_1, _2, H - 1 / 3)
        }
        return {
            R: R,
            G: G,
            B: B
        }
    }
})();
var invertObject = function(o) {
    if (o.length) {
        var ret = {};
        for (var key = 0; key < o.length; key++) {
            ret[o[key]] = key
        }
    } else {
        var ret = {};
        for (var key in o) {
            ret[o[key]] = key
        }
    }
    return ret
};
if (typeof MusicTheory === "undefined") MusicTheory = {};
(function() {
    var root = MusicTheory;
    root.key2number = {
        A: 0,
        "A#": 1,
        Bb: 1,
        B: 2,
        C: 3,
        "C#": 4,
        Db: 4,
        D: 5,
        "D#": 6,
        Eb: 6,
        E: 7,
        F: 8,
        "F#": 9,
        Gb: 9,
        G: 10,
        "G#": 11,
        Ab: 11
    };
    root.number2float = {
        0: 0,
        1: .5,
        2: 1,
        3: 2,
        4: 2.5,
        5: 3,
        6: 3.5,
        7: 4,
        8: 5,
        9: 5.5,
        10: 6,
        11: 6.5,
        12: 7
    };
    root.number2key = invertObject(root.key2number);
    root.float2number = invertObject(root.number2float);
    root.getKeySignature = function(key) {
        var keys = ["A", "AB", "B", "C", "CD", "D", "DE", "E", "F", "FG", "G", "GA"];
        var accidental = ["F", "C", "G", "D", "A", "E", "B"];
        var signature = {
            Fb: -8,
            Cb: -7,
            Gb: -6,
            Db: -5,
            Ab: -4,
            Eb: -3,
            Bb: -2,
            F: -1,
            C: 0,
            G: 1,
            D: 2,
            A: 3,
            E: 4,
            B: 5,
            "F#": 6,
            "C#": 7,
            "G#": 8,
            "D#": 9,
            "A#": 10,
            "E#": 11,
            "B#": 12
        }[key];
        if (signature < 0) {
            accidental = accidental.splice(7 + signature, -signature).reverse().join("")
        } else {
            accidental = accidental.splice(0, signature).join("")
        }
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].length > 1) {
                if (accidental.indexOf(keys[i][0]) != -1 || accidental.indexOf(keys[i][1]) != -1) {
                    if (signature > 0) {
                        keys[i] = keys[i][0] + "#"
                    } else {
                        keys[i] = keys[i][1] + "b"
                    }
                } else {
                    keys[i] = keys[i][0] + "#"
                }
            }
        }
        Piano.keySignature = keys
    };
    root.tempoFromTap = function(that) {
        function getName(v) {
            var tempo = {
                200: "Prestissimo",
                168: "Presto",
                140: "Vivace",
                120: "Allegro",
                112: "Allegretto",
                101: "Moderato",
                76: "Andante",
                66: "Adagio",
                60: "Larghetto",
                40: "Lento",
                0: "Larghissimo"
            };
            for (var n = 0, name = ""; n < 250; n++) {
                if (tempo[n]) name = tempo[n];
                if (v < n) return name
            }
            return "Prestissimo"
        }
        if (that.tap) {
            var diff = (new Date).getTime() - that.tap;
            var c = 1 / (diff / 1e3) * 60;
            Piano.tempo = c;
            console.log(getName(c), c, diff);
            document.getElementById("taptap").value = (c >> 0) + "bmp " + getName(c)
        }
        that.tap = (new Date).getTime()
    };
    root.findChord = function(r) {
        function rewrite(o) {
            var z = {};
            for (var i in o) {
                var r = {};
                for (var ii in o[i]) {
                    r[o[i][ii]] = 1
                }
                z[i] = r
            }
            return z
        }
        var test = {};
        var values = "0 3".split(" ");
        var chords = rewrite(Piano.chords);
        for (var key in chords) {
            for (var n = 0, length = values.length; n < length; n++) {
                if (isNaN(chords[key][values[n]])) {
                    test[key] = 1;
                    break
                }
            }
        }
        var results = [];
        for (var key in chords) {
            if (!test[key]) results.push(key)
        }
        document.getElementById("find").value = results;
        return results
    };
    root.scaleInfo = function(o) {
        var intervalNames = ["r", "b2", "2", "b3", "3", "4", "b5", "5", "&#X266F;5", "6", "b7", "7", "8", "b9", "9", "&#X266F;9", "10", "11", "b12", "12", "&#X266F;12", "13"];
        var notes = "",
            intervals = "",
            gaps = "",
            solfege = "",
            keys = "";
        for (var i in o) {
            if (o[i] > 0) {
                gaps += "-" + (o[i] - key)
            }
            var key = o[i];
            var note = Piano.calculateNote(key) % 12;
            var noteName = Piano.keySignature[note];
            var color = Piano.Color[Piano.HSL].english[note];
            solfege += ", " + MusicTheory.Solfege[noteName].syllable;
            keys += ", " + key;
            notes += ", " + noteName;
            intervals += ", " + intervalNames[key]
        }
        console.log("<b>notes:</b> " + notes.substr(2) + "<br>" + "<b>solfege:</b> " + solfege.substr(2) + "<br>" + "<b>intervals:</b> " + intervals.substr(2) + "<br>" + "<b>keys:</b> " + keys.substr(2) + "<br>" + "<b>gaps:</b> " + gaps.substr(1))
    }
})();
if (typeof MusicTheory === "undefined") var MusicTheory = {};
if (typeof MusicTheory.Synesthesia === "undefined") MusicTheory.Synesthesia = {};
(function(root) {
    root.data = {
        "Isaac Newton (1704)": {
            ref: "Gerstner, p.167",
            english: ["red", null, "orange", null, "yellow", "green", null, "blue", null, "indigo", null, "violet"],
            0: [0, 96, 51],
            1: [0, 0, 0],
            2: [29, 94, 52],
            3: [0, 0, 0],
            4: [60, 90, 60],
            5: [135, 76, 32],
            6: [0, 0, 0],
            7: [248, 82, 28],
            8: [0, 0, 0],
            9: [302, 88, 26],
            10: [0, 0, 0],
            11: [325, 84, 46]
        },
        "Louis Bertrand Castel (1734)": {
            ref: "Peacock, p.400",
            english: ["blue", "blue-green", "green", "olive green", "yellow", "yellow-orange", "orange", "red", "crimson", "violet", "agate", "indigo"],
            0: [248, 82, 28],
            1: [172, 68, 34],
            2: [135, 76, 32],
            3: [79, 59, 36],
            4: [60, 90, 60],
            5: [49, 90, 60],
            6: [29, 94, 52],
            7: [360, 96, 51],
            8: [1, 89, 33],
            9: [325, 84, 46],
            10: [273, 80, 27],
            11: [302, 88, 26]
        },
        "George Field (1816)": {
            ref: "Klein, p.69",
            english: ["blue", null, "purple", null, "red", "orange", null, "yellow", null, "yellow green", null, "green"],
            0: [248, 82, 28],
            1: [0, 0, 0],
            2: [302, 88, 26],
            3: [0, 0, 0],
            4: [360, 96, 51],
            5: [29, 94, 52],
            6: [0, 0, 0],
            7: [60, 90, 60],
            8: [0, 0, 0],
            9: [79, 59, 36],
            10: [0, 0, 0],
            11: [135, 76, 32]
        },
        "D. D. Jameson (1844)": {
            ref: "Jameson, p.12",
            english: ["red", "red-orange", "orange", "orange-yellow", "yellow", "green", "green-blue", "blue", "blue-purple", "purple", "purple-violet", "violet"],
            0: [360, 96, 51],
            1: [14, 91, 51],
            2: [29, 94, 52],
            3: [49, 90, 60],
            4: [60, 90, 60],
            5: [135, 76, 32],
            6: [172, 68, 34],
            7: [248, 82, 28],
            8: [273, 80, 27],
            9: [302, 88, 26],
            10: [313, 78, 37],
            11: [325, 84, 46]
        },
        "Theodor Seemann (1881)": {
            ref: "Klein, p.86",
            english: ["carmine", "scarlet", "orange", "yellow-orange", "yellow", "green", "green blue", "blue", "indigo", "violet", "brown", "black"],
            0: [0, 58, 26],
            1: [360, 96, 51],
            2: [29, 94, 52],
            3: [49, 90, 60],
            4: [60, 90, 60],
            5: [135, 76, 32],
            6: [172, 68, 34],
            7: [248, 82, 28],
            8: [302, 88, 26],
            9: [325, 84, 46],
            10: [0, 58, 26],
            11: [0, 0, 3]
        },
        "A. Wallace Rimington (1893)": {
            ref: "Peacock, p.402",
            english: ["deep red", "crimson", "orange-crimson", "orange", "yellow", "yellow-green", "green", "blueish green", "blue-green", "indigo", "deep blue", "violet"],
            0: [360, 96, 51],
            1: [1, 89, 33],
            2: [14, 91, 51],
            3: [29, 94, 52],
            4: [60, 90, 60],
            5: [79, 59, 36],
            6: [135, 76, 32],
            7: [163, 62, 40],
            8: [172, 68, 34],
            9: [302, 88, 26],
            10: [248, 82, 28],
            11: [325, 84, 46]
        },
        "Bainbridge Bishop (1893)": {
            ref: "Bishop, p.11",
            english: ["red", "orange-red or scarlet", "orange", "gold or yellow-orange", "yellow or green-gold", "yellow-green", "green", "greenish-blue or aquamarine", "blue", "indigo or violet-blue", "violet", "violet-red", "red"],
            0: [360, 96, 51],
            1: [1, 89, 33],
            2: [29, 94, 52],
            3: [50, 93, 52],
            4: [60, 90, 60],
            5: [73, 73, 55],
            6: [135, 76, 32],
            7: [163, 62, 40],
            8: [302, 88, 26],
            9: [325, 84, 46],
            10: [343, 79, 47],
            11: [360, 96, 51]
        },
        "H. von Helmholtz (1910)": {
            ref: "Helmholtz, p.22",
            english: ["yellow", "green", "greenish blue", "cayan-blue", "indigo blue", "violet", "end of red", "red", "red", "red", "red orange", "orange"],
            0: [60, 90, 60],
            1: [135, 76, 32],
            2: [172, 68, 34],
            3: [211, 70, 37],
            4: [302, 88, 26],
            5: [325, 84, 46],
            6: [330, 84, 34],
            7: [360, 96, 51],
            8: [10, 91, 43],
            9: [10, 91, 43],
            10: [8, 93, 51],
            11: [28, 89, 50]
        },
        "Alexander Scriabin (1911)": {
            ref: "Jones, p.104",
            english: ["red", "violet", "yellow", "steely with the glint of metal", "pearly blue the shimmer of moonshine", "dark red", "bright blue", "rosy orange", "purple", "green", "steely with a glint of metal", "pearly blue the shimmer of moonshine"],
            0: [360, 96, 51],
            1: [325, 84, 46],
            2: [60, 90, 60],
            3: [245, 21, 43],
            4: [211, 70, 37],
            5: [1, 89, 33],
            6: [248, 82, 28],
            7: [29, 94, 52],
            8: [302, 88, 26],
            9: [135, 76, 32],
            10: [245, 21, 43],
            11: [211, 70, 37]
        },
        "Adrian Bernard Klein (1930)": {
            ref: "Klein, p.209",
            english: ["dark red", "red", "red orange", "orange", "yellow", "yellow green", "green", "blue-green", "blue", "blue violet", "violet", "dark violet"],
            0: [0, 91, 40],
            1: [360, 96, 51],
            2: [14, 91, 51],
            3: [29, 94, 52],
            4: [60, 90, 60],
            5: [73, 73, 55],
            6: [135, 76, 32],
            7: [172, 68, 34],
            8: [248, 82, 28],
            9: [292, 70, 31],
            10: [325, 84, 46],
            11: [330, 84, 34]
        },
        "August Aeppli (1940)": {
            ref: "Gerstner, p.169",
            english: ["red", null, "orange", null, "yellow", null, "green", "blue-green", null, "ultramarine blue", "violet", "purple"],
            0: [0, 96, 51],
            1: [0, 0, 0],
            2: [29, 94, 52],
            3: [0, 0, 0],
            4: [60, 90, 60],
            5: [0, 0, 0],
            6: [135, 76, 32],
            7: [172, 68, 34],
            8: [0, 0, 0],
            9: [211, 70, 37],
            10: [273, 80, 27],
            11: [302, 88, 26]
        },
        "I. J. Belmont (1944)": {
            ref: "Belmont, p.226",
            english: ["red", "red-orange", "orange", "yellow-orange", "yellow", "yellow-green", "green", "blue-green", "blue", "blue-violet", "violet", "red-violet"],
            0: [360, 96, 51],
            1: [14, 91, 51],
            2: [29, 94, 52],
            3: [50, 93, 52],
            4: [60, 90, 60],
            5: [73, 73, 55],
            6: [135, 76, 32],
            7: [172, 68, 34],
            8: [248, 82, 28],
            9: [313, 78, 37],
            10: [325, 84, 46],
            11: [338, 85, 37]
        },
        "Steve Zieverink (2004)": {
            ref: "Cincinnati Contemporary Art Center",
            english: ["yellow-green", "green", "blue-green", "blue", "indigo", "violet", "ultra violet", "infra red", "red", "orange", "yellow-white", "yellow"],
            0: [73, 73, 55],
            1: [135, 76, 32],
            2: [172, 68, 34],
            3: [248, 82, 28],
            4: [302, 88, 26],
            5: [325, 84, 46],
            6: [326, 79, 24],
            7: [1, 89, 33],
            8: [360, 96, 51],
            9: [29, 94, 52],
            10: [62, 78, 74],
            11: [60, 90, 60]
        }
    };
    root.map = function(type) {
        var data = {};
        var blend = function(a, b) {
            return [a[0] * .5 + b[0] * .5 + .5 >> 0, a[1] * .5 + b[1] * .5 + .5 >> 0, a[2] * .5 + b[2] * .5 + .5 >> 0]
        };
        var syn = root.data;
        var colors = syn[type] || syn["D. D. Jameson (1844)"];
        for (var note = 0; note <= 88; note++) {
            var clr = colors[(note + 9) % 12];
            if (clr[0] == clr[1] && clr[1] == clr[2]) {
                clr = blend(parray, colors[(note + 10) % 12])
            }
            var amount = clr[2] / 10;
            var octave = note / 12 >> 0;
            var octaveLum = clr[2] + amount * octave - 3 * amount;
            data[note] = {
                hsl: "hsla(" + clr[0] + "," + clr[1] + "%," + octaveLum + "%, 1)",
                hex: Color.Space({
                    H: clr[0],
                    S: clr[1],
                    L: octaveLum
                }, "HSL>RGB>HEX>STRING")
            };
            var parray = clr
        }
        return data
    }
})(MusicTheory.Synesthesia);
(function(a, b) {
    function cy(a) {
        return f.isWindow(a) ? a : a.nodeType === 9 ? a.defaultView || a.parentWindow : !1
    }

    function cv(a) {
        if (!ck[a]) {
            var b = c.body,
                d = f("<" + a + ">").appendTo(b),
                e = d.css("display");
            d.remove();
            if (e === "none" || e === "") {
                cl || (cl = c.createElement("iframe"), cl.frameBorder = cl.width = cl.height = 0), b.appendChild(cl);
                if (!cm || !cl.createElement) cm = (cl.contentWindow || cl.contentDocument).document, cm.write((c.compatMode === "CSS1Compat" ? "<!doctype html>" : "") + "<html><body>"), cm.close();
                d = cm.createElement(a), cm.body.appendChild(d), e = f.css(d, "display"), b.removeChild(cl)
            }
            ck[a] = e
        }
        return ck[a]
    }

    function cu(a, b) {
        var c = {};
        f.each(cq.concat.apply([], cq.slice(0, b)), function() {
            c[this] = a
        });
        return c
    }

    function ct() {
        cr = b
    }

    function cs() {
        setTimeout(ct, 0);
        return cr = f.now()
    }

    function cj() {
        try {
            return new a.ActiveXObject("Microsoft.XMLHTTP")
        } catch (b) {}
    }

    function ci() {
        try {
            return new a.XMLHttpRequest
        } catch (b) {}
    }

    function cc(a, c) {
        a.dataFilter && (c = a.dataFilter(c, a.dataType));
        var d = a.dataTypes,
            e = {},
            g, h, i = d.length,
            j, k = d[0],
            l, m, n, o, p;
        for (g = 1; g < i; g++) {
            if (g === 1)
                for (h in a.converters) typeof h == "string" && (e[h.toLowerCase()] = a.converters[h]);
            l = k, k = d[g];
            if (k === "*") k = l;
            else if (l !== "*" && l !== k) {
                m = l + " " + k, n = e[m] || e["* " + k];
                if (!n) {
                    p = b;
                    for (o in e) {
                        j = o.split(" ");
                        if (j[0] === l || j[0] === "*") {
                            p = e[j[1] + " " + k];
                            if (p) {
                                o = e[o], o === !0 ? n = p : p === !0 && (n = o);
                                break
                            }
                        }
                    }
                }!n && !p && f.error("No conversion from " + m.replace(" ", " to ")), n !== !0 && (c = n ? n(c) : p(o(c)))
            }
        }
        return c
    }

    function cb(a, c, d) {
        var e = a.contents,
            f = a.dataTypes,
            g = a.responseFields,
            h, i, j, k;
        for (i in g) i in d && (c[g[i]] = d[i]);
        while (f[0] === "*") f.shift(), h === b && (h = a.mimeType || c.getResponseHeader("content-type"));
        if (h)
            for (i in e)
                if (e[i] && e[i].test(h)) {
                    f.unshift(i);
                    break
                }
        if (f[0] in d) j = f[0];
        else {
            for (i in d) {
                if (!f[0] || a.converters[i + " " + f[0]]) {
                    j = i;
                    break
                }
                k || (k = i)
            }
            j = j || k
        }
        if (j) {
            j !== f[0] && f.unshift(j);
            return d[j]
        }
    }

    function ca(a, b, c, d) {
        if (f.isArray(b)) f.each(b, function(b, e) {
            c || bE.test(a) ? d(a, e) : ca(a + "[" + (typeof e == "object" || f.isArray(e) ? b : "") + "]", e, c, d)
        });
        else if (!c && b != null && typeof b == "object")
            for (var e in b) ca(a + "[" + e + "]", b[e], c, d);
        else d(a, b)
    }

    function b_(a, c) {
        var d, e, g = f.ajaxSettings.flatOptions || {};
        for (d in c) c[d] !== b && ((g[d] ? a : e || (e = {}))[d] = c[d]);
        e && f.extend(!0, a, e)
    }

    function b$(a, c, d, e, f, g) {
        f = f || c.dataTypes[0], g = g || {}, g[f] = !0;
        var h = a[f],
            i = 0,
            j = h ? h.length : 0,
            k = a === bT,
            l;
        for (; i < j && (k || !l); i++) l = h[i](c, d, e), typeof l == "string" && (!k || g[l] ? l = b : (c.dataTypes.unshift(l), l = b$(a, c, d, e, l, g)));
        (k || !l) && !g["*"] && (l = b$(a, c, d, e, "*", g));
        return l
    }

    function bZ(a) {
        return function(b, c) {
            typeof b != "string" && (c = b, b = "*");
            if (f.isFunction(c)) {
                var d = b.toLowerCase().split(bP),
                    e = 0,
                    g = d.length,
                    h, i, j;
                for (; e < g; e++) h = d[e], j = /^\+/.test(h), j && (h = h.substr(1) || "*"), i = a[h] = a[h] || [], i[j ? "unshift" : "push"](c)
            }
        }
    }

    function bC(a, b, c) {
        var d = b === "width" ? a.offsetWidth : a.offsetHeight,
            e = b === "width" ? bx : by,
            g = 0,
            h = e.length;
        if (d > 0) {
            if (c !== "border")
                for (; g < h; g++) c || (d -= parseFloat(f.css(a, "padding" + e[g])) || 0), c === "margin" ? d += parseFloat(f.css(a, c + e[g])) || 0 : d -= parseFloat(f.css(a, "border" + e[g] + "Width")) || 0;
            return d + "px"
        }
        d = bz(a, b, b);
        if (d < 0 || d == null) d = a.style[b] || 0;
        d = parseFloat(d) || 0;
        if (c)
            for (; g < h; g++) d += parseFloat(f.css(a, "padding" + e[g])) || 0, c !== "padding" && (d += parseFloat(f.css(a, "border" + e[g] + "Width")) || 0), c === "margin" && (d += parseFloat(f.css(a, c + e[g])) || 0);
        return d + "px"
    }

    function bp(a, b) {
        b.src ? f.ajax({
            url: b.src,
            async: !1,
            dataType: "script"
        }) : f.globalEval((b.text || b.textContent || b.innerHTML || "").replace(bf, "/*$0*/")), b.parentNode && b.parentNode.removeChild(b)
    }

    function bo(a) {
        var b = c.createElement("div");
        bh.appendChild(b), b.innerHTML = a.outerHTML;
        return b.firstChild
    }

    function bn(a) {
        var b = (a.nodeName || "").toLowerCase();
        b === "input" ? bm(a) : b !== "script" && typeof a.getElementsByTagName != "undefined" && f.grep(a.getElementsByTagName("input"), bm)
    }

    function bm(a) {
        if (a.type === "checkbox" || a.type === "radio") a.defaultChecked = a.checked
    }

    function bl(a) {
        return typeof a.getElementsByTagName != "undefined" ? a.getElementsByTagName("*") : typeof a.querySelectorAll != "undefined" ? a.querySelectorAll("*") : []
    }

    function bk(a, b) {
        var c;
        if (b.nodeType === 1) {
            b.clearAttributes && b.clearAttributes(), b.mergeAttributes && b.mergeAttributes(a), c = b.nodeName.toLowerCase();
            if (c === "object") b.outerHTML = a.outerHTML;
            else if (c !== "input" || a.type !== "checkbox" && a.type !== "radio") {
                if (c === "option") b.selected = a.defaultSelected;
                else if (c === "input" || c === "textarea") b.defaultValue = a.defaultValue
            } else a.checked && (b.defaultChecked = b.checked = a.checked), b.value !== a.value && (b.value = a.value);
            b.removeAttribute(f.expando)
        }
    }

    function bj(a, b) {
        if (b.nodeType === 1 && !!f.hasData(a)) {
            var c, d, e, g = f._data(a),
                h = f._data(b, g),
                i = g.events;
            if (i) {
                delete h.handle, h.events = {};
                for (c in i)
                    for (d = 0, e = i[c].length; d < e; d++) f.event.add(b, c + (i[c][d].namespace ? "." : "") + i[c][d].namespace, i[c][d], i[c][d].data)
            }
            h.data && (h.data = f.extend({}, h.data))
        }
    }

    function bi(a, b) {
        return f.nodeName(a, "table") ? a.getElementsByTagName("tbody")[0] || a.appendChild(a.ownerDocument.createElement("tbody")) : a
    }

    function U(a) {
        var b = V.split("|"),
            c = a.createDocumentFragment();
        if (c.createElement)
            while (b.length) c.createElement(b.pop());
        return c
    }

    function T(a, b, c) {
        b = b || 0;
        if (f.isFunction(b)) return f.grep(a, function(a, d) {
            var e = !!b.call(a, d, a);
            return e === c
        });
        if (b.nodeType) return f.grep(a, function(a, d) {
            return a === b === c
        });
        if (typeof b == "string") {
            var d = f.grep(a, function(a) {
                return a.nodeType === 1
            });
            if (O.test(b)) return f.filter(b, d, !c);
            b = f.filter(b, d)
        }
        return f.grep(a, function(a, d) {
            return f.inArray(a, b) >= 0 === c
        })
    }

    function S(a) {
        return !a || !a.parentNode || a.parentNode.nodeType === 11
    }

    function K() {
        return !0
    }

    function J() {
        return !1
    }

    function n(a, b, c) {
        var d = b + "defer",
            e = b + "queue",
            g = b + "mark",
            h = f._data(a, d);
        h && (c === "queue" || !f._data(a, e)) && (c === "mark" || !f._data(a, g)) && setTimeout(function() {
            !f._data(a, e) && !f._data(a, g) && (f.removeData(a, d, !0), h.fire())
        }, 0)
    }

    function m(a) {
        for (var b in a) {
            if (b === "data" && f.isEmptyObject(a[b])) continue;
            if (b !== "toJSON") return !1
        }
        return !0
    }

    function l(a, c, d) {
        if (d === b && a.nodeType === 1) {
            var e = "data-" + c.replace(k, "-$1").toLowerCase();
            d = a.getAttribute(e);
            if (typeof d == "string") {
                try {
                    d = d === "true" ? !0 : d === "false" ? !1 : d === "null" ? null : f.isNumeric(d) ? parseFloat(d) : j.test(d) ? f.parseJSON(d) : d
                } catch (g) {}
                f.data(a, c, d)
            } else d = b
        }
        return d
    }

    function h(a) {
        var b = g[a] = {},
            c, d;
        a = a.split(/\s+/);
        for (c = 0, d = a.length; c < d; c++) b[a[c]] = !0;
        return b
    }
    var c = a.document,
        d = a.navigator,
        e = a.location,
        f = function() {
            function J() {
                if (!e.isReady) {
                    try {
                        c.documentElement.doScroll("left")
                    } catch (a) {
                        setTimeout(J, 1);
                        return
                    }
                    e.ready()
                }
            }
            var e = function(a, b) {
                    return new e.fn.init(a, b, h)
                },
                f = a.jQuery,
                g = a.$,
                h, i = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
                j = /\S/,
                k = /^\s+/,
                l = /\s+$/,
                m = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,
                n = /^[\],:{}\s]*$/,
                o = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
                p = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                q = /(?:^|:|,)(?:\s*\[)+/g,
                r = /(webkit)[ \/]([\w.]+)/,
                s = /(opera)(?:.*version)?[ \/]([\w.]+)/,
                t = /(msie) ([\w.]+)/,
                u = /(mozilla)(?:.*? rv:([\w.]+))?/,
                v = /-([a-z]|[0-9])/gi,
                w = /^-ms-/,
                x = function(a, b) {
                    return (b + "").toUpperCase()
                },
                y = d.userAgent,
                z, A, B, C = Object.prototype.toString,
                D = Object.prototype.hasOwnProperty,
                E = Array.prototype.push,
                F = Array.prototype.slice,
                G = String.prototype.trim,
                H = Array.prototype.indexOf,
                I = {};
            e.fn = e.prototype = {
                constructor: e,
                init: function(a, d, f) {
                    var g, h, j, k;
                    if (!a) return this;
                    if (a.nodeType) {
                        this.context = this[0] = a, this.length = 1;
                        return this
                    }
                    if (a === "body" && !d && c.body) {
                        this.context = c, this[0] = c.body, this.selector = a, this.length = 1;
                        return this
                    }
                    if (typeof a == "string") {
                        a.charAt(0) !== "<" || a.charAt(a.length - 1) !== ">" || a.length < 3 ? g = i.exec(a) : g = [null, a, null];
                        if (g && (g[1] || !d)) {
                            if (g[1]) {
                                d = d instanceof e ? d[0] : d, k = d ? d.ownerDocument || d : c, j = m.exec(a), j ? e.isPlainObject(d) ? (a = [c.createElement(j[1])], e.fn.attr.call(a, d, !0)) : a = [k.createElement(j[1])] : (j = e.buildFragment([g[1]], [k]), a = (j.cacheable ? e.clone(j.fragment) : j.fragment).childNodes);
                                return e.merge(this, a)
                            }
                            h = c.getElementById(g[2]);
                            if (h && h.parentNode) {
                                if (h.id !== g[2]) return f.find(a);
                                this.length = 1, this[0] = h
                            }
                            this.context = c, this.selector = a;
                            return this
                        }
                        return !d || d.jquery ? (d || f).find(a) : this.constructor(d).find(a)
                    }
                    if (e.isFunction(a)) return f.ready(a);
                    a.selector !== b && (this.selector = a.selector, this.context = a.context);
                    return e.makeArray(a, this)
                },
                selector: "",
                jquery: "1.7.1",
                length: 0,
                size: function() {
                    return this.length
                },
                toArray: function() {
                    return F.call(this, 0)
                },
                get: function(a) {
                    return a == null ? this.toArray() : a < 0 ? this[this.length + a] : this[a]
                },
                pushStack: function(a, b, c) {
                    var d = this.constructor();
                    e.isArray(a) ? E.apply(d, a) : e.merge(d, a), d.prevObject = this, d.context = this.context, b === "find" ? d.selector = this.selector + (this.selector ? " " : "") + c : b && (d.selector = this.selector + "." + b + "(" + c + ")");
                    return d
                },
                each: function(a, b) {
                    return e.each(this, a, b)
                },
                ready: function(a) {
                    e.bindReady(), A.add(a);
                    return this
                },
                eq: function(a) {
                    a = +a;
                    return a === -1 ? this.slice(a) : this.slice(a, a + 1)
                },
                first: function() {
                    return this.eq(0)
                },
                last: function() {
                    return this.eq(-1)
                },
                slice: function() {
                    return this.pushStack(F.apply(this, arguments), "slice", F.call(arguments).join(","))
                },
                map: function(a) {
                    return this.pushStack(e.map(this, function(b, c) {
                        return a.call(b, c, b)
                    }))
                },
                end: function() {
                    return this.prevObject || this.constructor(null)
                },
                push: E,
                sort: [].sort,
                splice: [].splice
            }, e.fn.init.prototype = e.fn, e.extend = e.fn.extend = function() {
                var a, c, d, f, g, h, i = arguments[0] || {},
                    j = 1,
                    k = arguments.length,
                    l = !1;
                typeof i == "boolean" && (l = i, i = arguments[1] || {}, j = 2), typeof i != "object" && !e.isFunction(i) && (i = {}), k === j && (i = this, --j);
                for (; j < k; j++)
                    if ((a = arguments[j]) != null)
                        for (c in a) {
                            d = i[c], f = a[c];
                            if (i === f) continue;
                            l && f && (e.isPlainObject(f) || (g = e.isArray(f))) ? (g ? (g = !1, h = d && e.isArray(d) ? d : []) : h = d && e.isPlainObject(d) ? d : {}, i[c] = e.extend(l, h, f)) : f !== b && (i[c] = f)
                        }
                return i
            }, e.extend({
                noConflict: function(b) {
                    a.$ === e && (a.$ = g), b && a.jQuery === e && (a.jQuery = f);
                    return e
                },
                isReady: !1,
                readyWait: 1,
                holdReady: function(a) {
                    a ? e.readyWait++ : e.ready(!0)
                },
                ready: function(a) {
                    if (a === !0 && !--e.readyWait || a !== !0 && !e.isReady) {
                        if (!c.body) return setTimeout(e.ready, 1);
                        e.isReady = !0;
                        if (a !== !0 && --e.readyWait > 0) return;
                        A.fireWith(c, [e]), e.fn.trigger && e(c).trigger("ready").off("ready")
                    }
                },
                bindReady: function() {
                    if (!A) {
                        A = e.Callbacks("once memory");
                        if (c.readyState === "complete") return setTimeout(e.ready, 1);
                        if (c.addEventListener) c.addEventListener("DOMContentLoaded", B, !1), a.addEventListener("load", e.ready, !1);
                        else if (c.attachEvent) {
                            c.attachEvent("onreadystatechange", B), a.attachEvent("onload", e.ready);
                            var b = !1;
                            try {
                                b = a.frameElement == null
                            } catch (d) {}
                            c.documentElement.doScroll && b && J()
                        }
                    }
                },
                isFunction: function(a) {
                    return e.type(a) === "function"
                },
                isArray: Array.isArray || function(a) {
                    return e.type(a) === "array"
                },
                isWindow: function(a) {
                    return a && typeof a == "object" && "setInterval" in a
                },
                isNumeric: function(a) {
                    return !isNaN(parseFloat(a)) && isFinite(a)
                },
                type: function(a) {
                    return a == null ? String(a) : I[C.call(a)] || "object"
                },
                isPlainObject: function(a) {
                    if (!a || e.type(a) !== "object" || a.nodeType || e.isWindow(a)) return !1;
                    try {
                        if (a.constructor && !D.call(a, "constructor") && !D.call(a.constructor.prototype, "isPrototypeOf")) return !1
                    } catch (c) {
                        return !1
                    }
                    var d;
                    for (d in a);
                    return d === b || D.call(a, d)
                },
                isEmptyObject: function(a) {
                    for (var b in a) return !1;
                    return !0
                },
                error: function(a) {
                    throw new Error(a)
                },
                parseJSON: function(b) {
                    if (typeof b != "string" || !b) return null;
                    b = e.trim(b);
                    if (a.JSON && a.JSON.parse) return a.JSON.parse(b);
                    if (n.test(b.replace(o, "@").replace(p, "]").replace(q, ""))) return new Function("return " + b)();
                    e.error("Invalid JSON: " + b)
                },
                parseXML: function(c) {
                    var d, f;
                    try {
                        a.DOMParser ? (f = new DOMParser, d = f.parseFromString(c, "text/xml")) : (d = new ActiveXObject("Microsoft.XMLDOM"), d.async = "false", d.loadXML(c))
                    } catch (g) {
                        d = b
                    }(!d || !d.documentElement || d.getElementsByTagName("parsererror").length) && e.error("Invalid XML: " + c);
                    return d
                },
                noop: function() {},
                globalEval: function(b) {
                    b && j.test(b) && (a.execScript || function(b) {
                        a.eval.call(a, b)
                    })(b)
                },
                camelCase: function(a) {
                    return a.replace(w, "ms-").replace(v, x)
                },
                nodeName: function(a, b) {
                    return a.nodeName && a.nodeName.toUpperCase() === b.toUpperCase()
                },
                each: function(a, c, d) {
                    var f, g = 0,
                        h = a.length,
                        i = h === b || e.isFunction(a);
                    if (d) {
                        if (i) {
                            for (f in a)
                                if (c.apply(a[f], d) === !1) break
                        } else
                            for (; g < h;)
                                if (c.apply(a[g++], d) === !1) break
                    } else if (i) {
                        for (f in a)
                            if (c.call(a[f], f, a[f]) === !1) break
                    } else
                        for (; g < h;)
                            if (c.call(a[g], g, a[g++]) === !1) break;
                    return a
                },
                trim: G ? function(a) {
                    return a == null ? "" : G.call(a)
                } : function(a) {
                    return a == null ? "" : (a + "").replace(k, "").replace(l, "")
                },
                makeArray: function(a, b) {
                    var c = b || [];
                    if (a != null) {
                        var d = e.type(a);
                        a.length == null || d === "string" || d === "function" || d === "regexp" || e.isWindow(a) ? E.call(c, a) : e.merge(c, a)
                    }
                    return c
                },
                inArray: function(a, b, c) {
                    var d;
                    if (b) {
                        if (H) return H.call(b, a, c);
                        d = b.length, c = c ? c < 0 ? Math.max(0, d + c) : c : 0;
                        for (; c < d; c++)
                            if (c in b && b[c] === a) return c
                    }
                    return -1
                },
                merge: function(a, c) {
                    var d = a.length,
                        e = 0;
                    if (typeof c.length == "number")
                        for (var f = c.length; e < f; e++) a[d++] = c[e];
                    else
                        while (c[e] !== b) a[d++] = c[e++];
                    a.length = d;
                    return a
                },
                grep: function(a, b, c) {
                    var d = [],
                        e;
                    c = !!c;
                    for (var f = 0, g = a.length; f < g; f++) e = !!b(a[f], f), c !== e && d.push(a[f]);
                    return d
                },
                map: function(a, c, d) {
                    var f, g, h = [],
                        i = 0,
                        j = a.length,
                        k = a instanceof e || j !== b && typeof j == "number" && (j > 0 && a[0] && a[j - 1] || j === 0 || e.isArray(a));
                    if (k)
                        for (; i < j; i++) f = c(a[i], i, d), f != null && (h[h.length] = f);
                    else
                        for (g in a) f = c(a[g], g, d), f != null && (h[h.length] = f);
                    return h.concat.apply([], h)
                },
                guid: 1,
                proxy: function(a, c) {
                    if (typeof c == "string") {
                        var d = a[c];
                        c = a, a = d
                    }
                    if (!e.isFunction(a)) return b;
                    var f = F.call(arguments, 2),
                        g = function() {
                            return a.apply(c, f.concat(F.call(arguments)))
                        };
                    g.guid = a.guid = a.guid || g.guid || e.guid++;
                    return g
                },
                access: function(a, c, d, f, g, h) {
                    var i = a.length;
                    if (typeof c == "object") {
                        for (var j in c) e.access(a, j, c[j], f, g, d);
                        return a
                    }
                    if (d !== b) {
                        f = !h && f && e.isFunction(d);
                        for (var k = 0; k < i; k++) g(a[k], c, f ? d.call(a[k], k, g(a[k], c)) : d, h);
                        return a
                    }
                    return i ? g(a[0], c) : b
                },
                now: function() {
                    return (new Date).getTime()
                },
                uaMatch: function(a) {
                    a = a.toLowerCase();
                    var b = r.exec(a) || s.exec(a) || t.exec(a) || a.indexOf("compatible") < 0 && u.exec(a) || [];
                    return {
                        browser: b[1] || "",
                        version: b[2] || "0"
                    }
                },
                sub: function() {
                    function a(b, c) {
                        return new a.fn.init(b, c)
                    }
                    e.extend(!0, a, this), a.superclass = this, a.fn = a.prototype = this(), a.fn.constructor = a, a.sub = this.sub, a.fn.init = function(d, f) {
                        f && f instanceof e && !(f instanceof a) && (f = a(f));
                        return e.fn.init.call(this, d, f, b)
                    }, a.fn.init.prototype = a.fn;
                    var b = a(c);
                    return a
                },
                browser: {}
            }), e.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(a, b) {
                I["[object " + b + "]"] = b.toLowerCase()
            }), z = e.uaMatch(y), z.browser && (e.browser[z.browser] = !0, e.browser.version = z.version), e.browser.webkit && (e.browser.safari = !0), j.test(" ") && (k = /^[\s\xA0]+/, l = /[\s\xA0]+$/), h = e(c), c.addEventListener ? B = function() {
                c.removeEventListener("DOMContentLoaded", B, !1), e.ready()
            } : c.attachEvent && (B = function() {
                c.readyState === "complete" && (c.detachEvent("onreadystatechange", B), e.ready())
            });
            return e
        }(),
        g = {};
    f.Callbacks = function(a) {
        a = a ? g[a] || h(a) : {};
        var c = [],
            d = [],
            e, i, j, k, l, m = function(b) {
                var d, e, g, h, i;
                for (d = 0, e = b.length; d < e; d++) g = b[d], h = f.type(g), h === "array" ? m(g) : h === "function" && (!a.unique || !o.has(g)) && c.push(g)
            },
            n = function(b, f) {
                f = f || [], e = !a.memory || [b, f], i = !0, l = j || 0, j = 0, k = c.length;
                for (; c && l < k; l++)
                    if (c[l].apply(b, f) === !1 && a.stopOnFalse) {
                        e = !0;
                        break
                    }
                i = !1, c && (a.once ? e === !0 ? o.disable() : c = [] : d && d.length && (e = d.shift(), o.fireWith(e[0], e[1])))
            },
            o = {
                add: function() {
                    if (c) {
                        var a = c.length;
                        m(arguments), i ? k = c.length : e && e !== !0 && (j = a, n(e[0], e[1]))
                    }
                    return this
                },
                remove: function() {
                    if (c) {
                        var b = arguments,
                            d = 0,
                            e = b.length;
                        for (; d < e; d++)
                            for (var f = 0; f < c.length; f++)
                                if (b[d] === c[f]) {
                                    i && f <= k && (k--, f <= l && l--), c.splice(f--, 1);
                                    if (a.unique) break
                                }
                    }
                    return this
                },
                has: function(a) {
                    if (c) {
                        var b = 0,
                            d = c.length;
                        for (; b < d; b++)
                            if (a === c[b]) return !0
                    }
                    return !1
                },
                empty: function() {
                    c = [];
                    return this
                },
                disable: function() {
                    c = d = e = b;
                    return this
                },
                disabled: function() {
                    return !c
                },
                lock: function() {
                    d = b, (!e || e === !0) && o.disable();
                    return this
                },
                locked: function() {
                    return !d
                },
                fireWith: function(b, c) {
                    d && (i ? a.once || d.push([b, c]) : (!a.once || !e) && n(b, c));
                    return this
                },
                fire: function() {
                    o.fireWith(this, arguments);
                    return this
                },
                fired: function() {
                    return !!e
                }
            };
        return o
    };
    var i = [].slice;
    f.extend({
        Deferred: function(a) {
            var b = f.Callbacks("once memory"),
                c = f.Callbacks("once memory"),
                d = f.Callbacks("memory"),
                e = "pending",
                g = {
                    resolve: b,
                    reject: c,
                    notify: d
                },
                h = {
                    done: b.add,
                    fail: c.add,
                    progress: d.add,
                    state: function() {
                        return e
                    },
                    isResolved: b.fired,
                    isRejected: c.fired,
                    then: function(a, b, c) {
                        i.done(a).fail(b).progress(c);
                        return this
                    },
                    always: function() {
                        i.done.apply(i, arguments).fail.apply(i, arguments);
                        return this
                    },
                    pipe: function(a, b, c) {
                        return f.Deferred(function(d) {
                            f.each({
                                done: [a, "resolve"],
                                fail: [b, "reject"],
                                progress: [c, "notify"]
                            }, function(a, b) {
                                var c = b[0],
                                    e = b[1],
                                    g;
                                f.isFunction(c) ? i[a](function() {
                                    g = c.apply(this, arguments), g && f.isFunction(g.promise) ? g.promise().then(d.resolve, d.reject, d.notify) : d[e + "With"](this === i ? d : this, [g])
                                }) : i[a](d[e])
                            })
                        }).promise()
                    },
                    promise: function(a) {
                        if (a == null) a = h;
                        else
                            for (var b in h) a[b] = h[b];
                        return a
                    }
                },
                i = h.promise({}),
                j;
            for (j in g) i[j] = g[j].fire, i[j + "With"] = g[j].fireWith;
            i.done(function() {
                e = "resolved"
            }, c.disable, d.lock).fail(function() {
                e = "rejected"
            }, b.disable, d.lock), a && a.call(i, i);
            return i
        },
        when: function(a) {
            function m(a) {
                return function(b) {
                    e[a] = arguments.length > 1 ? i.call(arguments, 0) : b, j.notifyWith(k, e)
                }
            }

            function l(a) {
                return function(c) {
                    b[a] = arguments.length > 1 ? i.call(arguments, 0) : c, --g || j.resolveWith(j, b)
                }
            }
            var b = i.call(arguments, 0),
                c = 0,
                d = b.length,
                e = Array(d),
                g = d,
                h = d,
                j = d <= 1 && a && f.isFunction(a.promise) ? a : f.Deferred(),
                k = j.promise();
            if (d > 1) {
                for (; c < d; c++) b[c] && b[c].promise && f.isFunction(b[c].promise) ? b[c].promise().then(l(c), j.reject, m(c)) : --g;
                g || j.resolveWith(j, b)
            } else j !== a && j.resolveWith(j, d ? [a] : []);
            return k
        }
    }), f.support = function() {
        var b, d, e, g, h, i, j, k, l, m, n, o, p, q = c.createElement("div"),
            r = c.documentElement;
        q.setAttribute("className", "t"), q.innerHTML = "   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>", d = q.getElementsByTagName("*"), e = q.getElementsByTagName("a")[0];
        if (!d || !d.length || !e) return {};
        g = c.createElement("select"), h = g.appendChild(c.createElement("option")), i = q.getElementsByTagName("input")[0], b = {
            leadingWhitespace: q.firstChild.nodeType === 3,
            tbody: !q.getElementsByTagName("tbody").length,
            htmlSerialize: !!q.getElementsByTagName("link").length,
            style: /top/.test(e.getAttribute("style")),
            hrefNormalized: e.getAttribute("href") === "/a",
            opacity: /^0.55/.test(e.style.opacity),
            cssFloat: !!e.style.cssFloat,
            checkOn: i.value === "on",
            optSelected: h.selected,
            getSetAttribute: q.className !== "t",
            enctype: !!c.createElement("form").enctype,
            html5Clone: c.createElement("nav").cloneNode(!0).outerHTML !== "<:nav></:nav>",
            submitBubbles: !0,
            changeBubbles: !0,
            focusinBubbles: !1,
            deleteExpando: !0,
            noCloneEvent: !0,
            inlineBlockNeedsLayout: !1,
            shrinkWrapBlocks: !1,
            reliableMarginRight: !0
        }, i.checked = !0, b.noCloneChecked = i.cloneNode(!0).checked, g.disabled = !0, b.optDisabled = !h.disabled;
        try {
            delete q.test
        } catch (s) {
            b.deleteExpando = !1
        }!q.addEventListener && q.attachEvent && q.fireEvent && (q.attachEvent("onclick", function() {
            b.noCloneEvent = !1
        }), q.cloneNode(!0).fireEvent("onclick")), i = c.createElement("input"), i.value = "t", i.setAttribute("type", "radio"), b.radioValue = i.value === "t", i.setAttribute("checked", "checked"), q.appendChild(i), k = c.createDocumentFragment(), k.appendChild(q.lastChild), b.checkClone = k.cloneNode(!0).cloneNode(!0).lastChild.checked, b.appendChecked = i.checked, k.removeChild(i), k.appendChild(q), q.innerHTML = "", a.getComputedStyle && (j = c.createElement("div"), j.style.width = "0", j.style.marginRight = "0", q.style.width = "2px", q.appendChild(j), b.reliableMarginRight = (parseInt((a.getComputedStyle(j, null) || {
            marginRight: 0
        }).marginRight, 10) || 0) === 0);
        if (q.attachEvent)
            for (o in {
                    submit: 1,
                    change: 1,
                    focusin: 1
                }) n = "on" + o, p = n in q, p || (q.setAttribute(n, "return;"), p = typeof q[n] == "function"), b[o + "Bubbles"] = p;
        k.removeChild(q), k = g = h = j = q = i = null, f(function() {
            var a, d, e, g, h, i, j, k, m, n, o, r = c.getElementsByTagName("body")[0];
            !r || (j = 1, k = "position:absolute;top:0;left:0;width:1px;height:1px;margin:0;", m = "visibility:hidden;border:0;", n = "style='" + k + "border:5px solid #000;padding:0;'", o = "<div " + n + "><div></div></div>" + "<table " + n + " cellpadding='0' cellspacing='0'>" + "<tr><td></td></tr></table>", a = c.createElement("div"), a.style.cssText = m + "width:0;height:0;position:static;top:0;margin-top:" + j + "px", r.insertBefore(a, r.firstChild), q = c.createElement("div"), a.appendChild(q), q.innerHTML = "<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>", l = q.getElementsByTagName("td"), p = l[0].offsetHeight === 0, l[0].style.display = "", l[1].style.display = "none", b.reliableHiddenOffsets = p && l[0].offsetHeight === 0, q.innerHTML = "", q.style.width = q.style.paddingLeft = "1px", f.boxModel = b.boxModel = q.offsetWidth === 2, typeof q.style.zoom != "undefined" && (q.style.display = "inline", q.style.zoom = 1, b.inlineBlockNeedsLayout = q.offsetWidth === 2, q.style.display = "", q.innerHTML = "<div style='width:4px;'></div>", b.shrinkWrapBlocks = q.offsetWidth !== 2), q.style.cssText = k + m, q.innerHTML = o, d = q.firstChild, e = d.firstChild, h = d.nextSibling.firstChild.firstChild, i = {
                doesNotAddBorder: e.offsetTop !== 5,
                doesAddBorderForTableAndCells: h.offsetTop === 5
            }, e.style.position = "fixed", e.style.top = "20px", i.fixedPosition = e.offsetTop === 20 || e.offsetTop === 15, e.style.position = e.style.top = "", d.style.overflow = "hidden", d.style.position = "relative", i.subtractsBorderForOverflowNotVisible = e.offsetTop === -5, i.doesNotIncludeMarginInBodyOffset = r.offsetTop !== j, r.removeChild(a), q = a = null, f.extend(b, i))
        });
        return b
    }();
    var j = /^(?:\{.*\}|\[.*\])$/,
        k = /([A-Z])/g;
    f.extend({
        cache: {},
        uuid: 0,
        expando: "jQuery" + (f.fn.jquery + Math.random()).replace(/\D/g, ""),
        noData: {
            embed: !0,
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            applet: !0
        },
        hasData: function(a) {
            a = a.nodeType ? f.cache[a[f.expando]] : a[f.expando];
            return !!a && !m(a)
        },
        data: function(a, c, d, e) {
            if (!!f.acceptData(a)) {
                var g, h, i, j = f.expando,
                    k = typeof c == "string",
                    l = a.nodeType,
                    m = l ? f.cache : a,
                    n = l ? a[j] : a[j] && j,
                    o = c === "events";
                if ((!n || !m[n] || !o && !e && !m[n].data) && k && d === b) return;
                n || (l ? a[j] = n = ++f.uuid : n = j), m[n] || (m[n] = {}, l || (m[n].toJSON = f.noop));
                if (typeof c == "object" || typeof c == "function") e ? m[n] = f.extend(m[n], c) : m[n].data = f.extend(m[n].data, c);
                g = h = m[n], e || (h.data || (h.data = {}), h = h.data), d !== b && (h[f.camelCase(c)] = d);
                if (o && !h[c]) return g.events;
                k ? (i = h[c], i == null && (i = h[f.camelCase(c)])) : i = h;
                return i
            }
        },
        removeData: function(a, b, c) {
            if (!!f.acceptData(a)) {
                var d, e, g, h = f.expando,
                    i = a.nodeType,
                    j = i ? f.cache : a,
                    k = i ? a[h] : h;
                if (!j[k]) return;
                if (b) {
                    d = c ? j[k] : j[k].data;
                    if (d) {
                        f.isArray(b) || (b in d ? b = [b] : (b = f.camelCase(b), b in d ? b = [b] : b = b.split(" ")));
                        for (e = 0, g = b.length; e < g; e++) delete d[b[e]];
                        if (!(c ? m : f.isEmptyObject)(d)) return
                    }
                }
                if (!c) {
                    delete j[k].data;
                    if (!m(j[k])) return
                }
                f.support.deleteExpando || !j.setInterval ? delete j[k] : j[k] = null, i && (f.support.deleteExpando ? delete a[h] : a.removeAttribute ? a.removeAttribute(h) : a[h] = null)
            }
        },
        _data: function(a, b, c) {
            return f.data(a, b, c, !0)
        },
        acceptData: function(a) {
            if (a.nodeName) {
                var b = f.noData[a.nodeName.toLowerCase()];
                if (b) return b !== !0 && a.getAttribute("classid") === b
            }
            return !0
        }
    }), f.fn.extend({
        data: function(a, c) {
            var d, e, g, h = null;
            if (typeof a == "undefined") {
                if (this.length) {
                    h = f.data(this[0]);
                    if (this[0].nodeType === 1 && !f._data(this[0], "parsedAttrs")) {
                        e = this[0].attributes;
                        for (var i = 0, j = e.length; i < j; i++) g = e[i].name, g.indexOf("data-") === 0 && (g = f.camelCase(g.substring(5)), l(this[0], g, h[g]));
                        f._data(this[0], "parsedAttrs", !0)
                    }
                }
                return h
            }
            if (typeof a == "object") return this.each(function() {
                f.data(this, a)
            });
            d = a.split("."), d[1] = d[1] ? "." + d[1] : "";
            if (c === b) {
                h = this.triggerHandler("getData" + d[1] + "!", [d[0]]), h === b && this.length && (h = f.data(this[0], a), h = l(this[0], a, h));
                return h === b && d[1] ? this.data(d[0]) : h
            }
            return this.each(function() {
                var b = f(this),
                    e = [d[0], c];
                b.triggerHandler("setData" + d[1] + "!", e), f.data(this, a, c), b.triggerHandler("changeData" + d[1] + "!", e)
            })
        },
        removeData: function(a) {
            return this.each(function() {
                f.removeData(this, a)
            })
        }
    }), f.extend({
        _mark: function(a, b) {
            a && (b = (b || "fx") + "mark", f._data(a, b, (f._data(a, b) || 0) + 1))
        },
        _unmark: function(a, b, c) {
            a !== !0 && (c = b, b = a, a = !1);
            if (b) {
                c = c || "fx";
                var d = c + "mark",
                    e = a ? 0 : (f._data(b, d) || 1) - 1;
                e ? f._data(b, d, e) : (f.removeData(b, d, !0), n(b, c, "mark"))
            }
        },
        queue: function(a, b, c) {
            var d;
            if (a) {
                b = (b || "fx") + "queue", d = f._data(a, b), c && (!d || f.isArray(c) ? d = f._data(a, b, f.makeArray(c)) : d.push(c));
                return d || []
            }
        },
        dequeue: function(a, b) {
            b = b || "fx";
            var c = f.queue(a, b),
                d = c.shift(),
                e = {};
            d === "inprogress" && (d = c.shift()), d && (b === "fx" && c.unshift("inprogress"), f._data(a, b + ".run", e), d.call(a, function() {
                f.dequeue(a, b)
            }, e)), c.length || (f.removeData(a, b + "queue " + b + ".run", !0), n(a, b, "queue"))
        }
    }), f.fn.extend({
        queue: function(a, c) {
            typeof a != "string" && (c = a, a = "fx");
            if (c === b) return f.queue(this[0], a);
            return this.each(function() {
                var b = f.queue(this, a, c);
                a === "fx" && b[0] !== "inprogress" && f.dequeue(this, a)
            })
        },
        dequeue: function(a) {
            return this.each(function() {
                f.dequeue(this, a)
            })
        },
        delay: function(a, b) {
            a = f.fx ? f.fx.speeds[a] || a : a, b = b || "fx";
            return this.queue(b, function(b, c) {
                var d = setTimeout(b, a);
                c.stop = function() {
                    clearTimeout(d)
                }
            })
        },
        clearQueue: function(a) {
            return this.queue(a || "fx", [])
        },
        promise: function(a, c) {
            function m() {
                --h || d.resolveWith(e, [e])
            }
            typeof a != "string" && (c = a, a = b), a = a || "fx";
            var d = f.Deferred(),
                e = this,
                g = e.length,
                h = 1,
                i = a + "defer",
                j = a + "queue",
                k = a + "mark",
                l;
            while (g--)
                if (l = f.data(e[g], i, b, !0) || (f.data(e[g], j, b, !0) || f.data(e[g], k, b, !0)) && f.data(e[g], i, f.Callbacks("once memory"), !0)) h++, l.add(m);
            m();
            return d.promise()
        }
    });
    var o = /[\n\t\r]/g,
        p = /\s+/,
        q = /\r/g,
        r = /^(?:button|input)$/i,
        s = /^(?:button|input|object|select|textarea)$/i,
        t = /^a(?:rea)?$/i,
        u = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
        v = f.support.getSetAttribute,
        w, x, y;
    f.fn.extend({
        attr: function(a, b) {
            return f.access(this, a, b, !0, f.attr)
        },
        removeAttr: function(a) {
            return this.each(function() {
                f.removeAttr(this, a)
            })
        },
        prop: function(a, b) {
            return f.access(this, a, b, !0, f.prop)
        },
        removeProp: function(a) {
            a = f.propFix[a] || a;
            return this.each(function() {
                try {
                    this[a] = b, delete this[a]
                } catch (c) {}
            })
        },
        addClass: function(a) {
            var b, c, d, e, g, h, i;
            if (f.isFunction(a)) return this.each(function(b) {
                f(this).addClass(a.call(this, b, this.className))
            });
            if (a && typeof a == "string") {
                b = a.split(p);
                for (c = 0, d = this.length; c < d; c++) {
                    e = this[c];
                    if (e.nodeType === 1)
                        if (!e.className && b.length === 1) e.className = a;
                        else {
                            g = " " + e.className + " ";
                            for (h = 0, i = b.length; h < i; h++) ~g.indexOf(" " + b[h] + " ") || (g += b[h] + " ");
                            e.className = f.trim(g)
                        }
                }
            }
            return this
        },
        removeClass: function(a) {
            var c, d, e, g, h, i, j;
            if (f.isFunction(a)) return this.each(function(b) {
                f(this).removeClass(a.call(this, b, this.className))
            });
            if (a && typeof a == "string" || a === b) {
                c = (a || "").split(p);
                for (d = 0, e = this.length; d < e; d++) {
                    g = this[d];
                    if (g.nodeType === 1 && g.className)
                        if (a) {
                            h = (" " + g.className + " ").replace(o, " ");
                            for (i = 0, j = c.length; i < j; i++) h = h.replace(" " + c[i] + " ", " ");
                            g.className = f.trim(h)
                        } else g.className = ""
                }
            }
            return this
        },
        toggleClass: function(a, b) {
            var c = typeof a,
                d = typeof b == "boolean";
            if (f.isFunction(a)) return this.each(function(c) {
                f(this).toggleClass(a.call(this, c, this.className, b), b)
            });
            return this.each(function() {
                if (c === "string") {
                    var e, g = 0,
                        h = f(this),
                        i = b,
                        j = a.split(p);
                    while (e = j[g++]) i = d ? i : !h.hasClass(e), h[i ? "addClass" : "removeClass"](e)
                } else if (c === "undefined" || c === "boolean") this.className && f._data(this, "__className__", this.className), this.className = this.className || a === !1 ? "" : f._data(this, "__className__") || ""
            })
        },
        hasClass: function(a) {
            var b = " " + a + " ",
                c = 0,
                d = this.length;
            for (; c < d; c++)
                if (this[c].nodeType === 1 && (" " + this[c].className + " ").replace(o, " ").indexOf(b) > -1) return !0;
            return !1
        },
        val: function(a) {
            var c, d, e, g = this[0]; {
                if (!!arguments.length) {
                    e = f.isFunction(a);
                    return this.each(function(d) {
                        var g = f(this),
                            h;
                        if (this.nodeType === 1) {
                            e ? h = a.call(this, d, g.val()) : h = a, h == null ? h = "" : typeof h == "number" ? h += "" : f.isArray(h) && (h = f.map(h, function(a) {
                                return a == null ? "" : a + ""
                            })), c = f.valHooks[this.nodeName.toLowerCase()] || f.valHooks[this.type];
                            if (!c || !("set" in c) || c.set(this, h, "value") === b) this.value = h
                        }
                    })
                }
                if (g) {
                    c = f.valHooks[g.nodeName.toLowerCase()] || f.valHooks[g.type];
                    if (c && "get" in c && (d = c.get(g, "value")) !== b) return d;
                    d = g.value;
                    return typeof d == "string" ? d.replace(q, "") : d == null ? "" : d
                }
            }
        }
    }), f.extend({
        valHooks: {
            option: {
                get: function(a) {
                    var b = a.attributes.value;
                    return !b || b.specified ? a.value : a.text
                }
            },
            select: {
                get: function(a) {
                    var b, c, d, e, g = a.selectedIndex,
                        h = [],
                        i = a.options,
                        j = a.type === "select-one";
                    if (g < 0) return null;
                    c = j ? g : 0, d = j ? g + 1 : i.length;
                    for (; c < d; c++) {
                        e = i[c];
                        if (e.selected && (f.support.optDisabled ? !e.disabled : e.getAttribute("disabled") === null) && (!e.parentNode.disabled || !f.nodeName(e.parentNode, "optgroup"))) {
                            b = f(e).val();
                            if (j) return b;
                            h.push(b)
                        }
                    }
                    if (j && !h.length && i.length) return f(i[g]).val();
                    return h
                },
                set: function(a, b) {
                    var c = f.makeArray(b);
                    f(a).find("option").each(function() {
                        this.selected = f.inArray(f(this).val(), c) >= 0
                    }), c.length || (a.selectedIndex = -1);
                    return c
                }
            }
        },
        attrFn: {
            val: !0,
            css: !0,
            html: !0,
            text: !0,
            data: !0,
            width: !0,
            height: !0,
            offset: !0
        },
        attr: function(a, c, d, e) {
            var g, h, i, j = a.nodeType;
            if (!!a && j !== 3 && j !== 8 && j !== 2) {
                if (e && c in f.attrFn) return f(a)[c](d);
                if (typeof a.getAttribute == "undefined") return f.prop(a, c, d);
                i = j !== 1 || !f.isXMLDoc(a), i && (c = c.toLowerCase(), h = f.attrHooks[c] || (u.test(c) ? x : w));
                if (d !== b) {
                    if (d === null) {
                        f.removeAttr(a, c);
                        return
                    }
                    if (h && "set" in h && i && (g = h.set(a, d, c)) !== b) return g;
                    a.setAttribute(c, "" + d);
                    return d
                }
                if (h && "get" in h && i && (g = h.get(a, c)) !== null) return g;
                g = a.getAttribute(c);
                return g === null ? b : g
            }
        },
        removeAttr: function(a, b) {
            var c, d, e, g, h = 0;
            if (b && a.nodeType === 1) {
                d = b.toLowerCase().split(p), g = d.length;
                for (; h < g; h++) e = d[h], e && (c = f.propFix[e] || e, f.attr(a, e, ""), a.removeAttribute(v ? e : c), u.test(e) && c in a && (a[c] = !1))
            }
        },
        attrHooks: {
            type: {
                set: function(a, b) {
                    if (r.test(a.nodeName) && a.parentNode) f.error("type property can't be changed");
                    else if (!f.support.radioValue && b === "radio" && f.nodeName(a, "input")) {
                        var c = a.value;
                        a.setAttribute("type", b), c && (a.value = c);
                        return b
                    }
                }
            },
            value: {
                get: function(a, b) {
                    if (w && f.nodeName(a, "button")) return w.get(a, b);
                    return b in a ? a.value : null
                },
                set: function(a, b, c) {
                    if (w && f.nodeName(a, "button")) return w.set(a, b, c);
                    a.value = b
                }
            }
        },
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        prop: function(a, c, d) {
            var e, g, h, i = a.nodeType;
            if (!!a && i !== 3 && i !== 8 && i !== 2) {
                h = i !== 1 || !f.isXMLDoc(a), h && (c = f.propFix[c] || c, g = f.propHooks[c]);
                return d !== b ? g && "set" in g && (e = g.set(a, d, c)) !== b ? e : a[c] = d : g && "get" in g && (e = g.get(a, c)) !== null ? e : a[c]
            }
        },
        propHooks: {
            tabIndex: {
                get: function(a) {
                    var c = a.getAttributeNode("tabindex");
                    return c && c.specified ? parseInt(c.value, 10) : s.test(a.nodeName) || t.test(a.nodeName) && a.href ? 0 : b
                }
            }
        }
    }), f.attrHooks.tabindex = f.propHooks.tabIndex, x = {
        get: function(a, c) {
            var d, e = f.prop(a, c);
            return e === !0 || typeof e != "boolean" && (d = a.getAttributeNode(c)) && d.nodeValue !== !1 ? c.toLowerCase() : b
        },
        set: function(a, b, c) {
            var d;
            b === !1 ? f.removeAttr(a, c) : (d = f.propFix[c] || c, d in a && (a[d] = !0), a.setAttribute(c, c.toLowerCase()));
            return c
        }
    }, v || (y = {
        name: !0,
        id: !0
    }, w = f.valHooks.button = {
        get: function(a, c) {
            var d;
            d = a.getAttributeNode(c);
            return d && (y[c] ? d.nodeValue !== "" : d.specified) ? d.nodeValue : b
        },
        set: function(a, b, d) {
            var e = a.getAttributeNode(d);
            e || (e = c.createAttribute(d), a.setAttributeNode(e));
            return e.nodeValue = b + ""
        }
    }, f.attrHooks.tabindex.set = w.set, f.each(["width", "height"], function(a, b) {
        f.attrHooks[b] = f.extend(f.attrHooks[b], {
            set: function(a, c) {
                if (c === "") {
                    a.setAttribute(b, "auto");
                    return c
                }
            }
        })
    }), f.attrHooks.contenteditable = {
        get: w.get,
        set: function(a, b, c) {
            b === "" && (b = "false"), w.set(a, b, c)
        }
    }), f.support.hrefNormalized || f.each(["href", "src", "width", "height"], function(a, c) {
        f.attrHooks[c] = f.extend(f.attrHooks[c], {
            get: function(a) {
                var d = a.getAttribute(c, 2);
                return d === null ? b : d
            }
        })
    }), f.support.style || (f.attrHooks.style = {
        get: function(a) {
            return a.style.cssText.toLowerCase() || b
        },
        set: function(a, b) {
            return a.style.cssText = "" + b
        }
    }), f.support.optSelected || (f.propHooks.selected = f.extend(f.propHooks.selected, {
        get: function(a) {
            var b = a.parentNode;
            b && (b.selectedIndex, b.parentNode && b.parentNode.selectedIndex);
            return null
        }
    })), f.support.enctype || (f.propFix.enctype = "encoding"), f.support.checkOn || f.each(["radio", "checkbox"], function() {
        f.valHooks[this] = {
            get: function(a) {
                return a.getAttribute("value") === null ? "on" : a.value
            }
        }
    }), f.each(["radio", "checkbox"], function() {
        f.valHooks[this] = f.extend(f.valHooks[this], {
            set: function(a, b) {
                if (f.isArray(b)) return a.checked = f.inArray(f(a).val(), b) >= 0
            }
        })
    });
    var z = /^(?:textarea|input|select)$/i,
        A = /^([^\.]*)?(?:\.(.+))?$/,
        B = /\bhover(\.\S+)?\b/,
        C = /^key/,
        D = /^(?:mouse|contextmenu)|click/,
        E = /^(?:focusinfocus|focusoutblur)$/,
        F = /^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,
        G = function(a) {
            var b = F.exec(a);
            b && (b[1] = (b[1] || "").toLowerCase(), b[3] = b[3] && new RegExp("(?:^|\\s)" + b[3] + "(?:\\s|$)"));
            return b
        },
        H = function(a, b) {
            var c = a.attributes || {};
            return (!b[1] || a.nodeName.toLowerCase() === b[1]) && (!b[2] || (c.id || {}).value === b[2]) && (!b[3] || b[3].test((c["class"] || {}).value))
        },
        I = function(a) {
            return f.event.special.hover ? a : a.replace(B, "mouseenter$1 mouseleave$1")
        };
    f.event = {
            add: function(a, c, d, e, g) {
                var h, i, j, k, l, m, n, o, p, q, r, s;
                if (!(a.nodeType === 3 || a.nodeType === 8 || !c || !d || !(h = f._data(a)))) {
                    d.handler && (p = d, d = p.handler), d.guid || (d.guid = f.guid++), j = h.events, j || (h.events = j = {}), i = h.handle, i || (h.handle = i = function(a) {
                        return typeof f != "undefined" && (!a || f.event.triggered !== a.type) ? f.event.dispatch.apply(i.elem, arguments) : b
                    }, i.elem = a), c = f.trim(I(c)).split(" ");
                    for (k = 0; k < c.length; k++) {
                        l = A.exec(c[k]) || [], m = l[1], n = (l[2] || "").split(".").sort(), s = f.event.special[m] || {}, m = (g ? s.delegateType : s.bindType) || m, s = f.event.special[m] || {}, o = f.extend({
                            type: m,
                            origType: l[1],
                            data: e,
                            handler: d,
                            guid: d.guid,
                            selector: g,
                            quick: G(g),
                            namespace: n.join(".")
                        }, p), r = j[m];
                        if (!r) {
                            r = j[m] = [], r.delegateCount = 0;
                            if (!s.setup || s.setup.call(a, e, n, i) === !1) a.addEventListener ? a.addEventListener(m, i, !1) : a.attachEvent && a.attachEvent("on" + m, i)
                        }
                        s.add && (s.add.call(a, o), o.handler.guid || (o.handler.guid = d.guid)), g ? r.splice(r.delegateCount++, 0, o) : r.push(o), f.event.global[m] = !0
                    }
                    a = null
                }
            },
            global: {},
            remove: function(a, b, c, d, e) {
                var g = f.hasData(a) && f._data(a),
                    h, i, j, k, l, m, n, o, p, q, r, s;
                if (!!g && !!(o = g.events)) {
                    b = f.trim(I(b || "")).split(" ");
                    for (h = 0; h < b.length; h++) {
                        i = A.exec(b[h]) || [], j = k = i[1], l = i[2];
                        if (!j) {
                            for (j in o) f.event.remove(a, j + b[h], c, d, !0);
                            continue
                        }
                        p = f.event.special[j] || {}, j = (d ? p.delegateType : p.bindType) || j, r = o[j] || [], m = r.length, l = l ? new RegExp("(^|\\.)" + l.split(".").sort().join("\\.(?:.*\\.)?") + "(\\.|$)") : null;
                        for (n = 0; n < r.length; n++) s = r[n], (e || k === s.origType) && (!c || c.guid === s.guid) && (!l || l.test(s.namespace)) && (!d || d === s.selector || d === "**" && s.selector) && (r.splice(n--, 1), s.selector && r.delegateCount--, p.remove && p.remove.call(a, s));
                        r.length === 0 && m !== r.length && ((!p.teardown || p.teardown.call(a, l) === !1) && f.removeEvent(a, j, g.handle), delete o[j])
                    }
                    f.isEmptyObject(o) && (q = g.handle, q && (q.elem = null), f.removeData(a, ["events", "handle"], !0))
                }
            },
            customEvent: {
                getData: !0,
                setData: !0,
                changeData: !0
            },
            trigger: function(c, d, e, g) {
                if (!e || e.nodeType !== 3 && e.nodeType !== 8) {
                    var h = c.type || c,
                        i = [],
                        j, k, l, m, n, o, p, q, r, s;
                    if (E.test(h + f.event.triggered)) return;
                    h.indexOf("!") >= 0 && (h = h.slice(0, -1), k = !0), h.indexOf(".") >= 0 && (i = h.split("."), h = i.shift(), i.sort());
                    if ((!e || f.event.customEvent[h]) && !f.event.global[h]) return;
                    c = typeof c == "object" ? c[f.expando] ? c : new f.Event(h, c) : new f.Event(h), c.type = h, c.isTrigger = !0, c.exclusive = k, c.namespace = i.join("."), c.namespace_re = c.namespace ? new RegExp("(^|\\.)" + i.join("\\.(?:.*\\.)?") + "(\\.|$)") : null, o = h.indexOf(":") < 0 ? "on" + h : "";
                    if (!e) {
                        j = f.cache;
                        for (l in j) j[l].events && j[l].events[h] && f.event.trigger(c, d, j[l].handle.elem, !0);
                        return
                    }
                    c.result = b, c.target || (c.target = e), d = d != null ? f.makeArray(d) : [], d.unshift(c), p = f.event.special[h] || {};
                    if (p.trigger && p.trigger.apply(e, d) === !1) return;
                    r = [
                        [e, p.bindType || h]
                    ];
                    if (!g && !p.noBubble && !f.isWindow(e)) {
                        s = p.delegateType || h, m = E.test(s + h) ? e : e.parentNode, n = null;
                        for (; m; m = m.parentNode) r.push([m, s]), n = m;
                        n && n === e.ownerDocument && r.push([n.defaultView || n.parentWindow || a, s])
                    }
                    for (l = 0; l < r.length && !c.isPropagationStopped(); l++) m = r[l][0], c.type = r[l][1], q = (f._data(m, "events") || {})[c.type] && f._data(m, "handle"), q && q.apply(m, d), q = o && m[o], q && f.acceptData(m) && q.apply(m, d) === !1 && c.preventDefault();
                    c.type = h, !g && !c.isDefaultPrevented() && (!p._default || p._default.apply(e.ownerDocument, d) === !1) && (h !== "click" || !f.nodeName(e, "a")) && f.acceptData(e) && o && e[h] && (h !== "focus" && h !== "blur" || c.target.offsetWidth !== 0) && !f.isWindow(e) && (n = e[o], n && (e[o] = null), f.event.triggered = h, e[h](), f.event.triggered = b, n && (e[o] = n));
                    return c.result
                }
            },
            dispatch: function(c) {
                c = f.event.fix(c || a.event);
                var d = (f._data(this, "events") || {})[c.type] || [],
                    e = d.delegateCount,
                    g = [].slice.call(arguments, 0),
                    h = !c.exclusive && !c.namespace,
                    i = [],
                    j, k, l, m, n, o, p, q, r, s, t;
                g[0] = c, c.delegateTarget = this;
                if (e && !c.target.disabled && (!c.button || c.type !== "click")) {
                    m = f(this), m.context = this.ownerDocument || this;
                    for (l = c.target; l != this; l = l.parentNode || this) {
                        o = {}, q = [], m[0] = l;
                        for (j = 0; j < e; j++) r = d[j], s = r.selector, o[s] === b && (o[s] = r.quick ? H(l, r.quick) : m.is(s)), o[s] && q.push(r);
                        q.length && i.push({
                            elem: l,
                            matches: q
                        })
                    }
                }
                d.length > e && i.push({
                    elem: this,
                    matches: d.slice(e)
                });
                for (j = 0; j < i.length && !c.isPropagationStopped(); j++) {
                    p = i[j], c.currentTarget = p.elem;
                    for (k = 0; k < p.matches.length && !c.isImmediatePropagationStopped(); k++) {
                        r = p.matches[k];
                        if (h || !c.namespace && !r.namespace || c.namespace_re && c.namespace_re.test(r.namespace)) c.data = r.data, c.handleObj = r, n = ((f.event.special[r.origType] || {}).handle || r.handler).apply(p.elem, g), n !== b && (c.result = n, n === !1 && (c.preventDefault(), c.stopPropagation()))
                    }
                }
                return c.result
            },
            props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
            fixHooks: {},
            keyHooks: {
                props: "char charCode key keyCode".split(" "),
                filter: function(a, b) {
                    a.which == null && (a.which = b.charCode != null ? b.charCode : b.keyCode);
                    return a
                }
            },
            mouseHooks: {
                props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
                filter: function(a, d) {
                    var e, f, g, h = d.button,
                        i = d.fromElement;
                    a.pageX == null && d.clientX != null && (e = a.target.ownerDocument || c, f = e.documentElement, g = e.body, a.pageX = d.clientX + (f && f.scrollLeft || g && g.scrollLeft || 0) - (f && f.clientLeft || g && g.clientLeft || 0), a.pageY = d.clientY + (f && f.scrollTop || g && g.scrollTop || 0) - (f && f.clientTop || g && g.clientTop || 0)), !a.relatedTarget && i && (a.relatedTarget = i === a.target ? d.toElement : i), !a.which && h !== b && (a.which = h & 1 ? 1 : h & 2 ? 3 : h & 4 ? 2 : 0);
                    return a
                }
            },
            fix: function(a) {
                if (a[f.expando]) return a;
                var d, e, g = a,
                    h = f.event.fixHooks[a.type] || {},
                    i = h.props ? this.props.concat(h.props) : this.props;
                a = f.Event(g);
                for (d = i.length; d;) e = i[--d], a[e] = g[e];
                a.target || (a.target = g.srcElement || c), a.target.nodeType === 3 && (a.target = a.target.parentNode), a.metaKey === b && (a.metaKey = a.ctrlKey);
                return h.filter ? h.filter(a, g) : a
            },
            special: {
                ready: {
                    setup: f.bindReady
                },
                load: {
                    noBubble: !0
                },
                focus: {
                    delegateType: "focusin"
                },
                blur: {
                    delegateType: "focusout"
                },
                beforeunload: {
                    setup: function(a, b, c) {
                        f.isWindow(this) && (this.onbeforeunload = c)
                    },
                    teardown: function(a, b) {
                        this.onbeforeunload === b && (this.onbeforeunload = null)
                    }
                }
            },
            simulate: function(a, b, c, d) {
                var e = f.extend(new f.Event, c, {
                    type: a,
                    isSimulated: !0,
                    originalEvent: {}
                });
                d ? f.event.trigger(e, null, b) : f.event.dispatch.call(b, e), e.isDefaultPrevented() && c.preventDefault()
            }
        }, f.event.handle = f.event.dispatch, f.removeEvent = c.removeEventListener ? function(a, b, c) {
            a.removeEventListener && a.removeEventListener(b, c, !1)
        } : function(a, b, c) {
            a.detachEvent && a.detachEvent("on" + b, c)
        }, f.Event = function(a, b) {
            if (!(this instanceof f.Event)) return new f.Event(a, b);
            a && a.type ? (this.originalEvent = a, this.type = a.type, this.isDefaultPrevented = a.defaultPrevented || a.returnValue === !1 || a.getPreventDefault && a.getPreventDefault() ? K : J) : this.type = a, b && f.extend(this, b), this.timeStamp = a && a.timeStamp || f.now(), this[f.expando] = !0
        }, f.Event.prototype = {
            preventDefault: function() {
                this.isDefaultPrevented = K;
                var a = this.originalEvent;
                !a || (a.preventDefault ? a.preventDefault() : a.returnValue = !1)
            },
            stopPropagation: function() {
                this.isPropagationStopped = K;
                var a = this.originalEvent;
                !a || (a.stopPropagation && a.stopPropagation(), a.cancelBubble = !0)
            },
            stopImmediatePropagation: function() {
                this.isImmediatePropagationStopped = K, this.stopPropagation()
            },
            isDefaultPrevented: J,
            isPropagationStopped: J,
            isImmediatePropagationStopped: J
        }, f.each({
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        }, function(a, b) {
            f.event.special[a] = {
                delegateType: b,
                bindType: b,
                handle: function(a) {
                    var c = this,
                        d = a.relatedTarget,
                        e = a.handleObj,
                        g = e.selector,
                        h;
                    if (!d || d !== c && !f.contains(c, d)) a.type = e.origType, h = e.handler.apply(this, arguments), a.type = b;
                    return h
                }
            }
        }), f.support.submitBubbles || (f.event.special.submit = {
            setup: function() {
                if (f.nodeName(this, "form")) return !1;
                f.event.add(this, "click._submit keypress._submit", function(a) {
                    var c = a.target,
                        d = f.nodeName(c, "input") || f.nodeName(c, "button") ? c.form : b;
                    d && !d._submit_attached && (f.event.add(d, "submit._submit", function(a) {
                        this.parentNode && !a.isTrigger && f.event.simulate("submit", this.parentNode, a, !0)
                    }), d._submit_attached = !0)
                })
            },
            teardown: function() {
                if (f.nodeName(this, "form")) return !1;
                f.event.remove(this, "._submit")
            }
        }), f.support.changeBubbles || (f.event.special.change = {
            setup: function() {
                if (z.test(this.nodeName)) {
                    if (this.type === "checkbox" || this.type === "radio") f.event.add(this, "propertychange._change", function(a) {
                        a.originalEvent.propertyName === "checked" && (this._just_changed = !0)
                    }), f.event.add(this, "click._change", function(a) {
                        this._just_changed && !a.isTrigger && (this._just_changed = !1, f.event.simulate("change", this, a, !0))
                    });
                    return !1
                }
                f.event.add(this, "beforeactivate._change", function(a) {
                    var b = a.target;
                    z.test(b.nodeName) && !b._change_attached && (f.event.add(b, "change._change", function(a) {
                        this.parentNode && !a.isSimulated && !a.isTrigger && f.event.simulate("change", this.parentNode, a, !0)
                    }), b._change_attached = !0)
                })
            },
            handle: function(a) {
                var b = a.target;
                if (this !== b || a.isSimulated || a.isTrigger || b.type !== "radio" && b.type !== "checkbox") return a.handleObj.handler.apply(this, arguments)
            },
            teardown: function() {
                f.event.remove(this, "._change");
                return z.test(this.nodeName)
            }
        }), f.support.focusinBubbles || f.each({
            focus: "focusin",
            blur: "focusout"
        }, function(a, b) {
            var d = 0,
                e = function(a) {
                    f.event.simulate(b, a.target, f.event.fix(a), !0)
                };
            f.event.special[b] = {
                setup: function() {
                    d++ === 0 && c.addEventListener(a, e, !0)
                },
                teardown: function() {
                    --d === 0 && c.removeEventListener(a, e, !0)
                }
            }
        }), f.fn.extend({
            on: function(a, c, d, e, g) {
                var h, i;
                if (typeof a == "object") {
                    typeof c != "string" && (d = c, c = b);
                    for (i in a) this.on(i, c, d, a[i], g);
                    return this
                }
                d == null && e == null ? (e = c, d = c = b) : e == null && (typeof c == "string" ? (e = d, d = b) : (e = d, d = c, c = b));
                if (e === !1) e = J;
                else if (!e) return this;
                g === 1 && (h = e, e = function(a) {
                    f().off(a);
                    return h.apply(this, arguments)
                }, e.guid = h.guid || (h.guid = f.guid++));
                return this.each(function() {
                    f.event.add(this, a, e, d, c)
                })
            },
            one: function(a, b, c, d) {
                return this.on.call(this, a, b, c, d, 1)
            },
            off: function(a, c, d) {
                if (a && a.preventDefault && a.handleObj) {
                    var e = a.handleObj;
                    f(a.delegateTarget).off(e.namespace ? e.type + "." + e.namespace : e.type, e.selector, e.handler);
                    return this
                }
                if (typeof a == "object") {
                    for (var g in a) this.off(g, c, a[g]);
                    return this
                }
                if (c === !1 || typeof c == "function") d = c, c = b;
                d === !1 && (d = J);
                return this.each(function() {
                    f.event.remove(this, a, d, c)
                })
            },
            bind: function(a, b, c) {
                return this.on(a, null, b, c)
            },
            unbind: function(a, b) {
                return this.off(a, null, b)
            },
            live: function(a, b, c) {
                f(this.context).on(a, this.selector, b, c);
                return this
            },
            die: function(a, b) {
                f(this.context).off(a, this.selector || "**", b);
                return this
            },
            delegate: function(a, b, c, d) {
                return this.on(b, a, c, d)
            },
            undelegate: function(a, b, c) {
                return arguments.length == 1 ? this.off(a, "**") : this.off(b, a, c)
            },
            trigger: function(a, b) {
                return this.each(function() {
                    f.event.trigger(a, b, this)
                })
            },
            triggerHandler: function(a, b) {
                if (this[0]) return f.event.trigger(a, b, this[0], !0)
            },
            toggle: function(a) {
                var b = arguments,
                    c = a.guid || f.guid++,
                    d = 0,
                    e = function(c) {
                        var e = (f._data(this, "lastToggle" + a.guid) || 0) % d;
                        f._data(this, "lastToggle" + a.guid, e + 1), c.preventDefault();
                        return b[e].apply(this, arguments) || !1
                    };
                e.guid = c;
                while (d < b.length) b[d++].guid = c;
                return this.click(e)
            },
            hover: function(a, b) {
                return this.mouseenter(a).mouseleave(b || a)
            }
        }), f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(a, b) {
            f.fn[b] = function(a, c) {
                c == null && (c = a, a = null);
                return arguments.length > 0 ? this.on(b, null, a, c) : this.trigger(b)
            }, f.attrFn && (f.attrFn[b] = !0), C.test(b) && (f.event.fixHooks[b] = f.event.keyHooks), D.test(b) && (f.event.fixHooks[b] = f.event.mouseHooks)
        }),
        function() {
            function x(a, b, c, e, f, g) {
                for (var h = 0, i = e.length; h < i; h++) {
                    var j = e[h];
                    if (j) {
                        var k = !1;
                        j = j[a];
                        while (j) {
                            if (j[d] === c) {
                                k = e[j.sizset];
                                break
                            }
                            if (j.nodeType === 1) {
                                g || (j[d] = c, j.sizset = h);
                                if (typeof b != "string") {
                                    if (j === b) {
                                        k = !0;
                                        break
                                    }
                                } else if (m.filter(b, [j]).length > 0) {
                                    k = j;
                                    break
                                }
                            }
                            j = j[a]
                        }
                        e[h] = k
                    }
                }
            }

            function w(a, b, c, e, f, g) {
                for (var h = 0, i = e.length; h < i; h++) {
                    var j = e[h];
                    if (j) {
                        var k = !1;
                        j = j[a];
                        while (j) {
                            if (j[d] === c) {
                                k = e[j.sizset];
                                break
                            }
                            j.nodeType === 1 && !g && (j[d] = c, j.sizset = h);
                            if (j.nodeName.toLowerCase() === b) {
                                k = j;
                                break
                            }
                            j = j[a]
                        }
                        e[h] = k
                    }
                }
            }
            var a = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
                d = "sizcache" + (Math.random() + "").replace(".", ""),
                e = 0,
                g = Object.prototype.toString,
                h = !1,
                i = !0,
                j = /\\/g,
                k = /\r\n/g,
                l = /\W/;
            [0, 0].sort(function() {
                i = !1;
                return 0
            });
            var m = function(b, d, e, f) {
                e = e || [], d = d || c;
                var h = d;
                if (d.nodeType !== 1 && d.nodeType !== 9) return [];
                if (!b || typeof b != "string") return e;
                var i, j, k, l, n, q, r, t, u = !0,
                    v = m.isXML(d),
                    w = [],
                    x = b;
                do {
                    a.exec(""), i = a.exec(x);
                    if (i) {
                        x = i[3], w.push(i[1]);
                        if (i[2]) {
                            l = i[3];
                            break
                        }
                    }
                } while (i);
                if (w.length > 1 && p.exec(b))
                    if (w.length === 2 && o.relative[w[0]]) j = y(w[0] + w[1], d, f);
                    else {
                        j = o.relative[w[0]] ? [d] : m(w.shift(), d);
                        while (w.length) b = w.shift(), o.relative[b] && (b += w.shift()), j = y(b, j, f)
                    }
                else {
                    !f && w.length > 1 && d.nodeType === 9 && !v && o.match.ID.test(w[0]) && !o.match.ID.test(w[w.length - 1]) && (n = m.find(w.shift(), d, v), d = n.expr ? m.filter(n.expr, n.set)[0] : n.set[0]);
                    if (d) {
                        n = f ? {
                            expr: w.pop(),
                            set: s(f)
                        } : m.find(w.pop(), w.length === 1 && (w[0] === "~" || w[0] === "+") && d.parentNode ? d.parentNode : d, v), j = n.expr ? m.filter(n.expr, n.set) : n.set, w.length > 0 ? k = s(j) : u = !1;
                        while (w.length) q = w.pop(), r = q, o.relative[q] ? r = w.pop() : q = "", r == null && (r = d), o.relative[q](k, r, v)
                    } else k = w = []
                }
                k || (k = j), k || m.error(q || b);
                if (g.call(k) === "[object Array]")
                    if (!u) e.push.apply(e, k);
                    else if (d && d.nodeType === 1)
                    for (t = 0; k[t] != null; t++) k[t] && (k[t] === !0 || k[t].nodeType === 1 && m.contains(d, k[t])) && e.push(j[t]);
                else
                    for (t = 0; k[t] != null; t++) k[t] && k[t].nodeType === 1 && e.push(j[t]);
                else s(k, e);
                l && (m(l, h, e, f), m.uniqueSort(e));
                return e
            };
            m.uniqueSort = function(a) {
                if (u) {
                    h = i, a.sort(u);
                    if (h)
                        for (var b = 1; b < a.length; b++) a[b] === a[b - 1] && a.splice(b--, 1)
                }
                return a
            }, m.matches = function(a, b) {
                return m(a, null, null, b)
            }, m.matchesSelector = function(a, b) {
                return m(b, null, null, [a]).length > 0
            }, m.find = function(a, b, c) {
                var d, e, f, g, h, i;
                if (!a) return [];
                for (e = 0, f = o.order.length; e < f; e++) {
                    h = o.order[e];
                    if (g = o.leftMatch[h].exec(a)) {
                        i = g[1], g.splice(1, 1);
                        if (i.substr(i.length - 1) !== "\\") {
                            g[1] = (g[1] || "").replace(j, ""), d = o.find[h](g, b, c);
                            if (d != null) {
                                a = a.replace(o.match[h], "");
                                break
                            }
                        }
                    }
                }
                d || (d = typeof b.getElementsByTagName != "undefined" ? b.getElementsByTagName("*") : []);
                return {
                    set: d,
                    expr: a
                }
            }, m.filter = function(a, c, d, e) {
                var f, g, h, i, j, k, l, n, p, q = a,
                    r = [],
                    s = c,
                    t = c && c[0] && m.isXML(c[0]);
                while (a && c.length) {
                    for (h in o.filter)
                        if ((f = o.leftMatch[h].exec(a)) != null && f[2]) {
                            k = o.filter[h], l = f[1], g = !1, f.splice(1, 1);
                            if (l.substr(l.length - 1) === "\\") continue;
                            s === r && (r = []);
                            if (o.preFilter[h]) {
                                f = o.preFilter[h](f, s, d, r, e, t);
                                if (!f) g = i = !0;
                                else if (f === !0) continue
                            }
                            if (f)
                                for (n = 0;
                                    (j = s[n]) != null; n++) j && (i = k(j, f, n, s), p = e ^ i, d && i != null ? p ? g = !0 : s[n] = !1 : p && (r.push(j), g = !0));
                            if (i !== b) {
                                d || (s = r), a = a.replace(o.match[h], "");
                                if (!g) return [];
                                break
                            }
                        }
                    if (a === q)
                        if (g == null) m.error(a);
                        else break;
                    q = a
                }
                return s
            }, m.error = function(a) {
                throw new Error("Syntax error, unrecognized expression: " + a)
            };
            var n = m.getText = function(a) {
                    var b, c, d = a.nodeType,
                        e = "";
                    if (d) {
                        if (d === 1 || d === 9) {
                            if (typeof a.textContent == "string") return a.textContent;
                            if (typeof a.innerText == "string") return a.innerText.replace(k, "");
                            for (a = a.firstChild; a; a = a.nextSibling) e += n(a)
                        } else if (d === 3 || d === 4) return a.nodeValue
                    } else
                        for (b = 0; c = a[b]; b++) c.nodeType !== 8 && (e += n(c));
                    return e
                },
                o = m.selectors = {
                    order: ["ID", "NAME", "TAG"],
                    match: {
                        ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                        CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                        NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
                        ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
                        TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
                        CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
                        POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
                        PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
                    },
                    leftMatch: {},
                    attrMap: {
                        "class": "className",
                        "for": "htmlFor"
                    },
                    attrHandle: {
                        href: function(a) {
                            return a.getAttribute("href")
                        },
                        type: function(a) {
                            return a.getAttribute("type")
                        }
                    },
                    relative: {
                        "+": function(a, b) {
                            var c = typeof b == "string",
                                d = c && !l.test(b),
                                e = c && !d;
                            d && (b = b.toLowerCase());
                            for (var f = 0, g = a.length, h; f < g; f++)
                                if (h = a[f]) {
                                    while ((h = h.previousSibling) && h.nodeType !== 1);
                                    a[f] = e || h && h.nodeName.toLowerCase() === b ? h || !1 : h === b
                                }
                            e && m.filter(b, a, !0)
                        },
                        ">": function(a, b) {
                            var c, d = typeof b == "string",
                                e = 0,
                                f = a.length;
                            if (d && !l.test(b)) {
                                b = b.toLowerCase();
                                for (; e < f; e++) {
                                    c = a[e];
                                    if (c) {
                                        var g = c.parentNode;
                                        a[e] = g.nodeName.toLowerCase() === b ? g : !1
                                    }
                                }
                            } else {
                                for (; e < f; e++) c = a[e], c && (a[e] = d ? c.parentNode : c.parentNode === b);
                                d && m.filter(b, a, !0)
                            }
                        },
                        "": function(a, b, c) {
                            var d, f = e++,
                                g = x;
                            typeof b == "string" && !l.test(b) && (b = b.toLowerCase(), d = b, g = w), g("parentNode", b, f, a, d, c)
                        },
                        "~": function(a, b, c) {
                            var d, f = e++,
                                g = x;
                            typeof b == "string" && !l.test(b) && (b = b.toLowerCase(), d = b, g = w), g("previousSibling", b, f, a, d, c)
                        }
                    },
                    find: {
                        ID: function(a, b, c) {
                            if (typeof b.getElementById != "undefined" && !c) {
                                var d = b.getElementById(a[1]);
                                return d && d.parentNode ? [d] : []
                            }
                        },
                        NAME: function(a, b) {
                            if (typeof b.getElementsByName != "undefined") {
                                var c = [],
                                    d = b.getElementsByName(a[1]);
                                for (var e = 0, f = d.length; e < f; e++) d[e].getAttribute("name") === a[1] && c.push(d[e]);
                                return c.length === 0 ? null : c
                            }
                        },
                        TAG: function(a, b) {
                            if (typeof b.getElementsByTagName != "undefined") return b.getElementsByTagName(a[1])
                        }
                    },
                    preFilter: {
                        CLASS: function(a, b, c, d, e, f) {
                            a = " " + a[1].replace(j, "") + " ";
                            if (f) return a;
                            for (var g = 0, h;
                                (h = b[g]) != null; g++) h && (e ^ (h.className && (" " + h.className + " ").replace(/[\t\n\r]/g, " ").indexOf(a) >= 0) ? c || d.push(h) : c && (b[g] = !1));
                            return !1
                        },
                        ID: function(a) {
                            return a[1].replace(j, "")
                        },
                        TAG: function(a, b) {
                            return a[1].replace(j, "").toLowerCase()
                        },
                        CHILD: function(a) {
                            if (a[1] === "nth") {
                                a[2] || m.error(a[0]), a[2] = a[2].replace(/^\+|\s*/g, "");
                                var b = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2] === "even" && "2n" || a[2] === "odd" && "2n+1" || !/\D/.test(a[2]) && "0n+" + a[2] || a[2]);
                                a[2] = b[1] + (b[2] || 1) - 0, a[3] = b[3] - 0
                            } else a[2] && m.error(a[0]);
                            a[0] = e++;
                            return a
                        },
                        ATTR: function(a, b, c, d, e, f) {
                            var g = a[1] = a[1].replace(j, "");
                            !f && o.attrMap[g] && (a[1] = o.attrMap[g]), a[4] = (a[4] || a[5] || "").replace(j, ""), a[2] === "~=" && (a[4] = " " + a[4] + " ");
                            return a
                        },
                        PSEUDO: function(b, c, d, e, f) {
                            if (b[1] === "not")
                                if ((a.exec(b[3]) || "").length > 1 || /^\w/.test(b[3])) b[3] = m(b[3], null, null, c);
                                else {
                                    var g = m.filter(b[3], c, d, !0 ^ f);
                                    d || e.push.apply(e, g);
                                    return !1
                                }
                            else if (o.match.POS.test(b[0]) || o.match.CHILD.test(b[0])) return !0;
                            return b
                        },
                        POS: function(a) {
                            a.unshift(!0);
                            return a
                        }
                    },
                    filters: {
                        enabled: function(a) {
                            return a.disabled === !1 && a.type !== "hidden"
                        },
                        disabled: function(a) {
                            return a.disabled === !0
                        },
                        checked: function(a) {
                            return a.checked === !0
                        },
                        selected: function(a) {
                            a.parentNode && a.parentNode.selectedIndex;
                            return a.selected === !0
                        },
                        parent: function(a) {
                            return !!a.firstChild
                        },
                        empty: function(a) {
                            return !a.firstChild
                        },
                        has: function(a, b, c) {
                            return !!m(c[3], a).length
                        },
                        header: function(a) {
                            return /h\d/i.test(a.nodeName)
                        },
                        text: function(a) {
                            var b = a.getAttribute("type"),
                                c = a.type;
                            return a.nodeName.toLowerCase() === "input" && "text" === c && (b === c || b === null)
                        },
                        radio: function(a) {
                            return a.nodeName.toLowerCase() === "input" && "radio" === a.type
                        },
                        checkbox: function(a) {
                            return a.nodeName.toLowerCase() === "input" && "checkbox" === a.type
                        },
                        file: function(a) {
                            return a.nodeName.toLowerCase() === "input" && "file" === a.type
                        },
                        password: function(a) {
                            return a.nodeName.toLowerCase() === "input" && "password" === a.type
                        },
                        submit: function(a) {
                            var b = a.nodeName.toLowerCase();
                            return (b === "input" || b === "button") && "submit" === a.type
                        },
                        image: function(a) {
                            return a.nodeName.toLowerCase() === "input" && "image" === a.type
                        },
                        reset: function(a) {
                            var b = a.nodeName.toLowerCase();
                            return (b === "input" || b === "button") && "reset" === a.type
                        },
                        button: function(a) {
                            var b = a.nodeName.toLowerCase();
                            return b === "input" && "button" === a.type || b === "button"
                        },
                        input: function(a) {
                            return /input|select|textarea|button/i.test(a.nodeName)
                        },
                        focus: function(a) {
                            return a === a.ownerDocument.activeElement
                        }
                    },
                    setFilters: {
                        first: function(a, b) {
                            return b === 0
                        },
                        last: function(a, b, c, d) {
                            return b === d.length - 1
                        },
                        even: function(a, b) {
                            return b % 2 === 0
                        },
                        odd: function(a, b) {
                            return b % 2 === 1
                        },
                        lt: function(a, b, c) {
                            return b < c[3] - 0
                        },
                        gt: function(a, b, c) {
                            return b > c[3] - 0
                        },
                        nth: function(a, b, c) {
                            return c[3] - 0 === b
                        },
                        eq: function(a, b, c) {
                            return c[3] - 0 === b
                        }
                    },
                    filter: {
                        PSEUDO: function(a, b, c, d) {
                            var e = b[1],
                                f = o.filters[e];
                            if (f) return f(a, c, b, d);
                            if (e === "contains") return (a.textContent || a.innerText || n([a]) || "").indexOf(b[3]) >= 0;
                            if (e === "not") {
                                var g = b[3];
                                for (var h = 0, i = g.length; h < i; h++)
                                    if (g[h] === a) return !1;
                                return !0
                            }
                            m.error(e)
                        },
                        CHILD: function(a, b) {
                            var c, e, f, g, h, i, j, k = b[1],
                                l = a;
                            switch (k) {
                                case "only":
                                case "first":
                                    while (l = l.previousSibling)
                                        if (l.nodeType === 1) return !1;
                                    if (k === "first") return !0;
                                    l = a;
                                case "last":
                                    while (l = l.nextSibling)
                                        if (l.nodeType === 1) return !1;
                                    return !0;
                                case "nth":
                                    c = b[2], e = b[3];
                                    if (c === 1 && e === 0) return !0;
                                    f = b[0], g = a.parentNode;
                                    if (g && (g[d] !== f || !a.nodeIndex)) {
                                        i = 0;
                                        for (l = g.firstChild; l; l = l.nextSibling) l.nodeType === 1 && (l.nodeIndex = ++i);
                                        g[d] = f
                                    }
                                    j = a.nodeIndex - e;
                                    return c === 0 ? j === 0 : j % c === 0 && j / c >= 0
                            }
                        },
                        ID: function(a, b) {
                            return a.nodeType === 1 && a.getAttribute("id") === b
                        },
                        TAG: function(a, b) {
                            return b === "*" && a.nodeType === 1 || !!a.nodeName && a.nodeName.toLowerCase() === b
                        },
                        CLASS: function(a, b) {
                            return (" " + (a.className || a.getAttribute("class")) + " ").indexOf(b) > -1
                        },
                        ATTR: function(a, b) {
                            var c = b[1],
                                d = m.attr ? m.attr(a, c) : o.attrHandle[c] ? o.attrHandle[c](a) : a[c] != null ? a[c] : a.getAttribute(c),
                                e = d + "",
                                f = b[2],
                                g = b[4];
                            return d == null ? f === "!=" : !f && m.attr ? d != null : f === "=" ? e === g : f === "*=" ? e.indexOf(g) >= 0 : f === "~=" ? (" " + e + " ").indexOf(g) >= 0 : g ? f === "!=" ? e !== g : f === "^=" ? e.indexOf(g) === 0 : f === "$=" ? e.substr(e.length - g.length) === g : f === "|=" ? e === g || e.substr(0, g.length + 1) === g + "-" : !1 : e && d !== !1
                        },
                        POS: function(a, b, c, d) {
                            var e = b[2],
                                f = o.setFilters[e];
                            if (f) return f(a, c, b, d)
                        }
                    }
                },
                p = o.match.POS,
                q = function(a, b) {
                    return "\\" + (b - 0 + 1)
                };
            for (var r in o.match) o.match[r] = new RegExp(o.match[r].source + /(?![^\[]*\])(?![^\(]*\))/.source), o.leftMatch[r] = new RegExp(/(^(?:.|\r|\n)*?)/.source + o.match[r].source.replace(/\\(\d+)/g, q));
            var s = function(a, b) {
                a = Array.prototype.slice.call(a, 0);
                if (b) {
                    b.push.apply(b, a);
                    return b
                }
                return a
            };
            try {
                Array.prototype.slice.call(c.documentElement.childNodes, 0)[0].nodeType
            } catch (t) {
                s = function(a, b) {
                    var c = 0,
                        d = b || [];
                    if (g.call(a) === "[object Array]") Array.prototype.push.apply(d, a);
                    else if (typeof a.length == "number")
                        for (var e = a.length; c < e; c++) d.push(a[c]);
                    else
                        for (; a[c]; c++) d.push(a[c]);
                    return d
                }
            }
            var u, v;
            c.documentElement.compareDocumentPosition ? u = function(a, b) {
                    if (a === b) {
                        h = !0;
                        return 0
                    }
                    if (!a.compareDocumentPosition || !b.compareDocumentPosition) return a.compareDocumentPosition ? -1 : 1;
                    return a.compareDocumentPosition(b) & 4 ? -1 : 1
                } : (u = function(a, b) {
                    if (a === b) {
                        h = !0;
                        return 0
                    }
                    if (a.sourceIndex && b.sourceIndex) return a.sourceIndex - b.sourceIndex;
                    var c, d, e = [],
                        f = [],
                        g = a.parentNode,
                        i = b.parentNode,
                        j = g;
                    if (g === i) return v(a, b);
                    if (!g) return -1;
                    if (!i) return 1;
                    while (j) e.unshift(j), j = j.parentNode;
                    j = i;
                    while (j) f.unshift(j), j = j.parentNode;
                    c = e.length, d = f.length;
                    for (var k = 0; k < c && k < d; k++)
                        if (e[k] !== f[k]) return v(e[k], f[k]);
                    return k === c ? v(a, f[k], -1) : v(e[k], b, 1)
                }, v = function(a, b, c) {
                    if (a === b) return c;
                    var d = a.nextSibling;
                    while (d) {
                        if (d === b) return -1;
                        d = d.nextSibling
                    }
                    return 1
                }),
                function() {
                    var a = c.createElement("div"),
                        d = "script" + (new Date).getTime(),
                        e = c.documentElement;
                    a.innerHTML = "<a name='" + d + "'/>", e.insertBefore(a, e.firstChild), c.getElementById(d) && (o.find.ID = function(a, c, d) {
                        if (typeof c.getElementById != "undefined" && !d) {
                            var e = c.getElementById(a[1]);
                            return e ? e.id === a[1] || typeof e.getAttributeNode != "undefined" && e.getAttributeNode("id").nodeValue === a[1] ? [e] : b : []
                        }
                    }, o.filter.ID = function(a, b) {
                        var c = typeof a.getAttributeNode != "undefined" && a.getAttributeNode("id");
                        return a.nodeType === 1 && c && c.nodeValue === b
                    }), e.removeChild(a), e = a = null
                }(),
                function() {
                    var a = c.createElement("div");
                    a.appendChild(c.createComment("")), a.getElementsByTagName("*").length > 0 && (o.find.TAG = function(a, b) {
                        var c = b.getElementsByTagName(a[1]);
                        if (a[1] === "*") {
                            var d = [];
                            for (var e = 0; c[e]; e++) c[e].nodeType === 1 && d.push(c[e]);
                            c = d
                        }
                        return c
                    }), a.innerHTML = "<a href='#'></a>", a.firstChild && typeof a.firstChild.getAttribute != "undefined" && a.firstChild.getAttribute("href") !== "#" && (o.attrHandle.href = function(a) {
                        return a.getAttribute("href", 2)
                    }), a = null
                }(), c.querySelectorAll && function() {
                    var a = m,
                        b = c.createElement("div"),
                        d = "__sizzle__";
                    b.innerHTML = "<p class='TEST'></p>";
                    if (!b.querySelectorAll || b.querySelectorAll(".TEST").length !== 0) {
                        m = function(b, e, f, g) {
                            e = e || c;
                            if (!g && !m.isXML(e)) {
                                var h = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);
                                if (h && (e.nodeType === 1 || e.nodeType === 9)) {
                                    if (h[1]) return s(e.getElementsByTagName(b), f);
                                    if (h[2] && o.find.CLASS && e.getElementsByClassName) return s(e.getElementsByClassName(h[2]), f)
                                }
                                if (e.nodeType === 9) {
                                    if (b === "body" && e.body) return s([e.body], f);
                                    if (h && h[3]) {
                                        var i = e.getElementById(h[3]);
                                        if (!i || !i.parentNode) return s([], f);
                                        if (i.id === h[3]) return s([i], f)
                                    }
                                    try {
                                        return s(e.querySelectorAll(b), f)
                                    } catch (j) {}
                                } else if (e.nodeType === 1 && e.nodeName.toLowerCase() !== "object") {
                                    var k = e,
                                        l = e.getAttribute("id"),
                                        n = l || d,
                                        p = e.parentNode,
                                        q = /^\s*[+~]/.test(b);
                                    l ? n = n.replace(/'/g, "\\$&") : e.setAttribute("id", n), q && p && (e = e.parentNode);
                                    try {
                                        if (!q || p) return s(e.querySelectorAll("[id='" + n + "'] " + b), f)
                                    } catch (r) {} finally {
                                        l || k.removeAttribute("id")
                                    }
                                }
                            }
                            return a(b, e, f, g)
                        };
                        for (var e in a) m[e] = a[e];
                        b = null
                    }
                }(),
                function() {
                    var a = c.documentElement,
                        b = a.matchesSelector || a.mozMatchesSelector || a.webkitMatchesSelector || a.msMatchesSelector;
                    if (b) {
                        var d = !b.call(c.createElement("div"), "div"),
                            e = !1;
                        try {
                            b.call(c.documentElement, "[test!='']:sizzle")
                        } catch (f) {
                            e = !0
                        }
                        m.matchesSelector = function(a, c) {
                            c = c.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");
                            if (!m.isXML(a)) try {
                                if (e || !o.match.PSEUDO.test(c) && !/!=/.test(c)) {
                                    var f = b.call(a, c);
                                    if (f || !d || a.document && a.document.nodeType !== 11) return f
                                }
                            } catch (g) {}
                            return m(c, null, null, [a]).length > 0
                        }
                    }
                }(),
                function() {
                    var a = c.createElement("div");
                    a.innerHTML = "<div class='test e'></div><div class='test'></div>";
                    if (!!a.getElementsByClassName && a.getElementsByClassName("e").length !== 0) {
                        a.lastChild.className = "e";
                        if (a.getElementsByClassName("e").length === 1) return;
                        o.order.splice(1, 0, "CLASS"), o.find.CLASS = function(a, b, c) {
                            if (typeof b.getElementsByClassName != "undefined" && !c) return b.getElementsByClassName(a[1])
                        }, a = null
                    }
                }(), c.documentElement.contains ? m.contains = function(a, b) {
                    return a !== b && (a.contains ? a.contains(b) : !0)
                } : c.documentElement.compareDocumentPosition ? m.contains = function(a, b) {
                    return !!(a.compareDocumentPosition(b) & 16)
                } : m.contains = function() {
                    return !1
                }, m.isXML = function(a) {
                    var b = (a ? a.ownerDocument || a : 0).documentElement;
                    return b ? b.nodeName !== "HTML" : !1
                };
            var y = function(a, b, c) {
                var d, e = [],
                    f = "",
                    g = b.nodeType ? [b] : b;
                while (d = o.match.PSEUDO.exec(a)) f += d[0], a = a.replace(o.match.PSEUDO, "");
                a = o.relative[a] ? a + "*" : a;
                for (var h = 0, i = g.length; h < i; h++) m(a, g[h], e, c);
                return m.filter(f, e)
            };
            m.attr = f.attr, m.selectors.attrMap = {}, f.find = m, f.expr = m.selectors, f.expr[":"] = f.expr.filters, f.unique = m.uniqueSort, f.text = m.getText, f.isXMLDoc = m.isXML, f.contains = m.contains
        }();
    var L = /Until$/,
        M = /^(?:parents|prevUntil|prevAll)/,
        N = /,/,
        O = /^.[^:#\[\.,]*$/,
        P = Array.prototype.slice,
        Q = f.expr.match.POS,
        R = {
            children: !0,
            contents: !0,
            next: !0,
            prev: !0
        };
    f.fn.extend({
        find: function(a) {
            var b = this,
                c, d;
            if (typeof a != "string") return f(a).filter(function() {
                for (c = 0, d = b.length; c < d; c++)
                    if (f.contains(b[c], this)) return !0
            });
            var e = this.pushStack("", "find", a),
                g, h, i;
            for (c = 0, d = this.length; c < d; c++) {
                g = e.length, f.find(a, this[c], e);
                if (c > 0)
                    for (h = g; h < e.length; h++)
                        for (i = 0; i < g; i++)
                            if (e[i] === e[h]) {
                                e.splice(h--, 1);
                                break
                            }
            }
            return e
        },
        has: function(a) {
            var b = f(a);
            return this.filter(function() {
                for (var a = 0, c = b.length; a < c; a++)
                    if (f.contains(this, b[a])) return !0
            })
        },
        not: function(a) {
            return this.pushStack(T(this, a, !1), "not", a)
        },
        filter: function(a) {
            return this.pushStack(T(this, a, !0), "filter", a)
        },
        is: function(a) {
            return !!a && (typeof a == "string" ? Q.test(a) ? f(a, this.context).index(this[0]) >= 0 : f.filter(a, this).length > 0 : this.filter(a).length > 0)
        },
        closest: function(a, b) {
            var c = [],
                d, e, g = this[0];
            if (f.isArray(a)) {
                var h = 1;
                while (g && g.ownerDocument && g !== b) {
                    for (d = 0; d < a.length; d++) f(g).is(a[d]) && c.push({
                        selector: a[d],
                        elem: g,
                        level: h
                    });
                    g = g.parentNode, h++
                }
                return c
            }
            var i = Q.test(a) || typeof a != "string" ? f(a, b || this.context) : 0;
            for (d = 0, e = this.length; d < e; d++) {
                g = this[d];
                while (g) {
                    if (i ? i.index(g) > -1 : f.find.matchesSelector(g, a)) {
                        c.push(g);
                        break
                    }
                    g = g.parentNode;
                    if (!g || !g.ownerDocument || g === b || g.nodeType === 11) break
                }
            }
            c = c.length > 1 ? f.unique(c) : c;
            return this.pushStack(c, "closest", a)
        },
        index: function(a) {
            if (!a) return this[0] && this[0].parentNode ? this.prevAll().length : -1;
            if (typeof a == "string") return f.inArray(this[0], f(a));
            return f.inArray(a.jquery ? a[0] : a, this)
        },
        add: function(a, b) {
            var c = typeof a == "string" ? f(a, b) : f.makeArray(a && a.nodeType ? [a] : a),
                d = f.merge(this.get(), c);
            return this.pushStack(S(c[0]) || S(d[0]) ? d : f.unique(d))
        },
        andSelf: function() {
            return this.add(this.prevObject)
        }
    }), f.each({
        parent: function(a) {
            var b = a.parentNode;
            return b && b.nodeType !== 11 ? b : null
        },
        parents: function(a) {
            return f.dir(a, "parentNode")
        },
        parentsUntil: function(a, b, c) {
            return f.dir(a, "parentNode", c)
        },
        next: function(a) {
            return f.nth(a, 2, "nextSibling")
        },
        prev: function(a) {
            return f.nth(a, 2, "previousSibling")
        },
        nextAll: function(a) {
            return f.dir(a, "nextSibling")
        },
        prevAll: function(a) {
            return f.dir(a, "previousSibling")
        },
        nextUntil: function(a, b, c) {
            return f.dir(a, "nextSibling", c)
        },
        prevUntil: function(a, b, c) {
            return f.dir(a, "previousSibling", c)
        },
        siblings: function(a) {
            return f.sibling(a.parentNode.firstChild, a)
        },
        children: function(a) {
            return f.sibling(a.firstChild)
        },
        contents: function(a) {
            return f.nodeName(a, "iframe") ? a.contentDocument || a.contentWindow.document : f.makeArray(a.childNodes)
        }
    }, function(a, b) {
        f.fn[a] = function(c, d) {
            var e = f.map(this, b, c);
            L.test(a) || (d = c), d && typeof d == "string" && (e = f.filter(d, e)), e = this.length > 1 && !R[a] ? f.unique(e) : e, (this.length > 1 || N.test(d)) && M.test(a) && (e = e.reverse());
            return this.pushStack(e, a, P.call(arguments).join(","))
        }
    }), f.extend({
        filter: function(a, b, c) {
            c && (a = ":not(" + a + ")");
            return b.length === 1 ? f.find.matchesSelector(b[0], a) ? [b[0]] : [] : f.find.matches(a, b)
        },
        dir: function(a, c, d) {
            var e = [],
                g = a[c];
            while (g && g.nodeType !== 9 && (d === b || g.nodeType !== 1 || !f(g).is(d))) g.nodeType === 1 && e.push(g), g = g[c];
            return e
        },
        nth: function(a, b, c, d) {
            b = b || 1;
            var e = 0;
            for (; a; a = a[c])
                if (a.nodeType === 1 && ++e === b) break;
            return a
        },
        sibling: function(a, b) {
            var c = [];
            for (; a; a = a.nextSibling) a.nodeType === 1 && a !== b && c.push(a);
            return c
        }
    });
    var V = "abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
        W = / jQuery\d+="(?:\d+|null)"/g,
        X = /^\s+/,
        Y = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
        Z = /<([\w:]+)/,
        $ = /<tbody/i,
        _ = /<|&#?\w+;/,
        ba = /<(?:script|style)/i,
        bb = /<(?:script|object|embed|option|style)/i,
        bc = new RegExp("<(?:" + V + ")", "i"),
        bd = /checked\s*(?:[^=]|=\s*.checked.)/i,
        be = /\/(java|ecma)script/i,
        bf = /^\s*<!(?:\[CDATA\[|\-\-)/,
        bg = {
            option: [1, "<select multiple='multiple'>", "</select>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            area: [1, "<map>", "</map>"],
            _default: [0, "", ""]
        },
        bh = U(c);
    bg.optgroup = bg.option, bg.tbody = bg.tfoot = bg.colgroup = bg.caption = bg.thead, bg.th = bg.td, f.support.htmlSerialize || (bg._default = [1, "div<div>", "</div>"]), f.fn.extend({
        text: function(a) {
            if (f.isFunction(a)) return this.each(function(b) {
                var c = f(this);
                c.text(a.call(this, b, c.text()))
            });
            if (typeof a != "object" && a !== b) return this.empty().append((this[0] && this[0].ownerDocument || c).createTextNode(a));
            return f.text(this)
        },
        wrapAll: function(a) {
            if (f.isFunction(a)) return this.each(function(b) {
                f(this).wrapAll(a.call(this, b))
            });
            if (this[0]) {
                var b = f(a, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && b.insertBefore(this[0]), b.map(function() {
                    var a = this;
                    while (a.firstChild && a.firstChild.nodeType === 1) a = a.firstChild;
                    return a
                }).append(this)
            }
            return this
        },
        wrapInner: function(a) {
            if (f.isFunction(a)) return this.each(function(b) {
                f(this).wrapInner(a.call(this, b))
            });
            return this.each(function() {
                var b = f(this),
                    c = b.contents();
                c.length ? c.wrapAll(a) : b.append(a)
            })
        },
        wrap: function(a) {
            var b = f.isFunction(a);
            return this.each(function(c) {
                f(this).wrapAll(b ? a.call(this, c) : a)
            })
        },
        unwrap: function() {
            return this.parent().each(function() {
                f.nodeName(this, "body") || f(this).replaceWith(this.childNodes)
            }).end()
        },
        append: function() {
            return this.domManip(arguments, !0, function(a) {
                this.nodeType === 1 && this.appendChild(a)
            })
        },
        prepend: function() {
            return this.domManip(arguments, !0, function(a) {
                this.nodeType === 1 && this.insertBefore(a, this.firstChild)
            })
        },
        before: function() {
            if (this[0] && this[0].parentNode) return this.domManip(arguments, !1, function(a) {
                this.parentNode.insertBefore(a, this)
            });
            if (arguments.length) {
                var a = f.clean(arguments);
                a.push.apply(a, this.toArray());
                return this.pushStack(a, "before", arguments)
            }
        },
        after: function() {
            if (this[0] && this[0].parentNode) return this.domManip(arguments, !1, function(a) {
                this.parentNode.insertBefore(a, this.nextSibling)
            });
            if (arguments.length) {
                var a = this.pushStack(this, "after", arguments);
                a.push.apply(a, f.clean(arguments));
                return a
            }
        },
        remove: function(a, b) {
            for (var c = 0, d;
                (d = this[c]) != null; c++)
                if (!a || f.filter(a, [d]).length) !b && d.nodeType === 1 && (f.cleanData(d.getElementsByTagName("*")), f.cleanData([d])), d.parentNode && d.parentNode.removeChild(d);
            return this
        },
        empty: function() {
            for (var a = 0, b;
                (b = this[a]) != null; a++) {
                b.nodeType === 1 && f.cleanData(b.getElementsByTagName("*"));
                while (b.firstChild) b.removeChild(b.firstChild)
            }
            return this
        },
        clone: function(a, b) {
            a = a == null ? !1 : a, b = b == null ? a : b;
            return this.map(function() {
                return f.clone(this, a, b)
            })
        },
        html: function(a) {
            if (a === b) return this[0] && this[0].nodeType === 1 ? this[0].innerHTML.replace(W, "") : null;
            if (typeof a == "string" && !ba.test(a) && (f.support.leadingWhitespace || !X.test(a)) && !bg[(Z.exec(a) || ["", ""])[1].toLowerCase()]) {
                a = a.replace(Y, "<$1></$2>");
                try {
                    for (var c = 0, d = this.length; c < d; c++) this[c].nodeType === 1 && (f.cleanData(this[c].getElementsByTagName("*")), this[c].innerHTML = a)
                } catch (e) {
                    this.empty().append(a)
                }
            } else f.isFunction(a) ? this.each(function(b) {
                var c = f(this);
                c.html(a.call(this, b, c.html()))
            }) : this.empty().append(a);
            return this
        },
        replaceWith: function(a) {
            if (this[0] && this[0].parentNode) {
                if (f.isFunction(a)) return this.each(function(b) {
                    var c = f(this),
                        d = c.html();
                    c.replaceWith(a.call(this, b, d))
                });
                typeof a != "string" && (a = f(a).detach());
                return this.each(function() {
                    var b = this.nextSibling,
                        c = this.parentNode;
                    f(this).remove(), b ? f(b).before(a) : f(c).append(a)
                })
            }
            return this.length ? this.pushStack(f(f.isFunction(a) ? a() : a), "replaceWith", a) : this
        },
        detach: function(a) {
            return this.remove(a, !0)
        },
        domManip: function(a, c, d) {
            var e, g, h, i, j = a[0],
                k = [];
            if (!f.support.checkClone && arguments.length === 3 && typeof j == "string" && bd.test(j)) return this.each(function() {
                f(this).domManip(a, c, d, !0)
            });
            if (f.isFunction(j)) return this.each(function(e) {
                var g = f(this);
                a[0] = j.call(this, e, c ? g.html() : b), g.domManip(a, c, d)
            });
            if (this[0]) {
                i = j && j.parentNode, f.support.parentNode && i && i.nodeType === 11 && i.childNodes.length === this.length ? e = {
                    fragment: i
                } : e = f.buildFragment(a, this, k), h = e.fragment, h.childNodes.length === 1 ? g = h = h.firstChild : g = h.firstChild;
                if (g) {
                    c = c && f.nodeName(g, "tr");
                    for (var l = 0, m = this.length, n = m - 1; l < m; l++) d.call(c ? bi(this[l], g) : this[l], e.cacheable || m > 1 && l < n ? f.clone(h, !0, !0) : h)
                }
                k.length && f.each(k, bp)
            }
            return this
        }
    }), f.buildFragment = function(a, b, d) {
        var e, g, h, i, j = a[0];
        b && b[0] && (i = b[0].ownerDocument || b[0]), i.createDocumentFragment || (i = c), a.length === 1 && typeof j == "string" && j.length < 512 && i === c && j.charAt(0) === "<" && !bb.test(j) && (f.support.checkClone || !bd.test(j)) && (f.support.html5Clone || !bc.test(j)) && (g = !0, h = f.fragments[j], h && h !== 1 && (e = h)), e || (e = i.createDocumentFragment(), f.clean(a, i, e, d)), g && (f.fragments[j] = h ? e : 1);
        return {
            fragment: e,
            cacheable: g
        }
    }, f.fragments = {}, f.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(a, b) {
        f.fn[a] = function(c) {
            var d = [],
                e = f(c),
                g = this.length === 1 && this[0].parentNode;
            if (g && g.nodeType === 11 && g.childNodes.length === 1 && e.length === 1) {
                e[b](this[0]);
                return this
            }
            for (var h = 0, i = e.length; h < i; h++) {
                var j = (h > 0 ? this.clone(!0) : this).get();
                f(e[h])[b](j), d = d.concat(j)
            }
            return this.pushStack(d, a, e.selector)
        }
    }), f.extend({
        clone: function(a, b, c) {
            var d, e, g, h = f.support.html5Clone || !bc.test("<" + a.nodeName) ? a.cloneNode(!0) : bo(a);
            if ((!f.support.noCloneEvent || !f.support.noCloneChecked) && (a.nodeType === 1 || a.nodeType === 11) && !f.isXMLDoc(a)) {
                bk(a, h), d = bl(a), e = bl(h);
                for (g = 0; d[g]; ++g) e[g] && bk(d[g], e[g])
            }
            if (b) {
                bj(a, h);
                if (c) {
                    d = bl(a), e = bl(h);
                    for (g = 0; d[g]; ++g) bj(d[g], e[g])
                }
            }
            d = e = null;
            return h
        },
        clean: function(a, b, d, e) {
            var g;
            b = b || c, typeof b.createElement == "undefined" && (b = b.ownerDocument || b[0] && b[0].ownerDocument || c);
            var h = [],
                i;
            for (var j = 0, k;
                (k = a[j]) != null; j++) {
                typeof k == "number" && (k += "");
                if (!k) continue;
                if (typeof k == "string")
                    if (!_.test(k)) k = b.createTextNode(k);
                    else {
                        k = k.replace(Y, "<$1></$2>");
                        var l = (Z.exec(k) || ["", ""])[1].toLowerCase(),
                            m = bg[l] || bg._default,
                            n = m[0],
                            o = b.createElement("div");
                        b === c ? bh.appendChild(o) : U(b).appendChild(o), o.innerHTML = m[1] + k + m[2];
                        while (n--) o = o.lastChild;
                        if (!f.support.tbody) {
                            var p = $.test(k),
                                q = l === "table" && !p ? o.firstChild && o.firstChild.childNodes : m[1] === "<table>" && !p ? o.childNodes : [];
                            for (i = q.length - 1; i >= 0; --i) f.nodeName(q[i], "tbody") && !q[i].childNodes.length && q[i].parentNode.removeChild(q[i])
                        }!f.support.leadingWhitespace && X.test(k) && o.insertBefore(b.createTextNode(X.exec(k)[0]), o.firstChild), k = o.childNodes
                    }
                var r;
                if (!f.support.appendChecked)
                    if (k[0] && typeof(r = k.length) == "number")
                        for (i = 0; i < r; i++) bn(k[i]);
                    else bn(k);
                k.nodeType ? h.push(k) : h = f.merge(h, k)
            }
            if (d) {
                g = function(a) {
                    return !a.type || be.test(a.type)
                };
                for (j = 0; h[j]; j++)
                    if (e && f.nodeName(h[j], "script") && (!h[j].type || h[j].type.toLowerCase() === "text/javascript")) e.push(h[j].parentNode ? h[j].parentNode.removeChild(h[j]) : h[j]);
                    else {
                        if (h[j].nodeType === 1) {
                            var s = f.grep(h[j].getElementsByTagName("script"), g);
                            h.splice.apply(h, [j + 1, 0].concat(s))
                        }
                        d.appendChild(h[j])
                    }
            }
            return h
        },
        cleanData: function(a) {
            var b, c, d = f.cache,
                e = f.event.special,
                g = f.support.deleteExpando;
            for (var h = 0, i;
                (i = a[h]) != null; h++) {
                if (i.nodeName && f.noData[i.nodeName.toLowerCase()]) continue;
                c = i[f.expando];
                if (c) {
                    b = d[c];
                    if (b && b.events) {
                        for (var j in b.events) e[j] ? f.event.remove(i, j) : f.removeEvent(i, j, b.handle);
                        b.handle && (b.handle.elem = null)
                    }
                    g ? delete i[f.expando] : i.removeAttribute && i.removeAttribute(f.expando), delete d[c]
                }
            }
        }
    });
    var bq = /alpha\([^)]*\)/i,
        br = /opacity=([^)]*)/,
        bs = /([A-Z]|^ms)/g,
        bt = /^-?\d+(?:px)?$/i,
        bu = /^-?\d/,
        bv = /^([\-+])=([\-+.\de]+)/,
        bw = {
            position: "absolute",
            visibility: "hidden",
            display: "block"
        },
        bx = ["Left", "Right"],
        by = ["Top", "Bottom"],
        bz, bA, bB;
    f.fn.css = function(a, c) {
        if (arguments.length === 2 && c === b) return this;
        return f.access(this, a, c, !0, function(a, c, d) {
            return d !== b ? f.style(a, c, d) : f.css(a, c)
        })
    }, f.extend({
        cssHooks: {
            opacity: {
                get: function(a, b) {
                    if (b) {
                        var c = bz(a, "opacity", "opacity");
                        return c === "" ? "1" : c
                    }
                    return a.style.opacity
                }
            }
        },
        cssNumber: {
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        cssProps: {
            "float": f.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        style: function(a, c, d, e) {
            if (!!a && a.nodeType !== 3 && a.nodeType !== 8 && !!a.style) {
                var g, h, i = f.camelCase(c),
                    j = a.style,
                    k = f.cssHooks[i];
                c = f.cssProps[i] || i;
                if (d === b) {
                    if (k && "get" in k && (g = k.get(a, !1, e)) !== b) return g;
                    return j[c]
                }
                h = typeof d, h === "string" && (g = bv.exec(d)) && (d = +(g[1] + 1) * +g[2] + parseFloat(f.css(a, c)), h = "number");
                if (d == null || h === "number" && isNaN(d)) return;
                h === "number" && !f.cssNumber[i] && (d += "px");
                if (!k || !("set" in k) || (d = k.set(a, d)) !== b) try {
                    j[c] = d
                } catch (l) {}
            }
        },
        css: function(a, c, d) {
            var e, g;
            c = f.camelCase(c), g = f.cssHooks[c], c = f.cssProps[c] || c, c === "cssFloat" && (c = "float");
            if (g && "get" in g && (e = g.get(a, !0, d)) !== b) return e;
            if (bz) return bz(a, c)
        },
        swap: function(a, b, c) {
            var d = {};
            for (var e in b) d[e] = a.style[e], a.style[e] = b[e];
            c.call(a);
            for (e in b) a.style[e] = d[e]
        }
    }), f.curCSS = f.css, f.each(["height", "width"], function(a, b) {
        f.cssHooks[b] = {
            get: function(a, c, d) {
                var e;
                if (c) {
                    if (a.offsetWidth !== 0) return bC(a, b, d);
                    f.swap(a, bw, function() {
                        e = bC(a, b, d)
                    });
                    return e
                }
            },
            set: function(a, b) {
                if (!bt.test(b)) return b;
                b = parseFloat(b);
                if (b >= 0) return b + "px"
            }
        }
    }), f.support.opacity || (f.cssHooks.opacity = {
        get: function(a, b) {
            return br.test((b && a.currentStyle ? a.currentStyle.filter : a.style.filter) || "") ? parseFloat(RegExp.$1) / 100 + "" : b ? "1" : ""
        },
        set: function(a, b) {
            var c = a.style,
                d = a.currentStyle,
                e = f.isNumeric(b) ? "alpha(opacity=" + b * 100 + ")" : "",
                g = d && d.filter || c.filter || "";
            c.zoom = 1;
            if (b >= 1 && f.trim(g.replace(bq, "")) === "") {
                c.removeAttribute("filter");
                if (d && !d.filter) return
            }
            c.filter = bq.test(g) ? g.replace(bq, e) : g + " " + e
        }
    }), f(function() {
        f.support.reliableMarginRight || (f.cssHooks.marginRight = {
            get: function(a, b) {
                var c;
                f.swap(a, {
                    display: "inline-block"
                }, function() {
                    b ? c = bz(a, "margin-right", "marginRight") : c = a.style.marginRight
                });
                return c
            }
        })
    }), c.defaultView && c.defaultView.getComputedStyle && (bA = function(a, b) {
        var c, d, e;
        b = b.replace(bs, "-$1").toLowerCase(), (d = a.ownerDocument.defaultView) && (e = d.getComputedStyle(a, null)) && (c = e.getPropertyValue(b), c === "" && !f.contains(a.ownerDocument.documentElement, a) && (c = f.style(a, b)));
        return c
    }), c.documentElement.currentStyle && (bB = function(a, b) {
        var c, d, e, f = a.currentStyle && a.currentStyle[b],
            g = a.style;
        f === null && g && (e = g[b]) && (f = e), !bt.test(f) && bu.test(f) && (c = g.left, d = a.runtimeStyle && a.runtimeStyle.left, d && (a.runtimeStyle.left = a.currentStyle.left), g.left = b === "fontSize" ? "1em" : f || 0, f = g.pixelLeft + "px", g.left = c, d && (a.runtimeStyle.left = d));
        return f === "" ? "auto" : f
    }), bz = bA || bB, f.expr && f.expr.filters && (f.expr.filters.hidden = function(a) {
        var b = a.offsetWidth,
            c = a.offsetHeight;
        return b === 0 && c === 0 || !f.support.reliableHiddenOffsets && (a.style && a.style.display || f.css(a, "display")) === "none"
    }, f.expr.filters.visible = function(a) {
        return !f.expr.filters.hidden(a)
    });
    var bD = /%20/g,
        bE = /\[\]$/,
        bF = /\r?\n/g,
        bG = /#.*$/,
        bH = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm,
        bI = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
        bJ = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
        bK = /^(?:GET|HEAD)$/,
        bL = /^\/\//,
        bM = /\?/,
        bN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        bO = /^(?:select|textarea)/i,
        bP = /\s+/,
        bQ = /([?&])_=[^&]*/,
        bR = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,
        bS = f.fn.load,
        bT = {},
        bU = {},
        bV, bW, bX = ["*/"] + ["*"];
    try {
        bV = e.href
    } catch (bY) {
        bV = c.createElement("a"), bV.href = "", bV = bV.href
    }
    bW = bR.exec(bV.toLowerCase()) || [], f.fn.extend({
        load: function(a, c, d) {
            if (typeof a != "string" && bS) return bS.apply(this, arguments);
            if (!this.length) return this;
            var e = a.indexOf(" ");
            if (e >= 0) {
                var g = a.slice(e, a.length);
                a = a.slice(0, e)
            }
            var h = "GET";
            c && (f.isFunction(c) ? (d = c, c = b) : typeof c == "object" && (c = f.param(c, f.ajaxSettings.traditional), h = "POST"));
            var i = this;
            f.ajax({
                url: a,
                type: h,
                dataType: "html",
                data: c,
                complete: function(a, b, c) {
                    c = a.responseText, a.isResolved() && (a.done(function(a) {
                        c = a
                    }), i.html(g ? f("<div>").append(c.replace(bN, "")).find(g) : c)), d && i.each(d, [c, b, a])
                }
            });
            return this
        },
        serialize: function() {
            return f.param(this.serializeArray())
        },
        serializeArray: function() {
            return this.map(function() {
                return this.elements ? f.makeArray(this.elements) : this
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || bO.test(this.nodeName) || bI.test(this.type))
            }).map(function(a, b) {
                var c = f(this).val();
                return c == null ? null : f.isArray(c) ? f.map(c, function(a, c) {
                    return {
                        name: b.name,
                        value: a.replace(bF, "\r\n")
                    }
                }) : {
                    name: b.name,
                    value: c.replace(bF, "\r\n")
                }
            }).get()
        }
    }), f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(a, b) {
        f.fn[b] = function(a) {
            return this.on(b, a)
        }
    }), f.each(["get", "post"], function(a, c) {
        f[c] = function(a, d, e, g) {
            f.isFunction(d) && (g = g || e, e = d, d = b);
            return f.ajax({
                type: c,
                url: a,
                data: d,
                success: e,
                dataType: g
            })
        }
    }), f.extend({
        getScript: function(a, c) {
            return f.get(a, b, c, "script")
        },
        getJSON: function(a, b, c) {
            return f.get(a, b, c, "json")
        },
        ajaxSetup: function(a, b) {
            b ? b_(a, f.ajaxSettings) : (b = a, a = f.ajaxSettings), b_(a, b);
            return a
        },
        ajaxSettings: {
            url: bV,
            isLocal: bJ.test(bW[1]),
            global: !0,
            type: "GET",
            contentType: "application/x-www-form-urlencoded",
            processData: !0,
            async: !0,
            accepts: {
                xml: "application/xml, text/xml",
                html: "text/html",
                text: "text/plain",
                json: "application/json, text/javascript",
                "*": bX
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText"
            },
            converters: {
                "* text": a.String,
                "text html": !0,
                "text json": f.parseJSON,
                "text xml": f.parseXML
            },
            flatOptions: {
                context: !0,
                url: !0
            }
        },
        ajaxPrefilter: bZ(bT),
        ajaxTransport: bZ(bU),
        ajax: function(a, c) {
            function w(a, c, l, m) {
                if (s !== 2) {
                    s = 2, q && clearTimeout(q), p = b, n = m || "", v.readyState = a > 0 ? 4 : 0;
                    var o, r, u, w = c,
                        x = l ? cb(d, v, l) : b,
                        y, z;
                    if (a >= 200 && a < 300 || a === 304) {
                        if (d.ifModified) {
                            if (y = v.getResponseHeader("Last-Modified")) f.lastModified[k] = y;
                            if (z = v.getResponseHeader("Etag")) f.etag[k] = z
                        }
                        if (a === 304) w = "notmodified", o = !0;
                        else try {
                            r = cc(d, x), w = "success", o = !0
                        } catch (A) {
                            w = "parsererror", u = A
                        }
                    } else {
                        u = w;
                        if (!w || a) w = "error", a < 0 && (a = 0)
                    }
                    v.status = a, v.statusText = "" + (c || w), o ? h.resolveWith(e, [r, w, v]) : h.rejectWith(e, [v, w, u]), v.statusCode(j), j = b, t && g.trigger("ajax" + (o ? "Success" : "Error"), [v, d, o ? r : u]), i.fireWith(e, [v, w]), t && (g.trigger("ajaxComplete", [v, d]), --f.active || f.event.trigger("ajaxStop"))
                }
            }
            typeof a == "object" && (c = a, a = b), c = c || {};
            var d = f.ajaxSetup({}, c),
                e = d.context || d,
                g = e !== d && (e.nodeType || e instanceof f) ? f(e) : f.event,
                h = f.Deferred(),
                i = f.Callbacks("once memory"),
                j = d.statusCode || {},
                k, l = {},
                m = {},
                n, o, p, q, r, s = 0,
                t, u, v = {
                    readyState: 0,
                    setRequestHeader: function(a, b) {
                        if (!s) {
                            var c = a.toLowerCase();
                            a = m[c] = m[c] || a, l[a] = b
                        }
                        return this
                    },
                    getAllResponseHeaders: function() {
                        return s === 2 ? n : null
                    },
                    getResponseHeader: function(a) {
                        var c;
                        if (s === 2) {
                            if (!o) {
                                o = {};
                                while (c = bH.exec(n)) o[c[1].toLowerCase()] = c[2]
                            }
                            c = o[a.toLowerCase()]
                        }
                        return c === b ? null : c
                    },
                    overrideMimeType: function(a) {
                        s || (d.mimeType = a);
                        return this
                    },
                    abort: function(a) {
                        a = a || "abort", p && p.abort(a), w(0, a);
                        return this
                    }
                };
            h.promise(v), v.success = v.done, v.error = v.fail, v.complete = i.add, v.statusCode = function(a) {
                if (a) {
                    var b;
                    if (s < 2)
                        for (b in a) j[b] = [j[b], a[b]];
                    else b = a[v.status], v.then(b, b)
                }
                return this
            }, d.url = ((a || d.url) + "").replace(bG, "").replace(bL, bW[1] + "//"), d.dataTypes = f.trim(d.dataType || "*").toLowerCase().split(bP), d.crossDomain == null && (r = bR.exec(d.url.toLowerCase()), d.crossDomain = !(!r || r[1] == bW[1] && r[2] == bW[2] && (r[3] || (r[1] === "http:" ? 80 : 443)) == (bW[3] || (bW[1] === "http:" ? 80 : 443)))), d.data && d.processData && typeof d.data != "string" && (d.data = f.param(d.data, d.traditional)), b$(bT, d, c, v);
            if (s === 2) return !1;
            t = d.global, d.type = d.type.toUpperCase(), d.hasContent = !bK.test(d.type), t && f.active++ === 0 && f.event.trigger("ajaxStart");
            if (!d.hasContent) {
                d.data && (d.url += (bM.test(d.url) ? "&" : "?") + d.data, delete d.data), k = d.url;
                if (d.cache === !1) {
                    var x = f.now(),
                        y = d.url.replace(bQ, "$1_=" + x);
                    d.url = y + (y === d.url ? (bM.test(d.url) ? "&" : "?") + "_=" + x : "")
                }
            }(d.data && d.hasContent && d.contentType !== !1 || c.contentType) && v.setRequestHeader("Content-Type", d.contentType), d.ifModified && (k = k || d.url, f.lastModified[k] && v.setRequestHeader("If-Modified-Since", f.lastModified[k]), f.etag[k] && v.setRequestHeader("If-None-Match", f.etag[k])), v.setRequestHeader("Accept", d.dataTypes[0] && d.accepts[d.dataTypes[0]] ? d.accepts[d.dataTypes[0]] + (d.dataTypes[0] !== "*" ? ", " + bX + "; q=0.01" : "") : d.accepts["*"]);
            for (u in d.headers) v.setRequestHeader(u, d.headers[u]);
            if (d.beforeSend && (d.beforeSend.call(e, v, d) === !1 || s === 2)) {
                v.abort();
                return !1
            }
            for (u in {
                    success: 1,
                    error: 1,
                    complete: 1
                }) v[u](d[u]);
            p = b$(bU, d, c, v);
            if (!p) w(-1, "No Transport");
            else {
                v.readyState = 1, t && g.trigger("ajaxSend", [v, d]), d.async && d.timeout > 0 && (q = setTimeout(function() {
                    v.abort("timeout")
                }, d.timeout));
                try {
                    s = 1, p.send(l, w)
                } catch (z) {
                    if (s < 2) w(-1, z);
                    else throw z
                }
            }
            return v
        },
        param: function(a, c) {
            var d = [],
                e = function(a, b) {
                    b = f.isFunction(b) ? b() : b, d[d.length] = encodeURIComponent(a) + "=" + encodeURIComponent(b)
                };
            c === b && (c = f.ajaxSettings.traditional);
            if (f.isArray(a) || a.jquery && !f.isPlainObject(a)) f.each(a, function() {
                e(this.name, this.value)
            });
            else
                for (var g in a) ca(g, a[g], c, e);
            return d.join("&").replace(bD, "+")
        }
    }), f.extend({
        active: 0,
        lastModified: {},
        etag: {}
    });
    var cd = f.now(),
        ce = /(\=)\?(&|$)|\?\?/i;
    f.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            return f.expando + "_" + cd++
        }
    }), f.ajaxPrefilter("json jsonp", function(b, c, d) {
        var e = b.contentType === "application/x-www-form-urlencoded" && typeof b.data == "string";
        if (b.dataTypes[0] === "jsonp" || b.jsonp !== !1 && (ce.test(b.url) || e && ce.test(b.data))) {
            var g, h = b.jsonpCallback = f.isFunction(b.jsonpCallback) ? b.jsonpCallback() : b.jsonpCallback,
                i = a[h],
                j = b.url,
                k = b.data,
                l = "$1" + h + "$2";
            b.jsonp !== !1 && (j = j.replace(ce, l), b.url === j && (e && (k = k.replace(ce, l)), b.data === k && (j += (/\?/.test(j) ? "&" : "?") + b.jsonp + "=" + h))), b.url = j, b.data = k, a[h] = function(a) {
                g = [a]
            }, d.always(function() {
                a[h] = i, g && f.isFunction(i) && a[h](g[0])
            }), b.converters["script json"] = function() {
                g || f.error(h + " was not called");
                return g[0]
            }, b.dataTypes[0] = "json";
            return "script"
        }
    }), f.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /javascript|ecmascript/
        },
        converters: {
            "text script": function(a) {
                f.globalEval(a);
                return a
            }
        }
    }), f.ajaxPrefilter("script", function(a) {
        a.cache === b && (a.cache = !1), a.crossDomain && (a.type = "GET", a.global = !1)
    }), f.ajaxTransport("script", function(a) {
        if (a.crossDomain) {
            var d, e = c.head || c.getElementsByTagName("head")[0] || c.documentElement;
            return {
                send: function(f, g) {
                    d = c.createElement("script"), d.async = "async", a.scriptCharset && (d.charset = a.scriptCharset), d.src = a.url, d.onload = d.onreadystatechange = function(a, c) {
                        if (c || !d.readyState || /loaded|complete/.test(d.readyState)) d.onload = d.onreadystatechange = null, e && d.parentNode && e.removeChild(d), d = b, c || g(200, "success")
                    }, e.insertBefore(d, e.firstChild)
                },
                abort: function() {
                    d && d.onload(0, 1)
                }
            }
        }
    });
    var cf = a.ActiveXObject ? function() {
            for (var a in ch) ch[a](0, 1)
        } : !1,
        cg = 0,
        ch;
    f.ajaxSettings.xhr = a.ActiveXObject ? function() {
            return !this.isLocal && ci() || cj()
        } : ci,
        function(a) {
            f.extend(f.support, {
                ajax: !!a,
                cors: !!a && "withCredentials" in a
            })
        }(f.ajaxSettings.xhr()), f.support.ajax && f.ajaxTransport(function(c) {
            if (!c.crossDomain || f.support.cors) {
                var d;
                return {
                    send: function(e, g) {
                        var h = c.xhr(),
                            i, j;
                        c.username ? h.open(c.type, c.url, c.async, c.username, c.password) : h.open(c.type, c.url, c.async);
                        if (c.xhrFields)
                            for (j in c.xhrFields) h[j] = c.xhrFields[j];
                        c.mimeType && h.overrideMimeType && h.overrideMimeType(c.mimeType), !c.crossDomain && !e["X-Requested-With"] && (e["X-Requested-With"] = "XMLHttpRequest");
                        try {
                            for (j in e) h.setRequestHeader(j, e[j])
                        } catch (k) {}
                        h.send(c.hasContent && c.data || null), d = function(a, e) {
                            var j, k, l, m, n;
                            try {
                                if (d && (e || h.readyState === 4)) {
                                    d = b, i && (h.onreadystatechange = f.noop, cf && delete ch[i]);
                                    if (e) h.readyState !== 4 && h.abort();
                                    else {
                                        j = h.status, l = h.getAllResponseHeaders(), m = {}, n = h.responseXML, n && n.documentElement && (m.xml = n), m.text = h.responseText;
                                        try {
                                            k = h.statusText
                                        } catch (o) {
                                            k = ""
                                        }!j && c.isLocal && !c.crossDomain ? j = m.text ? 200 : 404 : j === 1223 && (j = 204)
                                    }
                                }
                            } catch (p) {
                                e || g(-1, p)
                            }
                            m && g(j, k, m, l)
                        }, !c.async || h.readyState === 4 ? d() : (i = ++cg, cf && (ch || (ch = {}, f(a).unload(cf)), ch[i] = d), h.onreadystatechange = d)
                    },
                    abort: function() {
                        d && d(0, 1)
                    }
                }
            }
        });
    var ck = {},
        cl, cm, cn = /^(?:toggle|show|hide)$/,
        co = /^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,
        cp, cq = [
            ["height", "marginTop", "marginBottom", "paddingTop", "paddingBottom"],
            ["width", "marginLeft", "marginRight", "paddingLeft", "paddingRight"],
            ["opacity"]
        ],
        cr;
    f.fn.extend({
        show: function(a, b, c) {
            var d, e;
            if (a || a === 0) return this.animate(cu("show", 3), a, b, c);
            for (var g = 0, h = this.length; g < h; g++) d = this[g], d.style && (e = d.style.display, !f._data(d, "olddisplay") && e === "none" && (e = d.style.display = ""), e === "" && f.css(d, "display") === "none" && f._data(d, "olddisplay", cv(d.nodeName)));
            for (g = 0; g < h; g++) {
                d = this[g];
                if (d.style) {
                    e = d.style.display;
                    if (e === "" || e === "none") d.style.display = f._data(d, "olddisplay") || ""
                }
            }
            return this
        },
        hide: function(a, b, c) {
            if (a || a === 0) return this.animate(cu("hide", 3), a, b, c);
            var d, e, g = 0,
                h = this.length;
            for (; g < h; g++) d = this[g], d.style && (e = f.css(d, "display"), e !== "none" && !f._data(d, "olddisplay") && f._data(d, "olddisplay", e));
            for (g = 0; g < h; g++) this[g].style && (this[g].style.display = "none");
            return this
        },
        _toggle: f.fn.toggle,
        toggle: function(a, b, c) {
            var d = typeof a == "boolean";
            f.isFunction(a) && f.isFunction(b) ? this._toggle.apply(this, arguments) : a == null || d ? this.each(function() {
                var b = d ? a : f(this).is(":hidden");
                f(this)[b ? "show" : "hide"]()
            }) : this.animate(cu("toggle", 3), a, b, c);
            return this
        },
        fadeTo: function(a, b, c, d) {
            return this.filter(":hidden").css("opacity", 0).show().end().animate({
                opacity: b
            }, a, c, d)
        },
        animate: function(a, b, c, d) {
            function g() {
                e.queue === !1 && f._mark(this);
                var b = f.extend({}, e),
                    c = this.nodeType === 1,
                    d = c && f(this).is(":hidden"),
                    g, h, i, j, k, l, m, n, o;
                b.animatedProperties = {};
                for (i in a) {
                    g = f.camelCase(i), i !== g && (a[g] = a[i], delete a[i]), h = a[g], f.isArray(h) ? (b.animatedProperties[g] = h[1], h = a[g] = h[0]) : b.animatedProperties[g] = b.specialEasing && b.specialEasing[g] || b.easing || "swing";
                    if (h === "hide" && d || h === "show" && !d) return b.complete.call(this);
                    c && (g === "height" || g === "width") && (b.overflow = [this.style.overflow, this.style.overflowX, this.style.overflowY], f.css(this, "display") === "inline" && f.css(this, "float") === "none" && (!f.support.inlineBlockNeedsLayout || cv(this.nodeName) === "inline" ? this.style.display = "inline-block" : this.style.zoom = 1))
                }
                b.overflow != null && (this.style.overflow = "hidden");
                for (i in a) j = new f.fx(this, b, i), h = a[i], cn.test(h) ? (o = f._data(this, "toggle" + i) || (h === "toggle" ? d ? "show" : "hide" : 0), o ? (f._data(this, "toggle" + i, o === "show" ? "hide" : "show"), j[o]()) : j[h]()) : (k = co.exec(h), l = j.cur(), k ? (m = parseFloat(k[2]), n = k[3] || (f.cssNumber[i] ? "" : "px"), n !== "px" && (f.style(this, i, (m || 1) + n), l = (m || 1) / j.cur() * l, f.style(this, i, l + n)), k[1] && (m = (k[1] === "-=" ? -1 : 1) * m + l), j.custom(l, m, n)) : j.custom(l, h, ""));
                return !0
            }
            var e = f.speed(b, c, d);
            if (f.isEmptyObject(a)) return this.each(e.complete, [!1]);
            a = f.extend({}, a);
            return e.queue === !1 ? this.each(g) : this.queue(e.queue, g)
        },
        stop: function(a, c, d) {
            typeof a != "string" && (d = c, c = a, a = b), c && a !== !1 && this.queue(a || "fx", []);
            return this.each(function() {
                function h(a, b, c) {
                    var e = b[c];
                    f.removeData(a, c, !0), e.stop(d)
                }
                var b, c = !1,
                    e = f.timers,
                    g = f._data(this);
                d || f._unmark(!0, this);
                if (a == null)
                    for (b in g) g[b] && g[b].stop && b.indexOf(".run") === b.length - 4 && h(this, g, b);
                else g[b = a + ".run"] && g[b].stop && h(this, g, b);
                for (b = e.length; b--;) e[b].elem === this && (a == null || e[b].queue === a) && (d ? e[b](!0) : e[b].saveState(), c = !0, e.splice(b, 1));
                (!d || !c) && f.dequeue(this, a)
            })
        }
    }), f.each({
        slideDown: cu("show", 1),
        slideUp: cu("hide", 1),
        slideToggle: cu("toggle", 1),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(a, b) {
        f.fn[a] = function(a, c, d) {
            return this.animate(b, a, c, d)
        }
    }), f.extend({
        speed: function(a, b, c) {
            var d = a && typeof a == "object" ? f.extend({}, a) : {
                complete: c || !c && b || f.isFunction(a) && a,
                duration: a,
                easing: c && b || b && !f.isFunction(b) && b
            };
            d.duration = f.fx.off ? 0 : typeof d.duration == "number" ? d.duration : d.duration in f.fx.speeds ? f.fx.speeds[d.duration] : f.fx.speeds._default;
            if (d.queue == null || d.queue === !0) d.queue = "fx";
            d.old = d.complete, d.complete = function(a) {
                f.isFunction(d.old) && d.old.call(this), d.queue ? f.dequeue(this, d.queue) : a !== !1 && f._unmark(this)
            };
            return d
        },
        easing: {
            linear: function(a, b, c, d) {
                return c + d * a
            },
            swing: function(a, b, c, d) {
                return (-Math.cos(a * Math.PI) / 2 + .5) * d + c
            }
        },
        timers: [],
        fx: function(a, b, c) {
            this.options = b, this.elem = a, this.prop = c, b.orig = b.orig || {}
        }
    }), f.fx.prototype = {
        update: function() {
            this.options.step && this.options.step.call(this.elem, this.now, this), (f.fx.step[this.prop] || f.fx.step._default)(this)
        },
        cur: function() {
            if (this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null)) return this.elem[this.prop];
            var a, b = f.css(this.elem, this.prop);
            return isNaN(a = parseFloat(b)) ? !b || b === "auto" ? 0 : b : a
        },
        custom: function(a, c, d) {
            function h(a) {
                return e.step(a)
            }
            var e = this,
                g = f.fx;
            this.startTime = cr || cs(), this.end = c, this.now = this.start = a, this.pos = this.state = 0, this.unit = d || this.unit || (f.cssNumber[this.prop] ? "" : "px"), h.queue = this.options.queue, h.elem = this.elem, h.saveState = function() {
                e.options.hide && f._data(e.elem, "fxshow" + e.prop) === b && f._data(e.elem, "fxshow" + e.prop, e.start)
            }, h() && f.timers.push(h) && !cp && (cp = setInterval(g.tick, g.interval))
        },
        show: function() {
            var a = f._data(this.elem, "fxshow" + this.prop);
            this.options.orig[this.prop] = a || f.style(this.elem, this.prop), this.options.show = !0, a !== b ? this.custom(this.cur(), a) : this.custom(this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur()), f(this.elem).show()
        },
        hide: function() {
            this.options.orig[this.prop] = f._data(this.elem, "fxshow" + this.prop) || f.style(this.elem, this.prop), this.options.hide = !0, this.custom(this.cur(), 0)
        },
        step: function(a) {
            var b, c, d, e = cr || cs(),
                g = !0,
                h = this.elem,
                i = this.options;
            if (a || e >= i.duration + this.startTime) {
                this.now = this.end, this.pos = this.state = 1, this.update(), i.animatedProperties[this.prop] = !0;
                for (b in i.animatedProperties) i.animatedProperties[b] !== !0 && (g = !1);
                if (g) {
                    i.overflow != null && !f.support.shrinkWrapBlocks && f.each(["", "X", "Y"], function(a, b) {
                        h.style["overflow" + b] = i.overflow[a]
                    }), i.hide && f(h).hide();
                    if (i.hide || i.show)
                        for (b in i.animatedProperties) f.style(h, b, i.orig[b]), f.removeData(h, "fxshow" + b, !0), f.removeData(h, "toggle" + b, !0);
                    d = i.complete, d && (i.complete = !1, d.call(h))
                }
                return !1
            }
            i.duration == Infinity ? this.now = e : (c = e - this.startTime, this.state = c / i.duration, this.pos = f.easing[i.animatedProperties[this.prop]](this.state, c, 0, 1, i.duration), this.now = this.start + (this.end - this.start) * this.pos), this.update();
            return !0
        }
    }, f.extend(f.fx, {
        tick: function() {
            var a, b = f.timers,
                c = 0;
            for (; c < b.length; c++) a = b[c], !a() && b[c] === a && b.splice(c--, 1);
            b.length || f.fx.stop()
        },
        interval: 13,
        stop: function() {
            clearInterval(cp), cp = null
        },
        speeds: {
            slow: 600,
            fast: 200,
            _default: 400
        },
        step: {
            opacity: function(a) {
                f.style(a.elem, "opacity", a.now)
            },
            _default: function(a) {
                a.elem.style && a.elem.style[a.prop] != null ? a.elem.style[a.prop] = a.now + a.unit : a.elem[a.prop] = a.now
            }
        }
    }), f.each(["width", "height"], function(a, b) {
        f.fx.step[b] = function(a) {
            f.style(a.elem, b, Math.max(0, a.now) + a.unit)
        }
    }), f.expr && f.expr.filters && (f.expr.filters.animated = function(a) {
        return f.grep(f.timers, function(b) {
            return a === b.elem
        }).length
    });
    var cw = /^t(?:able|d|h)$/i,
        cx = /^(?:body|html)$/i;
    "getBoundingClientRect" in c.documentElement ? f.fn.offset = function(a) {
        var b = this[0],
            c;
        if (a) return this.each(function(b) {
            f.offset.setOffset(this, a, b)
        });
        if (!b || !b.ownerDocument) return null;
        if (b === b.ownerDocument.body) return f.offset.bodyOffset(b);
        try {
            c = b.getBoundingClientRect()
        } catch (d) {}
        var e = b.ownerDocument,
            g = e.documentElement;
        if (!c || !f.contains(g, b)) return c ? {
            top: c.top,
            left: c.left
        } : {
            top: 0,
            left: 0
        };
        var h = e.body,
            i = cy(e),
            j = g.clientTop || h.clientTop || 0,
            k = g.clientLeft || h.clientLeft || 0,
            l = i.pageYOffset || f.support.boxModel && g.scrollTop || h.scrollTop,
            m = i.pageXOffset || f.support.boxModel && g.scrollLeft || h.scrollLeft,
            n = c.top + l - j,
            o = c.left + m - k;
        return {
            top: n,
            left: o
        }
    } : f.fn.offset = function(a) {
        var b = this[0];
        if (a) return this.each(function(b) {
            f.offset.setOffset(this, a, b)
        });
        if (!b || !b.ownerDocument) return null;
        if (b === b.ownerDocument.body) return f.offset.bodyOffset(b);
        var c, d = b.offsetParent,
            e = b,
            g = b.ownerDocument,
            h = g.documentElement,
            i = g.body,
            j = g.defaultView,
            k = j ? j.getComputedStyle(b, null) : b.currentStyle,
            l = b.offsetTop,
            m = b.offsetLeft;
        while ((b = b.parentNode) && b !== i && b !== h) {
            if (f.support.fixedPosition && k.position === "fixed") break;
            c = j ? j.getComputedStyle(b, null) : b.currentStyle, l -= b.scrollTop, m -= b.scrollLeft, b === d && (l += b.offsetTop, m += b.offsetLeft, f.support.doesNotAddBorder && (!f.support.doesAddBorderForTableAndCells || !cw.test(b.nodeName)) && (l += parseFloat(c.borderTopWidth) || 0, m += parseFloat(c.borderLeftWidth) || 0), e = d, d = b.offsetParent), f.support.subtractsBorderForOverflowNotVisible && c.overflow !== "visible" && (l += parseFloat(c.borderTopWidth) || 0, m += parseFloat(c.borderLeftWidth) || 0), k = c
        }
        if (k.position === "relative" || k.position === "static") l += i.offsetTop, m += i.offsetLeft;
        f.support.fixedPosition && k.position === "fixed" && (l += Math.max(h.scrollTop, i.scrollTop), m += Math.max(h.scrollLeft, i.scrollLeft));
        return {
            top: l,
            left: m
        }
    }, f.offset = {
        bodyOffset: function(a) {
            var b = a.offsetTop,
                c = a.offsetLeft;
            f.support.doesNotIncludeMarginInBodyOffset && (b += parseFloat(f.css(a, "marginTop")) || 0, c += parseFloat(f.css(a, "marginLeft")) || 0);
            return {
                top: b,
                left: c
            }
        },
        setOffset: function(a, b, c) {
            var d = f.css(a, "position");
            d === "static" && (a.style.position = "relative");
            var e = f(a),
                g = e.offset(),
                h = f.css(a, "top"),
                i = f.css(a, "left"),
                j = (d === "absolute" || d === "fixed") && f.inArray("auto", [h, i]) > -1,
                k = {},
                l = {},
                m, n;
            j ? (l = e.position(), m = l.top, n = l.left) : (m = parseFloat(h) || 0, n = parseFloat(i) || 0), f.isFunction(b) && (b = b.call(a, c, g)), b.top != null && (k.top = b.top - g.top + m), b.left != null && (k.left = b.left - g.left + n), "using" in b ? b.using.call(a, k) : e.css(k)
        }
    }, f.fn.extend({
        position: function() {
            if (!this[0]) return null;
            var a = this[0],
                b = this.offsetParent(),
                c = this.offset(),
                d = cx.test(b[0].nodeName) ? {
                    top: 0,
                    left: 0
                } : b.offset();
            c.top -= parseFloat(f.css(a, "marginTop")) || 0, c.left -= parseFloat(f.css(a, "marginLeft")) || 0, d.top += parseFloat(f.css(b[0], "borderTopWidth")) || 0, d.left += parseFloat(f.css(b[0], "borderLeftWidth")) || 0;
            return {
                top: c.top - d.top,
                left: c.left - d.left
            }
        },
        offsetParent: function() {
            return this.map(function() {
                var a = this.offsetParent || c.body;
                while (a && !cx.test(a.nodeName) && f.css(a, "position") === "static") a = a.offsetParent;
                return a
            })
        }
    }), f.each(["Left", "Top"], function(a, c) {
        var d = "scroll" + c;
        f.fn[d] = function(c) {
            var e, g;
            if (c === b) {
                e = this[0];
                if (!e) return null;
                g = cy(e);
                return g ? "pageXOffset" in g ? g[a ? "pageYOffset" : "pageXOffset"] : f.support.boxModel && g.document.documentElement[d] || g.document.body[d] : e[d]
            }
            return this.each(function() {
                g = cy(this), g ? g.scrollTo(a ? f(g).scrollLeft() : c, a ? c : f(g).scrollTop()) : this[d] = c
            })
        }
    }), f.each(["Height", "Width"], function(a, c) {
        var d = c.toLowerCase();
        f.fn["inner" + c] = function() {
            var a = this[0];
            return a ? a.style ? parseFloat(f.css(a, d, "padding")) : this[d]() : null
        }, f.fn["outer" + c] = function(a) {
            var b = this[0];
            return b ? b.style ? parseFloat(f.css(b, d, a ? "margin" : "border")) : this[d]() : null
        }, f.fn[d] = function(a) {
            var e = this[0];
            if (!e) return a == null ? null : this;
            if (f.isFunction(a)) return this.each(function(b) {
                var c = f(this);
                c[d](a.call(this, b, c[d]()))
            });
            if (f.isWindow(e)) {
                var g = e.document.documentElement["client" + c],
                    h = e.document.body;
                return e.document.compatMode === "CSS1Compat" && g || h && h["client" + c] || g
            }
            if (e.nodeType === 9) return Math.max(e.documentElement["client" + c], e.body["scroll" + c], e.documentElement["scroll" + c], e.body["offset" + c], e.documentElement["offset" + c]);
            if (a === b) {
                var i = f.css(e, d),
                    j = parseFloat(i);
                return f.isNumeric(j) ? j : i
            }
            return this.css(d, typeof a == "string" ? a : a + "px")
        }
    }), a.jQuery = a.$ = f, typeof define == "function" && define.amd && define.amd.jQuery && define("jquery", [], function() {
        return f
    })
})(window);
jQuery.easing["jswing"] = jQuery.easing["swing"];
jQuery.extend(jQuery.easing, {
    def: "easeOutQuad",
    swing: function(x, t, b, c, d) {
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d)
    },
    easeInQuad: function(x, t, b, c, d) {
        return c * (t /= d) * t + b
    },
    easeOutQuad: function(x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b
    },
    easeInOutQuad: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * (--t * (t - 2) - 1) + b
    },
    easeInCubic: function(x, t, b, c, d) {
        return c * (t /= d) * t * t + b
    },
    easeOutCubic: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b
    },
    easeInOutCubic: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t + 2) + b
    },
    easeInQuart: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t + b
    },
    easeOutQuart: function(x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b
    },
    easeInOutQuart: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b
    },
    easeInQuint: function(x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b
    },
    easeOutQuint: function(x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b
    },
    easeInOutQuint: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b
    },
    easeInSine: function(x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b
    },
    easeOutSine: function(x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b
    },
    easeInOutSine: function(x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b
    },
    easeInExpo: function(x, t, b, c, d) {
        return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b
    },
    easeOutExpo: function(x, t, b, c, d) {
        return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b
    },
    easeInOutExpo: function(x, t, b, c, d) {
        if (t == 0) return b;
        if (t == d) return b + c;
        if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b
    },
    easeInCirc: function(x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b
    },
    easeOutCirc: function(x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b
    },
    easeInOutCirc: function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b
    },
    easeInElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b
    },
    easeOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d) == 1) return b + c;
        if (!p) p = d * .3;
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b
    },
    easeInOutElastic: function(x, t, b, c, d) {
        var s = 1.70158;
        var p = 0;
        var a = c;
        if (t == 0) return b;
        if ((t /= d / 2) == 2) return b + c;
        if (!p) p = d * (.3 * 1.5);
        if (a < Math.abs(c)) {
            a = c;
            var s = p / 4
        } else var s = p / (2 * Math.PI) * Math.asin(c / a);
        if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b
    },
    easeInBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * (t /= d) * t * ((s + 1) * t - s) + b
    },
    easeOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b
    },
    easeInOutBack: function(x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
        return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b
    },
    easeInBounce: function(x, t, b, c, d) {
        return c - jQuery.easing.easeOutBounce(x, d - t, 0, c, d) + b
    },
    easeOutBounce: function(x, t, b, c, d) {
        if ((t /= d) < 1 / 2.75) {
            return c * (7.5625 * t * t) + b
        } else if (t < 2 / 2.75) {
            return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b
        } else if (t < 2.5 / 2.75) {
            return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b
        } else {
            return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b
        }
    },
    easeInOutBounce: function(x, t, b, c, d) {
        if (t < d / 2) return jQuery.easing.easeInBounce(x, t * 2, 0, c, d) * .5 + b;
        return jQuery.easing.easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b
    }
});
(function(e, f, g) {
    var h, i, j;
    i = {
        paneClass: "pane",
        sliderClass: "slider",
        sliderMinHeight: 20,
        contentClass: "content",
        iOSNativeScrolling: !1,
        preventPageScrolling: !1
    };
    j = function() {
        var d, a;
        d = g.createElement("div");
        a = d.style;
        a.position = "absolute";
        a.width = "100px";
        a.height = "100px";
        a.overflow = "scroll";
        a.top = "-9999px";
        g.body.appendChild(d);
        a = d.offsetWidth - d.clientWidth;
        g.body.removeChild(d);
        return a
    };
    h = function() {
        function d(a, b) {
            this.options = b;
            this.el = e(a);
            this.doc = e(g);
            this.win = e(f);
            this.generate();
            this.createEvents();
            this.addEvents();
            this.reset()
        }
        d.name = "NanoScroll";
        d.prototype.preventScrolling = function(a, b) {
            switch (a.type) {
                case "DOMMouseScroll":
                    ("down" === b && 0 < a.originalEvent.detail || "up" === b && 0 > a.originalEvent.detail) && a.preventDefault();
                    break;
                case "mousewheel":
                    ("down" === b && 0 > a.originalEvent.wheelDelta || "up" === b && 0 < a.originalEvent.wheelDelta) && a.preventDefault()
            }
        };
        d.prototype.createEvents = function() {
            var a = this;
            this.events = {
                down: function(b) {
                    a.isDrag = !0;
                    a.offsetY = b.clientY - a.slider.offset().top;
                    a.pane.addClass("active");
                    a.doc.bind("mousemove", a.events.drag).bind("mouseup", a.events.up);
                    return !1
                },
                drag: function(b) {
                    a.sliderY = b.clientY - a.el.offset().top - a.offsetY;
                    a.scroll();
                    return !1
                },
                up: function() {
                    a.isDrag = !1;
                    a.pane.removeClass("active");
                    a.doc.unbind("mousemove", a.events.drag).unbind("mouseup", a.events.up);
                    return !1
                },
                resize: function() {
                    a.reset()
                },
                panedown: function(b) {
                    a.sliderY = b.clientY - a.el.offset().top - .5 * a.sliderH;
                    a.scroll();
                    a.events.down(b)
                },
                scroll: function(b) {
                    var c;
                    !0 !== a.isDrag && (c = a.content[0], c = c.scrollTop / (c.scrollHeight - c.clientHeight) * (a.paneH - a.sliderH), c + a.sliderH === a.paneH ? (a.options.preventPageScrolling && a.preventScrolling(b, "down"), a.el.trigger("scrollend")) : 0 === c && (a.options.preventPageScrolling && a.preventScrolling(b, "up"), a.el.trigger("scrolltop")), a.slider.css({
                        top: c + "px"
                    }))
                },
                wheel: function(b) {
                    a.sliderY += -b.wheelDeltaY || -b.delta;
                    a.scroll();
                    return !1
                }
            }
        };
        d.prototype.addEvents = function() {
            var a, b, c;
            b = this.events;
            c = this.pane;
            a = this.content;
            this.win.bind("resize", b.resize);
            this.slider.bind("mousedown", b.down);
            c.bind("mousedown", b.panedown);
            c.bind("mousewheel", b.wheel);
            c.bind("DOMMouseScroll", b.wheel);
            a.bind("mousewheel", b.scroll);
            a.bind("DOMMouseScroll", b.scroll);
            a.bind("touchmove", b.scroll)
        };
        d.prototype.removeEvents = function() {
            var a, b, c;
            b = this.events;
            c = this.pane;
            a = this.content;
            this.win.unbind("resize", b.resize);
            this.slider.unbind("mousedown", b.down);
            c.unbind("mousedown", b.panedown);
            c.unbind("mousewheel", b.wheel);
            c.unbind("DOMMouseScroll", b.wheel);
            a.unbind("mousewheel", b.scroll);
            a.unbind("DOMMouseScroll", b.scroll);
            a.unbind("touchmove", b.scroll)
        };
        d.prototype.generate = function() {
            var a;
            a = this.options;
            this.el.append('<div class="' + a.paneClass + '"><div class="' + a.sliderClass + '" /></div>');
            this.content = e(this.el.children("." + a.contentClass)[0]);
            this.slider = this.el.find("." + a.sliderClass);
            this.pane = this.el.find("." + a.paneClass);
            this.scrollW = j();
            a.iOSNativeScrolling ? this.content.css({
                right: -this.scrollW + "px",
                WebkitOverflowScrolling: "touch"
            }) : this.content.css({
                right: -this.scrollW + "px"
            })
        };
        d.prototype.reset = function() {
            var a, b, c, d, e;
            this.el.find("." + this.options.paneClass).length || (this.generate(), this.stop());
            !0 === this.isDead && (this.isDead = !1, this.pane.show(), this.addEvents());
            a = this.content[0];
            b = a.style;
            c = b.overflowY;
            "Microsoft Internet Explorer" === f.navigator.appName && (/msie 7./i.test(f.navigator.appVersion) && f.ActiveXObject) && this.content.css({
                height: this.content.height()
            });
            this.contentH = a.scrollHeight + this.scrollW;
            this.paneH = this.pane.outerHeight();
            e = parseInt(this.pane.css("top"), 10);
            d = parseInt(this.pane.css("bottom"), 10);
            this.paneOuterH = this.paneH + e + d;
            this.sliderH = Math.round(this.paneOuterH / this.contentH * this.paneOuterH);
            this.sliderH = this.sliderH > this.options.sliderMinHeight ? this.sliderH : this.options.sliderMinHeight;
            "scroll" === c && "scroll" !== b.overflowX && (this.sliderH += this.scrollW);
            this.scrollH = this.paneOuterH - this.sliderH;
            this.slider.height(this.sliderH);
            this.diffH = a.scrollHeight - a.clientHeight;
            this.pane.show();
            this.paneOuterH >= a.scrollHeight && "scroll" !== c ? this.pane.hide() : this.el.height() === a.scrollHeight && "scroll" === c ? this.slider.hide() : this.slider.show()
        };
        d.prototype.scroll = function() {
            this.sliderY = Math.max(0, this.sliderY);
            this.sliderY = Math.min(this.scrollH, this.sliderY);
            this.content.scrollTop(-((this.paneH - this.contentH + this.scrollW) * this.sliderY / this.scrollH));
            this.slider.css({
                top: this.sliderY
            })
        };
        d.prototype.scrollBottom = function(a) {
            var b, c;
            b = this.diffH;
            c = this.content[0].scrollTop;
            this.reset();
            c < b && 0 !== c || this.content.scrollTop(this.contentH - this.content.height() - a)
        };
        d.prototype.scrollTop = function(a) {
            this.reset();
            this.content.scrollTop(+a)
        };
        d.prototype.scrollTo = function(a) {
            this.reset();
            a = e(a).offset().top;
            a > this.scrollH && (a /= this.contentH, this.sliderY = a *= this.scrollH, this.scroll())
        };
        d.prototype.stop = function() {
            this.isDead = !0;
            this.removeEvents();
            this.pane.hide()
        };
        return d
    }();
    e.fn.nanoScroller = function(d) {
        var a;
        a = e.extend({}, i, d);
        this.each(function() {
            var b;
            b = e.data(this, "scrollbar");
            b || (b = new h(this, a), e.data(this, "scrollbar", b));
            return a.scrollBottom ? b.scrollBottom(a.scrollBottom) : a.scrollTop ? b.scrollTop(a.scrollTop) : a.scrollTo ? b.scrollTo(a.scrollTo) : "bottom" === a.scroll ? b.scrollBottom(0) : "top" === a.scroll ? b.scrollTop(0) : a.scroll instanceof e ? b.scrollTo(a.scroll) : a.stop ? b.stop() : b.reset()
        })
    }
})(jQuery, window, document);
"use strict";
var THREE = {
    REVISION: "69"
};
"object" === typeof module && (module.exports = THREE);
void 0 === Math.sign && (Math.sign = function(a) {
    return 0 > a ? -1 : 0 < a ? 1 : 0
});
THREE.MOUSE = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};
THREE.CullFaceNone = 0;
THREE.CullFaceBack = 1;
THREE.CullFaceFront = 2;
THREE.CullFaceFrontBack = 3;
THREE.FrontFaceDirectionCW = 0;
THREE.FrontFaceDirectionCCW = 1;
THREE.BasicShadowMap = 0;
THREE.PCFShadowMap = 1;
THREE.PCFSoftShadowMap = 2;
THREE.FrontSide = 0;
THREE.BackSide = 1;
THREE.DoubleSide = 2;
THREE.NoShading = 0;
THREE.FlatShading = 1;
THREE.SmoothShading = 2;
THREE.NoColors = 0;
THREE.FaceColors = 1;
THREE.VertexColors = 2;
THREE.NoBlending = 0;
THREE.NormalBlending = 1;
THREE.AdditiveBlending = 2;
THREE.SubtractiveBlending = 3;
THREE.MultiplyBlending = 4;
THREE.CustomBlending = 5;
THREE.AddEquation = 100;
THREE.SubtractEquation = 101;
THREE.ReverseSubtractEquation = 102;
THREE.MinEquation = 103;
THREE.MaxEquation = 104;
THREE.ZeroFactor = 200;
THREE.OneFactor = 201;
THREE.SrcColorFactor = 202;
THREE.OneMinusSrcColorFactor = 203;
THREE.SrcAlphaFactor = 204;
THREE.OneMinusSrcAlphaFactor = 205;
THREE.DstAlphaFactor = 206;
THREE.OneMinusDstAlphaFactor = 207;
THREE.DstColorFactor = 208;
THREE.OneMinusDstColorFactor = 209;
THREE.SrcAlphaSaturateFactor = 210;
THREE.MultiplyOperation = 0;
THREE.MixOperation = 1;
THREE.AddOperation = 2;
THREE.UVMapping = function() {};
THREE.CubeReflectionMapping = function() {};
THREE.CubeRefractionMapping = function() {};
THREE.SphericalReflectionMapping = function() {};
THREE.SphericalRefractionMapping = function() {};
THREE.RepeatWrapping = 1e3;
THREE.ClampToEdgeWrapping = 1001;
THREE.MirroredRepeatWrapping = 1002;
THREE.NearestFilter = 1003;
THREE.NearestMipMapNearestFilter = 1004;
THREE.NearestMipMapLinearFilter = 1005;
THREE.LinearFilter = 1006;
THREE.LinearMipMapNearestFilter = 1007;
THREE.LinearMipMapLinearFilter = 1008;
THREE.UnsignedByteType = 1009;
THREE.ByteType = 1010;
THREE.ShortType = 1011;
THREE.UnsignedShortType = 1012;
THREE.IntType = 1013;
THREE.UnsignedIntType = 1014;
THREE.FloatType = 1015;
THREE.UnsignedShort4444Type = 1016;
THREE.UnsignedShort5551Type = 1017;
THREE.UnsignedShort565Type = 1018;
THREE.AlphaFormat = 1019;
THREE.RGBFormat = 1020;
THREE.RGBAFormat = 1021;
THREE.LuminanceFormat = 1022;
THREE.LuminanceAlphaFormat = 1023;
THREE.RGB_S3TC_DXT1_Format = 2001;
THREE.RGBA_S3TC_DXT1_Format = 2002;
THREE.RGBA_S3TC_DXT3_Format = 2003;
THREE.RGBA_S3TC_DXT5_Format = 2004;
THREE.RGB_PVRTC_4BPPV1_Format = 2100;
THREE.RGB_PVRTC_2BPPV1_Format = 2101;
THREE.RGBA_PVRTC_4BPPV1_Format = 2102;
THREE.RGBA_PVRTC_2BPPV1_Format = 2103;
THREE.Color = function(a) {
    return 3 === arguments.length ? this.setRGB(arguments[0], arguments[1], arguments[2]) : this.set(a)
};
THREE.Color.prototype = {
    constructor: THREE.Color,
    r: 1,
    g: 1,
    b: 1,
    set: function(a) {
        a instanceof THREE.Color ? this.copy(a) : "number" === typeof a ? this.setHex(a) : "string" === typeof a && this.setStyle(a);
        return this
    },
    setHex: function(a) {
        a = Math.floor(a);
        this.r = (a >> 16 & 255) / 255;
        this.g = (a >> 8 & 255) / 255;
        this.b = (a & 255) / 255;
        return this
    },
    setRGB: function(a, b, c) {
        this.r = a;
        this.g = b;
        this.b = c;
        return this
    },
    setHSL: function(a, b, c) {
        if (0 === b) this.r = this.g = this.b = c;
        else {
            var d = function(a, b, c) {
                0 > c && (c += 1);
                1 < c && (c -= 1);
                return c < 1 / 6 ? a + 6 * (b - a) * c : .5 > c ? b : c < 2 / 3 ? a + 6 * (b - a) * (2 / 3 - c) : a
            };
            b = .5 >= c ? c * (1 + b) : c + b - c * b;
            c = 2 * c - b;
            this.r = d(c, b, a + 1 / 3);
            this.g = d(c, b, a);
            this.b = d(c, b, a - 1 / 3)
        }
        return this
    },
    setStyle: function(a) {
        if (/^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test(a)) return a = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec(a), this.r = Math.min(255, parseInt(a[1], 10)) / 255, this.g = Math.min(255, parseInt(a[2], 10)) / 255, this.b = Math.min(255, parseInt(a[3], 10)) / 255, this;
        if (/^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test(a)) return a = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec(a), this.r = Math.min(100, parseInt(a[1], 10)) / 100, this.g = Math.min(100, parseInt(a[2], 10)) / 100, this.b = Math.min(100, parseInt(a[3], 10)) / 100, this;
        if (/^\#([0-9a-f]{6})$/i.test(a)) return a = /^\#([0-9a-f]{6})$/i.exec(a), this.setHex(parseInt(a[1], 16)), this;
        if (/^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.test(a)) return a = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(a), this.setHex(parseInt(a[1] + a[1] + a[2] + a[2] + a[3] + a[3], 16)), this;
        if (/^(\w+)$/i.test(a)) return this.setHex(THREE.ColorKeywords[a]), this
    },
    copy: function(a) {
        this.r = a.r;
        this.g = a.g;
        this.b = a.b;
        return this
    },
    copyGammaToLinear: function(a) {
        this.r = a.r * a.r;
        this.g = a.g * a.g;
        this.b = a.b * a.b;
        return this
    },
    copyLinearToGamma: function(a) {
        this.r = Math.sqrt(a.r);
        this.g = Math.sqrt(a.g);
        this.b = Math.sqrt(a.b);
        return this
    },
    convertGammaToLinear: function() {
        var a = this.r,
            b = this.g,
            c = this.b;
        this.r = a * a;
        this.g = b * b;
        this.b = c * c;
        return this
    },
    convertLinearToGamma: function() {
        this.r = Math.sqrt(this.r);
        this.g = Math.sqrt(this.g);
        this.b = Math.sqrt(this.b);
        return this
    },
    getHex: function() {
        return 255 * this.r << 16 ^ 255 * this.g << 8 ^ 255 * this.b << 0
    },
    getHexString: function() {
        return ("000000" + this.getHex().toString(16)).slice(-6)
    },
    getHSL: function(a) {
        a = a || {
            h: 0,
            s: 0,
            l: 0
        };
        var b = this.r,
            c = this.g,
            d = this.b,
            e = Math.max(b, c, d),
            f = Math.min(b, c, d),
            g, h = (f + e) / 2;
        if (f === e) f = g = 0;
        else {
            var k = e - f,
                f = .5 >= h ? k / (e + f) : k / (2 - e - f);
            switch (e) {
                case b:
                    g = (c - d) / k + (c < d ? 6 : 0);
                    break;
                case c:
                    g = (d - b) / k + 2;
                    break;
                case d:
                    g = (b - c) / k + 4
            }
            g /= 6
        }
        a.h = g;
        a.s = f;
        a.l = h;
        return a
    },
    getStyle: function() {
        return "rgb(" + (255 * this.r | 0) + "," + (255 * this.g | 0) + "," + (255 * this.b | 0) + ")"
    },
    offsetHSL: function(a, b, c) {
        var d = this.getHSL();
        d.h += a;
        d.s += b;
        d.l += c;
        this.setHSL(d.h, d.s, d.l);
        return this
    },
    add: function(a) {
        this.r += a.r;
        this.g += a.g;
        this.b += a.b;
        return this
    },
    addColors: function(a, b) {
        this.r = a.r + b.r;
        this.g = a.g + b.g;
        this.b = a.b + b.b;
        return this
    },
    addScalar: function(a) {
        this.r += a;
        this.g += a;
        this.b += a;
        return this
    },
    multiply: function(a) {
        this.r *= a.r;
        this.g *= a.g;
        this.b *= a.b;
        return this
    },
    multiplyScalar: function(a) {
        this.r *= a;
        this.g *= a;
        this.b *= a;
        return this
    },
    lerp: function(a, b) {
        this.r += (a.r - this.r) * b;
        this.g += (a.g - this.g) * b;
        this.b += (a.b - this.b) * b;
        return this
    },
    equals: function(a) {
        return a.r === this.r && a.g === this.g && a.b === this.b
    },
    fromArray: function(a) {
        this.r = a[0];
        this.g = a[1];
        this.b = a[2];
        return this
    },
    toArray: function() {
        return [this.r, this.g, this.b]
    },
    clone: function() {
        return (new THREE.Color).setRGB(this.r, this.g, this.b)
    }
};
THREE.ColorKeywords = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
};
THREE.Quaternion = function(a, b, c, d) {
    this._x = a || 0;
    this._y = b || 0;
    this._z = c || 0;
    this._w = void 0 !== d ? d : 1
};
THREE.Quaternion.prototype = {
    constructor: THREE.Quaternion,
    _x: 0,
    _y: 0,
    _z: 0,
    _w: 0,
    get x() {
        return this._x
    },
    set x(a) {
        this._x = a;
        this.onChangeCallback()
    },
    get y() {
        return this._y
    },
    set y(a) {
        this._y = a;
        this.onChangeCallback()
    },
    get z() {
        return this._z
    },
    set z(a) {
        this._z = a;
        this.onChangeCallback()
    },
    get w() {
        return this._w
    },
    set w(a) {
        this._w = a;
        this.onChangeCallback()
    },
    set: function(a, b, c, d) {
        this._x = a;
        this._y = b;
        this._z = c;
        this._w = d;
        this.onChangeCallback();
        return this
    },
    copy: function(a) {
        this._x = a.x;
        this._y = a.y;
        this._z = a.z;
        this._w = a.w;
        this.onChangeCallback();
        return this
    },
    setFromEuler: function(a, b) {
        if (!1 === a instanceof THREE.Euler) throw Error("THREE.Quaternion: .setFromEuler() now expects a Euler rotation rather than a Vector3 and order.");
        var c = Math.cos(a._x / 2),
            d = Math.cos(a._y / 2),
            e = Math.cos(a._z / 2),
            f = Math.sin(a._x / 2),
            g = Math.sin(a._y / 2),
            h = Math.sin(a._z / 2);
        "XYZ" === a.order ? (this._x = f * d * e + c * g * h, this._y = c * g * e - f * d * h, this._z = c * d * h + f * g * e, this._w = c * d * e - f * g * h) : "YXZ" === a.order ? (this._x = f * d * e + c * g * h, this._y = c * g * e - f * d * h, this._z = c * d * h - f * g * e, this._w = c * d * e + f * g * h) : "ZXY" === a.order ? (this._x = f * d * e - c * g * h, this._y = c * g * e + f * d * h, this._z = c * d * h + f * g * e, this._w = c * d * e - f * g * h) : "ZYX" === a.order ? (this._x = f * d * e - c * g * h, this._y = c * g * e + f * d * h, this._z = c * d * h - f * g * e, this._w = c * d * e + f * g * h) : "YZX" === a.order ? (this._x = f * d * e + c * g * h, this._y = c * g * e + f * d * h, this._z = c * d * h - f * g * e, this._w = c * d * e - f * g * h) : "XZY" === a.order && (this._x = f * d * e - c * g * h, this._y = c * g * e - f * d * h, this._z = c * d * h + f * g * e, this._w = c * d * e + f * g * h);
        if (!1 !== b) this.onChangeCallback();
        return this
    },
    setFromAxisAngle: function(a, b) {
        var c = b / 2,
            d = Math.sin(c);
        this._x = a.x * d;
        this._y = a.y * d;
        this._z = a.z * d;
        this._w = Math.cos(c);
        this.onChangeCallback();
        return this
    },
    setFromRotationMatrix: function(a) {
        var b = a.elements,
            c = b[0];
        a = b[4];
        var d = b[8],
            e = b[1],
            f = b[5],
            g = b[9],
            h = b[2],
            k = b[6],
            b = b[10],
            n = c + f + b;
        0 < n ? (c = .5 / Math.sqrt(n + 1), this._w = .25 / c, this._x = (k - g) * c, this._y = (d - h) * c, this._z = (e - a) * c) : c > f && c > b ? (c = 2 * Math.sqrt(1 + c - f - b), this._w = (k - g) / c, this._x = .25 * c, this._y = (a + e) / c, this._z = (d + h) / c) : f > b ? (c = 2 * Math.sqrt(1 + f - c - b), this._w = (d - h) / c, this._x = (a + e) / c, this._y = .25 * c, this._z = (g + k) / c) : (c = 2 * Math.sqrt(1 + b - c - f), this._w = (e - a) / c, this._x = (d + h) / c, this._y = (g + k) / c, this._z = .25 * c);
        this.onChangeCallback();
        return this
    },
    setFromUnitVectors: function() {
        var a, b;
        return function(c, d) {
            void 0 === a && (a = new THREE.Vector3);
            b = c.dot(d) + 1;
            1e-6 > b ? (b = 0, Math.abs(c.x) > Math.abs(c.z) ? a.set(-c.y, c.x, 0) : a.set(0, -c.z, c.y)) : a.crossVectors(c, d);
            this._x = a.x;
            this._y = a.y;
            this._z = a.z;
            this._w = b;
            this.normalize();
            return this
        }
    }(),
    inverse: function() {
        this.conjugate().normalize();
        return this
    },
    conjugate: function() {
        this._x *= -1;
        this._y *= -1;
        this._z *= -1;
        this.onChangeCallback();
        return this
    },
    dot: function(a) {
        return this._x * a._x + this._y * a._y + this._z * a._z + this._w * a._w
    },
    lengthSq: function() {
        return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w
    },
    length: function() {
        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w)
    },
    normalize: function() {
        var a = this.length();
        0 === a ? (this._z = this._y = this._x = 0, this._w = 1) : (a = 1 / a, this._x *= a, this._y *= a, this._z *= a, this._w *= a);
        this.onChangeCallback();
        return this
    },
    multiply: function(a, b) {
        return void 0 !== b ? (console.warn("THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead."), this.multiplyQuaternions(a, b)) : this.multiplyQuaternions(this, a)
    },
    multiplyQuaternions: function(a, b) {
        var c = a._x,
            d = a._y,
            e = a._z,
            f = a._w,
            g = b._x,
            h = b._y,
            k = b._z,
            n = b._w;
        this._x = c * n + f * g + d * k - e * h;
        this._y = d * n + f * h + e * g - c * k;
        this._z = e * n + f * k + c * h - d * g;
        this._w = f * n - c * g - d * h - e * k;
        this.onChangeCallback();
        return this
    },
    multiplyVector3: function(a) {
        console.warn("THREE.Quaternion: .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.");
        return a.applyQuaternion(this)
    },
    slerp: function(a, b) {
        if (0 === b) return this;
        if (1 === b) return this.copy(a);
        var c = this._x,
            d = this._y,
            e = this._z,
            f = this._w,
            g = f * a._w + c * a._x + d * a._y + e * a._z;
        0 > g ? (this._w = -a._w, this._x = -a._x, this._y = -a._y, this._z = -a._z, g = -g) : this.copy(a);
        if (1 <= g) return this._w = f, this._x = c, this._y = d, this._z = e, this;
        var h = Math.acos(g),
            k = Math.sqrt(1 - g * g);
        if (.001 > Math.abs(k)) return this._w = .5 * (f + this._w), this._x = .5 * (c + this._x), this._y = .5 * (d + this._y), this._z = .5 * (e + this._z), this;
        g = Math.sin((1 - b) * h) / k;
        h = Math.sin(b * h) / k;
        this._w = f * g + this._w * h;
        this._x = c * g + this._x * h;
        this._y = d * g + this._y * h;
        this._z = e * g + this._z * h;
        this.onChangeCallback();
        return this
    },
    equals: function(a) {
        return a._x === this._x && a._y === this._y && a._z === this._z && a._w === this._w
    },
    fromArray: function(a, b) {
        void 0 === b && (b = 0);
        this._x = a[b];
        this._y = a[b + 1];
        this._z = a[b + 2];
        this._w = a[b + 3];
        this.onChangeCallback();
        return this
    },
    toArray: function(a, b) {
        void 0 === a && (a = []);
        void 0 === b && (b = 0);
        a[b] = this._x;
        a[b + 1] = this._y;
        a[b + 2] = this._z;
        a[b + 3] = this._w;
        return a
    },
    onChange: function(a) {
        this.onChangeCallback = a;
        return this
    },
    onChangeCallback: function() {},
    clone: function() {
        return new THREE.Quaternion(this._x, this._y, this._z, this._w)
    }
};
THREE.Quaternion.slerp = function(a, b, c, d) {
    return c.copy(a).slerp(b, d)
};
THREE.Vector2 = function(a, b) {
    this.x = a || 0;
    this.y = b || 0
};
THREE.Vector2.prototype = {
    constructor: THREE.Vector2,
    set: function(a, b) {
        this.x = a;
        this.y = b;
        return this
    },
    setX: function(a) {
        this.x = a;
        return this
    },
    setY: function(a) {
        this.y = a;
        return this
    },
    setComponent: function(a, b) {
        switch (a) {
            case 0:
                this.x = b;
                break;
            case 1:
                this.y = b;
                break;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    getComponent: function(a) {
        switch (a) {
            case 0:
                return this.x;
            case 1:
                return this.y;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    copy: function(a) {
        this.x = a.x;
        this.y = a.y;
        return this
    },
    add: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead."), this.addVectors(a, b);
        this.x += a.x;
        this.y += a.y;
        return this
    },
    addVectors: function(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        return this
    },
    addScalar: function(a) {
        this.x += a;
        this.y += a;
        return this
    },
    sub: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."), this.subVectors(a, b);
        this.x -= a.x;
        this.y -= a.y;
        return this
    },
    subVectors: function(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        return this
    },
    multiply: function(a) {
        this.x *= a.x;
        this.y *= a.y;
        return this
    },
    multiplyScalar: function(a) {
        this.x *= a;
        this.y *= a;
        return this
    },
    divide: function(a) {
        this.x /= a.x;
        this.y /= a.y;
        return this
    },
    divideScalar: function(a) {
        0 !== a ? (a = 1 / a, this.x *= a, this.y *= a) : this.y = this.x = 0;
        return this
    },
    min: function(a) {
        this.x > a.x && (this.x = a.x);
        this.y > a.y && (this.y = a.y);
        return this
    },
    max: function(a) {
        this.x < a.x && (this.x = a.x);
        this.y < a.y && (this.y = a.y);
        return this
    },
    clamp: function(a, b) {
        this.x < a.x ? this.x = a.x : this.x > b.x && (this.x = b.x);
        this.y < a.y ? this.y = a.y : this.y > b.y && (this.y = b.y);
        return this
    },
    clampScalar: function() {
        var a, b;
        return function(c, d) {
            void 0 === a && (a = new THREE.Vector2, b = new THREE.Vector2);
            a.set(c, c);
            b.set(d, d);
            return this.clamp(a, b)
        }
    }(),
    floor: function() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this
    },
    ceil: function() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this
    },
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this
    },
    roundToZero: function() {
        this.x = 0 > this.x ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = 0 > this.y ? Math.ceil(this.y) : Math.floor(this.y);
        return this
    },
    negate: function() {
        this.x = -this.x;
        this.y = -this.y;
        return this
    },
    dot: function(a) {
        return this.x * a.x + this.y * a.y
    },
    lengthSq: function() {
        return this.x * this.x + this.y * this.y
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    },
    normalize: function() {
        return this.divideScalar(this.length())
    },
    distanceTo: function(a) {
        return Math.sqrt(this.distanceToSquared(a))
    },
    distanceToSquared: function(a) {
        var b = this.x - a.x;
        a = this.y - a.y;
        return b * b + a * a
    },
    setLength: function(a) {
        var b = this.length();
        0 !== b && a !== b && this.multiplyScalar(a / b);
        return this
    },
    lerp: function(a, b) {
        this.x += (a.x - this.x) * b;
        this.y += (a.y - this.y) * b;
        return this
    },
    equals: function(a) {
        return a.x === this.x && a.y === this.y
    },
    fromArray: function(a, b) {
        void 0 === b && (b = 0);
        this.x = a[b];
        this.y = a[b + 1];
        return this
    },
    toArray: function(a, b) {
        void 0 === a && (a = []);
        void 0 === b && (b = 0);
        a[b] = this.x;
        a[b + 1] = this.y;
        return a
    },
    clone: function() {
        return new THREE.Vector2(this.x, this.y)
    }
};
THREE.Vector3 = function(a, b, c) {
    this.x = a || 0;
    this.y = b || 0;
    this.z = c || 0
};
THREE.Vector3.prototype = {
    constructor: THREE.Vector3,
    set: function(a, b, c) {
        this.x = a;
        this.y = b;
        this.z = c;
        return this
    },
    setX: function(a) {
        this.x = a;
        return this
    },
    setY: function(a) {
        this.y = a;
        return this
    },
    setZ: function(a) {
        this.z = a;
        return this
    },
    setComponent: function(a, b) {
        switch (a) {
            case 0:
                this.x = b;
                break;
            case 1:
                this.y = b;
                break;
            case 2:
                this.z = b;
                break;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    getComponent: function(a) {
        switch (a) {
            case 0:
                return this.x;
            case 1:
                return this.y;
            case 2:
                return this.z;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    copy: function(a) {
        this.x = a.x;
        this.y = a.y;
        this.z = a.z;
        return this
    },
    add: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead."), this.addVectors(a, b);
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        return this
    },
    addScalar: function(a) {
        this.x += a;
        this.y += a;
        this.z += a;
        return this
    },
    addVectors: function(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        return this
    },
    sub: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."), this.subVectors(a, b);
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        return this
    },
    subVectors: function(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        return this
    },
    multiply: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead."), this.multiplyVectors(a, b);
        this.x *= a.x;
        this.y *= a.y;
        this.z *= a.z;
        return this
    },
    multiplyScalar: function(a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        return this
    },
    multiplyVectors: function(a, b) {
        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;
        return this
    },
    applyEuler: function() {
        var a;
        return function(b) {
            !1 === b instanceof THREE.Euler && console.error("THREE.Vector3: .applyEuler() now expects a Euler rotation rather than a Vector3 and order.");
            void 0 === a && (a = new THREE.Quaternion);
            this.applyQuaternion(a.setFromEuler(b));
            return this
        }
    }(),
    applyAxisAngle: function() {
        var a;
        return function(b, c) {
            void 0 === a && (a = new THREE.Quaternion);
            this.applyQuaternion(a.setFromAxisAngle(b, c));
            return this
        }
    }(),
    applyMatrix3: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z;
        a = a.elements;
        this.x = a[0] * b + a[3] * c + a[6] * d;
        this.y = a[1] * b + a[4] * c + a[7] * d;
        this.z = a[2] * b + a[5] * c + a[8] * d;
        return this
    },
    applyMatrix4: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z;
        a = a.elements;
        this.x = a[0] * b + a[4] * c + a[8] * d + a[12];
        this.y = a[1] * b + a[5] * c + a[9] * d + a[13];
        this.z = a[2] * b + a[6] * c + a[10] * d + a[14];
        return this
    },
    applyProjection: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z;
        a = a.elements;
        var e = 1 / (a[3] * b + a[7] * c + a[11] * d + a[15]);
        this.x = (a[0] * b + a[4] * c + a[8] * d + a[12]) * e;
        this.y = (a[1] * b + a[5] * c + a[9] * d + a[13]) * e;
        this.z = (a[2] * b + a[6] * c + a[10] * d + a[14]) * e;
        return this
    },
    applyQuaternion: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z,
            e = a.x,
            f = a.y,
            g = a.z;
        a = a.w;
        var h = a * b + f * d - g * c,
            k = a * c + g * b - e * d,
            n = a * d + e * c - f * b,
            b = -e * b - f * c - g * d;
        this.x = h * a + b * -e + k * -g - n * -f;
        this.y = k * a + b * -f + n * -e - h * -g;
        this.z = n * a + b * -g + h * -f - k * -e;
        return this
    },
    project: function() {
        var a;
        return function(b) {
            void 0 === a && (a = new THREE.Matrix4);
            a.multiplyMatrices(b.projectionMatrix, a.getInverse(b.matrixWorld));
            return this.applyProjection(a)
        }
    }(),
    unproject: function() {
        var a;
        return function(b) {
            void 0 === a && (a = new THREE.Matrix4);
            a.multiplyMatrices(b.matrixWorld, a.getInverse(b.projectionMatrix));
            return this.applyProjection(a)
        }
    }(),
    transformDirection: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z;
        a = a.elements;
        this.x = a[0] * b + a[4] * c + a[8] * d;
        this.y = a[1] * b + a[5] * c + a[9] * d;
        this.z = a[2] * b + a[6] * c + a[10] * d;
        this.normalize();
        return this
    },
    divide: function(a) {
        this.x /= a.x;
        this.y /= a.y;
        this.z /= a.z;
        return this
    },
    divideScalar: function(a) {
        0 !== a ? (a = 1 / a, this.x *= a, this.y *= a, this.z *= a) : this.z = this.y = this.x = 0;
        return this
    },
    min: function(a) {
        this.x > a.x && (this.x = a.x);
        this.y > a.y && (this.y = a.y);
        this.z > a.z && (this.z = a.z);
        return this
    },
    max: function(a) {
        this.x < a.x && (this.x = a.x);
        this.y < a.y && (this.y = a.y);
        this.z < a.z && (this.z = a.z);
        return this
    },
    clamp: function(a, b) {
        this.x < a.x ? this.x = a.x : this.x > b.x && (this.x = b.x);
        this.y < a.y ? this.y = a.y : this.y > b.y && (this.y = b.y);
        this.z < a.z ? this.z = a.z : this.z > b.z && (this.z = b.z);
        return this
    },
    clampScalar: function() {
        var a, b;
        return function(c, d) {
            void 0 === a && (a = new THREE.Vector3, b = new THREE.Vector3);
            a.set(c, c, c);
            b.set(d, d, d);
            return this.clamp(a, b)
        }
    }(),
    floor: function() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        return this
    },
    ceil: function() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        return this
    },
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        return this
    },
    roundToZero: function() {
        this.x = 0 > this.x ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = 0 > this.y ? Math.ceil(this.y) : Math.floor(this.y);
        this.z = 0 > this.z ? Math.ceil(this.z) : Math.floor(this.z);
        return this
    },
    negate: function() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this
    },
    dot: function(a) {
        return this.x * a.x + this.y * a.y + this.z * a.z
    },
    lengthSq: function() {
        return this.x * this.x + this.y * this.y + this.z * this.z
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    },
    lengthManhattan: function() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z)
    },
    normalize: function() {
        return this.divideScalar(this.length())
    },
    setLength: function(a) {
        var b = this.length();
        0 !== b && a !== b && this.multiplyScalar(a / b);
        return this
    },
    lerp: function(a, b) {
        this.x += (a.x - this.x) * b;
        this.y += (a.y - this.y) * b;
        this.z += (a.z - this.z) * b;
        return this
    },
    cross: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead."), this.crossVectors(a, b);
        var c = this.x,
            d = this.y,
            e = this.z;
        this.x = d * a.z - e * a.y;
        this.y = e * a.x - c * a.z;
        this.z = c * a.y - d * a.x;
        return this
    },
    crossVectors: function(a, b) {
        var c = a.x,
            d = a.y,
            e = a.z,
            f = b.x,
            g = b.y,
            h = b.z;
        this.x = d * h - e * g;
        this.y = e * f - c * h;
        this.z = c * g - d * f;
        return this
    },
    projectOnVector: function() {
        var a, b;
        return function(c) {
            void 0 === a && (a = new THREE.Vector3);
            a.copy(c).normalize();
            b = this.dot(a);
            return this.copy(a).multiplyScalar(b)
        }
    }(),
    projectOnPlane: function() {
        var a;
        return function(b) {
            void 0 === a && (a = new THREE.Vector3);
            a.copy(this).projectOnVector(b);
            return this.sub(a)
        }
    }(),
    reflect: function() {
        var a;
        return function(b) {
            void 0 === a && (a = new THREE.Vector3);
            return this.sub(a.copy(b).multiplyScalar(2 * this.dot(b)))
        }
    }(),
    angleTo: function(a) {
        a = this.dot(a) / (this.length() * a.length());
        return Math.acos(THREE.Math.clamp(a, -1, 1))
    },
    distanceTo: function(a) {
        return Math.sqrt(this.distanceToSquared(a))
    },
    distanceToSquared: function(a) {
        var b = this.x - a.x,
            c = this.y - a.y;
        a = this.z - a.z;
        return b * b + c * c + a * a
    },
    setEulerFromRotationMatrix: function(a, b) {
        console.error("THREE.Vector3: .setEulerFromRotationMatrix() has been removed. Use Euler.setFromRotationMatrix() instead.")
    },
    setEulerFromQuaternion: function(a, b) {
        console.error("THREE.Vector3: .setEulerFromQuaternion() has been removed. Use Euler.setFromQuaternion() instead.")
    },
    getPositionFromMatrix: function(a) {
        console.warn("THREE.Vector3: .getPositionFromMatrix() has been renamed to .setFromMatrixPosition().");
        return this.setFromMatrixPosition(a)
    },
    getScaleFromMatrix: function(a) {
        console.warn("THREE.Vector3: .getScaleFromMatrix() has been renamed to .setFromMatrixScale().");
        return this.setFromMatrixScale(a)
    },
    getColumnFromMatrix: function(a, b) {
        console.warn("THREE.Vector3: .getColumnFromMatrix() has been renamed to .setFromMatrixColumn().");
        return this.setFromMatrixColumn(a, b)
    },
    setFromMatrixPosition: function(a) {
        this.x = a.elements[12];
        this.y = a.elements[13];
        this.z = a.elements[14];
        return this
    },
    setFromMatrixScale: function(a) {
        var b = this.set(a.elements[0], a.elements[1], a.elements[2]).length(),
            c = this.set(a.elements[4], a.elements[5], a.elements[6]).length();
        a = this.set(a.elements[8], a.elements[9], a.elements[10]).length();
        this.x = b;
        this.y = c;
        this.z = a;
        return this
    },
    setFromMatrixColumn: function(a, b) {
        var c = 4 * a,
            d = b.elements;
        this.x = d[c];
        this.y = d[c + 1];
        this.z = d[c + 2];
        return this
    },
    equals: function(a) {
        return a.x === this.x && a.y === this.y && a.z === this.z
    },
    fromArray: function(a, b) {
        void 0 === b && (b = 0);
        this.x = a[b];
        this.y = a[b + 1];
        this.z = a[b + 2];
        return this
    },
    toArray: function(a, b) {
        void 0 === a && (a = []);
        void 0 === b && (b = 0);
        a[b] = this.x;
        a[b + 1] = this.y;
        a[b + 2] = this.z;
        return a
    },
    clone: function() {
        return new THREE.Vector3(this.x, this.y, this.z)
    }
};
THREE.Vector4 = function(a, b, c, d) {
    this.x = a || 0;
    this.y = b || 0;
    this.z = c || 0;
    this.w = void 0 !== d ? d : 1
};
THREE.Vector4.prototype = {
    constructor: THREE.Vector4,
    set: function(a, b, c, d) {
        this.x = a;
        this.y = b;
        this.z = c;
        this.w = d;
        return this
    },
    setX: function(a) {
        this.x = a;
        return this
    },
    setY: function(a) {
        this.y = a;
        return this
    },
    setZ: function(a) {
        this.z = a;
        return this
    },
    setW: function(a) {
        this.w = a;
        return this
    },
    setComponent: function(a, b) {
        switch (a) {
            case 0:
                this.x = b;
                break;
            case 1:
                this.y = b;
                break;
            case 2:
                this.z = b;
                break;
            case 3:
                this.w = b;
                break;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    getComponent: function(a) {
        switch (a) {
            case 0:
                return this.x;
            case 1:
                return this.y;
            case 2:
                return this.z;
            case 3:
                return this.w;
            default:
                throw Error("index is out of range: " + a)
        }
    },
    copy: function(a) {
        this.x = a.x;
        this.y = a.y;
        this.z = a.z;
        this.w = void 0 !== a.w ? a.w : 1;
        return this
    },
    add: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector4: .add() now only accepts one argument. Use .addVectors( a, b ) instead."), this.addVectors(a, b);
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
        this.w += a.w;
        return this
    },
    addScalar: function(a) {
        this.x += a;
        this.y += a;
        this.z += a;
        this.w += a;
        return this
    },
    addVectors: function(a, b) {
        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;
        this.w = a.w + b.w;
        return this
    },
    sub: function(a, b) {
        if (void 0 !== b) return console.warn("THREE.Vector4: .sub() now only accepts one argument. Use .subVectors( a, b ) instead."), this.subVectors(a, b);
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
        this.w -= a.w;
        return this
    },
    subVectors: function(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;
        this.w = a.w - b.w;
        return this
    },
    multiplyScalar: function(a) {
        this.x *= a;
        this.y *= a;
        this.z *= a;
        this.w *= a;
        return this
    },
    applyMatrix4: function(a) {
        var b = this.x,
            c = this.y,
            d = this.z,
            e = this.w;
        a = a.elements;
        this.x = a[0] * b + a[4] * c + a[8] * d + a[12] * e;
        this.y = a[1] * b + a[5] * c + a[9] * d + a[13] * e;
        this.z = a[2] * b + a[6] * c + a[10] * d + a[14] * e;
        this.w = a[3] * b + a[7] * c + a[11] * d + a[15] * e;
        return this
    },
    divideScalar: function(a) {
        0 !== a ? (a = 1 / a, this.x *= a, this.y *= a, this.z *= a, this.w *= a) : (this.z = this.y = this.x = 0, this.w = 1);
        return this
    },
    setAxisAngleFromQuaternion: function(a) {
        this.w = 2 * Math.acos(a.w);
        var b = Math.sqrt(1 - a.w * a.w);
        1e-4 > b ? (this.x = 1, this.z = this.y = 0) : (this.x = a.x / b, this.y = a.y / b, this.z = a.z / b);
        return this
    },
    setAxisAngleFromRotationMatrix: function(a) {
        var b, c, d;
        a = a.elements;
        var e = a[0];
        d = a[4];
        var f = a[8],
            g = a[1],
            h = a[5],
            k = a[9];
        c = a[2];
        b = a[6];
        var n = a[10];
        if (.01 > Math.abs(d - g) && .01 > Math.abs(f - c) && .01 > Math.abs(k - b)) {
            if (.1 > Math.abs(d + g) && .1 > Math.abs(f + c) && .1 > Math.abs(k + b) && .1 > Math.abs(e + h + n - 3)) return this.set(1, 0, 0, 0), this;
            a = Math.PI;
            e = (e + 1) / 2;
            h = (h + 1) / 2;
            n = (n + 1) / 2;
            d = (d + g) / 4;
            f = (f + c) / 4;
            k = (k + b) / 4;
            e > h && e > n ? .01 > e ? (b = 0, d = c = .707106781) : (b = Math.sqrt(e), c = d / b, d = f / b) : h > n ? .01 > h ? (b = .707106781, c = 0, d = .707106781) : (c = Math.sqrt(h), b = d / c, d = k / c) : .01 > n ? (c = b = .707106781, d = 0) : (d = Math.sqrt(n), b = f / d, c = k / d);
            this.set(b, c, d, a);
            return this
        }
        a = Math.sqrt((b - k) * (b - k) + (f - c) * (f - c) + (g - d) * (g - d));
        .001 > Math.abs(a) && (a = 1);
        this.x = (b - k) / a;
        this.y = (f - c) / a;
        this.z = (g - d) / a;
        this.w = Math.acos((e + h + n - 1) / 2);
        return this
    },
    min: function(a) {
        this.x > a.x && (this.x = a.x);
        this.y > a.y && (this.y = a.y);
        this.z > a.z && (this.z = a.z);
        this.w > a.w && (this.w = a.w);
        return this
    },
    max: function(a) {
        this.x < a.x && (this.x = a.x);
        this.y < a.y && (this.y = a.y);
        this.z < a.z && (this.z = a.z);
        this.w < a.w && (this.w = a.w);
        return this
    },
    clamp: function(a, b) {
        this.x < a.x ? this.x = a.x : this.x > b.x && (this.x = b.x);
        this.y < a.y ? this.y = a.y : this.y > b.y && (this.y = b.y);
        this.z < a.z ? this.z = a.z : this.z > b.z && (this.z = b.z);
        this.w < a.w ? this.w = a.w : this.w > b.w && (this.w = b.w);
        return this
    },
    clampScalar: function() {
        var a, b;
        return function(c, d) {
            void 0 === a && (a = new THREE.Vector4, b = new THREE.Vector4);
            a.set(c, c, c, c);
            b.set(d, d, d, d);
            return this.clamp(a, b)
        }
    }(),
    floor: function() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);
        this.w = Math.floor(this.w);
        return this
    },
    ceil: function() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);
        this.w = Math.ceil(this.w);
        return this
    },
    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);
        this.w = Math.round(this.w);
        return this
    },
    roundToZero: function() {
        this.x = 0 > this.x ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = 0 > this.y ? Math.ceil(this.y) : Math.floor(this.y);
        this.z = 0 > this.z ? Math.ceil(this.z) : Math.floor(this.z);
        this.w = 0 > this.w ? Math.ceil(this.w) : Math.floor(this.w);
        return this
    },
    negate: function() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        this.w = -this.w;
        return this
    },
    dot: function(a) {
        return this.x * a.x + this.y * a.y + this.z * a.z + this.w * a.w
    },
    lengthSq: function() {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
    },
    lengthManhattan: function() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w)
    },
    normalize: function() {
        return this.divideScalar(this.length())
    },
    setLength: function(a) {
        var b = this.length();
        0 !== b && a !== b && this.multiplyScalar(a / b);
        return this
    },
    lerp: function(a, b) {
        this.x += (a.x - this.x) * b;
        this.y += (a.y - this.y) * b;
        this.z += (a.z - this.z) * b;
        this.w += (a.w - this.w) * b;
        return this
    },
    equals: function(a) {
        return a.x === this.x && a.y === this.y && a.z === this.z && a.w === this.w
    },
    fromArray: function(a, b) {
        void 0 === b && (b = 0);
        this.x = a[b];
        this.y = a[b + 1];
        this.z = a[b + 2];
        this.w = a[b + 3];
        return this
    },
    toArray: function(a, b) {
        void 0 === a && (a = []);
        void 0 === b && (b = 0);
        a[b] = this.x;
        a[b + 1] = this.y;
        a[b + 2] = this.z;
        a[b + 3] = this.w;
        return a
    },
    clone: function() {
        return new THREE.Vector4(this.x, this.y, this.z, this.w)
    }
};
THREE.Euler = function(a, b, c, d) {
    this._x = a || 0;
    this._y = b || 0;
    this._z = c || 0;
    this._order = d || THREE.Euler.DefaultOrder
};
THREE.Euler.RotationOrders = "XYZ YZX ZXY XZY YXZ ZYX".split(" ");
THREE.Euler.DefaultOrder = "XYZ";
THREE.Euler.prototype = {
    constructor: THREE.Euler,
    _x: 0,
    _y: 0,
    _z: 0,
    _order: THREE.Euler.DefaultOrder,
    get x() {
        return this._x
    },
    set x(a) {
        this._x = a;
        this.onChangeCallback()
    },
    get y() {
        return this._y
    },
    set y(a) {
        this._y = a;
        this.onChangeCallback()
    },
    get z() {
        return this._z
    },
    set z(a) {
        this._z = a;
        this.onChangeCallback()
    },
    get order() {
        return this._order
    },
    set order(a) {
        this._order = a;
        this.onChangeCallback()
    },
    set: function(a, b, c, d) {
        this._x = a;
        this._y = b;
        this._z = c;
        this._order = d || this._order;
        this.onChangeCallback();
        return this
    },
    copy: function(a) {
        this._x = a._x;
        this._y = a._y;
        this._z = a._z;
        this._order = a._order;
        this.onChangeCallback();
        return this
    },
    setFromRotationMatrix: function(a, b) {
        var c = THREE.Math.clamp,
            d = a.elements,
            e = d[0],
            f = d[4],
            g = d[8],
            h = d[1],
            k = d[5],
            n = d[9],
            p = d[2],
            q = d[6],
            d = d[10];
        b = b || this._order;
        "XYZ" === b ? (this._y = Math.asin(c(g, -1, 1)), .99999 > Math.abs(g) ? (this._x = Math.atan2(-n, d), this._z = Math.atan2(-f, e)) : (this._x = Math.atan2(q, k), this._z = 0)) : "YXZ" === b ? (this._x = Math.asin(-c(n, -1, 1)), .99999 > Math.abs(n) ? (this._y = Math.atan2(g, d), this._z = Math.atan2(h, k)) : (this._y = Math.atan2(-p, e), this._z = 0)) : "ZXY" === b ? (this._x = Math.asin(c(q, -1, 1)), .99999 > Math.abs(q) ? (this._y = Math.atan2(-p, d), this._z = Math.atan2(-f, k)) : (this._y = 0, this._z = Math.atan2(h, e))) : "ZYX" === b ? (this._y = Math.asin(-c(p, -1, 1)), .99999 > Math.abs(p) ? (this._x = Math.atan2(q, d), this._z = Math.atan2(h, e)) : (this._x = 0, this._z = Math.atan2(-f, k))) : "YZX" === b ? (this._z = Math.asin(c(h, -1, 1)), .99999 > Math.abs(h) ? (this._x = Math.atan2(-n, k), this._y = Math.atan2(-p, e)) : (this._x = 0, this._y = Math.atan2(g, d))) : "XZY" === b ? (this._z = Math.asin(-c(f, -1, 1)), .99999 > Math.abs(f) ? (this._x = Math.atan2(q, k), this._y = Math.atan2(g, e)) : (this._x = Math.atan2(-n, d), this._y = 0)) : console.warn("THREE.Euler: .setFromRotationMatrix() given unsupported order: " + b);
        this._order = b;
        this.onChangeCallback();
        return this
    },
    setFromQuaternion: function(a, b, c) {
        var d = THREE.Math.clamp,
            e = a.x * a.x,
            f = a.y * a.y,
            g = a.z * a.z,
            h = a.w * a.w;
        b = b || this._order;
        "XYZ" === b ? (this._x = Math.atan2(2 * (a.x * a.w - a.y * a.z), h - e - f + g), this._y = Math.asin(d(2 * (a.x * a.z + a.y * a.w), -1, 1)), this._z = Math.atan2(2 * (a.z * a.w - a.x * a.y), h + e - f - g)) : "YXZ" === b ? (this._x = Math.asin(d(2 * (a.x * a.w - a.y * a.z), -1, 1)), this._y = Math.atan2(2 * (a.x * a.z + a.y * a.w), h - e - f + g), this._z = Math.atan2(2 * (a.x * a.y + a.z * a.w), h - e + f - g)) : "ZXY" === b ? (this._x = Math.asin(d(2 * (a.x * a.w + a.y * a.z), -1, 1)), this._y = Math.atan2(2 * (a.y * a.w - a.z * a.x), h - e - f + g), this._z = Math.atan2(2 * (a.z * a.w - a.x * a.y), h - e + f - g)) : "ZYX" === b ? (this._x = Math.atan2(2 * (a.x * a.w + a.z * a.y), h - e - f + g), this._y = Math.asin(d(2 * (a.y * a.w - a.x * a.z), -1, 1)), this._z = Math.atan2(2 * (a.x * a.y + a.z * a.w), h + e - f - g)) : "YZX" === b ? (this._x = Math.atan2(2 * (a.x * a.w - a.z * a.y), h - e + f - g), this._y = Math.atan2(2 * (a.y * a.w - a.x * a.z), h + e - f - g), this._z = Math.asin(d(2 * (a.x * a.y + a.z * a.w), -1, 1))) : "XZY" === b ? (this._x = Math.atan2(2 * (a.x * a.w + a.y * a.z), h - e + f - g), this._y = Math.atan2(2 * (a.x * a.z + a.y * a.w), h + e - f - g), this._z = Math.asin(d(2 * (a.z * a.w - a.x * a.y), -1, 1))) : console.warn("THREE.Euler: .setFromQuaternion() given unsupported order: " + b);
        this._order = b;
        if (!1 !== c) this.onChangeCallback();
        return this
    },
    reorder: function() {
        var a = new THREE.Quaternion;
        return function(b) {
            a.setFromEuler(this);
            this.setFromQuaternion(a, b)
        }
    }(),
    equals: function(a) {
        return a._x === this._x && a._y === this._y && a._z === this._z && a._order === this._order
    },
    fromArray: function(a) {
        this._x = a[0];
        this._y = a[1];
        this._z = a[2];
        void 0 !== a[3] && (this._order = a[3]);
        this.onChangeCallback();
        return this
    },
    toArray: function() {
        return [this._x, this._y, this._z, this._order]
    },
    onChange: function(a) {
        this.onChangeCallback = a;
        return this
    },
    onChangeCallback: function() {},
    clone: function() {
        return new THREE.Euler(this._x, this._y, this._z, this._order)
    }
};
THREE.Line3 = function(a, b) {
    this.start = void 0 !== a ? a : new THREE.Vector3;
    this.end = void 0 !== b ? b : new THREE.Vector3
};
THREE.Line3.prototype = {
    constructor: THREE.Line3,
    set: function(a, b) {
        this.start.copy(a);
        this.end.copy(b);
        return this
    },
    copy: function(a) {
        this.start.copy(a.start);
        this.end.copy(a.end);
        return this
    },
    center: function(a) {
        return (a || new THREE.Vector3).addVectors(this.start, this.end).multiplyScalar(.5)
    },
    delta: function(a) {
        return (a || new THREE.Vector3).subVectors(this.end, this.start)
    },
    distanceSq: function() {
        return this.start.distanceToSquared(this.end)
    },
    distance: function() {
        return this.start.distanceTo(this.end)
    },
    at: function(a, b) {
        var c = b || new THREE.Vector3;
        return this.delta(c).multiplyScalar(a).add(this.start)
    },
    closestPointToPointParameter: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3;
        return function(c, d) {
            a.subVectors(c, this.start);
            b.subVectors(this.end, this.start);
            var e = b.dot(b),
                e = b.dot(a) / e;
            d && (e = THREE.Math.clamp(e, 0, 1));
            return e
        }
    }(),
    closestPointToPoint: function(a, b, c) {
        a = this.closestPointToPointParameter(a, b);
        c = c || new THREE.Vector3;
        return this.delta(c).multiplyScalar(a).add(this.start)
    },
    applyMatrix4: function(a) {
        this.start.applyMatrix4(a);
        this.end.applyMatrix4(a);
        return this
    },
    equals: function(a) {
        return a.start.equals(this.start) && a.end.equals(this.end)
    },
    clone: function() {
        return (new THREE.Line3).copy(this)
    }
};
THREE.Box2 = function(a, b) {
    this.min = void 0 !== a ? a : new THREE.Vector2(Infinity, Infinity);
    this.max = void 0 !== b ? b : new THREE.Vector2(-Infinity, -Infinity)
};
THREE.Box2.prototype = {
    constructor: THREE.Box2,
    set: function(a, b) {
        this.min.copy(a);
        this.max.copy(b);
        return this
    },
    setFromPoints: function(a) {
        this.makeEmpty();
        for (var b = 0, c = a.length; b < c; b++) this.expandByPoint(a[b]);
        return this
    },
    setFromCenterAndSize: function() {
        var a = new THREE.Vector2;
        return function(b, c) {
            var d = a.copy(c).multiplyScalar(.5);
            this.min.copy(b).sub(d);
            this.max.copy(b).add(d);
            return this
        }
    }(),
    copy: function(a) {
        this.min.copy(a.min);
        this.max.copy(a.max);
        return this
    },
    makeEmpty: function() {
        this.min.x = this.min.y = Infinity;
        this.max.x = this.max.y = -Infinity;
        return this
    },
    empty: function() {
        return this.max.x < this.min.x || this.max.y < this.min.y
    },
    center: function(a) {
        return (a || new THREE.Vector2).addVectors(this.min, this.max).multiplyScalar(.5)
    },
    size: function(a) {
        return (a || new THREE.Vector2).subVectors(this.max, this.min)
    },
    expandByPoint: function(a) {
        this.min.min(a);
        this.max.max(a);
        return this
    },
    expandByVector: function(a) {
        this.min.sub(a);
        this.max.add(a);
        return this
    },
    expandByScalar: function(a) {
        this.min.addScalar(-a);
        this.max.addScalar(a);
        return this
    },
    containsPoint: function(a) {
        return a.x < this.min.x || a.x > this.max.x || a.y < this.min.y || a.y > this.max.y ? !1 : !0
    },
    containsBox: function(a) {
        return this.min.x <= a.min.x && a.max.x <= this.max.x && this.min.y <= a.min.y && a.max.y <= this.max.y ? !0 : !1
    },
    getParameter: function(a, b) {
        return (b || new THREE.Vector2).set((a.x - this.min.x) / (this.max.x - this.min.x), (a.y - this.min.y) / (this.max.y - this.min.y))
    },
    isIntersectionBox: function(a) {
        return a.max.x < this.min.x || a.min.x > this.max.x || a.max.y < this.min.y || a.min.y > this.max.y ? !1 : !0
    },
    clampPoint: function(a, b) {
        return (b || new THREE.Vector2).copy(a).clamp(this.min, this.max)
    },
    distanceToPoint: function() {
        var a = new THREE.Vector2;
        return function(b) {
            return a.copy(b).clamp(this.min, this.max).sub(b).length()
        }
    }(),
    intersect: function(a) {
        this.min.max(a.min);
        this.max.min(a.max);
        return this
    },
    union: function(a) {
        this.min.min(a.min);
        this.max.max(a.max);
        return this
    },
    translate: function(a) {
        this.min.add(a);
        this.max.add(a);
        return this
    },
    equals: function(a) {
        return a.min.equals(this.min) && a.max.equals(this.max)
    },
    clone: function() {
        return (new THREE.Box2).copy(this)
    }
};
THREE.Box3 = function(a, b) {
    this.min = void 0 !== a ? a : new THREE.Vector3(Infinity, Infinity, Infinity);
    this.max = void 0 !== b ? b : new THREE.Vector3(-Infinity, -Infinity, -Infinity)
};
THREE.Box3.prototype = {
    constructor: THREE.Box3,
    set: function(a, b) {
        this.min.copy(a);
        this.max.copy(b);
        return this
    },
    setFromPoints: function(a) {
        this.makeEmpty();
        for (var b = 0, c = a.length; b < c; b++) this.expandByPoint(a[b]);
        return this
    },
    setFromCenterAndSize: function() {
        var a = new THREE.Vector3;
        return function(b, c) {
            var d = a.copy(c).multiplyScalar(.5);
            this.min.copy(b).sub(d);
            this.max.copy(b).add(d);
            return this
        }
    }(),
    setFromObject: function() {
        var a = new THREE.Vector3;
        return function(b) {
            var c = this;
            b.updateMatrixWorld(!0);
            this.makeEmpty();
            b.traverse(function(b) {
                var e = b.geometry;
                if (void 0 !== e)
                    if (e instanceof THREE.Geometry)
                        for (var f = e.vertices, e = 0, g = f.length; e < g; e++) a.copy(f[e]), a.applyMatrix4(b.matrixWorld), c.expandByPoint(a);
                    else if (e instanceof THREE.BufferGeometry && void 0 !== e.attributes.position)
                    for (f = e.attributes.position.array, e = 0, g = f.length; e < g; e += 3) a.set(f[e], f[e + 1], f[e + 2]), a.applyMatrix4(b.matrixWorld), c.expandByPoint(a)
            });
            return this
        }
    }(),
    copy: function(a) {
        this.min.copy(a.min);
        this.max.copy(a.max);
        return this
    },
    makeEmpty: function() {
        this.min.x = this.min.y = this.min.z = Infinity;
        this.max.x = this.max.y = this.max.z = -Infinity;
        return this
    },
    empty: function() {
        return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z
    },
    center: function(a) {
        return (a || new THREE.Vector3).addVectors(this.min, this.max).multiplyScalar(.5)
    },
    size: function(a) {
        return (a || new THREE.Vector3).subVectors(this.max, this.min)
    },
    expandByPoint: function(a) {
        this.min.min(a);
        this.max.max(a);
        return this
    },
    expandByVector: function(a) {
        this.min.sub(a);
        this.max.add(a);
        return this
    },
    expandByScalar: function(a) {
        this.min.addScalar(-a);
        this.max.addScalar(a);
        return this
    },
    containsPoint: function(a) {
        return a.x < this.min.x || a.x > this.max.x || a.y < this.min.y || a.y > this.max.y || a.z < this.min.z || a.z > this.max.z ? !1 : !0
    },
    containsBox: function(a) {
        return this.min.x <= a.min.x && a.max.x <= this.max.x && this.min.y <= a.min.y && a.max.y <= this.max.y && this.min.z <= a.min.z && a.max.z <= this.max.z ? !0 : !1
    },
    getParameter: function(a, b) {
        return (b || new THREE.Vector3).set((a.x - this.min.x) / (this.max.x - this.min.x), (a.y - this.min.y) / (this.max.y - this.min.y), (a.z - this.min.z) / (this.max.z - this.min.z))
    },
    isIntersectionBox: function(a) {
        return a.max.x < this.min.x || a.min.x > this.max.x || a.max.y < this.min.y || a.min.y > this.max.y || a.max.z < this.min.z || a.min.z > this.max.z ? !1 : !0
    },
    clampPoint: function(a, b) {
        return (b || new THREE.Vector3).copy(a).clamp(this.min, this.max)
    },
    distanceToPoint: function() {
        var a = new THREE.Vector3;
        return function(b) {
            return a.copy(b).clamp(this.min, this.max).sub(b).length()
        }
    }(),
    getBoundingSphere: function() {
        var a = new THREE.Vector3;
        return function(b) {
            b = b || new THREE.Sphere;
            b.center = this.center();
            b.radius = .5 * this.size(a).length();
            return b
        }
    }(),
    intersect: function(a) {
        this.min.max(a.min);
        this.max.min(a.max);
        return this
    },
    union: function(a) {
        this.min.min(a.min);
        this.max.max(a.max);
        return this
    },
    applyMatrix4: function() {
        var a = [new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3];
        return function(b) {
            a[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(b);
            a[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(b);
            a[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(b);
            a[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(b);
            a[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(b);
            a[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(b);
            a[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(b);
            a[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(b);
            this.makeEmpty();
            this.setFromPoints(a);
            return this
        }
    }(),
    translate: function(a) {
        this.min.add(a);
        this.max.add(a);
        return this
    },
    equals: function(a) {
        return a.min.equals(this.min) && a.max.equals(this.max)
    },
    clone: function() {
        return (new THREE.Box3).copy(this)
    }
};
THREE.Matrix3 = function() {
    this.elements = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    0 < arguments.length && console.error("THREE.Matrix3: the constructor no longer reads arguments. use .set() instead.")
};
THREE.Matrix3.prototype = {
    constructor: THREE.Matrix3,
    set: function(a, b, c, d, e, f, g, h, k) {
        var n = this.elements;
        n[0] = a;
        n[3] = b;
        n[6] = c;
        n[1] = d;
        n[4] = e;
        n[7] = f;
        n[2] = g;
        n[5] = h;
        n[8] = k;
        return this
    },
    identity: function() {
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
        return this
    },
    copy: function(a) {
        a = a.elements;
        this.set(a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]);
        return this
    },
    multiplyVector3: function(a) {
        console.warn("THREE.Matrix3: .multiplyVector3() has been removed. Use vector.applyMatrix3( matrix ) instead.");
        return a.applyMatrix3(this)
    },
    multiplyVector3Array: function(a) {
        console.warn("THREE.Matrix3: .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.");
        return this.applyToVector3Array(a)
    },
    applyToVector3Array: function() {
        var a = new THREE.Vector3;
        return function(b, c, d) {
            void 0 === c && (c = 0);
            void 0 === d && (d = b.length);
            for (var e = 0; e < d; e += 3, c += 3) a.x = b[c], a.y = b[c + 1], a.z = b[c + 2], a.applyMatrix3(this), b[c] = a.x, b[c + 1] = a.y, b[c + 2] = a.z;
            return b
        }
    }(),
    multiplyScalar: function(a) {
        var b = this.elements;
        b[0] *= a;
        b[3] *= a;
        b[6] *= a;
        b[1] *= a;
        b[4] *= a;
        b[7] *= a;
        b[2] *= a;
        b[5] *= a;
        b[8] *= a;
        return this
    },
    determinant: function() {
        var a = this.elements,
            b = a[0],
            c = a[1],
            d = a[2],
            e = a[3],
            f = a[4],
            g = a[5],
            h = a[6],
            k = a[7],
            a = a[8];
        return b * f * a - b * g * k - c * e * a + c * g * h + d * e * k - d * f * h
    },
    getInverse: function(a, b) {
        var c = a.elements,
            d = this.elements;
        d[0] = c[10] * c[5] - c[6] * c[9];
        d[1] = -c[10] * c[1] + c[2] * c[9];
        d[2] = c[6] * c[1] - c[2] * c[5];
        d[3] = -c[10] * c[4] + c[6] * c[8];
        d[4] = c[10] * c[0] - c[2] * c[8];
        d[5] = -c[6] * c[0] + c[2] * c[4];
        d[6] = c[9] * c[4] - c[5] * c[8];
        d[7] = -c[9] * c[0] + c[1] * c[8];
        d[8] = c[5] * c[0] - c[1] * c[4];
        c = c[0] * d[0] + c[1] * d[3] + c[2] * d[6];
        if (0 === c) {
            if (b) throw Error("Matrix3.getInverse(): can't invert matrix, determinant is 0");
            console.warn("Matrix3.getInverse(): can't invert matrix, determinant is 0");
            this.identity();
            return this
        }
        this.multiplyScalar(1 / c);
        return this
    },
    transpose: function() {
        var a, b = this.elements;
        a = b[1];
        b[1] = b[3];
        b[3] = a;
        a = b[2];
        b[2] = b[6];
        b[6] = a;
        a = b[5];
        b[5] = b[7];
        b[7] = a;
        return this
    },
    flattenToArrayOffset: function(a, b) {
        var c = this.elements;
        a[b] = c[0];
        a[b + 1] = c[1];
        a[b + 2] = c[2];
        a[b + 3] = c[3];
        a[b + 4] = c[4];
        a[b + 5] = c[5];
        a[b + 6] = c[6];
        a[b + 7] = c[7];
        a[b + 8] = c[8];
        return a
    },
    getNormalMatrix: function(a) {
        this.getInverse(a).transpose();
        return this
    },
    transposeIntoArray: function(a) {
        var b = this.elements;
        a[0] = b[0];
        a[1] = b[3];
        a[2] = b[6];
        a[3] = b[1];
        a[4] = b[4];
        a[5] = b[7];
        a[6] = b[2];
        a[7] = b[5];
        a[8] = b[8];
        return this
    },
    fromArray: function(a) {
        this.elements.set(a);
        return this
    },
    toArray: function() {
        var a = this.elements;
        return [a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]]
    },
    clone: function() {
        return (new THREE.Matrix3).fromArray(this.elements)
    }
};
THREE.Matrix4 = function() {
    this.elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    0 < arguments.length && console.error("THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.")
};
THREE.Matrix4.prototype = {
    constructor: THREE.Matrix4,
    set: function(a, b, c, d, e, f, g, h, k, n, p, q, m, r, t, s) {
        var u = this.elements;
        u[0] = a;
        u[4] = b;
        u[8] = c;
        u[12] = d;
        u[1] = e;
        u[5] = f;
        u[9] = g;
        u[13] = h;
        u[2] = k;
        u[6] = n;
        u[10] = p;
        u[14] = q;
        u[3] = m;
        u[7] = r;
        u[11] = t;
        u[15] = s;
        return this
    },
    identity: function() {
        this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return this
    },
    copy: function(a) {
        this.elements.set(a.elements);
        return this
    },
    extractPosition: function(a) {
        console.warn("THREE.Matrix4: .extractPosition() has been renamed to .copyPosition().");
        return this.copyPosition(a)
    },
    copyPosition: function(a) {
        var b = this.elements;
        a = a.elements;
        b[12] = a[12];
        b[13] = a[13];
        b[14] = a[14];
        return this
    },
    extractRotation: function() {
        var a = new THREE.Vector3;
        return function(b) {
            var c = this.elements;
            b = b.elements;
            var d = 1 / a.set(b[0], b[1], b[2]).length(),
                e = 1 / a.set(b[4], b[5], b[6]).length(),
                f = 1 / a.set(b[8], b[9], b[10]).length();
            c[0] = b[0] * d;
            c[1] = b[1] * d;
            c[2] = b[2] * d;
            c[4] = b[4] * e;
            c[5] = b[5] * e;
            c[6] = b[6] * e;
            c[8] = b[8] * f;
            c[9] = b[9] * f;
            c[10] = b[10] * f;
            return this
        }
    }(),
    makeRotationFromEuler: function(a) {
        !1 === a instanceof THREE.Euler && console.error("THREE.Matrix: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.");
        var b = this.elements,
            c = a.x,
            d = a.y,
            e = a.z,
            f = Math.cos(c),
            c = Math.sin(c),
            g = Math.cos(d),
            d = Math.sin(d),
            h = Math.cos(e),
            e = Math.sin(e);
        if ("XYZ" === a.order) {
            a = f * h;
            var k = f * e,
                n = c * h,
                p = c * e;
            b[0] = g * h;
            b[4] = -g * e;
            b[8] = d;
            b[1] = k + n * d;
            b[5] = a - p * d;
            b[9] = -c * g;
            b[2] = p - a * d;
            b[6] = n + k * d;
            b[10] = f * g
        } else "YXZ" === a.order ? (a = g * h, k = g * e, n = d * h, p = d * e, b[0] = a + p * c, b[4] = n * c - k, b[8] = f * d, b[1] = f * e, b[5] = f * h, b[9] = -c, b[2] = k * c - n, b[6] = p + a * c, b[10] = f * g) : "ZXY" === a.order ? (a = g * h, k = g * e, n = d * h, p = d * e, b[0] = a - p * c, b[4] = -f * e, b[8] = n + k * c, b[1] = k + n * c, b[5] = f * h, b[9] = p - a * c, b[2] = -f * d, b[6] = c, b[10] = f * g) : "ZYX" === a.order ? (a = f * h, k = f * e, n = c * h, p = c * e, b[0] = g * h, b[4] = n * d - k, b[8] = a * d + p, b[1] = g * e, b[5] = p * d + a, b[9] = k * d - n, b[2] = -d, b[6] = c * g, b[10] = f * g) : "YZX" === a.order ? (a = f * g, k = f * d, n = c * g, p = c * d, b[0] = g * h, b[4] = p - a * e, b[8] = n * e + k, b[1] = e, b[5] = f * h, b[9] = -c * h, b[2] = -d * h, b[6] = k * e + n, b[10] = a - p * e) : "XZY" === a.order && (a = f * g, k = f * d, n = c * g, p = c * d, b[0] = g * h, b[4] = -e, b[8] = d * h, b[1] = a * e + p, b[5] = f * h, b[9] = k * e - n, b[2] = n * e - k, b[6] = c * h, b[10] = p * e + a);
        b[3] = 0;
        b[7] = 0;
        b[11] = 0;
        b[12] = 0;
        b[13] = 0;
        b[14] = 0;
        b[15] = 1;
        return this
    },
    setRotationFromQuaternion: function(a) {
        console.warn("THREE.Matrix4: .setRotationFromQuaternion() has been renamed to .makeRotationFromQuaternion().");
        return this.makeRotationFromQuaternion(a)
    },
    makeRotationFromQuaternion: function(a) {
        var b = this.elements,
            c = a.x,
            d = a.y,
            e = a.z,
            f = a.w,
            g = c + c,
            h = d + d,
            k = e + e;
        a = c * g;
        var n = c * h,
            c = c * k,
            p = d * h,
            d = d * k,
            e = e * k,
            g = f * g,
            h = f * h,
            f = f * k;
        b[0] = 1 - (p + e);
        b[4] = n - f;
        b[8] = c + h;
        b[1] = n + f;
        b[5] = 1 - (a + e);
        b[9] = d - g;
        b[2] = c - h;
        b[6] = d + g;
        b[10] = 1 - (a + p);
        b[3] = 0;
        b[7] = 0;
        b[11] = 0;
        b[12] = 0;
        b[13] = 0;
        b[14] = 0;
        b[15] = 1;
        return this
    },
    lookAt: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3,
            c = new THREE.Vector3;
        return function(d, e, f) {
            var g = this.elements;
            c.subVectors(d, e).normalize();
            0 === c.length() && (c.z = 1);
            a.crossVectors(f, c).normalize();
            0 === a.length() && (c.x += 1e-4, a.crossVectors(f, c).normalize());
            b.crossVectors(c, a);
            g[0] = a.x;
            g[4] = b.x;
            g[8] = c.x;
            g[1] = a.y;
            g[5] = b.y;
            g[9] = c.y;
            g[2] = a.z;
            g[6] = b.z;
            g[10] = c.z;
            return this
        }
    }(),
    multiply: function(a, b) {
        return void 0 !== b ? (console.warn("THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead."), this.multiplyMatrices(a, b)) : this.multiplyMatrices(this, a)
    },
    multiplyMatrices: function(a, b) {
        var c = a.elements,
            d = b.elements,
            e = this.elements,
            f = c[0],
            g = c[4],
            h = c[8],
            k = c[12],
            n = c[1],
            p = c[5],
            q = c[9],
            m = c[13],
            r = c[2],
            t = c[6],
            s = c[10],
            u = c[14],
            v = c[3],
            y = c[7],
            G = c[11],
            c = c[15],
            w = d[0],
            K = d[4],
            x = d[8],
            D = d[12],
            E = d[1],
            A = d[5],
            B = d[9],
            F = d[13],
            R = d[2],
            H = d[6],
            C = d[10],
            T = d[14],
            Q = d[3],
            O = d[7],
            S = d[11],
            d = d[15];
        e[0] = f * w + g * E + h * R + k * Q;
        e[4] = f * K + g * A + h * H + k * O;
        e[8] = f * x + g * B + h * C + k * S;
        e[12] = f * D + g * F + h * T + k * d;
        e[1] = n * w + p * E + q * R + m * Q;
        e[5] = n * K + p * A + q * H + m * O;
        e[9] = n * x + p * B + q * C + m * S;
        e[13] = n * D + p * F + q * T + m * d;
        e[2] = r * w + t * E + s * R + u * Q;
        e[6] = r * K + t * A + s * H + u * O;
        e[10] = r * x + t * B + s * C + u * S;
        e[14] = r * D + t * F + s * T + u * d;
        e[3] = v * w + y * E + G * R + c * Q;
        e[7] = v * K + y * A + G * H + c * O;
        e[11] = v * x + y * B + G * C + c * S;
        e[15] = v * D + y * F + G * T + c * d;
        return this
    },
    multiplyToArray: function(a, b, c) {
        var d = this.elements;
        this.multiplyMatrices(a, b);
        c[0] = d[0];
        c[1] = d[1];
        c[2] = d[2];
        c[3] = d[3];
        c[4] = d[4];
        c[5] = d[5];
        c[6] = d[6];
        c[7] = d[7];
        c[8] = d[8];
        c[9] = d[9];
        c[10] = d[10];
        c[11] = d[11];
        c[12] = d[12];
        c[13] = d[13];
        c[14] = d[14];
        c[15] = d[15];
        return this
    },
    multiplyScalar: function(a) {
        var b = this.elements;
        b[0] *= a;
        b[4] *= a;
        b[8] *= a;
        b[12] *= a;
        b[1] *= a;
        b[5] *= a;
        b[9] *= a;
        b[13] *= a;
        b[2] *= a;
        b[6] *= a;
        b[10] *= a;
        b[14] *= a;
        b[3] *= a;
        b[7] *= a;
        b[11] *= a;
        b[15] *= a;
        return this
    },
    multiplyVector3: function(a) {
        console.warn("THREE.Matrix4: .multiplyVector3() has been removed. Use vector.applyMatrix4( matrix ) or vector.applyProjection( matrix ) instead.");
        return a.applyProjection(this)
    },
    multiplyVector4: function(a) {
        console.warn("THREE.Matrix4: .multiplyVector4() has been removed. Use vector.applyMatrix4( matrix ) instead.");
        return a.applyMatrix4(this)
    },
    multiplyVector3Array: function(a) {
        console.warn("THREE.Matrix4: .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.");
        return this.applyToVector3Array(a)
    },
    applyToVector3Array: function() {
        var a = new THREE.Vector3;
        return function(b, c, d) {
            void 0 === c && (c = 0);
            void 0 === d && (d = b.length);
            for (var e = 0; e < d; e += 3, c += 3) a.x = b[c], a.y = b[c + 1], a.z = b[c + 2], a.applyMatrix4(this), b[c] = a.x, b[c + 1] = a.y, b[c + 2] = a.z;
            return b
        }
    }(),
    rotateAxis: function(a) {
        console.warn("THREE.Matrix4: .rotateAxis() has been removed. Use Vector3.transformDirection( matrix ) instead.");
        a.transformDirection(this)
    },
    crossVector: function(a) {
        console.warn("THREE.Matrix4: .crossVector() has been removed. Use vector.applyMatrix4( matrix ) instead.");
        return a.applyMatrix4(this)
    },
    determinant: function() {
        var a = this.elements,
            b = a[0],
            c = a[4],
            d = a[8],
            e = a[12],
            f = a[1],
            g = a[5],
            h = a[9],
            k = a[13],
            n = a[2],
            p = a[6],
            q = a[10],
            m = a[14];
        return a[3] * (+e * h * p - d * k * p - e * g * q + c * k * q + d * g * m - c * h * m) + a[7] * (+b * h * m - b * k * q + e * f * q - d * f * m + d * k * n - e * h * n) + a[11] * (+b * k * p - b * g * m - e * f * p + c * f * m + e * g * n - c * k * n) + a[15] * (-d * g * n - b * h * p + b * g * q + d * f * p - c * f * q + c * h * n)
    },
    transpose: function() {
        var a = this.elements,
            b;
        b = a[1];
        a[1] = a[4];
        a[4] = b;
        b = a[2];
        a[2] = a[8];
        a[8] = b;
        b = a[6];
        a[6] = a[9];
        a[9] = b;
        b = a[3];
        a[3] = a[12];
        a[12] = b;
        b = a[7];
        a[7] = a[13];
        a[13] = b;
        b = a[11];
        a[11] = a[14];
        a[14] = b;
        return this
    },
    flattenToArrayOffset: function(a, b) {
        var c = this.elements;
        a[b] = c[0];
        a[b + 1] = c[1];
        a[b + 2] = c[2];
        a[b + 3] = c[3];
        a[b + 4] = c[4];
        a[b + 5] = c[5];
        a[b + 6] = c[6];
        a[b + 7] = c[7];
        a[b + 8] = c[8];
        a[b + 9] = c[9];
        a[b + 10] = c[10];
        a[b + 11] = c[11];
        a[b + 12] = c[12];
        a[b + 13] = c[13];
        a[b + 14] = c[14];
        a[b + 15] = c[15];
        return a
    },
    getPosition: function() {
        var a = new THREE.Vector3;
        return function() {
            console.warn("THREE.Matrix4: .getPosition() has been removed. Use Vector3.setFromMatrixPosition( matrix ) instead.");
            var b = this.elements;
            return a.set(b[12], b[13], b[14])
        }
    }(),
    setPosition: function(a) {
        var b = this.elements;
        b[12] = a.x;
        b[13] = a.y;
        b[14] = a.z;
        return this
    },
    getInverse: function(a, b) {
        var c = this.elements,
            d = a.elements,
            e = d[0],
            f = d[4],
            g = d[8],
            h = d[12],
            k = d[1],
            n = d[5],
            p = d[9],
            q = d[13],
            m = d[2],
            r = d[6],
            t = d[10],
            s = d[14],
            u = d[3],
            v = d[7],
            y = d[11],
            d = d[15];
        c[0] = p * s * v - q * t * v + q * r * y - n * s * y - p * r * d + n * t * d;
        c[4] = h * t * v - g * s * v - h * r * y + f * s * y + g * r * d - f * t * d;
        c[8] = g * q * v - h * p * v + h * n * y - f * q * y - g * n * d + f * p * d;
        c[12] = h * p * r - g * q * r - h * n * t + f * q * t + g * n * s - f * p * s;
        c[1] = q * t * u - p * s * u - q * m * y + k * s * y + p * m * d - k * t * d;
        c[5] = g * s * u - h * t * u + h * m * y - e * s * y - g * m * d + e * t * d;
        c[9] = h * p * u - g * q * u - h * k * y + e * q * y + g * k * d - e * p * d;
        c[13] = g * q * m - h * p * m + h * k * t - e * q * t - g * k * s + e * p * s;
        c[2] = n * s * u - q * r * u + q * m * v - k * s * v - n * m * d + k * r * d;
        c[6] = h * r * u - f * s * u - h * m * v + e * s * v + f * m * d - e * r * d;
        c[10] = f * q * u - h * n * u + h * k * v - e * q * v - f * k * d + e * n * d;
        c[14] = h * n * m - f * q * m - h * k * r + e * q * r + f * k * s - e * n * s;
        c[3] = p * r * u - n * t * u - p * m * v + k * t * v + n * m * y - k * r * y;
        c[7] = f * t * u - g * r * u + g * m * v - e * t * v - f * m * y + e * r * y;
        c[11] = g * n * u - f * p * u - g * k * v + e * p * v + f * k * y - e * n * y;
        c[15] = f * p * m - g * n * m + g * k * r - e * p * r - f * k * t + e * n * t;
        c = e * c[0] + k * c[4] + m * c[8] + u * c[12];
        if (0 == c) {
            if (b) throw Error("Matrix4.getInverse(): can't invert matrix, determinant is 0");
            console.warn("Matrix4.getInverse(): can't invert matrix, determinant is 0");
            this.identity();
            return this
        }
        this.multiplyScalar(1 / c);
        return this
    },
    translate: function(a) {
        console.warn("THREE.Matrix4: .translate() has been removed.")
    },
    rotateX: function(a) {
        console.warn("THREE.Matrix4: .rotateX() has been removed.")
    },
    rotateY: function(a) {
        console.warn("THREE.Matrix4: .rotateY() has been removed.")
    },
    rotateZ: function(a) {
        console.warn("THREE.Matrix4: .rotateZ() has been removed.")
    },
    rotateByAxis: function(a, b) {
        console.warn("THREE.Matrix4: .rotateByAxis() has been removed.")
    },
    scale: function(a) {
        var b = this.elements,
            c = a.x,
            d = a.y;
        a = a.z;
        b[0] *= c;
        b[4] *= d;
        b[8] *= a;
        b[1] *= c;
        b[5] *= d;
        b[9] *= a;
        b[2] *= c;
        b[6] *= d;
        b[10] *= a;
        b[3] *= c;
        b[7] *= d;
        b[11] *= a;
        return this
    },
    getMaxScaleOnAxis: function() {
        var a = this.elements;
        return Math.sqrt(Math.max(a[0] * a[0] + a[1] * a[1] + a[2] * a[2], Math.max(a[4] * a[4] + a[5] * a[5] + a[6] * a[6], a[8] * a[8] + a[9] * a[9] + a[10] * a[10])))
    },
    makeTranslation: function(a, b, c) {
        this.set(1, 0, 0, a, 0, 1, 0, b, 0, 0, 1, c, 0, 0, 0, 1);
        return this
    },
    makeRotationX: function(a) {
        var b = Math.cos(a);
        a = Math.sin(a);
        this.set(1, 0, 0, 0, 0, b, -a, 0, 0, a, b, 0, 0, 0, 0, 1);
        return this
    },
    makeRotationY: function(a) {
        var b = Math.cos(a);
        a = Math.sin(a);
        this.set(b, 0, a, 0, 0, 1, 0, 0, -a, 0, b, 0, 0, 0, 0, 1);
        return this
    },
    makeRotationZ: function(a) {
        var b = Math.cos(a);
        a = Math.sin(a);
        this.set(b, -a, 0, 0, a, b, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        return this
    },
    makeRotationAxis: function(a, b) {
        var c = Math.cos(b),
            d = Math.sin(b),
            e = 1 - c,
            f = a.x,
            g = a.y,
            h = a.z,
            k = e * f,
            n = e * g;
        this.set(k * f + c, k * g - d * h, k * h + d * g, 0, k * g + d * h, n * g + c, n * h - d * f, 0, k * h - d * g, n * h + d * f, e * h * h + c, 0, 0, 0, 0, 1);
        return this
    },
    makeScale: function(a, b, c) {
        this.set(a, 0, 0, 0, 0, b, 0, 0, 0, 0, c, 0, 0, 0, 0, 1);
        return this
    },
    compose: function(a, b, c) {
        this.makeRotationFromQuaternion(b);
        this.scale(c);
        this.setPosition(a);
        return this
    },
    decompose: function() {
        var a = new THREE.Vector3,
            b = new THREE.Matrix4;
        return function(c, d, e) {
            var f = this.elements,
                g = a.set(f[0], f[1], f[2]).length(),
                h = a.set(f[4], f[5], f[6]).length(),
                k = a.set(f[8], f[9], f[10]).length();
            0 > this.determinant() && (g = -g);
            c.x = f[12];
            c.y = f[13];
            c.z = f[14];
            b.elements.set(this.elements);
            c = 1 / g;
            var f = 1 / h,
                n = 1 / k;
            b.elements[0] *= c;
            b.elements[1] *= c;
            b.elements[2] *= c;
            b.elements[4] *= f;
            b.elements[5] *= f;
            b.elements[6] *= f;
            b.elements[8] *= n;
            b.elements[9] *= n;
            b.elements[10] *= n;
            d.setFromRotationMatrix(b);
            e.x = g;
            e.y = h;
            e.z = k;
            return this
        }
    }(),
    makeFrustum: function(a, b, c, d, e, f) {
        var g = this.elements;
        g[0] = 2 * e / (b - a);
        g[4] = 0;
        g[8] = (b + a) / (b - a);
        g[12] = 0;
        g[1] = 0;
        g[5] = 2 * e / (d - c);
        g[9] = (d + c) / (d - c);
        g[13] = 0;
        g[2] = 0;
        g[6] = 0;
        g[10] = -(f + e) / (f - e);
        g[14] = -2 * f * e / (f - e);
        g[3] = 0;
        g[7] = 0;
        g[11] = -1;
        g[15] = 0;
        return this
    },
    makePerspective: function(a, b, c, d) {
        a = c * Math.tan(THREE.Math.degToRad(.5 * a));
        var e = -a;
        return this.makeFrustum(e * b, a * b, e, a, c, d)
    },
    makeOrthographic: function(a, b, c, d, e, f) {
        var g = this.elements,
            h = b - a,
            k = c - d,
            n = f - e;
        g[0] = 2 / h;
        g[4] = 0;
        g[8] = 0;
        g[12] = -((b + a) / h);
        g[1] = 0;
        g[5] = 2 / k;
        g[9] = 0;
        g[13] = -((c + d) / k);
        g[2] = 0;
        g[6] = 0;
        g[10] = -2 / n;
        g[14] = -((f + e) / n);
        g[3] = 0;
        g[7] = 0;
        g[11] = 0;
        g[15] = 1;
        return this
    },
    fromArray: function(a) {
        this.elements.set(a);
        return this
    },
    toArray: function() {
        var a = this.elements;
        return [a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]]
    },
    clone: function() {
        return (new THREE.Matrix4).fromArray(this.elements)
    }
};
THREE.Ray = function(a, b) {
    this.origin = void 0 !== a ? a : new THREE.Vector3;
    this.direction = void 0 !== b ? b : new THREE.Vector3
};
THREE.Ray.prototype = {
    constructor: THREE.Ray,
    set: function(a, b) {
        this.origin.copy(a);
        this.direction.copy(b);
        return this
    },
    copy: function(a) {
        this.origin.copy(a.origin);
        this.direction.copy(a.direction);
        return this
    },
    at: function(a, b) {
        return (b || new THREE.Vector3).copy(this.direction).multiplyScalar(a).add(this.origin)
    },
    recast: function() {
        var a = new THREE.Vector3;
        return function(b) {
            this.origin.copy(this.at(b, a));
            return this
        }
    }(),
    closestPointToPoint: function(a, b) {
        var c = b || new THREE.Vector3;
        c.subVectors(a, this.origin);
        var d = c.dot(this.direction);
        return 0 > d ? c.copy(this.origin) : c.copy(this.direction).multiplyScalar(d).add(this.origin)
    },
    distanceToPoint: function() {
        var a = new THREE.Vector3;
        return function(b) {
            var c = a.subVectors(b, this.origin).dot(this.direction);
            if (0 > c) return this.origin.distanceTo(b);
            a.copy(this.direction).multiplyScalar(c).add(this.origin);
            return a.distanceTo(b)
        }
    }(),
    distanceSqToSegment: function(a, b, c, d) {
        var e = a.clone().add(b).multiplyScalar(.5),
            f = b.clone().sub(a).normalize(),
            g = .5 * a.distanceTo(b),
            h = this.origin.clone().sub(e);
        a = -this.direction.dot(f);
        b = h.dot(this.direction);
        var k = -h.dot(f),
            n = h.lengthSq(),
            p = Math.abs(1 - a * a),
            q, m;
        0 <= p ? (h = a * k - b, q = a * b - k, m = g * p, 0 <= h ? q >= -m ? q <= m ? (g = 1 / p, h *= g, q *= g, a = h * (h + a * q + 2 * b) + q * (a * h + q + 2 * k) + n) : (q = g, h = Math.max(0, -(a * q + b)), a = -h * h + q * (q + 2 * k) + n) : (q = -g, h = Math.max(0, -(a * q + b)), a = -h * h + q * (q + 2 * k) + n) : q <= -m ? (h = Math.max(0, -(-a * g + b)), q = 0 < h ? -g : Math.min(Math.max(-g, -k), g), a = -h * h + q * (q + 2 * k) + n) : q <= m ? (h = 0, q = Math.min(Math.max(-g, -k), g), a = q * (q + 2 * k) + n) : (h = Math.max(0, -(a * g + b)), q = 0 < h ? g : Math.min(Math.max(-g, -k), g), a = -h * h + q * (q + 2 * k) + n)) : (q = 0 < a ? -g : g, h = Math.max(0, -(a * q + b)), a = -h * h + q * (q + 2 * k) + n);
        c && c.copy(this.direction.clone().multiplyScalar(h).add(this.origin));
        d && d.copy(f.clone().multiplyScalar(q).add(e));
        return a
    },
    isIntersectionSphere: function(a) {
        return this.distanceToPoint(a.center) <= a.radius
    },
    intersectSphere: function() {
        var a = new THREE.Vector3;
        return function(b, c) {
            a.subVectors(b.center, this.origin);
            var d = a.dot(this.direction),
                e = a.dot(a) - d * d,
                f = b.radius * b.radius;
            if (e > f) return null;
            f = Math.sqrt(f - e);
            e = d - f;
            d += f;
            return 0 > e && 0 > d ? null : 0 > e ? this.at(d, c) : this.at(e, c)
        }
    }(),
    isIntersectionPlane: function(a) {
        var b = a.distanceToPoint(this.origin);
        return 0 === b || 0 > a.normal.dot(this.direction) * b ? !0 : !1
    },
    distanceToPlane: function(a) {
        var b = a.normal.dot(this.direction);
        if (0 == b) return 0 == a.distanceToPoint(this.origin) ? 0 : null;
        a = -(this.origin.dot(a.normal) + a.constant) / b;
        return 0 <= a ? a : null
    },
    intersectPlane: function(a, b) {
        var c = this.distanceToPlane(a);
        return null === c ? null : this.at(c, b)
    },
    isIntersectionBox: function() {
        var a = new THREE.Vector3;
        return function(b) {
            return null !== this.intersectBox(b, a)
        }
    }(),
    intersectBox: function(a, b) {
        var c, d, e, f, g;
        d = 1 / this.direction.x;
        f = 1 / this.direction.y;
        g = 1 / this.direction.z;
        var h = this.origin;
        0 <= d ? (c = (a.min.x - h.x) * d, d *= a.max.x - h.x) : (c = (a.max.x - h.x) * d, d *= a.min.x - h.x);
        0 <= f ? (e = (a.min.y - h.y) * f, f *= a.max.y - h.y) : (e = (a.max.y - h.y) * f, f *= a.min.y - h.y);
        if (c > f || e > d) return null;
        if (e > c || c !== c) c = e;
        if (f < d || d !== d) d = f;
        0 <= g ? (e = (a.min.z - h.z) * g, g *= a.max.z - h.z) : (e = (a.max.z - h.z) * g, g *= a.min.z - h.z);
        if (c > g || e > d) return null;
        if (e > c || c !== c) c = e;
        if (g < d || d !== d) d = g;
        return 0 > d ? null : this.at(0 <= c ? c : d, b)
    },
    intersectTriangle: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3,
            c = new THREE.Vector3,
            d = new THREE.Vector3;
        return function(e, f, g, h, k) {
            b.subVectors(f, e);
            c.subVectors(g, e);
            d.crossVectors(b, c);
            f = this.direction.dot(d);
            if (0 < f) {
                if (h) return null;
                h = 1
            } else if (0 > f) h = -1, f = -f;
            else return null;
            a.subVectors(this.origin, e);
            e = h * this.direction.dot(c.crossVectors(a, c));
            if (0 > e) return null;
            g = h * this.direction.dot(b.cross(a));
            if (0 > g || e + g > f) return null;
            e = -h * a.dot(d);
            return 0 > e ? null : this.at(e / f, k)
        }
    }(),
    applyMatrix4: function(a) {
        this.direction.add(this.origin).applyMatrix4(a);
        this.origin.applyMatrix4(a);
        this.direction.sub(this.origin);
        this.direction.normalize();
        return this
    },
    equals: function(a) {
        return a.origin.equals(this.origin) && a.direction.equals(this.direction)
    },
    clone: function() {
        return (new THREE.Ray).copy(this)
    }
};
THREE.Sphere = function(a, b) {
    this.center = void 0 !== a ? a : new THREE.Vector3;
    this.radius = void 0 !== b ? b : 0
};
THREE.Sphere.prototype = {
    constructor: THREE.Sphere,
    set: function(a, b) {
        this.center.copy(a);
        this.radius = b;
        return this
    },
    setFromPoints: function() {
        var a = new THREE.Box3;
        return function(b, c) {
            var d = this.center;
            void 0 !== c ? d.copy(c) : a.setFromPoints(b).center(d);
            for (var e = 0, f = 0, g = b.length; f < g; f++) e = Math.max(e, d.distanceToSquared(b[f]));
            this.radius = Math.sqrt(e);
            return this
        }
    }(),
    copy: function(a) {
        this.center.copy(a.center);
        this.radius = a.radius;
        return this
    },
    empty: function() {
        return 0 >= this.radius
    },
    containsPoint: function(a) {
        return a.distanceToSquared(this.center) <= this.radius * this.radius
    },
    distanceToPoint: function(a) {
        return a.distanceTo(this.center) - this.radius
    },
    intersectsSphere: function(a) {
        var b = this.radius + a.radius;
        return a.center.distanceToSquared(this.center) <= b * b
    },
    clampPoint: function(a, b) {
        var c = this.center.distanceToSquared(a),
            d = b || new THREE.Vector3;
        d.copy(a);
        c > this.radius * this.radius && (d.sub(this.center).normalize(), d.multiplyScalar(this.radius).add(this.center));
        return d
    },
    getBoundingBox: function(a) {
        a = a || new THREE.Box3;
        a.set(this.center, this.center);
        a.expandByScalar(this.radius);
        return a
    },
    applyMatrix4: function(a) {
        this.center.applyMatrix4(a);
        this.radius *= a.getMaxScaleOnAxis();
        return this
    },
    translate: function(a) {
        this.center.add(a);
        return this
    },
    equals: function(a) {
        return a.center.equals(this.center) && a.radius === this.radius
    },
    clone: function() {
        return (new THREE.Sphere).copy(this)
    }
};
THREE.Frustum = function(a, b, c, d, e, f) {
    this.planes = [void 0 !== a ? a : new THREE.Plane, void 0 !== b ? b : new THREE.Plane, void 0 !== c ? c : new THREE.Plane, void 0 !== d ? d : new THREE.Plane, void 0 !== e ? e : new THREE.Plane, void 0 !== f ? f : new THREE.Plane]
};
THREE.Frustum.prototype = {
    constructor: THREE.Frustum,
    set: function(a, b, c, d, e, f) {
        var g = this.planes;
        g[0].copy(a);
        g[1].copy(b);
        g[2].copy(c);
        g[3].copy(d);
        g[4].copy(e);
        g[5].copy(f);
        return this
    },
    copy: function(a) {
        for (var b = this.planes, c = 0; 6 > c; c++) b[c].copy(a.planes[c]);
        return this
    },
    setFromMatrix: function(a) {
        var b = this.planes,
            c = a.elements;
        a = c[0];
        var d = c[1],
            e = c[2],
            f = c[3],
            g = c[4],
            h = c[5],
            k = c[6],
            n = c[7],
            p = c[8],
            q = c[9],
            m = c[10],
            r = c[11],
            t = c[12],
            s = c[13],
            u = c[14],
            c = c[15];
        b[0].setComponents(f - a, n - g, r - p, c - t).normalize();
        b[1].setComponents(f + a, n + g, r + p, c + t).normalize();
        b[2].setComponents(f + d, n + h, r + q, c + s).normalize();
        b[3].setComponents(f - d, n - h, r - q, c - s).normalize();
        b[4].setComponents(f - e, n - k, r - m, c - u).normalize();
        b[5].setComponents(f + e, n + k, r + m, c + u).normalize();
        return this
    },
    intersectsObject: function() {
        var a = new THREE.Sphere;
        return function(b) {
            var c = b.geometry;
            null === c.boundingSphere && c.computeBoundingSphere();
            a.copy(c.boundingSphere);
            a.applyMatrix4(b.matrixWorld);
            return this.intersectsSphere(a)
        }
    }(),
    intersectsSphere: function(a) {
        var b = this.planes,
            c = a.center;
        a = -a.radius;
        for (var d = 0; 6 > d; d++)
            if (b[d].distanceToPoint(c) < a) return !1;
        return !0
    },
    intersectsBox: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3;
        return function(c) {
            for (var d = this.planes, e = 0; 6 > e; e++) {
                var f = d[e];
                a.x = 0 < f.normal.x ? c.min.x : c.max.x;
                b.x = 0 < f.normal.x ? c.max.x : c.min.x;
                a.y = 0 < f.normal.y ? c.min.y : c.max.y;
                b.y = 0 < f.normal.y ? c.max.y : c.min.y;
                a.z = 0 < f.normal.z ? c.min.z : c.max.z;
                b.z = 0 < f.normal.z ? c.max.z : c.min.z;
                var g = f.distanceToPoint(a),
                    f = f.distanceToPoint(b);
                if (0 > g && 0 > f) return !1
            }
            return !0
        }
    }(),
    containsPoint: function(a) {
        for (var b = this.planes, c = 0; 6 > c; c++)
            if (0 > b[c].distanceToPoint(a)) return !1;
        return !0
    },
    clone: function() {
        return (new THREE.Frustum).copy(this)
    }
};
THREE.Plane = function(a, b) {
    this.normal = void 0 !== a ? a : new THREE.Vector3(1, 0, 0);
    this.constant = void 0 !== b ? b : 0
};
THREE.Plane.prototype = {
    constructor: THREE.Plane,
    set: function(a, b) {
        this.normal.copy(a);
        this.constant = b;
        return this
    },
    setComponents: function(a, b, c, d) {
        this.normal.set(a, b, c);
        this.constant = d;
        return this
    },
    setFromNormalAndCoplanarPoint: function(a, b) {
        this.normal.copy(a);
        this.constant = -b.dot(this.normal);
        return this
    },
    setFromCoplanarPoints: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3;
        return function(c, d, e) {
            d = a.subVectors(e, d).cross(b.subVectors(c, d)).normalize();
            this.setFromNormalAndCoplanarPoint(d, c);
            return this
        }
    }(),
    copy: function(a) {
        this.normal.copy(a.normal);
        this.constant = a.constant;
        return this
    },
    normalize: function() {
        var a = 1 / this.normal.length();
        this.normal.multiplyScalar(a);
        this.constant *= a;
        return this
    },
    negate: function() {
        this.constant *= -1;
        this.normal.negate();
        return this
    },
    distanceToPoint: function(a) {
        return this.normal.dot(a) + this.constant
    },
    distanceToSphere: function(a) {
        return this.distanceToPoint(a.center) - a.radius
    },
    projectPoint: function(a, b) {
        return this.orthoPoint(a, b).sub(a).negate()
    },
    orthoPoint: function(a, b) {
        var c = this.distanceToPoint(a);
        return (b || new THREE.Vector3).copy(this.normal).multiplyScalar(c)
    },
    isIntersectionLine: function(a) {
        var b = this.distanceToPoint(a.start);
        a = this.distanceToPoint(a.end);
        return 0 > b && 0 < a || 0 > a && 0 < b
    },
    intersectLine: function() {
        var a = new THREE.Vector3;
        return function(b, c) {
            var d = c || new THREE.Vector3,
                e = b.delta(a),
                f = this.normal.dot(e);
            if (0 == f) {
                if (0 == this.distanceToPoint(b.start)) return d.copy(b.start)
            } else return f = -(b.start.dot(this.normal) + this.constant) / f, 0 > f || 1 < f ? void 0 : d.copy(e).multiplyScalar(f).add(b.start)
        }
    }(),
    coplanarPoint: function(a) {
        return (a || new THREE.Vector3).copy(this.normal).multiplyScalar(-this.constant)
    },
    applyMatrix4: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3,
            c = new THREE.Matrix3;
        return function(d, e) {
            var f = e || c.getNormalMatrix(d),
                f = a.copy(this.normal).applyMatrix3(f),
                g = this.coplanarPoint(b);
            g.applyMatrix4(d);
            this.setFromNormalAndCoplanarPoint(f, g);
            return this
        }
    }(),
    translate: function(a) {
        this.constant -= a.dot(this.normal);
        return this
    },
    equals: function(a) {
        return a.normal.equals(this.normal) && a.constant == this.constant
    },
    clone: function() {
        return (new THREE.Plane).copy(this)
    }
};
THREE.Math = {
    generateUUID: function() {
        var a = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
            b = Array(36),
            c = 0,
            d;
        return function() {
            for (var e = 0; 36 > e; e++) 8 == e || 13 == e || 18 == e || 23 == e ? b[e] = "-" : 14 == e ? b[e] = "4" : (2 >= c && (c = 33554432 + 16777216 * Math.random() | 0), d = c & 15, c >>= 4, b[e] = a[19 == e ? d & 3 | 8 : d]);
            return b.join("")
        }
    }(),
    clamp: function(a, b, c) {
        return a < b ? b : a > c ? c : a
    },
    clampBottom: function(a, b) {
        return a < b ? b : a
    },
    mapLinear: function(a, b, c, d, e) {
        return d + (a - b) * (e - d) / (c - b)
    },
    smoothstep: function(a, b, c) {
        if (a <= b) return 0;
        if (a >= c) return 1;
        a = (a - b) / (c - b);
        return a * a * (3 - 2 * a)
    },
    smootherstep: function(a, b, c) {
        if (a <= b) return 0;
        if (a >= c) return 1;
        a = (a - b) / (c - b);
        return a * a * a * (a * (6 * a - 15) + 10)
    },
    random16: function() {
        return (65280 * Math.random() + 255 * Math.random()) / 65535
    },
    randInt: function(a, b) {
        return a + Math.floor(Math.random() * (b - a + 1))
    },
    randFloat: function(a, b) {
        return a + Math.random() * (b - a)
    },
    randFloatSpread: function(a) {
        return a * (.5 - Math.random())
    },
    degToRad: function() {
        var a = Math.PI / 180;
        return function(b) {
            return b * a
        }
    }(),
    radToDeg: function() {
        var a = 180 / Math.PI;
        return function(b) {
            return b * a
        }
    }(),
    isPowerOfTwo: function(a) {
        return 0 === (a & a - 1) && 0 !== a
    }
};
THREE.Spline = function(a) {
    function b(a, b, c, d, e, f, g) {
        a = .5 * (c - a);
        d = .5 * (d - b);
        return (2 * (b - c) + a + d) * g + (-3 * (b - c) - 2 * a - d) * f + a * e + b
    }
    this.points = a;
    var c = [],
        d = {
            x: 0,
            y: 0,
            z: 0
        },
        e, f, g, h, k, n, p, q, m;
    this.initFromArray = function(a) {
        this.points = [];
        for (var b = 0; b < a.length; b++) this.points[b] = {
            x: a[b][0],
            y: a[b][1],
            z: a[b][2]
        }
    };
    this.getPoint = function(a) {
        e = (this.points.length - 1) * a;
        f = Math.floor(e);
        g = e - f;
        c[0] = 0 === f ? f : f - 1;
        c[1] = f;
        c[2] = f > this.points.length - 2 ? this.points.length - 1 : f + 1;
        c[3] = f > this.points.length - 3 ? this.points.length - 1 : f + 2;
        n = this.points[c[0]];
        p = this.points[c[1]];
        q = this.points[c[2]];
        m = this.points[c[3]];
        h = g * g;
        k = g * h;
        d.x = b(n.x, p.x, q.x, m.x, g, h, k);
        d.y = b(n.y, p.y, q.y, m.y, g, h, k);
        d.z = b(n.z, p.z, q.z, m.z, g, h, k);
        return d
    };
    this.getControlPointsArray = function() {
        var a, b, c = this.points.length,
            d = [];
        for (a = 0; a < c; a++) b = this.points[a], d[a] = [b.x, b.y, b.z];
        return d
    };
    this.getLength = function(a) {
        var b, c, d, e = b = b = 0,
            f = new THREE.Vector3,
            g = new THREE.Vector3,
            h = [],
            k = 0;
        h[0] = 0;
        a || (a = 100);
        c = this.points.length * a;
        f.copy(this.points[0]);
        for (a = 1; a < c; a++) b = a / c, d = this.getPoint(b), g.copy(d), k += g.distanceTo(f), f.copy(d), b *= this.points.length - 1, b = Math.floor(b), b != e && (h[b] = k, e = b);
        h[h.length] = k;
        return {
            chunks: h,
            total: k
        }
    };
    this.reparametrizeByArcLength = function(a) {
        var b, c, d, e, f, g, h = [],
            k = new THREE.Vector3,
            m = this.getLength();
        h.push(k.copy(this.points[0]).clone());
        for (b = 1; b < this.points.length; b++) {
            c = m.chunks[b] - m.chunks[b - 1];
            g = Math.ceil(a * c / m.total);
            e = (b - 1) / (this.points.length - 1);
            f = b / (this.points.length - 1);
            for (c = 1; c < g - 1; c++) d = e + 1 / g * c * (f - e), d = this.getPoint(d), h.push(k.copy(d).clone());
            h.push(k.copy(this.points[b]).clone())
        }
        this.points = h
    }
};
THREE.Triangle = function(a, b, c) {
    this.a = void 0 !== a ? a : new THREE.Vector3;
    this.b = void 0 !== b ? b : new THREE.Vector3;
    this.c = void 0 !== c ? c : new THREE.Vector3
};
THREE.Triangle.normal = function() {
    var a = new THREE.Vector3;
    return function(b, c, d, e) {
        e = e || new THREE.Vector3;
        e.subVectors(d, c);
        a.subVectors(b, c);
        e.cross(a);
        b = e.lengthSq();
        return 0 < b ? e.multiplyScalar(1 / Math.sqrt(b)) : e.set(0, 0, 0)
    }
}();
THREE.Triangle.barycoordFromPoint = function() {
    var a = new THREE.Vector3,
        b = new THREE.Vector3,
        c = new THREE.Vector3;
    return function(d, e, f, g, h) {
        a.subVectors(g, e);
        b.subVectors(f, e);
        c.subVectors(d, e);
        d = a.dot(a);
        e = a.dot(b);
        f = a.dot(c);
        var k = b.dot(b);
        g = b.dot(c);
        var n = d * k - e * e;
        h = h || new THREE.Vector3;
        if (0 == n) return h.set(-2, -1, -1);
        n = 1 / n;
        k = (k * f - e * g) * n;
        d = (d * g - e * f) * n;
        return h.set(1 - k - d, d, k)
    }
}();
THREE.Triangle.containsPoint = function() {
    var a = new THREE.Vector3;
    return function(b, c, d, e) {
        b = THREE.Triangle.barycoordFromPoint(b, c, d, e, a);
        return 0 <= b.x && 0 <= b.y && 1 >= b.x + b.y
    }
}();
THREE.Triangle.prototype = {
    constructor: THREE.Triangle,
    set: function(a, b, c) {
        this.a.copy(a);
        this.b.copy(b);
        this.c.copy(c);
        return this
    },
    setFromPointsAndIndices: function(a, b, c, d) {
        this.a.copy(a[b]);
        this.b.copy(a[c]);
        this.c.copy(a[d]);
        return this
    },
    copy: function(a) {
        this.a.copy(a.a);
        this.b.copy(a.b);
        this.c.copy(a.c);
        return this
    },
    area: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3;
        return function() {
            a.subVectors(this.c, this.b);
            b.subVectors(this.a, this.b);
            return .5 * a.cross(b).length()
        }
    }(),
    midpoint: function(a) {
        return (a || new THREE.Vector3).addVectors(this.a, this.b).add(this.c).multiplyScalar(1 / 3)
    },
    normal: function(a) {
        return THREE.Triangle.normal(this.a, this.b, this.c, a)
    },
    plane: function(a) {
        return (a || new THREE.Plane).setFromCoplanarPoints(this.a, this.b, this.c)
    },
    barycoordFromPoint: function(a, b) {
        return THREE.Triangle.barycoordFromPoint(a, this.a, this.b, this.c, b)
    },
    containsPoint: function(a) {
        return THREE.Triangle.containsPoint(a, this.a, this.b, this.c)
    },
    equals: function(a) {
        return a.a.equals(this.a) && a.b.equals(this.b) && a.c.equals(this.c)
    },
    clone: function() {
        return (new THREE.Triangle).copy(this)
    }
};
THREE.Clock = function(a) {
    this.autoStart = void 0 !== a ? a : !0;
    this.elapsedTime = this.oldTime = this.startTime = 0;
    this.running = !1
};
THREE.Clock.prototype = {
    constructor: THREE.Clock,
    start: function() {
        this.oldTime = this.startTime = void 0 !== self.performance && void 0 !== self.performance.now ? self.performance.now() : Date.now();
        this.running = !0
    },
    stop: function() {
        this.getElapsedTime();
        this.running = !1
    },
    getElapsedTime: function() {
        this.getDelta();
        return this.elapsedTime
    },
    getDelta: function() {
        var a = 0;
        this.autoStart && !this.running && this.start();
        if (this.running) {
            var b = void 0 !== self.performance && void 0 !== self.performance.now ? self.performance.now() : Date.now(),
                a = .001 * (b - this.oldTime);
            this.oldTime = b;
            this.elapsedTime += a
        }
        return a
    }
};
THREE.EventDispatcher = function() {};
THREE.EventDispatcher.prototype = {
    constructor: THREE.EventDispatcher,
    apply: function(a) {
        a.addEventListener = THREE.EventDispatcher.prototype.addEventListener;
        a.hasEventListener = THREE.EventDispatcher.prototype.hasEventListener;
        a.removeEventListener = THREE.EventDispatcher.prototype.removeEventListener;
        a.dispatchEvent = THREE.EventDispatcher.prototype.dispatchEvent
    },
    addEventListener: function(a, b) {
        void 0 === this._listeners && (this._listeners = {});
        var c = this._listeners;
        void 0 === c[a] && (c[a] = []); - 1 === c[a].indexOf(b) && c[a].push(b)
    },
    hasEventListener: function(a, b) {
        if (void 0 === this._listeners) return !1;
        var c = this._listeners;
        return void 0 !== c[a] && -1 !== c[a].indexOf(b) ? !0 : !1
    },
    removeEventListener: function(a, b) {
        if (void 0 !== this._listeners) {
            var c = this._listeners[a];
            if (void 0 !== c) {
                var d = c.indexOf(b); - 1 !== d && c.splice(d, 1)
            }
        }
    },
    dispatchEvent: function(a) {
        if (void 0 !== this._listeners) {
            var b = this._listeners[a.type];
            if (void 0 !== b) {
                a.target = this;
                for (var c = [], d = b.length, e = 0; e < d; e++) c[e] = b[e];
                for (e = 0; e < d; e++) c[e].call(this, a)
            }
        }
    }
};
(function(a) {
    a.Raycaster = function(b, c, f, g) {
        this.ray = new a.Ray(b, c);
        this.near = f || 0;
        this.far = g || Infinity;
        this.params = {
            Sprite: {},
            Mesh: {},
            PointCloud: {
                threshold: 1
            },
            LOD: {},
            Line: {}
        }
    };
    var b = function(a, b) {
            return a.distance - b.distance
        },
        c = function(a, b, f, g) {
            a.raycast(b, f);
            if (!0 === g) {
                a = a.children;
                g = 0;
                for (var h = a.length; g < h; g++) c(a[g], b, f, !0)
            }
        };
    a.Raycaster.prototype = {
        constructor: a.Raycaster,
        precision: 1e-4,
        linePrecision: 1,
        set: function(a, b) {
            this.ray.set(a, b)
        },
        intersectObject: function(a, e) {
            var f = [];
            c(a, this, f, e);
            f.sort(b);
            return f
        },
        intersectObjects: function(a, e) {
            var f = [];
            if (!1 === a instanceof Array) return console.log("THREE.Raycaster.intersectObjects: objects is not an Array."), f;
            for (var g = 0, h = a.length; g < h; g++) c(a[g], this, f, e);
            f.sort(b);
            return f
        }
    }
})(THREE);
THREE.Object3D = function() {
    Object.defineProperty(this, "id", {
        value: THREE.Object3DIdCount++
    });
    this.uuid = THREE.Math.generateUUID();
    this.name = "";
    this.type = "Object3D";
    this.parent = void 0;
    this.children = [];
    this.up = THREE.Object3D.DefaultUp.clone();
    var a = new THREE.Vector3,
        b = new THREE.Euler,
        c = new THREE.Quaternion,
        d = new THREE.Vector3(1, 1, 1);
    b.onChange(function() {
        c.setFromEuler(b, !1)
    });
    c.onChange(function() {
        b.setFromQuaternion(c, void 0, !1)
    });
    Object.defineProperties(this, {
        position: {
            enumerable: !0,
            value: a
        },
        rotation: {
            enumerable: !0,
            value: b
        },
        quaternion: {
            enumerable: !0,
            value: c
        },
        scale: {
            enumerable: !0,
            value: d
        }
    });
    this.renderDepth = null;
    this.rotationAutoUpdate = !0;
    this.matrix = new THREE.Matrix4;
    this.matrixWorld = new THREE.Matrix4;
    this.matrixAutoUpdate = !0;
    this.matrixWorldNeedsUpdate = !1;
    this.visible = !0;
    this.receiveShadow = this.castShadow = !1;
    this.frustumCulled = !0;
    this.userData = {}
};
THREE.Object3D.DefaultUp = new THREE.Vector3(0, 1, 0);
THREE.Object3D.prototype = {
    constructor: THREE.Object3D,
    get eulerOrder() {
        console.warn("THREE.Object3D: .eulerOrder has been moved to .rotation.order.");
        return this.rotation.order
    },
    set eulerOrder(a) {
        console.warn("THREE.Object3D: .eulerOrder has been moved to .rotation.order.");
        this.rotation.order = a
    },
    get useQuaternion() {
        console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")
    },
    set useQuaternion(a) {
        console.warn("THREE.Object3D: .useQuaternion has been removed. The library now uses quaternions by default.")
    },
    applyMatrix: function(a) {
        this.matrix.multiplyMatrices(a, this.matrix);
        this.matrix.decompose(this.position, this.quaternion, this.scale)
    },
    setRotationFromAxisAngle: function(a, b) {
        this.quaternion.setFromAxisAngle(a, b)
    },
    setRotationFromEuler: function(a) {
        this.quaternion.setFromEuler(a, !0)
    },
    setRotationFromMatrix: function(a) {
        this.quaternion.setFromRotationMatrix(a)
    },
    setRotationFromQuaternion: function(a) {
        this.quaternion.copy(a)
    },
    rotateOnAxis: function() {
        var a = new THREE.Quaternion;
        return function(b, c) {
            a.setFromAxisAngle(b, c);
            this.quaternion.multiply(a);
            return this
        }
    }(),
    rotateX: function() {
        var a = new THREE.Vector3(1, 0, 0);
        return function(b) {
            return this.rotateOnAxis(a, b)
        }
    }(),
    rotateY: function() {
        var a = new THREE.Vector3(0, 1, 0);
        return function(b) {
            return this.rotateOnAxis(a, b)
        }
    }(),
    rotateZ: function() {
        var a = new THREE.Vector3(0, 0, 1);
        return function(b) {
            return this.rotateOnAxis(a, b)
        }
    }(),
    translateOnAxis: function() {
        var a = new THREE.Vector3;
        return function(b, c) {
            a.copy(b).applyQuaternion(this.quaternion);
            this.position.add(a.multiplyScalar(c));
            return this
        }
    }(),
    translate: function(a, b) {
        console.warn("THREE.Object3D: .translate() has been removed. Use .translateOnAxis( axis, distance ) instead.");
        return this.translateOnAxis(b, a)
    },
    translateX: function() {
        var a = new THREE.Vector3(1, 0, 0);
        return function(b) {
            return this.translateOnAxis(a, b)
        }
    }(),
    translateY: function() {
        var a = new THREE.Vector3(0, 1, 0);
        return function(b) {
            return this.translateOnAxis(a, b)
        }
    }(),
    translateZ: function() {
        var a = new THREE.Vector3(0, 0, 1);
        return function(b) {
            return this.translateOnAxis(a, b)
        }
    }(),
    localToWorld: function(a) {
        return a.applyMatrix4(this.matrixWorld)
    },
    worldToLocal: function() {
        var a = new THREE.Matrix4;
        return function(b) {
            return b.applyMatrix4(a.getInverse(this.matrixWorld))
        }
    }(),
    lookAt: function() {
        var a = new THREE.Matrix4;
        return function(b) {
            a.lookAt(b, this.position, this.up);
            this.quaternion.setFromRotationMatrix(a)
        }
    }(),
    add: function(a) {
        if (1 < arguments.length) {
            for (var b = 0; b < arguments.length; b++) this.add(arguments[b]);
            return this
        }
        if (a === this) return console.error("THREE.Object3D.add:", a, "can't be added as a child of itself."), this;
        a instanceof THREE.Object3D ? (void 0 !== a.parent && a.parent.remove(a), a.parent = this, a.dispatchEvent({
            type: "added"
        }), this.children.push(a)) : console.error("THREE.Object3D.add:", a, "is not an instance of THREE.Object3D.");
        return this
    },
    remove: function(a) {
        if (1 < arguments.length)
            for (var b = 0; b < arguments.length; b++) this.remove(arguments[b]);
        b = this.children.indexOf(a); - 1 !== b && (a.parent = void 0, a.dispatchEvent({
            type: "removed"
        }), this.children.splice(b, 1))
    },
    getChildByName: function(a, b) {
        console.warn("THREE.Object3D: .getChildByName() has been renamed to .getObjectByName().");
        return this.getObjectByName(a, b)
    },
    getObjectById: function(a, b) {
        if (this.id === a) return this;
        for (var c = 0, d = this.children.length; c < d; c++) {
            var e = this.children[c].getObjectById(a, b);
            if (void 0 !== e) return e
        }
    },
    getObjectByName: function(a, b) {
        if (this.name === a) return this;
        for (var c = 0, d = this.children.length; c < d; c++) {
            var e = this.children[c].getObjectByName(a, b);
            if (void 0 !== e) return e
        }
    },
    getWorldPosition: function(a) {
        a = a || new THREE.Vector3;
        this.updateMatrixWorld(!0);
        return a.setFromMatrixPosition(this.matrixWorld)
    },
    getWorldQuaternion: function() {
        var a = new THREE.Vector3,
            b = new THREE.Vector3;
        return function(c) {
            c = c || new THREE.Quaternion;
            this.updateMatrixWorld(!0);
            this.matrixWorld.decompose(a, c, b);
            return c
        }
    }(),
    getWorldRotation: function() {
        var a = new THREE.Quaternion;
        return function(b) {
            b = b || new THREE.Euler;
            this.getWorldQuaternion(a);
            return b.setFromQuaternion(a, this.rotation.order, !1)
        }
    }(),
    getWorldScale: function() {
        var a = new THREE.Vector3,
            b = new THREE.Quaternion;
        return function(c) {
            c = c || new THREE.Vector3;
            this.updateMatrixWorld(!0);
            this.matrixWorld.decompose(a, b, c);
            return c
        }
    }(),
    getWorldDirection: function() {
        var a = new THREE.Quaternion;
        return function(b) {
            b = b || new THREE.Vector3;
            this.getWorldQuaternion(a);
            return b.set(0, 0, 1).applyQuaternion(a)
        }
    }(),
    raycast: function() {},
    traverse: function(a) {
        a(this);
        for (var b = 0, c = this.children.length; b < c; b++) this.children[b].traverse(a)
    },
    traverseVisible: function(a) {
        if (!1 !== this.visible) {
            a(this);
            for (var b = 0, c = this.children.length; b < c; b++) this.children[b].traverseVisible(a)
        }
    },
    updateMatrix: function() {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.matrixWorldNeedsUpdate = !0
    },
    updateMatrixWorld: function(a) {
        !0 === this.matrixAutoUpdate && this.updateMatrix();
        if (!0 === this.matrixWorldNeedsUpdate || !0 === a) void 0 === this.parent ? this.matrixWorld.copy(this.matrix) : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix), this.matrixWorldNeedsUpdate = !1, a = !0;
        for (var b = 0, c = this.children.length; b < c; b++) this.children[b].updateMatrixWorld(a)
    },
    toJSON: function() {
        var a = {
                metadata: {
                    version: 4.3,
                    type: "Object",
                    generator: "ObjectExporter"
                }
            },
            b = {},
            c = function(c) {
                void 0 === a.geometries && (a.geometries = []);
                if (void 0 === b[c.uuid]) {
                    var d = c.toJSON();
                    delete d.metadata;
                    b[c.uuid] = d;
                    a.geometries.push(d)
                }
                return c.uuid
            },
            d = {},
            e = function(b) {
                void 0 === a.materials && (a.materials = []);
                if (void 0 === d[b.uuid]) {
                    var c = b.toJSON();
                    delete c.metadata;
                    d[b.uuid] = c;
                    a.materials.push(c)
                }
                return b.uuid
            },
            f = function(a) {
                var b = {};
                b.uuid = a.uuid;
                b.type = a.type;
                "" !== a.name && (b.name = a.name);
                "{}" !== JSON.stringify(a.userData) && (b.userData = a.userData);
                !0 !== a.visible && (b.visible = a.visible);
                a instanceof THREE.PerspectiveCamera ? (b.fov = a.fov, b.aspect = a.aspect, b.near = a.near, b.far = a.far) : a instanceof THREE.OrthographicCamera ? (b.left = a.left, b.right = a.right, b.top = a.top, b.bottom = a.bottom, b.near = a.near, b.far = a.far) : a instanceof THREE.AmbientLight ? b.color = a.color.getHex() : a instanceof THREE.DirectionalLight ? (b.color = a.color.getHex(), b.intensity = a.intensity) : a instanceof THREE.PointLight ? (b.color = a.color.getHex(), b.intensity = a.intensity, b.distance = a.distance) : a instanceof THREE.SpotLight ? (b.color = a.color.getHex(), b.intensity = a.intensity, b.distance = a.distance, b.angle = a.angle, b.exponent = a.exponent) : a instanceof THREE.HemisphereLight ? (b.color = a.color.getHex(), b.groundColor = a.groundColor.getHex()) : a instanceof THREE.Mesh ? (b.geometry = c(a.geometry), b.material = e(a.material)) : a instanceof THREE.Line ? (b.geometry = c(a.geometry), b.material = e(a.material)) : a instanceof THREE.Sprite && (b.material = e(a.material));
                b.matrix = a.matrix.toArray();
                if (0 < a.children.length) {
                    b.children = [];
                    for (var d = 0; d < a.children.length; d++) b.children.push(f(a.children[d]))
                }
                return b
            };
        a.object = f(this);
        return a
    },
    clone: function(a, b) {
        void 0 === a && (a = new THREE.Object3D);
        void 0 === b && (b = !0);
        a.name = this.name;
        a.up.copy(this.up);
        a.position.copy(this.position);
        a.quaternion.copy(this.quaternion);
        a.scale.copy(this.scale);
        a.renderDepth = this.renderDepth;
        a.rotationAutoUpdate = this.rotationAutoUpdate;
        a.matrix.copy(this.matrix);
        a.matrixWorld.copy(this.matrixWorld);
        a.matrixAutoUpdate = this.matrixAutoUpdate;
        a.matrixWorldNeedsUpdate = this.matrixWorldNeedsUpdate;
        a.visible = this.visible;
        a.castShadow = this.castShadow;
        a.receiveShadow = this.receiveShadow;
        a.frustumCulled = this.frustumCulled;
        a.userData = JSON.parse(JSON.stringify(this.userData));
        if (!0 === b)
            for (var c = 0; c < this.children.length; c++) a.add(this.children[c].clone());
        return a
    }
};
THREE.EventDispatcher.prototype.apply(THREE.Object3D.prototype);
THREE.Object3DIdCount = 0;
THREE.Projector = function() {
    console.warn("THREE.Projector has been moved to /examples/renderers/Projector.js.");
    this.projectVector = function(a, b) {
        console.warn("THREE.Projector: .projectVector() is now vector.project().");
        a.project(b)
    };
    this.unprojectVector = function(a, b) {
        console.warn("THREE.Projector: .unprojectVector() is now vector.unproject().");
        a.unproject(b)
    };
    this.pickingRay = function(a, b) {
        console.error("THREE.Projector: .pickingRay() has been removed.")
    }
};
THREE.Face3 = function(a, b, c, d, e, f) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.normal = d instanceof THREE.Vector3 ? d : new THREE.Vector3;
    this.vertexNormals = d instanceof Array ? d : [];
    this.color = e instanceof THREE.Color ? e : new THREE.Color;
    this.vertexColors = e instanceof Array ? e : [];
    this.vertexTangents = [];
    this.materialIndex = void 0 !== f ? f : 0
};
THREE.Face3.prototype = {
    constructor: THREE.Face3,
    clone: function() {
        var a = new THREE.Face3(this.a, this.b, this.c);
        a.normal.copy(this.normal);
        a.color.copy(this.color);
        a.materialIndex = this.materialIndex;
        for (var b = 0, c = this.vertexNormals.length; b < c; b++) a.vertexNormals[b] = this.vertexNormals[b].clone();
        b = 0;
        for (c = this.vertexColors.length; b < c; b++) a.vertexColors[b] = this.vertexColors[b].clone();
        b = 0;
        for (c = this.vertexTangents.length; b < c; b++) a.vertexTangents[b] = this.vertexTangents[b].clone();
        return a
    }
};
THREE.Face4 = function(a, b, c, d, e, f, g) {
    console.warn("THREE.Face4 has been removed. A THREE.Face3 will be created instead.");
    return new THREE.Face3(a, b, c, e, f, g)
};
THREE.BufferAttribute = function(a, b) {
    this.array = a;
    this.itemSize = b;
    this.needsUpdate = !1
};
THREE.BufferAttribute.prototype = {
    constructor: THREE.BufferAttribute,
    get length() {
        return this.array.length
    },
    copyAt: function(a, b, c) {
        a *= this.itemSize;
        c *= b.itemSize;
        for (var d = 0, e = this.itemSize; d < e; d++) this.array[a + d] = b.array[c + d]
    },
    set: function(a) {
        this.array.set(a);
        return this
    },
    setX: function(a, b) {
        this.array[a * this.itemSize] = b;
        return this
    },
    setY: function(a, b) {
        this.array[a * this.itemSize + 1] = b;
        return this
    },
    setZ: function(a, b) {
        this.array[a * this.itemSize + 2] = b;
        return this
    },
    setXY: function(a, b, c) {
        a *= this.itemSize;
        this.array[a] = b;
        this.array[a + 1] = c;
        return this
    },
    setXYZ: function(a, b, c, d) {
        a *= this.itemSize;
        this.array[a] = b;
        this.array[a + 1] = c;
        this.array[a + 2] = d;
        return this
    },
    setXYZW: function(a, b, c, d, e) {
        a *= this.itemSize;
        this.array[a] = b;
        this.array[a + 1] = c;
        this.array[a + 2] = d;
        this.array[a + 3] = e;
        return this
    },
    clone: function() {
        return new THREE.BufferAttribute(new this.array.constructor(this.array), this.itemSize)
    }
};
THREE.Int8Attribute = function(a, b) {
    console.warn("THREE.Int8Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Uint8Attribute = function(a, b) {
    console.warn("THREE.Uint8Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Uint8ClampedAttribute = function(a, b) {
    console.warn("THREE.Uint8ClampedAttribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Int16Attribute = function(a, b) {
    console.warn("THREE.Int16Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Uint16Attribute = function(a, b) {
    console.warn("THREE.Uint16Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Int32Attribute = function(a, b) {
    console.warn("THREE.Int32Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Uint32Attribute = function(a, b) {
    console.warn("THREE.Uint32Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Float32Attribute = function(a, b) {
    console.warn("THREE.Float32Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.Float64Attribute = function(a, b) {
    console.warn("THREE.Float64Attribute has been removed. Use THREE.BufferAttribute( array, itemSize ) instead.");
    return new THREE.BufferAttribute(a, b)
};
THREE.BufferGeometry = function() {
    Object.defineProperty(this, "id", {
        value: THREE.GeometryIdCount++
    });
    this.uuid = THREE.Math.generateUUID();
    this.name = "";
    this.type = "BufferGeometry";
    this.attributes = {};
    this.attributesKeys = [];
    this.offsets = this.drawcalls = [];
    this.boundingSphere = this.boundingBox = null
};
THREE.BufferGeometry.prototype = {
    constructor: THREE.BufferGeometry,
    addAttribute: function(a, b, c) {
        !1 === b instanceof THREE.BufferAttribute ? (console.warn("THREE.BufferGeometry: .addAttribute() now expects ( name, attribute )."), this.attributes[a] = {
            array: b,
            itemSize: c
        }) : (this.attributes[a] = b, this.attributesKeys = Object.keys(this.attributes))
    },
    getAttribute: function(a) {
        return this.attributes[a]
    },
    addDrawCall: function(a, b, c) {
        this.drawcalls.push({
            start: a,
            count: b,
            index: void 0 !== c ? c : 0
        })
    },
    applyMatrix: function(a) {
        var b = this.attributes.position;
        void 0 !== b && (a.applyToVector3Array(b.array), b.needsUpdate = !0);
        b = this.attributes.normal;
        void 0 !== b && ((new THREE.Matrix3).getNormalMatrix(a).applyToVector3Array(b.array), b.needsUpdate = !0)
    },
    center: function() {},
    fromGeometry: function(a, b) {
        b = b || {
            vertexColors: THREE.NoColors
        };
        var c = a.vertices,
            d = a.faces,
            e = a.faceVertexUvs,
            f = b.vertexColors,
            g = 0 < e[0].length,
            h = 3 == d[0].vertexNormals.length,
            k = new Float32Array(9 * d.length);
        this.addAttribute("position", new THREE.BufferAttribute(k, 3));
        var n = new Float32Array(9 * d.length);
        this.addAttribute("normal", new THREE.BufferAttribute(n, 3));
        if (f !== THREE.NoColors) {
            var p = new Float32Array(9 * d.length);
            this.addAttribute("color", new THREE.BufferAttribute(p, 3))
        }
        if (!0 === g) {
            var q = new Float32Array(6 * d.length);
            this.addAttribute("uv", new THREE.BufferAttribute(q, 2))
        }
        for (var m = 0, r = 0, t = 0; m < d.length; m++, r += 6, t += 9) {
            var s = d[m],
                u = c[s.a],
                v = c[s.b],
                y = c[s.c];
            k[t] = u.x;
            k[t + 1] = u.y;
            k[t + 2] = u.z;
            k[t + 3] = v.x;
            k[t + 4] = v.y;
            k[t + 5] = v.z;
            k[t + 6] = y.x;
            k[t + 7] = y.y;
            k[t + 8] = y.z;
            !0 === h ? (u = s.vertexNormals[0], v = s.vertexNormals[1], y = s.vertexNormals[2], n[t] = u.x, n[t + 1] = u.y, n[t + 2] = u.z, n[t + 3] = v.x, n[t + 4] = v.y, n[t + 5] = v.z, n[t + 6] = y.x, n[t + 7] = y.y, n[t + 8] = y.z) : (u = s.normal, n[t] = u.x, n[t + 1] = u.y, n[t + 2] = u.z, n[t + 3] = u.x, n[t + 4] = u.y, n[t + 5] = u.z, n[t + 6] = u.x, n[t + 7] = u.y, n[t + 8] = u.z);
            f === THREE.FaceColors ? (s = s.color, p[t] = s.r, p[t + 1] = s.g, p[t + 2] = s.b, p[t + 3] = s.r, p[t + 4] = s.g, p[t + 5] = s.b, p[t + 6] = s.r, p[t + 7] = s.g, p[t + 8] = s.b) : f === THREE.VertexColors && (u = s.vertexColors[0], v = s.vertexColors[1], s = s.vertexColors[2], p[t] = u.r, p[t + 1] = u.g, p[t + 2] = u.b, p[t + 3] = v.r, p[t + 4] = v.g, p[t + 5] = v.b, p[t + 6] = s.r, p[t + 7] = s.g, p[t + 8] = s.b);
            !0 === g && (s = e[0][m][0], u = e[0][m][1], v = e[0][m][2], q[r] = s.x, q[r + 1] = s.y, q[r + 2] = u.x, q[r + 3] = u.y, q[r + 4] = v.x, q[r + 5] = v.y)
        }
        this.computeBoundingSphere();
        return this
    },
    computeBoundingBox: function() {
        var a = new THREE.Vector3;
        return function() {
            null === this.boundingBox && (this.boundingBox = new THREE.Box3);
            var b = this.attributes.position.array;
            if (b) {
                var c = this.boundingBox;
                c.makeEmpty();
                for (var d = 0, e = b.length; d < e; d += 3) a.set(b[d], b[d + 1], b[d + 2]), c.expandByPoint(a)
            }
            if (void 0 === b || 0 === b.length) this.boundingBox.min.set(0, 0, 0), this.boundingBox.max.set(0, 0, 0);
            (isNaN(this.boundingBox.min.x) || isNaN(this.boundingBox.min.y) || isNaN(this.boundingBox.min.z)) && console.error('THREE.BufferGeometry.computeBoundingBox: Computed min/max have NaN values. The "position" attribute is likely to have NaN values.')
        }
    }(),
    computeBoundingSphere: function() {
        var a = new THREE.Box3,
            b = new THREE.Vector3;
        return function() {
            null === this.boundingSphere && (this.boundingSphere = new THREE.Sphere);
            var c = this.attributes.position.array;
            if (c) {
                a.makeEmpty();
                for (var d = this.boundingSphere.center, e = 0, f = c.length; e < f; e += 3) b.set(c[e], c[e + 1], c[e + 2]), a.expandByPoint(b);
                a.center(d);
                for (var g = 0, e = 0, f = c.length; e < f; e += 3) b.set(c[e], c[e + 1], c[e + 2]), g = Math.max(g, d.distanceToSquared(b));
                this.boundingSphere.radius = Math.sqrt(g);
                isNaN(this.boundingSphere.radius) && console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.')
            }
        }
    }(),
    computeFaceNormals: function() {},
    computeVertexNormals: function() {
        var a = this.attributes;
        if (a.position) {
            var b = a.position.array;
            if (void 0 === a.normal) this.addAttribute("normal", new THREE.BufferAttribute(new Float32Array(b.length), 3));
            else
                for (var c = a.normal.array, d = 0, e = c.length; d < e; d++) c[d] = 0;
            var c = a.normal.array,
                f, g, h, k = new THREE.Vector3,
                n = new THREE.Vector3,
                p = new THREE.Vector3,
                q = new THREE.Vector3,
                m = new THREE.Vector3;
            if (a.index)
                for (var r = a.index.array, t = 0 < this.offsets.length ? this.offsets : [{
                        start: 0,
                        count: r.length,
                        index: 0
                    }], s = 0, u = t.length; s < u; ++s) {
                    e = t[s].start;
                    f = t[s].count;
                    for (var v = t[s].index, d = e, e = e + f; d < e; d += 3) f = 3 * (v + r[d]), g = 3 * (v + r[d + 1]), h = 3 * (v + r[d + 2]), k.fromArray(b, f), n.fromArray(b, g), p.fromArray(b, h), q.subVectors(p, n), m.subVectors(k, n), q.cross(m), c[f] += q.x, c[f + 1] += q.y, c[f + 2] += q.z, c[g] += q.x, c[g + 1] += q.y, c[g + 2] += q.z, c[h] += q.x, c[h + 1] += q.y, c[h + 2] += q.z
                } else
                    for (d = 0, e = b.length; d < e; d += 9) k.fromArray(b, d), n.fromArray(b, d + 3), p.fromArray(b, d + 6), q.subVectors(p, n), m.subVectors(k, n), q.cross(m), c[d] = q.x, c[d + 1] = q.y, c[d + 2] = q.z, c[d + 3] = q.x, c[d + 4] = q.y, c[d + 5] = q.z, c[d + 6] = q.x, c[d + 7] = q.y, c[d + 8] = q.z;
            this.normalizeNormals();
            a.normal.needsUpdate = !0
        }
    },
    computeTangents: function() {
        function a(a, b, c) {
            q.fromArray(d, 3 * a);
            m.fromArray(d, 3 * b);
            r.fromArray(d, 3 * c);
            t.fromArray(f, 2 * a);
            s.fromArray(f, 2 * b);
            u.fromArray(f, 2 * c);
            v = m.x - q.x;
            y = r.x - q.x;
            G = m.y - q.y;
            w = r.y - q.y;
            K = m.z - q.z;
            x = r.z - q.z;
            D = s.x - t.x;
            E = u.x - t.x;
            A = s.y - t.y;
            B = u.y - t.y;
            F = 1 / (D * B - E * A);
            R.set((B * v - A * y) * F, (B * G - A * w) * F, (B * K - A * x) * F);
            H.set((D * y - E * v) * F, (D * w - E * G) * F, (D * x - E * K) * F);
            k[a].add(R);
            k[b].add(R);
            k[c].add(R);
            n[a].add(H);
            n[b].add(H);
            n[c].add(H)
        }

        function b(a) {
            ya.fromArray(e, 3 * a);
            P.copy(ya);
            Fa = k[a];
            la.copy(Fa);
            la.sub(ya.multiplyScalar(ya.dot(Fa))).normalize();
            ma.crossVectors(P, Fa);
            za = ma.dot(n[a]);
            Ga = 0 > za ? -1 : 1;
            h[4 * a] = la.x;
            h[4 * a + 1] = la.y;
            h[4 * a + 2] = la.z;
            h[4 * a + 3] = Ga
        }
        if (void 0 === this.attributes.index || void 0 === this.attributes.position || void 0 === this.attributes.normal || void 0 === this.attributes.uv) console.warn("Missing required attributes (index, position, normal or uv) in BufferGeometry.computeTangents()");
        else {
            var c = this.attributes.index.array,
                d = this.attributes.position.array,
                e = this.attributes.normal.array,
                f = this.attributes.uv.array,
                g = d.length / 3;
            void 0 === this.attributes.tangent && this.addAttribute("tangent", new THREE.BufferAttribute(new Float32Array(4 * g), 4));
            for (var h = this.attributes.tangent.array, k = [], n = [], p = 0; p < g; p++) k[p] = new THREE.Vector3, n[p] = new THREE.Vector3;
            var q = new THREE.Vector3,
                m = new THREE.Vector3,
                r = new THREE.Vector3,
                t = new THREE.Vector2,
                s = new THREE.Vector2,
                u = new THREE.Vector2,
                v, y, G, w, K, x, D, E, A, B, F, R = new THREE.Vector3,
                H = new THREE.Vector3,
                C, T, Q, O, S;
            0 === this.drawcalls.length && this.addDrawCall(0, c.length, 0);
            var X = this.drawcalls,
                p = 0;
            for (T = X.length; p < T; ++p) {
                C = X[p].start;
                Q = X[p].count;
                var Y = X[p].index,
                    g = C;
                for (C += Q; g < C; g += 3) Q = Y + c[g], O = Y + c[g + 1], S = Y + c[g + 2], a(Q, O, S)
            }
            var la = new THREE.Vector3,
                ma = new THREE.Vector3,
                ya = new THREE.Vector3,
                P = new THREE.Vector3,
                Ga, Fa, za, p = 0;
            for (T = X.length; p < T; ++p)
                for (C = X[p].start, Q = X[p].count, Y = X[p].index, g = C, C += Q; g < C; g += 3) Q = Y + c[g], O = Y + c[g + 1], S = Y + c[g + 2], b(Q), b(O), b(S)
        }
    },
    computeOffsets: function(a) {
        var b = a;
        void 0 === a && (b = 65535);
        Date.now();
        a = this.attributes.index.array;
        for (var c = this.attributes.position.array, d = a.length / 3, e = new Uint16Array(a.length), f = 0, g = 0, h = [{
                start: 0,
                count: 0,
                index: 0
            }], k = h[0], n = 0, p = 0, q = new Int32Array(6), m = new Int32Array(c.length), r = new Int32Array(c.length), t = 0; t < c.length; t++) m[t] = -1, r[t] = -1;
        for (c = 0; c < d; c++) {
            for (var s = p = 0; 3 > s; s++) t = a[3 * c + s], -1 == m[t] ? (q[2 * s] = t, q[2 * s + 1] = -1, p++) : m[t] < k.index ? (q[2 * s] = t, q[2 * s + 1] = -1, n++) : (q[2 * s] = t, q[2 * s + 1] = m[t]);
            if (g + p > k.index + b)
                for (k = {
                        start: f,
                        count: 0,
                        index: g
                    }, h.push(k), p = 0; 6 > p; p += 2) s = q[p + 1], -1 < s && s < k.index && (q[p + 1] = -1);
            for (p = 0; 6 > p; p += 2) t = q[p], s = q[p + 1], -1 === s && (s = g++), m[t] = s, r[s] = t, e[f++] = s - k.index, k.count++
        }
        this.reorderBuffers(e, r, g);
        return this.offsets = h
    },
    merge: function() {
        console.log("BufferGeometry.merge(): TODO")
    },
    normalizeNormals: function() {
        for (var a = this.attributes.normal.array, b, c, d, e = 0, f = a.length; e < f; e += 3) b = a[e], c = a[e + 1], d = a[e + 2], b = 1 / Math.sqrt(b * b + c * c + d * d), a[e] *= b, a[e + 1] *= b, a[e + 2] *= b
    },
    reorderBuffers: function(a, b, c) {
        var d = {},
            e;
        for (e in this.attributes) "index" != e && (d[e] = new this.attributes[e].array.constructor(this.attributes[e].itemSize * c));
        for (var f = 0; f < c; f++) {
            var g = b[f];
            for (e in this.attributes)
                if ("index" != e)
                    for (var h = this.attributes[e].array, k = this.attributes[e].itemSize, n = d[e], p = 0; p < k; p++) n[f * k + p] = h[g * k + p]
        }
        this.attributes.index.array = a;
        for (e in this.attributes) "index" != e && (this.attributes[e].array = d[e], this.attributes[e].numItems = this.attributes[e].itemSize * c)
    },
    toJSON: function() {
        var a = {
                metadata: {
                    version: 4,
                    type: "BufferGeometry",
                    generator: "BufferGeometryExporter"
                },
                uuid: this.uuid,
                type: this.type,
                data: {
                    attributes: {}
                }
            },
            b = this.attributes,
            c = this.offsets,
            d = this.boundingSphere,
            e;
        for (e in b) {
            for (var f = b[e], g = [], h = f.array, k = 0, n = h.length; k < n; k++) g[k] = h[k];
            a.data.attributes[e] = {
                itemSize: f.itemSize,
                type: f.array.constructor.name,
                array: g
            }
        }
        0 < c.length && (a.data.offsets = JSON.parse(JSON.stringify(c)));
        null !== d && (a.data.boundingSphere = {
            center: d.center.toArray(),
            radius: d.radius
        });
        return a
    },
    clone: function() {
        var a = new THREE.BufferGeometry,
            b;
        for (b in this.attributes) a.addAttribute(b, this.attributes[b].clone());
        b = 0;
        for (var c = this.offsets.length; b < c; b++) {
            var d = this.offsets[b];
            a.offsets.push({
                start: d.start,
                index: d.index,
                count: d.count
            })
        }
        return a
    },
    dispose: function() {
        this.dispatchEvent({
            type: "dispose"
        })
    }
};
THREE.EventDispatcher.prototype.apply(THREE.BufferGeometry.prototype);
THREE.Geometry = function() {
    Object.defineProperty(this, "id", {
        value: THREE.GeometryIdCount++
    });
    this.uuid = THREE.Math.generateUUID();
    this.name = "";
    this.type = "Geometry";
    this.vertices = [];
    this.colors = [];
    this.faces = [];
    this.faceVertexUvs = [
        []
    ];
    this.morphTargets = [];
    this.morphColors = [];
    this.morphNormals = [];
    this.skinWeights = [];
    this.skinIndices = [];
    this.lineDistances = [];
    this.boundingSphere = this.boundingBox = null;
    this.hasTangents = !1;
    this.dynamic = !0;
    this.groupsNeedUpdate = this.lineDistancesNeedUpdate = this.colorsNeedUpdate = this.tangentsNeedUpdate = this.normalsNeedUpdate = this.uvsNeedUpdate = this.elementsNeedUpdate = this.verticesNeedUpdate = !1
};
THREE.Geometry.prototype = {
    constructor: THREE.Geometry,
    applyMatrix: function(a) {
        for (var b = (new THREE.Matrix3).getNormalMatrix(a), c = 0, d = this.vertices.length; c < d; c++) this.vertices[c].applyMatrix4(a);
        c = 0;
        for (d = this.faces.length; c < d; c++) {
            a = this.faces[c];
            a.normal.applyMatrix3(b).normalize();
            for (var e = 0, f = a.vertexNormals.length; e < f; e++) a.vertexNormals[e].applyMatrix3(b).normalize()
        }
        this.boundingBox instanceof THREE.Box3 && this.computeBoundingBox();
        this.boundingSphere instanceof THREE.Sphere && this.computeBoundingSphere()
    },
    fromBufferGeometry: function(a) {
        for (var b = this, c = a.attributes, d = c.position.array, e = void 0 !== c.index ? c.index.array : void 0, f = void 0 !== c.normal ? c.normal.array : void 0, g = void 0 !== c.color ? c.color.array : void 0, h = void 0 !== c.uv ? c.uv.array : void 0, k = [], n = [], p = c = 0; c < d.length; c += 3, p += 2) b.vertices.push(new THREE.Vector3(d[c], d[c + 1], d[c + 2])), void 0 !== f && k.push(new THREE.Vector3(f[c], f[c + 1], f[c + 2])), void 0 !== g && b.colors.push(new THREE.Color(g[c], g[c + 1], g[c + 2])), void 0 !== h && n.push(new THREE.Vector2(h[p], h[p + 1]));
        h = function(a, c, d) {
            var e = void 0 !== f ? [k[a].clone(), k[c].clone(), k[d].clone()] : [],
                h = void 0 !== g ? [b.colors[a].clone(), b.colors[c].clone(), b.colors[d].clone()] : [];
            b.faces.push(new THREE.Face3(a, c, d, e, h));
            b.faceVertexUvs[0].push([n[a], n[c], n[d]])
        };
        if (void 0 !== e)
            for (c = 0; c < e.length; c += 3) h(e[c], e[c + 1], e[c + 2]);
        else
            for (c = 0; c < d.length / 3; c += 3) h(c, c + 1, c + 2);
        this.computeFaceNormals();
        null !== a.boundingBox && (this.boundingBox = a.boundingBox.clone());
        null !== a.boundingSphere && (this.boundingSphere = a.boundingSphere.clone());
        return this
    },
    center: function() {
        this.computeBoundingBox();
        var a = new THREE.Vector3;
        a.addVectors(this.boundingBox.min, this.boundingBox.max);
        a.multiplyScalar(-.5);
        this.applyMatrix((new THREE.Matrix4).makeTranslation(a.x, a.y, a.z));
        this.computeBoundingBox();
        return a
    },
    computeFaceNormals: function() {
        for (var a = new THREE.Vector3, b = new THREE.Vector3, c = 0, d = this.faces.length; c < d; c++) {
            var e = this.faces[c],
                f = this.vertices[e.a],
                g = this.vertices[e.b];
            a.subVectors(this.vertices[e.c], g);
            b.subVectors(f, g);
            a.cross(b);
            a.normalize();
            e.normal.copy(a)
        }
    },
    computeVertexNormals: function(a) {
        var b, c, d;
        d = Array(this.vertices.length);
        b = 0;
        for (c = this.vertices.length; b < c; b++) d[b] = new THREE.Vector3;
        if (a) {
            var e, f, g, h = new THREE.Vector3,
                k = new THREE.Vector3;
            new THREE.Vector3;
            new THREE.Vector3;
            new THREE.Vector3;
            a = 0;
            for (b = this.faces.length; a < b; a++) c = this.faces[a], e = this.vertices[c.a], f = this.vertices[c.b], g = this.vertices[c.c], h.subVectors(g, f), k.subVectors(e, f), h.cross(k), d[c.a].add(h), d[c.b].add(h), d[c.c].add(h)
        } else
            for (a = 0, b = this.faces.length; a < b; a++) c = this.faces[a], d[c.a].add(c.normal), d[c.b].add(c.normal), d[c.c].add(c.normal);
        b = 0;
        for (c = this.vertices.length; b < c; b++) d[b].normalize();
        a = 0;
        for (b = this.faces.length; a < b; a++) c = this.faces[a], c.vertexNormals[0] = d[c.a].clone(), c.vertexNormals[1] = d[c.b].clone(), c.vertexNormals[2] = d[c.c].clone()
    },
    computeMorphNormals: function() {
        var a, b, c, d, e;
        c = 0;
        for (d = this.faces.length; c < d; c++)
            for (e = this.faces[c], e.__originalFaceNormal ? e.__originalFaceNormal.copy(e.normal) : e.__originalFaceNormal = e.normal.clone(), e.__originalVertexNormals || (e.__originalVertexNormals = []), a = 0, b = e.vertexNormals.length; a < b; a++) e.__originalVertexNormals[a] ? e.__originalVertexNormals[a].copy(e.vertexNormals[a]) : e.__originalVertexNormals[a] = e.vertexNormals[a].clone();
        var f = new THREE.Geometry;
        f.faces = this.faces;
        a = 0;
        for (b = this.morphTargets.length; a < b; a++) {
            if (!this.morphNormals[a]) {
                this.morphNormals[a] = {};
                this.morphNormals[a].faceNormals = [];
                this.morphNormals[a].vertexNormals = [];
                e = this.morphNormals[a].faceNormals;
                var g = this.morphNormals[a].vertexNormals,
                    h, k;
                c = 0;
                for (d = this.faces.length; c < d; c++) h = new THREE.Vector3, k = {
                    a: new THREE.Vector3,
                    b: new THREE.Vector3,
                    c: new THREE.Vector3
                }, e.push(h), g.push(k)
            }
            g = this.morphNormals[a];
            f.vertices = this.morphTargets[a].vertices;
            f.computeFaceNormals();
            f.computeVertexNormals();
            c = 0;
            for (d = this.faces.length; c < d; c++) e = this.faces[c], h = g.faceNormals[c], k = g.vertexNormals[c], h.copy(e.normal), k.a.copy(e.vertexNormals[0]), k.b.copy(e.vertexNormals[1]), k.c.copy(e.vertexNormals[2])
        }
        c = 0;
        for (d = this.faces.length; c < d; c++) e = this.faces[c], e.normal = e.__originalFaceNormal, e.vertexNormals = e.__originalVertexNormals
    },
    computeTangents: function() {
        var a, b, c, d, e, f, g, h, k, n, p, q, m, r, t, s, u, v = [],
            y = [];
        c = new THREE.Vector3;
        var G = new THREE.Vector3,
            w = new THREE.Vector3,
            K = new THREE.Vector3,
            x = new THREE.Vector3;
        a = 0;
        for (b = this.vertices.length; a < b; a++) v[a] = new THREE.Vector3, y[a] = new THREE.Vector3;
        a = 0;
        for (b = this.faces.length; a < b; a++) e = this.faces[a], f = this.faceVertexUvs[0][a], d = e.a, u = e.b, e = e.c, g = this.vertices[d], h = this.vertices[u], k = this.vertices[e], n = f[0], p = f[1], q = f[2], f = h.x - g.x, m = k.x - g.x, r = h.y - g.y, t = k.y - g.y, h = h.z - g.z, g = k.z - g.z, k = p.x - n.x, s = q.x - n.x, p = p.y - n.y, n = q.y - n.y, q = 1 / (k * n - s * p), c.set((n * f - p * m) * q, (n * r - p * t) * q, (n * h - p * g) * q), G.set((k * m - s * f) * q, (k * t - s * r) * q, (k * g - s * h) * q), v[d].add(c), v[u].add(c), v[e].add(c), y[d].add(G), y[u].add(G), y[e].add(G);
        G = ["a", "b", "c", "d"];
        a = 0;
        for (b = this.faces.length; a < b; a++)
            for (e = this.faces[a], c = 0; c < Math.min(e.vertexNormals.length, 3); c++) x.copy(e.vertexNormals[c]), d = e[G[c]], u = v[d], w.copy(u), w.sub(x.multiplyScalar(x.dot(u))).normalize(), K.crossVectors(e.vertexNormals[c], u), d = K.dot(y[d]), d = 0 > d ? -1 : 1, e.vertexTangents[c] = new THREE.Vector4(w.x, w.y, w.z, d);
        this.hasTangents = !0
    },
    computeLineDistances: function() {
        for (var a = 0, b = this.vertices, c = 0, d = b.length; c < d; c++) 0 < c && (a += b[c].distanceTo(b[c - 1])), this.lineDistances[c] = a
    },
    computeBoundingBox: function() {
        null === this.boundingBox && (this.boundingBox = new THREE.Box3);
        this.boundingBox.setFromPoints(this.vertices)
    },
    computeBoundingSphere: function() {
        null === this.boundingSphere && (this.boundingSphere = new THREE.Sphere);
        this.boundingSphere.setFromPoints(this.vertices)
    },
    merge: function(a, b, c) {
        if (!1 === a instanceof THREE.Geometry) console.error("THREE.Geometry.merge(): geometry not an instance of THREE.Geometry.", a);
        else {
            var d, e = this.vertices.length,
                f = this.vertices,
                g = a.vertices,
                h = this.faces,
                k = a.faces,
                n = this.faceVertexUvs[0];
            a = a.faceVertexUvs[0];
            void 0 === c && (c = 0);
            void 0 !== b && (d = (new THREE.Matrix3).getNormalMatrix(b));
            for (var p = 0, q = g.length; p < q; p++) {
                var m = g[p].clone();
                void 0 !== b && m.applyMatrix4(b);
                f.push(m)
            }
            p = 0;
            for (q = k.length; p < q; p++) {
                var g = k[p],
                    r, t = g.vertexNormals,
                    s = g.vertexColors,
                    m = new THREE.Face3(g.a + e, g.b + e, g.c + e);
                m.normal.copy(g.normal);
                void 0 !== d && m.normal.applyMatrix3(d).normalize();
                b = 0;
                for (f = t.length; b < f; b++) r = t[b].clone(), void 0 !== d && r.applyMatrix3(d).normalize(), m.vertexNormals.push(r);
                m.color.copy(g.color);
                b = 0;
                for (f = s.length; b < f; b++) r = s[b], m.vertexColors.push(r.clone());
                m.materialIndex = g.materialIndex + c;
                h.push(m)
            }
            p = 0;
            for (q = a.length; p < q; p++)
                if (c = a[p], d = [], void 0 !== c) {
                    b = 0;
                    for (f = c.length; b < f; b++) d.push(new THREE.Vector2(c[b].x, c[b].y));
                    n.push(d)
                }
        }
    },
    mergeVertices: function() {
        var a = {},
            b = [],
            c = [],
            d, e = Math.pow(10, 4),
            f, g;
        f = 0;
        for (g = this.vertices.length; f < g; f++) d = this.vertices[f], d = Math.round(d.x * e) + "_" + Math.round(d.y * e) + "_" + Math.round(d.z * e), void 0 === a[d] ? (a[d] = f, b.push(this.vertices[f]), c[f] = b.length - 1) : c[f] = c[a[d]];
        a = [];
        f = 0;
        for (g = this.faces.length; f < g; f++)
            for (e = this.faces[f], e.a = c[e.a], e.b = c[e.b], e.c = c[e.c], e = [e.a, e.b, e.c], d = 0; 3 > d; d++)
                if (e[d] == e[(d + 1) % 3]) {
                    a.push(f);
                    break
                }
        for (f = a.length - 1; 0 <= f; f--)
            for (e = a[f], this.faces.splice(e, 1), c = 0, g = this.faceVertexUvs.length; c < g; c++) this.faceVertexUvs[c].splice(e, 1);
        f = this.vertices.length - b.length;
        this.vertices = b;
        return f
    },
    toJSON: function() {
        function a(a, b, c) {
            return c ? a | 1 << b : a & ~(1 << b)
        }

        function b(a) {
            var b = a.x.toString() + a.y.toString() + a.z.toString();
            if (void 0 !== n[b]) return n[b];
            n[b] = k.length / 3;
            k.push(a.x, a.y, a.z);
            return n[b]
        }

        function c(a) {
            var b = a.r.toString() + a.g.toString() + a.b.toString();
            if (void 0 !== q[b]) return q[b];
            q[b] = p.length;
            p.push(a.getHex());
            return q[b]
        }

        function d(a) {
            var b = a.x.toString() + a.y.toString();
            if (void 0 !== r[b]) return r[b];
            r[b] = m.length / 2;
            m.push(a.x, a.y);
            return r[b]
        }
        var e = {
            metadata: {
                version: 4,
                type: "BufferGeometry",
                generator: "BufferGeometryExporter"
            },
            uuid: this.uuid,
            type: this.type
        };
        "" !== this.name && (e.name = this.name);
        if (void 0 !== this.parameters) {
            var f = this.parameters,
                g;
            for (g in f) void 0 !== f[g] && (e[g] = f[g]);
            return e
        }
        f = [];
        for (g = 0; g < this.vertices.length; g++) {
            var h = this.vertices[g];
            f.push(h.x, h.y, h.z)
        }
        var h = [],
            k = [],
            n = {},
            p = [],
            q = {},
            m = [],
            r = {};
        for (g = 0; g < this.faces.length; g++) {
            var t = this.faces[g],
                s = void 0 !== this.faceVertexUvs[0][g],
                u = 0 < t.normal.length(),
                v = 0 < t.vertexNormals.length,
                y = 1 !== t.color.r || 1 !== t.color.g || 1 !== t.color.b,
                G = 0 < t.vertexColors.length,
                w = 0,
                w = a(w, 0, 0),
                w = a(w, 1, !1),
                w = a(w, 2, !1),
                w = a(w, 3, s),
                w = a(w, 4, u),
                w = a(w, 5, v),
                w = a(w, 6, y),
                w = a(w, 7, G);
            h.push(w);
            h.push(t.a, t.b, t.c);
            s && (s = this.faceVertexUvs[0][g], h.push(d(s[0]), d(s[1]), d(s[2])));
            u && h.push(b(t.normal));
            v && (u = t.vertexNormals, h.push(b(u[0]), b(u[1]), b(u[2])));
            y && h.push(c(t.color));
            G && (t = t.vertexColors, h.push(c(t[0]), c(t[1]), c(t[2])))
        }
        e.data = {};
        e.data.vertices = f;
        e.data.normals = k;
        0 < p.length && (e.data.colors = p);
        0 < m.length && (e.data.uvs = [m]);
        e.data.faces = h;
        return e
    },
    clone: function() {
        for (var a = new THREE.Geometry, b = this.vertices, c = 0, d = b.length; c < d; c++) a.vertices.push(b[c].clone());
        b = this.faces;
        c = 0;
        for (d = b.length; c < d; c++) a.faces.push(b[c].clone());
        b = this.faceVertexUvs[0];
        c = 0;
        for (d = b.length; c < d; c++) {
            for (var e = b[c], f = [], g = 0, h = e.length; g < h; g++) f.push(new THREE.Vector2(e[g].x, e[g].y));
            a.faceVertexUvs[0].push(f)
        }
        return a
    },
    dispose: function() {
        this.dispatchEvent({
            type: "dispose"
        })
    }
};
THREE.EventDispatcher.prototype.apply(THREE.Geometry.prototype);
THREE.GeometryIdCount = 0;
THREE.Camera = function() {
    THREE.Object3D.call(this);
    this.type = "Camera";
    this.matrixWorldInverse = new THREE.Matrix4;
    this.projectionMatrix = new THREE.Matrix4
};
THREE.Camera.prototype = Object.create(THREE.Object3D.prototype);
THREE.Camera.prototype.getWorldDirection = function() {
    var a = new THREE.Quaternion;
    return function(b) {
        b = b || new THREE.Vector3;
        this.getWorldQuaternion(a);
        return b.set(0, 0, -1).applyQuaternion(a)
    }
}();
THREE.Camera.prototype.lookAt = function() {
    var a = new THREE.Matrix4;
    return function(b) {
        a.lookAt(this.position, b, this.up);
        this.quaternion.setFromRotationMatrix(a)
    }
}();
THREE.Camera.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.Camera);
    THREE.Object3D.prototype.clone.call(this, a);
    a.matrixWorldInverse.copy(this.matrixWorldInverse);
    a.projectionMatrix.copy(this.projectionMatrix);
    return a
};
THREE.CubeCamera = function(a, b, c) {
    THREE.Object3D.call(this);
    this.type = "CubeCamera";
    var d = new THREE.PerspectiveCamera(90, 1, a, b);
    d.up.set(0, -1, 0);
    d.lookAt(new THREE.Vector3(1, 0, 0));
    this.add(d);
    var e = new THREE.PerspectiveCamera(90, 1, a, b);
    e.up.set(0, -1, 0);
    e.lookAt(new THREE.Vector3(-1, 0, 0));
    this.add(e);
    var f = new THREE.PerspectiveCamera(90, 1, a, b);
    f.up.set(0, 0, 1);
    f.lookAt(new THREE.Vector3(0, 1, 0));
    this.add(f);
    var g = new THREE.PerspectiveCamera(90, 1, a, b);
    g.up.set(0, 0, -1);
    g.lookAt(new THREE.Vector3(0, -1, 0));
    this.add(g);
    var h = new THREE.PerspectiveCamera(90, 1, a, b);
    h.up.set(0, -1, 0);
    h.lookAt(new THREE.Vector3(0, 0, 1));
    this.add(h);
    var k = new THREE.PerspectiveCamera(90, 1, a, b);
    k.up.set(0, -1, 0);
    k.lookAt(new THREE.Vector3(0, 0, -1));
    this.add(k);
    this.renderTarget = new THREE.WebGLRenderTargetCube(c, c, {
        format: THREE.RGBFormat,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter
    });
    this.updateCubeMap = function(a, b) {
        var c = this.renderTarget,
            m = c.generateMipmaps;
        c.generateMipmaps = !1;
        c.activeCubeFace = 0;
        a.render(b, d, c);
        c.activeCubeFace = 1;
        a.render(b, e, c);
        c.activeCubeFace = 2;
        a.render(b, f, c);
        c.activeCubeFace = 3;
        a.render(b, g, c);
        c.activeCubeFace = 4;
        a.render(b, h, c);
        c.generateMipmaps = m;
        c.activeCubeFace = 5;
        a.render(b, k, c)
    }
};
THREE.CubeCamera.prototype = Object.create(THREE.Object3D.prototype);
THREE.OrthographicCamera = function(a, b, c, d, e, f) {
    THREE.Camera.call(this);
    this.type = "OrthographicCamera";
    this.zoom = 1;
    this.left = a;
    this.right = b;
    this.top = c;
    this.bottom = d;
    this.near = void 0 !== e ? e : .1;
    this.far = void 0 !== f ? f : 2e3;
    this.updateProjectionMatrix()
};
THREE.OrthographicCamera.prototype = Object.create(THREE.Camera.prototype);
THREE.OrthographicCamera.prototype.updateProjectionMatrix = function() {
    var a = (this.right - this.left) / (2 * this.zoom),
        b = (this.top - this.bottom) / (2 * this.zoom),
        c = (this.right + this.left) / 2,
        d = (this.top + this.bottom) / 2;
    this.projectionMatrix.makeOrthographic(c - a, c + a, d + b, d - b, this.near, this.far)
};
THREE.OrthographicCamera.prototype.clone = function() {
    var a = new THREE.OrthographicCamera;
    THREE.Camera.prototype.clone.call(this, a);
    a.zoom = this.zoom;
    a.left = this.left;
    a.right = this.right;
    a.top = this.top;
    a.bottom = this.bottom;
    a.near = this.near;
    a.far = this.far;
    a.projectionMatrix.copy(this.projectionMatrix);
    return a
};
THREE.PerspectiveCamera = function(a, b, c, d) {
    THREE.Camera.call(this);
    this.type = "PerspectiveCamera";
    this.zoom = 1;
    this.fov = void 0 !== a ? a : 50;
    this.aspect = void 0 !== b ? b : 1;
    this.near = void 0 !== c ? c : .1;
    this.far = void 0 !== d ? d : 2e3;
    this.updateProjectionMatrix()
};
THREE.PerspectiveCamera.prototype = Object.create(THREE.Camera.prototype);
THREE.PerspectiveCamera.prototype.setLens = function(a, b) {
    void 0 === b && (b = 24);
    this.fov = 2 * THREE.Math.radToDeg(Math.atan(b / (2 * a)));
    this.updateProjectionMatrix()
};
THREE.PerspectiveCamera.prototype.setViewOffset = function(a, b, c, d, e, f) {
    this.fullWidth = a;
    this.fullHeight = b;
    this.x = c;
    this.y = d;
    this.width = e;
    this.height = f;
    this.updateProjectionMatrix()
};
THREE.PerspectiveCamera.prototype.updateProjectionMatrix = function() {
    var a = THREE.Math.radToDeg(2 * Math.atan(Math.tan(.5 * THREE.Math.degToRad(this.fov)) / this.zoom));
    if (this.fullWidth) {
        var b = this.fullWidth / this.fullHeight,
            a = Math.tan(THREE.Math.degToRad(.5 * a)) * this.near,
            c = -a,
            d = b * c,
            b = Math.abs(b * a - d),
            c = Math.abs(a - c);
        this.projectionMatrix.makeFrustum(d + this.x * b / this.fullWidth, d + (this.x + this.width) * b / this.fullWidth, a - (this.y + this.height) * c / this.fullHeight, a - this.y * c / this.fullHeight, this.near, this.far)
    } else this.projectionMatrix.makePerspective(a, this.aspect, this.near, this.far)
};
THREE.PerspectiveCamera.prototype.clone = function() {
    var a = new THREE.PerspectiveCamera;
    THREE.Camera.prototype.clone.call(this, a);
    a.zoom = this.zoom;
    a.fov = this.fov;
    a.aspect = this.aspect;
    a.near = this.near;
    a.far = this.far;
    a.projectionMatrix.copy(this.projectionMatrix);
    return a
};
THREE.Light = function(a) {
    THREE.Object3D.call(this);
    this.type = "Light";
    this.color = new THREE.Color(a)
};
THREE.Light.prototype = Object.create(THREE.Object3D.prototype);
THREE.Light.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.Light);
    THREE.Object3D.prototype.clone.call(this, a);
    a.color.copy(this.color);
    return a
};
THREE.AmbientLight = function(a) {
    THREE.Light.call(this, a);
    this.type = "AmbientLight"
};
THREE.AmbientLight.prototype = Object.create(THREE.Light.prototype);
THREE.AmbientLight.prototype.clone = function() {
    var a = new THREE.AmbientLight;
    THREE.Light.prototype.clone.call(this, a);
    return a
};
THREE.AreaLight = function(a, b) {
    THREE.Light.call(this, a);
    this.type = "AreaLight";
    this.normal = new THREE.Vector3(0, -1, 0);
    this.right = new THREE.Vector3(1, 0, 0);
    this.intensity = void 0 !== b ? b : 1;
    this.height = this.width = 1;
    this.constantAttenuation = 1.5;
    this.linearAttenuation = .5;
    this.quadraticAttenuation = .1
};
THREE.AreaLight.prototype = Object.create(THREE.Light.prototype);
THREE.DirectionalLight = function(a, b) {
    THREE.Light.call(this, a);
    this.type = "DirectionalLight";
    this.position.set(0, 1, 0);
    this.target = new THREE.Object3D;
    this.intensity = void 0 !== b ? b : 1;
    this.onlyShadow = this.castShadow = !1;
    this.shadowCameraNear = 50;
    this.shadowCameraFar = 5e3;
    this.shadowCameraLeft = -500;
    this.shadowCameraTop = this.shadowCameraRight = 500;
    this.shadowCameraBottom = -500;
    this.shadowCameraVisible = !1;
    this.shadowBias = 0;
    this.shadowDarkness = .5;
    this.shadowMapHeight = this.shadowMapWidth = 512;
    this.shadowCascade = !1;
    this.shadowCascadeOffset = new THREE.Vector3(0, 0, -1e3);
    this.shadowCascadeCount = 2;
    this.shadowCascadeBias = [0, 0, 0];
    this.shadowCascadeWidth = [512, 512, 512];
    this.shadowCascadeHeight = [512, 512, 512];
    this.shadowCascadeNearZ = [-1, .99, .998];
    this.shadowCascadeFarZ = [.99, .998, 1];
    this.shadowCascadeArray = [];
    this.shadowMatrix = this.shadowCamera = this.shadowMapSize = this.shadowMap = null
};
THREE.DirectionalLight.prototype = Object.create(THREE.Light.prototype);
THREE.DirectionalLight.prototype.clone = function() {
    var a = new THREE.DirectionalLight;
    THREE.Light.prototype.clone.call(this, a);
    a.target = this.target.clone();
    a.intensity = this.intensity;
    a.castShadow = this.castShadow;
    a.onlyShadow = this.onlyShadow;
    a.shadowCameraNear = this.shadowCameraNear;
    a.shadowCameraFar = this.shadowCameraFar;
    a.shadowCameraLeft = this.shadowCameraLeft;
    a.shadowCameraRight = this.shadowCameraRight;
    a.shadowCameraTop = this.shadowCameraTop;
    a.shadowCameraBottom = this.shadowCameraBottom;
    a.shadowCameraVisible = this.shadowCameraVisible;
    a.shadowBias = this.shadowBias;
    a.shadowDarkness = this.shadowDarkness;
    a.shadowMapWidth = this.shadowMapWidth;
    a.shadowMapHeight = this.shadowMapHeight;
    a.shadowCascade = this.shadowCascade;
    a.shadowCascadeOffset.copy(this.shadowCascadeOffset);
    a.shadowCascadeCount = this.shadowCascadeCount;
    a.shadowCascadeBias = this.shadowCascadeBias.slice(0);
    a.shadowCascadeWidth = this.shadowCascadeWidth.slice(0);
    a.shadowCascadeHeight = this.shadowCascadeHeight.slice(0);
    a.shadowCascadeNearZ = this.shadowCascadeNearZ.slice(0);
    a.shadowCascadeFarZ = this.shadowCascadeFarZ.slice(0);
    return a
};
THREE.HemisphereLight = function(a, b, c) {
    THREE.Light.call(this, a);
    this.type = "HemisphereLight";
    this.position.set(0, 100, 0);
    this.groundColor = new THREE.Color(b);
    this.intensity = void 0 !== c ? c : 1
};
THREE.HemisphereLight.prototype = Object.create(THREE.Light.prototype);
THREE.HemisphereLight.prototype.clone = function() {
    var a = new THREE.HemisphereLight;
    THREE.Light.prototype.clone.call(this, a);
    a.groundColor.copy(this.groundColor);
    a.intensity = this.intensity;
    return a
};
THREE.PointLight = function(a, b, c) {
    THREE.Light.call(this, a);
    this.type = "PointLight";
    this.intensity = void 0 !== b ? b : 1;
    this.distance = void 0 !== c ? c : 0
};
THREE.PointLight.prototype = Object.create(THREE.Light.prototype);
THREE.PointLight.prototype.clone = function() {
    var a = new THREE.PointLight;
    THREE.Light.prototype.clone.call(this, a);
    a.intensity = this.intensity;
    a.distance = this.distance;
    return a
};
THREE.SpotLight = function(a, b, c, d, e) {
    THREE.Light.call(this, a);
    this.type = "SpotLight";
    this.position.set(0, 1, 0);
    this.target = new THREE.Object3D;
    this.intensity = void 0 !== b ? b : 1;
    this.distance = void 0 !== c ? c : 0;
    this.angle = void 0 !== d ? d : Math.PI / 3;
    this.exponent = void 0 !== e ? e : 10;
    this.onlyShadow = this.castShadow = !1;
    this.shadowCameraNear = 50;
    this.shadowCameraFar = 5e3;
    this.shadowCameraFov = 50;
    this.shadowCameraVisible = !1;
    this.shadowBias = 0;
    this.shadowDarkness = .5;
    this.shadowMapHeight = this.shadowMapWidth = 512;
    this.shadowMatrix = this.shadowCamera = this.shadowMapSize = this.shadowMap = null
};
THREE.SpotLight.prototype = Object.create(THREE.Light.prototype);
THREE.SpotLight.prototype.clone = function() {
    var a = new THREE.SpotLight;
    THREE.Light.prototype.clone.call(this, a);
    a.target = this.target.clone();
    a.intensity = this.intensity;
    a.distance = this.distance;
    a.angle = this.angle;
    a.exponent = this.exponent;
    a.castShadow = this.castShadow;
    a.onlyShadow = this.onlyShadow;
    a.shadowCameraNear = this.shadowCameraNear;
    a.shadowCameraFar = this.shadowCameraFar;
    a.shadowCameraFov = this.shadowCameraFov;
    a.shadowCameraVisible = this.shadowCameraVisible;
    a.shadowBias = this.shadowBias;
    a.shadowDarkness = this.shadowDarkness;
    a.shadowMapWidth = this.shadowMapWidth;
    a.shadowMapHeight = this.shadowMapHeight;
    return a
};
THREE.Cache = function() {
    this.files = {}
};
THREE.Cache.prototype = {
    constructor: THREE.Cache,
    add: function(a, b) {
        this.files[a] = b
    },
    get: function(a) {
        return this.files[a]
    },
    remove: function(a) {
        delete this.files[a]
    },
    clear: function() {
        this.files = {}
    }
};
THREE.Loader = function(a) {
    this.statusDomElement = (this.showStatus = a) ? THREE.Loader.prototype.addStatusElement() : null;
    this.imageLoader = new THREE.ImageLoader;
    this.onLoadStart = function() {};
    this.onLoadProgress = function() {};
    this.onLoadComplete = function() {}
};
THREE.Loader.prototype = {
    constructor: THREE.Loader,
    crossOrigin: void 0,
    addStatusElement: function() {
        var a = document.createElement("div");
        a.style.position = "absolute";
        a.style.right = "0px";
        a.style.top = "0px";
        a.style.fontSize = "0.8em";
        a.style.textAlign = "left";
        a.style.background = "rgba(0,0,0,0.25)";
        a.style.color = "#fff";
        a.style.width = "120px";
        a.style.padding = "0.5em 0.5em 0.5em 0.5em";
        a.style.zIndex = 1e3;
        a.innerHTML = "Loading ...";
        return a
    },
    updateProgress: function(a) {
        var b = "Loaded ",
            b = a.total ? b + ((100 * a.loaded / a.total).toFixed(0) + "%") : b + ((a.loaded / 1024).toFixed(2) + " KB");
        this.statusDomElement.innerHTML = b
    },
    extractUrlBase: function(a) {
        a = a.split("/");
        if (1 === a.length) return "./";
        a.pop();
        return a.join("/") + "/"
    },
    initMaterials: function(a, b) {
        for (var c = [], d = 0; d < a.length; ++d) c[d] = this.createMaterial(a[d], b);
        return c
    },
    needsTangents: function(a) {
        for (var b = 0, c = a.length; b < c; b++)
            if (a[b] instanceof THREE.ShaderMaterial) return !0;
        return !1
    },
    createMaterial: function(a, b) {
        function c(a) {
            a = Math.log(a) / Math.LN2;
            return Math.pow(2, Math.round(a))
        }

        function d(a, d, e, g, h, k, s) {
            var u = b + e,
                v, y = THREE.Loader.Handlers.get(u);
            null !== y ? v = y.load(u) : (v = new THREE.Texture, y = f.imageLoader, y.crossOrigin = f.crossOrigin, y.load(u, function(a) {
                if (!1 === THREE.Math.isPowerOfTwo(a.width) || !1 === THREE.Math.isPowerOfTwo(a.height)) {
                    var b = c(a.width),
                        d = c(a.height),
                        e = document.createElement("canvas");
                    e.width = b;
                    e.height = d;
                    e.getContext("2d").drawImage(a, 0, 0, b, d);
                    v.image = e
                } else v.image = a;
                v.needsUpdate = !0
            }));
            v.sourceFile = e;
            g && (v.repeat.set(g[0], g[1]), 1 !== g[0] && (v.wrapS = THREE.RepeatWrapping), 1 !== g[1] && (v.wrapT = THREE.RepeatWrapping));
            h && v.offset.set(h[0], h[1]);
            k && (e = {
                repeat: THREE.RepeatWrapping,
                mirror: THREE.MirroredRepeatWrapping
            }, void 0 !== e[k[0]] && (v.wrapS = e[k[0]]), void 0 !== e[k[1]] && (v.wrapT = e[k[1]]));
            s && (v.anisotropy = s);
            a[d] = v
        }

        function e(a) {
            return (255 * a[0] << 16) + (255 * a[1] << 8) + 255 * a[2]
        }
        var f = this,
            g = "MeshLambertMaterial",
            h = {
                color: 15658734,
                opacity: 1,
                map: null,
                lightMap: null,
                normalMap: null,
                bumpMap: null,
                wireframe: !1
            };
        if (a.shading) {
            var k = a.shading.toLowerCase();
            "phong" === k ? g = "MeshPhongMaterial" : "basic" === k && (g = "MeshBasicMaterial")
        }
        void 0 !== a.blending && void 0 !== THREE[a.blending] && (h.blending = THREE[a.blending]);
        if (void 0 !== a.transparent || 1 > a.opacity) h.transparent = a.transparent;
        void 0 !== a.depthTest && (h.depthTest = a.depthTest);
        void 0 !== a.depthWrite && (h.depthWrite = a.depthWrite);
        void 0 !== a.visible && (h.visible = a.visible);
        void 0 !== a.flipSided && (h.side = THREE.BackSide);
        void 0 !== a.doubleSided && (h.side = THREE.DoubleSide);
        void 0 !== a.wireframe && (h.wireframe = a.wireframe);
        void 0 !== a.vertexColors && ("face" === a.vertexColors ? h.vertexColors = THREE.FaceColors : a.vertexColors && (h.vertexColors = THREE.VertexColors));
        a.colorDiffuse ? h.color = e(a.colorDiffuse) : a.DbgColor && (h.color = a.DbgColor);
        a.colorSpecular && (h.specular = e(a.colorSpecular));
        a.colorAmbient && (h.ambient = e(a.colorAmbient));
        a.colorEmissive && (h.emissive = e(a.colorEmissive));
        a.transparency && (h.opacity = a.transparency);
        a.specularCoef && (h.shininess = a.specularCoef);
        a.mapDiffuse && b && d(h, "map", a.mapDiffuse, a.mapDiffuseRepeat, a.mapDiffuseOffset, a.mapDiffuseWrap, a.mapDiffuseAnisotropy);
        a.mapLight && b && d(h, "lightMap", a.mapLight, a.mapLightRepeat, a.mapLightOffset, a.mapLightWrap, a.mapLightAnisotropy);
        a.mapBump && b && d(h, "bumpMap", a.mapBump, a.mapBumpRepeat, a.mapBumpOffset, a.mapBumpWrap, a.mapBumpAnisotropy);
        a.mapNormal && b && d(h, "normalMap", a.mapNormal, a.mapNormalRepeat, a.mapNormalOffset, a.mapNormalWrap, a.mapNormalAnisotropy);
        a.mapSpecular && b && d(h, "specularMap", a.mapSpecular, a.mapSpecularRepeat, a.mapSpecularOffset, a.mapSpecularWrap, a.mapSpecularAnisotropy);
        a.mapAlpha && b && d(h, "alphaMap", a.mapAlpha, a.mapAlphaRepeat, a.mapAlphaOffset, a.mapAlphaWrap, a.mapAlphaAnisotropy);
        a.mapBumpScale && (h.bumpScale = a.mapBumpScale);
        a.mapNormal ? (g = THREE.ShaderLib.normalmap, k = THREE.UniformsUtils.clone(g.uniforms), k.tNormal.value = h.normalMap, a.mapNormalFactor && k.uNormalScale.value.set(a.mapNormalFactor, a.mapNormalFactor), h.map && (k.tDiffuse.value = h.map, k.enableDiffuse.value = !0), h.specularMap && (k.tSpecular.value = h.specularMap, k.enableSpecular.value = !0), h.lightMap && (k.tAO.value = h.lightMap, k.enableAO.value = !0), k.diffuse.value.setHex(h.color), k.specular.value.setHex(h.specular), k.ambient.value.setHex(h.ambient), k.shininess.value = h.shininess, void 0 !== h.opacity && (k.opacity.value = h.opacity), g = new THREE.ShaderMaterial({
            fragmentShader: g.fragmentShader,
            vertexShader: g.vertexShader,
            uniforms: k,
            lights: !0,
            fog: !0
        }), h.transparent && (g.transparent = !0)) : g = new THREE[g](h);
        void 0 !== a.DbgName && (g.name = a.DbgName);
        return g
    }
};
THREE.Loader.Handlers = {
    handlers: [],
    add: function(a, b) {
        this.handlers.push(a, b)
    },
    get: function(a) {
        for (var b = 0, c = this.handlers.length; b < c; b += 2) {
            var d = this.handlers[b + 1];
            if (this.handlers[b].test(a)) return d
        }
        return null
    }
};
THREE.XHRLoader = function(a) {
    this.cache = new THREE.Cache;
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.XHRLoader.prototype = {
    constructor: THREE.XHRLoader,
    load: function(a, b, c, d) {
        var e = this,
            f = e.cache.get(a);
        void 0 !== f ? b && b(f) : (f = new XMLHttpRequest, f.open("GET", a, !0), f.addEventListener("load", function(c) {
            e.cache.add(a, this.response);
            b && b(this.response);
            e.manager.itemEnd(a)
        }, !1), void 0 !== c && f.addEventListener("progress", function(a) {
            c(a)
        }, !1), void 0 !== d && f.addEventListener("error", function(a) {
            d(a)
        }, !1), void 0 !== this.crossOrigin && (f.crossOrigin = this.crossOrigin), void 0 !== this.responseType && (f.responseType = this.responseType), f.send(null), e.manager.itemStart(a))
    },
    setResponseType: function(a) {
        this.responseType = a
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    }
};
THREE.ImageLoader = function(a) {
    this.cache = new THREE.Cache;
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.ImageLoader.prototype = {
    constructor: THREE.ImageLoader,
    load: function(a, b, c, d) {
        var e = this,
            f = e.cache.get(a);
        if (void 0 !== f) b(f);
        else return f = document.createElement("img"), void 0 !== b && f.addEventListener("load", function(c) {
            e.cache.add(a, this);
            b(this);
            e.manager.itemEnd(a)
        }, !1), void 0 !== c && f.addEventListener("progress", function(a) {
            c(a)
        }, !1), void 0 !== d && f.addEventListener("error", function(a) {
            d(a)
        }, !1), void 0 !== this.crossOrigin && (f.crossOrigin = this.crossOrigin), f.src = a, e.manager.itemStart(a), f
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    }
};
THREE.JSONLoader = function(a) {
    THREE.Loader.call(this, a);
    this.withCredentials = !1
};
THREE.JSONLoader.prototype = Object.create(THREE.Loader.prototype);
THREE.JSONLoader.prototype.load = function(a, b, c) {
    c = c && "string" === typeof c ? c : this.extractUrlBase(a);
    this.onLoadStart();
    this.loadAjaxJSON(this, a, b, c)
};
THREE.JSONLoader.prototype.loadAjaxJSON = function(a, b, c, d, e) {
    var f = new XMLHttpRequest,
        g = 0;
    f.onreadystatechange = function() {
        if (f.readyState === f.DONE)
            if (200 === f.status || 0 === f.status) {
                if (f.responseText) {
                    var h = JSON.parse(f.responseText);
                    if (void 0 !== h.metadata && "scene" === h.metadata.type) {
                        console.error('THREE.JSONLoader: "' + b + '" seems to be a Scene. Use THREE.SceneLoader instead.');
                        return
                    }
                    h = a.parse(h, d);
                    c(h.geometry, h.materials)
                } else console.error('THREE.JSONLoader: "' + b + '" seems to be unreachable or the file is empty.');
                a.onLoadComplete()
            } else console.error("THREE.JSONLoader: Couldn't load \"" + b + '" (' + f.status + ")");
        else f.readyState === f.LOADING ? e && (0 === g && (g = f.getResponseHeader("Content-Length")), e({
            total: g,
            loaded: f.responseText.length
        })) : f.readyState === f.HEADERS_RECEIVED && void 0 !== e && (g = f.getResponseHeader("Content-Length"))
    };
    f.open("GET", b, !0);
    f.withCredentials = this.withCredentials;
    f.send(null)
};
THREE.JSONLoader.prototype.parse = function(a, b) {
    var c = new THREE.Geometry,
        d = void 0 !== a.scale ? 1 / a.scale : 1;
    (function(b) {
        var d, g, h, k, n, p, q, m, r, t, s, u, v, y = a.faces;
        p = a.vertices;
        var G = a.normals,
            w = a.colors,
            K = 0;
        if (void 0 !== a.uvs) {
            for (d = 0; d < a.uvs.length; d++) a.uvs[d].length && K++;
            for (d = 0; d < K; d++) c.faceVertexUvs[d] = []
        }
        k = 0;
        for (n = p.length; k < n;) d = new THREE.Vector3, d.x = p[k++] * b, d.y = p[k++] * b, d.z = p[k++] * b, c.vertices.push(d);
        k = 0;
        for (n = y.length; k < n;)
            if (b = y[k++], r = b & 1, h = b & 2, d = b & 8, q = b & 16, t = b & 32, p = b & 64, b &= 128, r) {
                r = new THREE.Face3;
                r.a = y[k];
                r.b = y[k + 1];
                r.c = y[k + 3];
                s = new THREE.Face3;
                s.a = y[k + 1];
                s.b = y[k + 2];
                s.c = y[k + 3];
                k += 4;
                h && (h = y[k++], r.materialIndex = h, s.materialIndex = h);
                h = c.faces.length;
                if (d)
                    for (d = 0; d < K; d++)
                        for (u = a.uvs[d], c.faceVertexUvs[d][h] = [], c.faceVertexUvs[d][h + 1] = [], g = 0; 4 > g; g++) m = y[k++], v = u[2 * m], m = u[2 * m + 1], v = new THREE.Vector2(v, m), 2 !== g && c.faceVertexUvs[d][h].push(v), 0 !== g && c.faceVertexUvs[d][h + 1].push(v);
                q && (q = 3 * y[k++], r.normal.set(G[q++], G[q++], G[q]), s.normal.copy(r.normal));
                if (t)
                    for (d = 0; 4 > d; d++) q = 3 * y[k++], t = new THREE.Vector3(G[q++], G[q++], G[q]), 2 !== d && r.vertexNormals.push(t), 0 !== d && s.vertexNormals.push(t);
                p && (p = y[k++], p = w[p], r.color.setHex(p), s.color.setHex(p));
                if (b)
                    for (d = 0; 4 > d; d++) p = y[k++], p = w[p], 2 !== d && r.vertexColors.push(new THREE.Color(p)), 0 !== d && s.vertexColors.push(new THREE.Color(p));
                c.faces.push(r);
                c.faces.push(s)
            } else {
                r = new THREE.Face3;
                r.a = y[k++];
                r.b = y[k++];
                r.c = y[k++];
                h && (h = y[k++], r.materialIndex = h);
                h = c.faces.length;
                if (d)
                    for (d = 0; d < K; d++)
                        for (u = a.uvs[d], c.faceVertexUvs[d][h] = [], g = 0; 3 > g; g++) m = y[k++], v = u[2 * m], m = u[2 * m + 1], v = new THREE.Vector2(v, m), c.faceVertexUvs[d][h].push(v);
                q && (q = 3 * y[k++], r.normal.set(G[q++], G[q++], G[q]));
                if (t)
                    for (d = 0; 3 > d; d++) q = 3 * y[k++], t = new THREE.Vector3(G[q++], G[q++], G[q]), r.vertexNormals.push(t);
                p && (p = y[k++], r.color.setHex(w[p]));
                if (b)
                    for (d = 0; 3 > d; d++) p = y[k++], r.vertexColors.push(new THREE.Color(w[p]));
                c.faces.push(r)
            }
    })(d);
    (function() {
        var b = void 0 !== a.influencesPerVertex ? a.influencesPerVertex : 2;
        if (a.skinWeights)
            for (var d = 0, g = a.skinWeights.length; d < g; d += b) c.skinWeights.push(new THREE.Vector4(a.skinWeights[d], 1 < b ? a.skinWeights[d + 1] : 0, 2 < b ? a.skinWeights[d + 2] : 0, 3 < b ? a.skinWeights[d + 3] : 0));
        if (a.skinIndices)
            for (d = 0, g = a.skinIndices.length; d < g; d += b) c.skinIndices.push(new THREE.Vector4(a.skinIndices[d], 1 < b ? a.skinIndices[d + 1] : 0, 2 < b ? a.skinIndices[d + 2] : 0, 3 < b ? a.skinIndices[d + 3] : 0));
        c.bones = a.bones;
        c.bones && 0 < c.bones.length && (c.skinWeights.length !== c.skinIndices.length || c.skinIndices.length !== c.vertices.length) && console.warn("When skinning, number of vertices (" + c.vertices.length + "), skinIndices (" + c.skinIndices.length + "), and skinWeights (" + c.skinWeights.length + ") should match.");
        c.animation = a.animation;
        c.animations = a.animations
    })();
    (function(b) {
        if (void 0 !== a.morphTargets) {
            var d, g, h, k, n, p;
            d = 0;
            for (g = a.morphTargets.length; d < g; d++)
                for (c.morphTargets[d] = {}, c.morphTargets[d].name = a.morphTargets[d].name, c.morphTargets[d].vertices = [], n = c.morphTargets[d].vertices, p = a.morphTargets[d].vertices, h = 0, k = p.length; h < k; h += 3) {
                    var q = new THREE.Vector3;
                    q.x = p[h] * b;
                    q.y = p[h + 1] * b;
                    q.z = p[h + 2] * b;
                    n.push(q)
                }
        }
        if (void 0 !== a.morphColors)
            for (d = 0, g = a.morphColors.length; d < g; d++)
                for (c.morphColors[d] = {}, c.morphColors[d].name = a.morphColors[d].name, c.morphColors[d].colors = [], k = c.morphColors[d].colors, n = a.morphColors[d].colors, b = 0, h = n.length; b < h; b += 3) p = new THREE.Color(16755200), p.setRGB(n[b], n[b + 1], n[b + 2]), k.push(p)
    })(d);
    c.computeFaceNormals();
    c.computeBoundingSphere();
    if (void 0 === a.materials || 0 === a.materials.length) return {
        geometry: c
    };
    d = this.initMaterials(a.materials, b);
    this.needsTangents(d) && c.computeTangents();
    return {
        geometry: c,
        materials: d
    }
};
THREE.LoadingManager = function(a, b, c) {
    var d = this,
        e = 0,
        f = 0;
    this.onLoad = a;
    this.onProgress = b;
    this.onError = c;
    this.itemStart = function(a) {
        f++
    };
    this.itemEnd = function(a) {
        e++;
        if (void 0 !== d.onProgress) d.onProgress(a, e, f);
        if (e === f && void 0 !== d.onLoad) d.onLoad()
    }
};
THREE.DefaultLoadingManager = new THREE.LoadingManager;
THREE.BufferGeometryLoader = function(a) {
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.BufferGeometryLoader.prototype = {
    constructor: THREE.BufferGeometryLoader,
    load: function(a, b, c, d) {
        var e = this,
            f = new THREE.XHRLoader;
        f.setCrossOrigin(this.crossOrigin);
        f.load(a, function(a) {
            b(e.parse(JSON.parse(a)))
        }, c, d)
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    },
    parse: function(a) {
        var b = new THREE.BufferGeometry,
            c = a.attributes,
            d;
        for (d in c) {
            var e = c[d],
                f = new self[e.type](e.array);
            b.addAttribute(d, new THREE.BufferAttribute(f, e.itemSize))
        }
        c = a.offsets;
        void 0 !== c && (b.offsets = JSON.parse(JSON.stringify(c)));
        a = a.boundingSphere;
        void 0 !== a && (c = new THREE.Vector3, void 0 !== a.center && c.fromArray(a.center), b.boundingSphere = new THREE.Sphere(c, a.radius));
        return b
    }
};
THREE.MaterialLoader = function(a) {
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.MaterialLoader.prototype = {
    constructor: THREE.MaterialLoader,
    load: function(a, b, c, d) {
        var e = this,
            f = new THREE.XHRLoader;
        f.setCrossOrigin(this.crossOrigin);
        f.load(a, function(a) {
            b(e.parse(JSON.parse(a)))
        }, c, d)
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    },
    parse: function(a) {
        var b = new THREE[a.type];
        void 0 !== a.color && b.color.setHex(a.color);
        void 0 !== a.ambient && b.ambient.setHex(a.ambient);
        void 0 !== a.emissive && b.emissive.setHex(a.emissive);
        void 0 !== a.specular && b.specular.setHex(a.specular);
        void 0 !== a.shininess && (b.shininess = a.shininess);
        void 0 !== a.uniforms && (b.uniforms = a.uniforms);
        void 0 !== a.vertexShader && (b.vertexShader = a.vertexShader);
        void 0 !== a.fragmentShader && (b.fragmentShader = a.fragmentShader);
        void 0 !== a.vertexColors && (b.vertexColors = a.vertexColors);
        void 0 !== a.shading && (b.shading = a.shading);
        void 0 !== a.blending && (b.blending = a.blending);
        void 0 !== a.side && (b.side = a.side);
        void 0 !== a.opacity && (b.opacity = a.opacity);
        void 0 !== a.transparent && (b.transparent = a.transparent);
        void 0 !== a.wireframe && (b.wireframe = a.wireframe);
        if (void 0 !== a.materials)
            for (var c = 0, d = a.materials.length; c < d; c++) b.materials.push(this.parse(a.materials[c]));
        return b
    }
};
THREE.ObjectLoader = function(a) {
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.ObjectLoader.prototype = {
    constructor: THREE.ObjectLoader,
    load: function(a, b, c, d) {
        var e = this,
            f = new THREE.XHRLoader(e.manager);
        f.setCrossOrigin(this.crossOrigin);
        f.load(a, function(a) {
            b(e.parse(JSON.parse(a)))
        }, c, d)
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    },
    parse: function(a) {
        var b = this.parseGeometries(a.geometries),
            c = this.parseMaterials(a.materials);
        return this.parseObject(a.object, b, c)
    },
    parseGeometries: function(a) {
        var b = {};
        if (void 0 !== a)
            for (var c = new THREE.JSONLoader, d = new THREE.BufferGeometryLoader, e = 0, f = a.length; e < f; e++) {
                var g, h = a[e];
                switch (h.type) {
                    case "PlaneGeometry":
                        g = new THREE.PlaneGeometry(h.width, h.height, h.widthSegments, h.heightSegments);
                        break;
                    case "BoxGeometry":
                    case "CubeGeometry":
                        g = new THREE.BoxGeometry(h.width, h.height, h.depth, h.widthSegments, h.heightSegments, h.depthSegments);
                        break;
                    case "CircleGeometry":
                        g = new THREE.CircleGeometry(h.radius, h.segments);
                        break;
                    case "CylinderGeometry":
                        g = new THREE.CylinderGeometry(h.radiusTop, h.radiusBottom, h.height, h.radialSegments, h.heightSegments, h.openEnded);
                        break;
                    case "SphereGeometry":
                        g = new THREE.SphereGeometry(h.radius, h.widthSegments, h.heightSegments, h.phiStart, h.phiLength, h.thetaStart, h.thetaLength);
                        break;
                    case "IcosahedronGeometry":
                        g = new THREE.IcosahedronGeometry(h.radius, h.detail);
                        break;
                    case "TorusGeometry":
                        g = new THREE.TorusGeometry(h.radius, h.tube, h.radialSegments, h.tubularSegments, h.arc);
                        break;
                    case "TorusKnotGeometry":
                        g = new THREE.TorusKnotGeometry(h.radius, h.tube, h.radialSegments, h.tubularSegments, h.p, h.q, h.heightScale);
                        break;
                    case "BufferGeometry":
                        g = d.parse(h.data);
                        break;
                    case "Geometry":
                        g = c.parse(h.data).geometry
                }
                g.uuid = h.uuid;
                void 0 !== h.name && (g.name = h.name);
                b[h.uuid] = g
            }
        return b
    },
    parseMaterials: function(a) {
        var b = {};
        if (void 0 !== a)
            for (var c = new THREE.MaterialLoader, d = 0, e = a.length; d < e; d++) {
                var f = a[d],
                    g = c.parse(f);
                g.uuid = f.uuid;
                void 0 !== f.name && (g.name = f.name);
                b[f.uuid] = g
            }
        return b
    },
    parseObject: function() {
        var a = new THREE.Matrix4;
        return function(b, c, d) {
            var e;
            switch (b.type) {
                case "Scene":
                    e = new THREE.Scene;
                    break;
                case "PerspectiveCamera":
                    e = new THREE.PerspectiveCamera(b.fov, b.aspect, b.near, b.far);
                    break;
                case "OrthographicCamera":
                    e = new THREE.OrthographicCamera(b.left, b.right, b.top, b.bottom, b.near, b.far);
                    break;
                case "AmbientLight":
                    e = new THREE.AmbientLight(b.color);
                    break;
                case "DirectionalLight":
                    e = new THREE.DirectionalLight(b.color, b.intensity);
                    break;
                case "PointLight":
                    e = new THREE.PointLight(b.color, b.intensity, b.distance);
                    break;
                case "SpotLight":
                    e = new THREE.SpotLight(b.color, b.intensity, b.distance, b.angle, b.exponent);
                    break;
                case "HemisphereLight":
                    e = new THREE.HemisphereLight(b.color, b.groundColor, b.intensity);
                    break;
                case "Mesh":
                    e = c[b.geometry];
                    var f = d[b.material];
                    void 0 === e && console.warn("THREE.ObjectLoader: Undefined geometry", b.geometry);
                    void 0 === f && console.warn("THREE.ObjectLoader: Undefined material", b.material);
                    e = new THREE.Mesh(e, f);
                    break;
                case "Line":
                    e = c[b.geometry];
                    f = d[b.material];
                    void 0 === e && console.warn("THREE.ObjectLoader: Undefined geometry", b.geometry);
                    void 0 === f && console.warn("THREE.ObjectLoader: Undefined material", b.material);
                    e = new THREE.Line(e, f);
                    break;
                case "Sprite":
                    f = d[b.material];
                    void 0 === f && console.warn("THREE.ObjectLoader: Undefined material", b.material);
                    e = new THREE.Sprite(f);
                    break;
                case "Group":
                    e = new THREE.Group;
                    break;
                default:
                    e = new THREE.Object3D
            }
            e.uuid = b.uuid;
            void 0 !== b.name && (e.name = b.name);
            void 0 !== b.matrix ? (a.fromArray(b.matrix), a.decompose(e.position, e.quaternion, e.scale)) : (void 0 !== b.position && e.position.fromArray(b.position), void 0 !== b.rotation && e.rotation.fromArray(b.rotation), void 0 !== b.scale && e.scale.fromArray(b.scale));
            void 0 !== b.visible && (e.visible = b.visible);
            void 0 !== b.userData && (e.userData = b.userData);
            if (void 0 !== b.children)
                for (var g in b.children) e.add(this.parseObject(b.children[g], c, d));
            return e
        }
    }()
};
THREE.TextureLoader = function(a) {
    this.manager = void 0 !== a ? a : THREE.DefaultLoadingManager
};
THREE.TextureLoader.prototype = {
    constructor: THREE.TextureLoader,
    load: function(a, b, c, d) {
        var e = new THREE.ImageLoader(this.manager);
        e.setCrossOrigin(this.crossOrigin);
        e.load(a, function(a) {
            a = new THREE.Texture(a);
            a.needsUpdate = !0;
            void 0 !== b && b(a)
        }, c, d)
    },
    setCrossOrigin: function(a) {
        this.crossOrigin = a
    }
};
THREE.CompressedTextureLoader = function() {
    this._parser = null
};
THREE.CompressedTextureLoader.prototype = {
    constructor: THREE.CompressedTextureLoader,
    load: function(a, b, c) {
        var d = this,
            e = [],
            f = new THREE.CompressedTexture;
        f.image = e;
        var g = new THREE.XHRLoader;
        g.setResponseType("arraybuffer");
        if (a instanceof Array) {
            var h = 0;
            c = function(c) {
                g.load(a[c], function(a) {
                    a = d._parser(a, !0);
                    e[c] = {
                        width: a.width,
                        height: a.height,
                        format: a.format,
                        mipmaps: a.mipmaps
                    };
                    h += 1;
                    6 === h && (1 == a.mipmapCount && (f.minFilter = THREE.LinearFilter), f.format = a.format, f.needsUpdate = !0, b && b(f))
                })
            };
            for (var k = 0, n = a.length; k < n; ++k) c(k)
        } else g.load(a, function(a) {
            a = d._parser(a, !0);
            if (a.isCubemap)
                for (var c = a.mipmaps.length / a.mipmapCount, g = 0; g < c; g++) {
                    e[g] = {
                        mipmaps: []
                    };
                    for (var h = 0; h < a.mipmapCount; h++) e[g].mipmaps.push(a.mipmaps[g * a.mipmapCount + h]), e[g].format = a.format, e[g].width = a.width, e[g].height = a.height
                } else f.image.width = a.width, f.image.height = a.height, f.mipmaps = a.mipmaps;
            1 === a.mipmapCount && (f.minFilter = THREE.LinearFilter);
            f.format = a.format;
            f.needsUpdate = !0;
            b && b(f)
        });
        return f
    }
};
THREE.Material = function() {
    Object.defineProperty(this, "id", {
        value: THREE.MaterialIdCount++
    });
    this.uuid = THREE.Math.generateUUID();
    this.name = "";
    this.type = "Material";
    this.side = THREE.FrontSide;
    this.opacity = 1;
    this.transparent = !1;
    this.blending = THREE.NormalBlending;
    this.blendSrc = THREE.SrcAlphaFactor;
    this.blendDst = THREE.OneMinusSrcAlphaFactor;
    this.blendEquation = THREE.AddEquation;
    this.depthWrite = this.depthTest = !0;
    this.polygonOffset = !1;
    this.overdraw = this.alphaTest = this.polygonOffsetUnits = this.polygonOffsetFactor = 0;
    this.needsUpdate = this.visible = !0
};
THREE.Material.prototype = {
    constructor: THREE.Material,
    setValues: function(a) {
        if (void 0 !== a)
            for (var b in a) {
                var c = a[b];
                if (void 0 === c) console.warn("THREE.Material: '" + b + "' parameter is undefined.");
                else if (b in this) {
                    var d = this[b];
                    d instanceof THREE.Color ? d.set(c) : d instanceof THREE.Vector3 && c instanceof THREE.Vector3 ? d.copy(c) : this[b] = "overdraw" == b ? Number(c) : c
                }
            }
    },
    toJSON: function() {
        var a = {
            metadata: {
                version: 4.2,
                type: "material",
                generator: "MaterialExporter"
            },
            uuid: this.uuid,
            type: this.type
        };
        "" !== this.name && (a.name = this.name);
        this instanceof THREE.MeshBasicMaterial ? (a.color = this.color.getHex(), this.vertexColors !== THREE.NoColors && (a.vertexColors = this.vertexColors), this.blending !== THREE.NormalBlending && (a.blending = this.blending), this.side !== THREE.FrontSide && (a.side = this.side)) : this instanceof THREE.MeshLambertMaterial ? (a.color = this.color.getHex(), a.ambient = this.ambient.getHex(), a.emissive = this.emissive.getHex(), this.vertexColors !== THREE.NoColors && (a.vertexColors = this.vertexColors), this.blending !== THREE.NormalBlending && (a.blending = this.blending), this.side !== THREE.FrontSide && (a.side = this.side)) : this instanceof THREE.MeshPhongMaterial ? (a.color = this.color.getHex(), a.ambient = this.ambient.getHex(), a.emissive = this.emissive.getHex(), a.specular = this.specular.getHex(), a.shininess = this.shininess, this.vertexColors !== THREE.NoColors && (a.vertexColors = this.vertexColors), this.blending !== THREE.NormalBlending && (a.blending = this.blending), this.side !== THREE.FrontSide && (a.side = this.side)) : this instanceof THREE.MeshNormalMaterial ? (this.shading !== THREE.FlatShading && (a.shading = this.shading), this.blending !== THREE.NormalBlending && (a.blending = this.blending), this.side !== THREE.FrontSide && (a.side = this.side)) : this instanceof THREE.MeshDepthMaterial ? (this.blending !== THREE.NormalBlending && (a.blending = this.blending), this.side !== THREE.FrontSide && (a.side = this.side)) : this instanceof THREE.ShaderMaterial ? (a.uniforms = this.uniforms, a.vertexShader = this.vertexShader, a.fragmentShader = this.fragmentShader) : this instanceof THREE.SpriteMaterial && (a.color = this.color.getHex());
        1 > this.opacity && (a.opacity = this.opacity);
        !1 !== this.transparent && (a.transparent = this.transparent);
        !1 !== this.wireframe && (a.wireframe = this.wireframe);
        return a
    },
    clone: function(a) {
        void 0 === a && (a = new THREE.Material);
        a.name = this.name;
        a.side = this.side;
        a.opacity = this.opacity;
        a.transparent = this.transparent;
        a.blending = this.blending;
        a.blendSrc = this.blendSrc;
        a.blendDst = this.blendDst;
        a.blendEquation = this.blendEquation;
        a.depthTest = this.depthTest;
        a.depthWrite = this.depthWrite;
        a.polygonOffset = this.polygonOffset;
        a.polygonOffsetFactor = this.polygonOffsetFactor;
        a.polygonOffsetUnits = this.polygonOffsetUnits;
        a.alphaTest = this.alphaTest;
        a.overdraw = this.overdraw;
        a.visible = this.visible;
        return a
    },
    dispose: function() {
        this.dispatchEvent({
            type: "dispose"
        })
    }
};
THREE.EventDispatcher.prototype.apply(THREE.Material.prototype);
THREE.MaterialIdCount = 0;
THREE.LineBasicMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "LineBasicMaterial";
    this.color = new THREE.Color(16777215);
    this.linewidth = 1;
    this.linejoin = this.linecap = "round";
    this.vertexColors = THREE.NoColors;
    this.fog = !0;
    this.setValues(a)
};
THREE.LineBasicMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.LineBasicMaterial.prototype.clone = function() {
    var a = new THREE.LineBasicMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.linewidth = this.linewidth;
    a.linecap = this.linecap;
    a.linejoin = this.linejoin;
    a.vertexColors = this.vertexColors;
    a.fog = this.fog;
    return a
};
THREE.LineDashedMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "LineDashedMaterial";
    this.color = new THREE.Color(16777215);
    this.scale = this.linewidth = 1;
    this.dashSize = 3;
    this.gapSize = 1;
    this.vertexColors = !1;
    this.fog = !0;
    this.setValues(a)
};
THREE.LineDashedMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.LineDashedMaterial.prototype.clone = function() {
    var a = new THREE.LineDashedMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.linewidth = this.linewidth;
    a.scale = this.scale;
    a.dashSize = this.dashSize;
    a.gapSize = this.gapSize;
    a.vertexColors = this.vertexColors;
    a.fog = this.fog;
    return a
};
THREE.MeshBasicMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "MeshBasicMaterial";
    this.color = new THREE.Color(16777215);
    this.envMap = this.alphaMap = this.specularMap = this.lightMap = this.map = null;
    this.combine = THREE.MultiplyOperation;
    this.reflectivity = 1;
    this.refractionRatio = .98;
    this.fog = !0;
    this.shading = THREE.SmoothShading;
    this.wireframe = !1;
    this.wireframeLinewidth = 1;
    this.wireframeLinejoin = this.wireframeLinecap = "round";
    this.vertexColors = THREE.NoColors;
    this.morphTargets = this.skinning = !1;
    this.setValues(a)
};
THREE.MeshBasicMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshBasicMaterial.prototype.clone = function() {
    var a = new THREE.MeshBasicMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.map = this.map;
    a.lightMap = this.lightMap;
    a.specularMap = this.specularMap;
    a.alphaMap = this.alphaMap;
    a.envMap = this.envMap;
    a.combine = this.combine;
    a.reflectivity = this.reflectivity;
    a.refractionRatio = this.refractionRatio;
    a.fog = this.fog;
    a.shading = this.shading;
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    a.wireframeLinecap = this.wireframeLinecap;
    a.wireframeLinejoin = this.wireframeLinejoin;
    a.vertexColors = this.vertexColors;
    a.skinning = this.skinning;
    a.morphTargets = this.morphTargets;
    return a
};
THREE.MeshLambertMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "MeshLambertMaterial";
    this.color = new THREE.Color(16777215);
    this.ambient = new THREE.Color(16777215);
    this.emissive = new THREE.Color(0);
    this.wrapAround = !1;
    this.wrapRGB = new THREE.Vector3(1, 1, 1);
    this.envMap = this.alphaMap = this.specularMap = this.lightMap = this.map = null;
    this.combine = THREE.MultiplyOperation;
    this.reflectivity = 1;
    this.refractionRatio = .98;
    this.fog = !0;
    this.shading = THREE.SmoothShading;
    this.wireframe = !1;
    this.wireframeLinewidth = 1;
    this.wireframeLinejoin = this.wireframeLinecap = "round";
    this.vertexColors = THREE.NoColors;
    this.morphNormals = this.morphTargets = this.skinning = !1;
    this.setValues(a)
};
THREE.MeshLambertMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshLambertMaterial.prototype.clone = function() {
    var a = new THREE.MeshLambertMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.ambient.copy(this.ambient);
    a.emissive.copy(this.emissive);
    a.wrapAround = this.wrapAround;
    a.wrapRGB.copy(this.wrapRGB);
    a.map = this.map;
    a.lightMap = this.lightMap;
    a.specularMap = this.specularMap;
    a.alphaMap = this.alphaMap;
    a.envMap = this.envMap;
    a.combine = this.combine;
    a.reflectivity = this.reflectivity;
    a.refractionRatio = this.refractionRatio;
    a.fog = this.fog;
    a.shading = this.shading;
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    a.wireframeLinecap = this.wireframeLinecap;
    a.wireframeLinejoin = this.wireframeLinejoin;
    a.vertexColors = this.vertexColors;
    a.skinning = this.skinning;
    a.morphTargets = this.morphTargets;
    a.morphNormals = this.morphNormals;
    return a
};
THREE.MeshPhongMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "MeshPhongMaterial";
    this.color = new THREE.Color(16777215);
    this.ambient = new THREE.Color(16777215);
    this.emissive = new THREE.Color(0);
    this.specular = new THREE.Color(1118481);
    this.shininess = 30;
    this.wrapAround = this.metal = !1;
    this.wrapRGB = new THREE.Vector3(1, 1, 1);
    this.bumpMap = this.lightMap = this.map = null;
    this.bumpScale = 1;
    this.normalMap = null;
    this.normalScale = new THREE.Vector2(1, 1);
    this.envMap = this.alphaMap = this.specularMap = null;
    this.combine = THREE.MultiplyOperation;
    this.reflectivity = 1;
    this.refractionRatio = .98;
    this.fog = !0;
    this.shading = THREE.SmoothShading;
    this.wireframe = !1;
    this.wireframeLinewidth = 1;
    this.wireframeLinejoin = this.wireframeLinecap = "round";
    this.vertexColors = THREE.NoColors;
    this.morphNormals = this.morphTargets = this.skinning = !1;
    this.setValues(a)
};
THREE.MeshPhongMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshPhongMaterial.prototype.clone = function() {
    var a = new THREE.MeshPhongMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.ambient.copy(this.ambient);
    a.emissive.copy(this.emissive);
    a.specular.copy(this.specular);
    a.shininess = this.shininess;
    a.metal = this.metal;
    a.wrapAround = this.wrapAround;
    a.wrapRGB.copy(this.wrapRGB);
    a.map = this.map;
    a.lightMap = this.lightMap;
    a.bumpMap = this.bumpMap;
    a.bumpScale = this.bumpScale;
    a.normalMap = this.normalMap;
    a.normalScale.copy(this.normalScale);
    a.specularMap = this.specularMap;
    a.alphaMap = this.alphaMap;
    a.envMap = this.envMap;
    a.combine = this.combine;
    a.reflectivity = this.reflectivity;
    a.refractionRatio = this.refractionRatio;
    a.fog = this.fog;
    a.shading = this.shading;
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    a.wireframeLinecap = this.wireframeLinecap;
    a.wireframeLinejoin = this.wireframeLinejoin;
    a.vertexColors = this.vertexColors;
    a.skinning = this.skinning;
    a.morphTargets = this.morphTargets;
    a.morphNormals = this.morphNormals;
    return a
};
THREE.MeshDepthMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "MeshDepthMaterial";
    this.wireframe = this.morphTargets = !1;
    this.wireframeLinewidth = 1;
    this.setValues(a)
};
THREE.MeshDepthMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshDepthMaterial.prototype.clone = function() {
    var a = new THREE.MeshDepthMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    return a
};
THREE.MeshNormalMaterial = function(a) {
    THREE.Material.call(this, a);
    this.type = "MeshNormalMaterial";
    this.shading = THREE.FlatShading;
    this.wireframe = !1;
    this.wireframeLinewidth = 1;
    this.morphTargets = !1;
    this.setValues(a)
};
THREE.MeshNormalMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.MeshNormalMaterial.prototype.clone = function() {
    var a = new THREE.MeshNormalMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.shading = this.shading;
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    return a
};
THREE.MeshFaceMaterial = function(a) {
    this.uuid = THREE.Math.generateUUID();
    this.type = "MeshFaceMaterial";
    this.materials = a instanceof Array ? a : []
};
THREE.MeshFaceMaterial.prototype = {
    constructor: THREE.MeshFaceMaterial,
    toJSON: function() {
        for (var a = {
                metadata: {
                    version: 4.2,
                    type: "material",
                    generator: "MaterialExporter"
                },
                uuid: this.uuid,
                type: this.type,
                materials: []
            }, b = 0, c = this.materials.length; b < c; b++) a.materials.push(this.materials[b].toJSON());
        return a
    },
    clone: function() {
        for (var a = new THREE.MeshFaceMaterial, b = 0; b < this.materials.length; b++) a.materials.push(this.materials[b].clone());
        return a
    }
};
THREE.PointCloudMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "PointCloudMaterial";
    this.color = new THREE.Color(16777215);
    this.map = null;
    this.size = 1;
    this.sizeAttenuation = !0;
    this.vertexColors = THREE.NoColors;
    this.fog = !0;
    this.setValues(a)
};
THREE.PointCloudMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.PointCloudMaterial.prototype.clone = function() {
    var a = new THREE.PointCloudMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.map = this.map;
    a.size = this.size;
    a.sizeAttenuation = this.sizeAttenuation;
    a.vertexColors = this.vertexColors;
    a.fog = this.fog;
    return a
};
THREE.ParticleBasicMaterial = function(a) {
    console.warn("THREE.ParticleBasicMaterial has been renamed to THREE.PointCloudMaterial.");
    return new THREE.PointCloudMaterial(a)
};
THREE.ParticleSystemMaterial = function(a) {
    console.warn("THREE.ParticleSystemMaterial has been renamed to THREE.PointCloudMaterial.");
    return new THREE.PointCloudMaterial(a)
};
THREE.ShaderMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "ShaderMaterial";
    this.defines = {};
    this.uniforms = {};
    this.attributes = null;
    this.vertexShader = "void main() {\n    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}";
    this.fragmentShader = "void main() {\n  gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}";
    this.shading = THREE.SmoothShading;
    this.linewidth = 1;
    this.wireframe = !1;
    this.wireframeLinewidth = 1;
    this.lights = this.fog = !1;
    this.vertexColors = THREE.NoColors;
    this.morphNormals = this.morphTargets = this.skinning = !1;
    this.defaultAttributeValues = {
        color: [1, 1, 1],
        uv: [0, 0],
        uv2: [0, 0]
    };
    this.index0AttributeName = void 0;
    this.setValues(a)
};
THREE.ShaderMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.ShaderMaterial.prototype.clone = function() {
    var a = new THREE.ShaderMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.fragmentShader = this.fragmentShader;
    a.vertexShader = this.vertexShader;
    a.uniforms = THREE.UniformsUtils.clone(this.uniforms);
    a.attributes = this.attributes;
    a.defines = this.defines;
    a.shading = this.shading;
    a.wireframe = this.wireframe;
    a.wireframeLinewidth = this.wireframeLinewidth;
    a.fog = this.fog;
    a.lights = this.lights;
    a.vertexColors = this.vertexColors;
    a.skinning = this.skinning;
    a.morphTargets = this.morphTargets;
    a.morphNormals = this.morphNormals;
    return a
};
THREE.RawShaderMaterial = function(a) {
    THREE.ShaderMaterial.call(this, a);
    this.type = "RawShaderMaterial"
};
THREE.RawShaderMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
THREE.RawShaderMaterial.prototype.clone = function() {
    var a = new THREE.RawShaderMaterial;
    THREE.ShaderMaterial.prototype.clone.call(this, a);
    return a
};
THREE.SpriteMaterial = function(a) {
    THREE.Material.call(this);
    this.type = "SpriteMaterial";
    this.color = new THREE.Color(16777215);
    this.map = null;
    this.rotation = 0;
    this.fog = !1;
    this.setValues(a)
};
THREE.SpriteMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.SpriteMaterial.prototype.clone = function() {
    var a = new THREE.SpriteMaterial;
    THREE.Material.prototype.clone.call(this, a);
    a.color.copy(this.color);
    a.map = this.map;
    a.rotation = this.rotation;
    a.fog = this.fog;
    return a
};
THREE.Texture = function(a, b, c, d, e, f, g, h, k) {
    Object.defineProperty(this, "id", {
        value: THREE.TextureIdCount++
    });
    this.uuid = THREE.Math.generateUUID();
    this.name = "";
    this.image = void 0 !== a ? a : THREE.Texture.DEFAULT_IMAGE;
    this.mipmaps = [];
    this.mapping = void 0 !== b ? b : THREE.Texture.DEFAULT_MAPPING;
    this.wrapS = void 0 !== c ? c : THREE.ClampToEdgeWrapping;
    this.wrapT = void 0 !== d ? d : THREE.ClampToEdgeWrapping;
    this.magFilter = void 0 !== e ? e : THREE.LinearFilter;
    this.minFilter = void 0 !== f ? f : THREE.LinearMipMapLinearFilter;
    this.anisotropy = void 0 !== k ? k : 1;
    this.format = void 0 !== g ? g : THREE.RGBAFormat;
    this.type = void 0 !== h ? h : THREE.UnsignedByteType;
    this.offset = new THREE.Vector2(0, 0);
    this.repeat = new THREE.Vector2(1, 1);
    this.generateMipmaps = !0;
    this.premultiplyAlpha = !1;
    this.flipY = !0;
    this.unpackAlignment = 4;
    this._needsUpdate = !1;
    this.onUpdate = null
};
THREE.Texture.DEFAULT_IMAGE = void 0;
THREE.Texture.DEFAULT_MAPPING = new THREE.UVMapping;
THREE.Texture.prototype = {
    constructor: THREE.Texture,
    get needsUpdate() {
        return this._needsUpdate
    },
    set needsUpdate(a) {
        !0 === a && this.update();
        this._needsUpdate = a
    },
    clone: function(a) {
        void 0 === a && (a = new THREE.Texture);
        a.image = this.image;
        a.mipmaps = this.mipmaps.slice(0);
        a.mapping = this.mapping;
        a.wrapS = this.wrapS;
        a.wrapT = this.wrapT;
        a.magFilter = this.magFilter;
        a.minFilter = this.minFilter;
        a.anisotropy = this.anisotropy;
        a.format = this.format;
        a.type = this.type;
        a.offset.copy(this.offset);
        a.repeat.copy(this.repeat);
        a.generateMipmaps = this.generateMipmaps;
        a.premultiplyAlpha = this.premultiplyAlpha;
        a.flipY = this.flipY;
        a.unpackAlignment = this.unpackAlignment;
        return a
    },
    update: function() {
        this.dispatchEvent({
            type: "update"
        })
    },
    dispose: function() {
        this.dispatchEvent({
            type: "dispose"
        })
    }
};
THREE.EventDispatcher.prototype.apply(THREE.Texture.prototype);
THREE.TextureIdCount = 0;
THREE.CubeTexture = function(a, b, c, d, e, f, g, h, k) {
    THREE.Texture.call(this, a, b, c, d, e, f, g, h, k);
    this.images = a
};
THREE.CubeTexture.prototype = Object.create(THREE.Texture.prototype);
THREE.CubeTexture.clone = function(a) {
    void 0 === a && (a = new THREE.CubeTexture);
    THREE.Texture.prototype.clone.call(this, a);
    a.images = this.images;
    return a
};
THREE.CompressedTexture = function(a, b, c, d, e, f, g, h, k, n, p) {
    THREE.Texture.call(this, null, f, g, h, k, n, d, e, p);
    this.image = {
        width: b,
        height: c
    };
    this.mipmaps = a;
    this.generateMipmaps = this.flipY = !1
};
THREE.CompressedTexture.prototype = Object.create(THREE.Texture.prototype);
THREE.CompressedTexture.prototype.clone = function() {
    var a = new THREE.CompressedTexture;
    THREE.Texture.prototype.clone.call(this, a);
    return a
};
THREE.DataTexture = function(a, b, c, d, e, f, g, h, k, n, p) {
    THREE.Texture.call(this, null, f, g, h, k, n, d, e, p);
    this.image = {
        data: a,
        width: b,
        height: c
    }
};
THREE.DataTexture.prototype = Object.create(THREE.Texture.prototype);
THREE.DataTexture.prototype.clone = function() {
    var a = new THREE.DataTexture;
    THREE.Texture.prototype.clone.call(this, a);
    return a
};
THREE.VideoTexture = function(a, b, c, d, e, f, g, h, k) {
    THREE.Texture.call(this, a, b, c, d, e, f, g, h, k);
    this.generateMipmaps = !1;
    var n = this,
        p = function() {
            requestAnimationFrame(p);
            a.readyState === a.HAVE_ENOUGH_DATA && (n.needsUpdate = !0)
        };
    p()
};
THREE.VideoTexture.prototype = Object.create(THREE.Texture.prototype);
THREE.Group = function() {
    THREE.Object3D.call(this);
    this.type = "Group"
};
THREE.Group.prototype = Object.create(THREE.Object3D.prototype);
THREE.PointCloud = function(a, b) {
    THREE.Object3D.call(this);
    this.type = "PointCloud";
    this.geometry = void 0 !== a ? a : new THREE.Geometry;
    this.material = void 0 !== b ? b : new THREE.PointCloudMaterial({
        color: 16777215 * Math.random()
    });
    this.sortParticles = !1
};
THREE.PointCloud.prototype = Object.create(THREE.Object3D.prototype);
THREE.PointCloud.prototype.raycast = function() {
    var a = new THREE.Matrix4,
        b = new THREE.Ray;
    return function(c, d) {
        var e = this,
            f = e.geometry,
            g = c.params.PointCloud.threshold;
        a.getInverse(this.matrixWorld);
        b.copy(c.ray).applyMatrix4(a);
        if (null === f.boundingBox || !1 !== b.isIntersectionBox(f.boundingBox)) {
            var h = g / ((this.scale.x + this.scale.y + this.scale.z) / 3),
                k = new THREE.Vector3,
                g = function(a, f) {
                    var g = b.distanceToPoint(a);
                    if (g < h) {
                        var k = b.closestPointToPoint(a);
                        k.applyMatrix4(e.matrixWorld);
                        var m = c.ray.origin.distanceTo(k);
                        d.push({
                            distance: m,
                            distanceToRay: g,
                            point: k.clone(),
                            index: f,
                            face: null,
                            object: e
                        })
                    }
                };
            if (f instanceof THREE.BufferGeometry) {
                var n = f.attributes,
                    p = n.position.array;
                if (void 0 !== n.index) {
                    var n = n.index.array,
                        q = f.offsets;
                    0 === q.length && (q = [{
                        start: 0,
                        count: n.length,
                        index: 0
                    }]);
                    for (var m = 0, r = q.length; m < r; ++m)
                        for (var t = q[m].start, s = q[m].index, f = t, t = t + q[m].count; f < t; f++) {
                            var u = s + n[f];
                            k.fromArray(p, 3 * u);
                            g(k, u)
                        }
                } else
                    for (n = p.length / 3, f = 0; f < n; f++) k.set(p[3 * f], p[3 * f + 1], p[3 * f + 2]), g(k, f)
            } else
                for (k = this.geometry.vertices, f = 0; f < k.length; f++) g(k[f], f)
        }
    }
}();
THREE.PointCloud.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.PointCloud(this.geometry, this.material));
    a.sortParticles = this.sortParticles;
    THREE.Object3D.prototype.clone.call(this, a);
    return a
};
THREE.ParticleSystem = function(a, b) {
    console.warn("THREE.ParticleSystem has been renamed to THREE.PointCloud.");
    return new THREE.PointCloud(a, b)
};
THREE.Line = function(a, b, c) {
    THREE.Object3D.call(this);
    this.type = "Line";
    this.geometry = void 0 !== a ? a : new THREE.Geometry;
    this.material = void 0 !== b ? b : new THREE.LineBasicMaterial({
        color: 16777215 * Math.random()
    });
    this.mode = void 0 !== c ? c : THREE.LineStrip
};
THREE.LineStrip = 0;
THREE.LinePieces = 1;
THREE.Line.prototype = Object.create(THREE.Object3D.prototype);
THREE.Line.prototype.raycast = function() {
    var a = new THREE.Matrix4,
        b = new THREE.Ray,
        c = new THREE.Sphere;
    return function(d, e) {
        var f = d.linePrecision,
            f = f * f,
            g = this.geometry;
        null === g.boundingSphere && g.computeBoundingSphere();
        c.copy(g.boundingSphere);
        c.applyMatrix4(this.matrixWorld);
        if (!1 !== d.ray.isIntersectionSphere(c) && (a.getInverse(this.matrixWorld), b.copy(d.ray).applyMatrix4(a), g instanceof THREE.Geometry))
            for (var g = g.vertices, h = g.length, k = new THREE.Vector3, n = new THREE.Vector3, p = this.mode === THREE.LineStrip ? 1 : 2, q = 0; q < h - 1; q += p)
                if (!(b.distanceSqToSegment(g[q], g[q + 1], n, k) > f)) {
                    var m = b.origin.distanceTo(n);
                    m < d.near || m > d.far || e.push({
                        distance: m,
                        point: k.clone().applyMatrix4(this.matrixWorld),
                        face: null,
                        faceIndex: null,
                        object: this
                    })
                }
    }
}();
THREE.Line.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.Line(this.geometry, this.material, this.mode));
    THREE.Object3D.prototype.clone.call(this, a);
    return a
};
THREE.Mesh = function(a, b) {
    THREE.Object3D.call(this);
    this.type = "Mesh";
    this.geometry = void 0 !== a ? a : new THREE.Geometry;
    this.material = void 0 !== b ? b : new THREE.MeshBasicMaterial({
        color: 16777215 * Math.random()
    });
    this.updateMorphTargets()
};
THREE.Mesh.prototype = Object.create(THREE.Object3D.prototype);
THREE.Mesh.prototype.updateMorphTargets = function() {
    if (void 0 !== this.geometry.morphTargets && 0 < this.geometry.morphTargets.length) {
        this.morphTargetBase = -1;
        this.morphTargetForcedOrder = [];
        this.morphTargetInfluences = [];
        this.morphTargetDictionary = {};
        for (var a = 0, b = this.geometry.morphTargets.length; a < b; a++) this.morphTargetInfluences.push(0), this.morphTargetDictionary[this.geometry.morphTargets[a].name] = a
    }
};
THREE.Mesh.prototype.getMorphTargetIndexByName = function(a) {
    if (void 0 !== this.morphTargetDictionary[a]) return this.morphTargetDictionary[a];
    console.log("THREE.Mesh.getMorphTargetIndexByName: morph target " + a + " does not exist. Returning 0.");
    return 0
};
THREE.Mesh.prototype.raycast = function() {
    var a = new THREE.Matrix4,
        b = new THREE.Ray,
        c = new THREE.Sphere,
        d = new THREE.Vector3,
        e = new THREE.Vector3,
        f = new THREE.Vector3;
    return function(g, h) {
        var k = this.geometry;
        null === k.boundingSphere && k.computeBoundingSphere();
        c.copy(k.boundingSphere);
        c.applyMatrix4(this.matrixWorld);
        if (!1 !== g.ray.isIntersectionSphere(c) && (a.getInverse(this.matrixWorld), b.copy(g.ray).applyMatrix4(a), null === k.boundingBox || !1 !== b.isIntersectionBox(k.boundingBox)))
            if (k instanceof THREE.BufferGeometry) {
                var n = this.material;
                if (void 0 !== n) {
                    var p = k.attributes,
                        q, m, r = g.precision;
                    if (void 0 !== p.index) {
                        var t = p.index.array,
                            s = p.position.array,
                            u = k.offsets;
                        0 === u.length && (u = [{
                            start: 0,
                            count: t.length,
                            index: 0
                        }]);
                        for (var v = 0, y = u.length; v < y; ++v)
                            for (var p = u[v].start, G = u[v].index, k = p, w = p + u[v].count; k < w; k += 3) {
                                p = G + t[k];
                                q = G + t[k + 1];
                                m = G + t[k + 2];
                                d.fromArray(s, 3 * p);
                                e.fromArray(s, 3 * q);
                                f.fromArray(s, 3 * m);
                                var K = n.side === THREE.BackSide ? b.intersectTriangle(f, e, d, !0) : b.intersectTriangle(d, e, f, n.side !== THREE.DoubleSide);
                                if (null !== K) {
                                    K.applyMatrix4(this.matrixWorld);
                                    var x = g.ray.origin.distanceTo(K);
                                    x < r || x < g.near || x > g.far || h.push({
                                        distance: x,
                                        point: K,
                                        face: new THREE.Face3(p, q, m, THREE.Triangle.normal(d, e, f)),
                                        faceIndex: null,
                                        object: this
                                    })
                                }
                            }
                    } else
                        for (s = p.position.array, t = k = 0, w = s.length; k < w; k += 3, t += 9) p = k, q = k + 1, m = k + 2, d.fromArray(s, t), e.fromArray(s, t + 3), f.fromArray(s, t + 6), K = n.side === THREE.BackSide ? b.intersectTriangle(f, e, d, !0) : b.intersectTriangle(d, e, f, n.side !== THREE.DoubleSide), null !== K && (K.applyMatrix4(this.matrixWorld), x = g.ray.origin.distanceTo(K), x < r || x < g.near || x > g.far || h.push({
                            distance: x,
                            point: K,
                            face: new THREE.Face3(p, q, m, THREE.Triangle.normal(d, e, f)),
                            faceIndex: null,
                            object: this
                        }))
                }
            } else if (k instanceof THREE.Geometry)
            for (t = this.material instanceof THREE.MeshFaceMaterial, s = !0 === t ? this.material.materials : null, r = g.precision, u = k.vertices, v = 0, y = k.faces.length; v < y; v++)
                if (G = k.faces[v], n = !0 === t ? s[G.materialIndex] : this.material, void 0 !== n) {
                    p = u[G.a];
                    q = u[G.b];
                    m = u[G.c];
                    if (!0 === n.morphTargets) {
                        K = k.morphTargets;
                        x = this.morphTargetInfluences;
                        d.set(0, 0, 0);
                        e.set(0, 0, 0);
                        f.set(0, 0, 0);
                        for (var w = 0, D = K.length; w < D; w++) {
                            var E = x[w];
                            if (0 !== E) {
                                var A = K[w].vertices;
                                d.x += (A[G.a].x - p.x) * E;
                                d.y += (A[G.a].y - p.y) * E;
                                d.z += (A[G.a].z - p.z) * E;
                                e.x += (A[G.b].x - q.x) * E;
                                e.y += (A[G.b].y - q.y) * E;
                                e.z += (A[G.b].z - q.z) * E;
                                f.x += (A[G.c].x - m.x) * E;
                                f.y += (A[G.c].y - m.y) * E;
                                f.z += (A[G.c].z - m.z) * E
                            }
                        }
                        d.add(p);
                        e.add(q);
                        f.add(m);
                        p = d;
                        q = e;
                        m = f
                    }
                    K = n.side === THREE.BackSide ? b.intersectTriangle(m, q, p, !0) : b.intersectTriangle(p, q, m, n.side !== THREE.DoubleSide);
                    null !== K && (K.applyMatrix4(this.matrixWorld), x = g.ray.origin.distanceTo(K), x < r || x < g.near || x > g.far || h.push({
                        distance: x,
                        point: K,
                        face: G,
                        faceIndex: v,
                        object: this
                    }))
                }
    }
}();
THREE.Mesh.prototype.clone = function(a, b) {
    void 0 === a && (a = new THREE.Mesh(this.geometry, this.material));
    THREE.Object3D.prototype.clone.call(this, a, b);
    return a
};
THREE.Bone = function(a) {
    THREE.Object3D.call(this);
    this.skin = a
};
THREE.Bone.prototype = Object.create(THREE.Object3D.prototype);
THREE.Skeleton = function(a, b, c) {
    this.useVertexTexture = void 0 !== c ? c : !0;
    this.identityMatrix = new THREE.Matrix4;
    a = a || [];
    this.bones = a.slice(0);
    this.useVertexTexture ? (this.boneTextureHeight = this.boneTextureWidth = a = 256 < this.bones.length ? 64 : 64 < this.bones.length ? 32 : 16 < this.bones.length ? 16 : 8, this.boneMatrices = new Float32Array(this.boneTextureWidth * this.boneTextureHeight * 4), this.boneTexture = new THREE.DataTexture(this.boneMatrices, this.boneTextureWidth, this.boneTextureHeight, THREE.RGBAFormat, THREE.FloatType), this.boneTexture.minFilter = THREE.NearestFilter, this.boneTexture.magFilter = THREE.NearestFilter, this.boneTexture.generateMipmaps = !1, this.boneTexture.flipY = !1) : this.boneMatrices = new Float32Array(16 * this.bones.length);
    if (void 0 === b) this.calculateInverses();
    else if (this.bones.length === b.length) this.boneInverses = b.slice(0);
    else
        for (console.warn("THREE.Skeleton bonInverses is the wrong length."), this.boneInverses = [], b = 0, a = this.bones.length; b < a; b++) this.boneInverses.push(new THREE.Matrix4)
};
THREE.Skeleton.prototype.calculateInverses = function() {
    this.boneInverses = [];
    for (var a = 0, b = this.bones.length; a < b; a++) {
        var c = new THREE.Matrix4;
        this.bones[a] && c.getInverse(this.bones[a].matrixWorld);
        this.boneInverses.push(c)
    }
};
THREE.Skeleton.prototype.pose = function() {
    for (var a, b = 0, c = this.bones.length; b < c; b++)(a = this.bones[b]) && a.matrixWorld.getInverse(this.boneInverses[b]);
    b = 0;
    for (c = this.bones.length; b < c; b++)
        if (a = this.bones[b]) a.parent ? (a.matrix.getInverse(a.parent.matrixWorld), a.matrix.multiply(a.matrixWorld)) : a.matrix.copy(a.matrixWorld), a.matrix.decompose(a.position, a.quaternion, a.scale)
};
THREE.Skeleton.prototype.update = function() {
    var a = new THREE.Matrix4;
    return function() {
        for (var b = 0, c = this.bones.length; b < c; b++) a.multiplyMatrices(this.bones[b] ? this.bones[b].matrixWorld : this.identityMatrix, this.boneInverses[b]), a.flattenToArrayOffset(this.boneMatrices, 16 * b);
        this.useVertexTexture && (this.boneTexture.needsUpdate = !0)
    }
}();
THREE.SkinnedMesh = function(a, b, c) {
    THREE.Mesh.call(this, a, b);
    this.type = "SkinnedMesh";
    this.bindMode = "attached";
    this.bindMatrix = new THREE.Matrix4;
    this.bindMatrixInverse = new THREE.Matrix4;
    a = [];
    if (this.geometry && void 0 !== this.geometry.bones) {
        for (var d, e, f, g, h = 0, k = this.geometry.bones.length; h < k; ++h) d = this.geometry.bones[h], e = d.pos, f = d.rotq, g = d.scl, b = new THREE.Bone(this), a.push(b), b.name = d.name, b.position.set(e[0], e[1], e[2]), b.quaternion.set(f[0], f[1], f[2], f[3]), void 0 !== g ? b.scale.set(g[0], g[1], g[2]) : b.scale.set(1, 1, 1);
        h = 0;
        for (k = this.geometry.bones.length; h < k; ++h) d = this.geometry.bones[h], -1 !== d.parent ? a[d.parent].add(a[h]) : this.add(a[h])
    }
    this.normalizeSkinWeights();
    this.updateMatrixWorld(!0);
    this.bind(new THREE.Skeleton(a, void 0, c))
};
THREE.SkinnedMesh.prototype = Object.create(THREE.Mesh.prototype);
THREE.SkinnedMesh.prototype.bind = function(a, b) {
    this.skeleton = a;
    void 0 === b && (this.updateMatrixWorld(!0), b = this.matrixWorld);
    this.bindMatrix.copy(b);
    this.bindMatrixInverse.getInverse(b)
};
THREE.SkinnedMesh.prototype.pose = function() {
    this.skeleton.pose()
};
THREE.SkinnedMesh.prototype.normalizeSkinWeights = function() {
    if (this.geometry instanceof THREE.Geometry)
        for (var a = 0; a < this.geometry.skinIndices.length; a++) {
            var b = this.geometry.skinWeights[a],
                c = 1 / b.lengthManhattan();
            Infinity !== c ? b.multiplyScalar(c) : b.set(1)
        }
};
THREE.SkinnedMesh.prototype.updateMatrixWorld = function(a) {
    THREE.Mesh.prototype.updateMatrixWorld.call(this, !0);
    "attached" === this.bindMode ? this.bindMatrixInverse.getInverse(this.matrixWorld) : "detached" === this.bindMode ? this.bindMatrixInverse.getInverse(this.bindMatrix) : console.warn("THREE.SkinnedMesh unreckognized bindMode: " + this.bindMode)
};
THREE.SkinnedMesh.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.SkinnedMesh(this.geometry, this.material, this.useVertexTexture));
    THREE.Mesh.prototype.clone.call(this, a);
    return a
};
THREE.MorphAnimMesh = function(a, b) {
    THREE.Mesh.call(this, a, b);
    this.type = "MorphAnimMesh";
    this.duration = 1e3;
    this.mirroredLoop = !1;
    this.currentKeyframe = this.lastKeyframe = this.time = 0;
    this.direction = 1;
    this.directionBackwards = !1;
    this.setFrameRange(0, this.geometry.morphTargets.length - 1)
};
THREE.MorphAnimMesh.prototype = Object.create(THREE.Mesh.prototype);
THREE.MorphAnimMesh.prototype.setFrameRange = function(a, b) {
    this.startKeyframe = a;
    this.endKeyframe = b;
    this.length = this.endKeyframe - this.startKeyframe + 1
};
THREE.MorphAnimMesh.prototype.setDirectionForward = function() {
    this.direction = 1;
    this.directionBackwards = !1
};
THREE.MorphAnimMesh.prototype.setDirectionBackward = function() {
    this.direction = -1;
    this.directionBackwards = !0
};
THREE.MorphAnimMesh.prototype.parseAnimations = function() {
    var a = this.geometry;
    a.animations || (a.animations = {});
    for (var b, c = a.animations, d = /([a-z]+)_?(\d+)/, e = 0, f = a.morphTargets.length; e < f; e++) {
        var g = a.morphTargets[e].name.match(d);
        if (g && 1 < g.length) {
            g = g[1];
            c[g] || (c[g] = {
                start: Infinity,
                end: -Infinity
            });
            var h = c[g];
            e < h.start && (h.start = e);
            e > h.end && (h.end = e);
            b || (b = g)
        }
    }
    a.firstAnimation = b
};
THREE.MorphAnimMesh.prototype.setAnimationLabel = function(a, b, c) {
    this.geometry.animations || (this.geometry.animations = {});
    this.geometry.animations[a] = {
        start: b,
        end: c
    }
};
THREE.MorphAnimMesh.prototype.playAnimation = function(a, b) {
    var c = this.geometry.animations[a];
    c ? (this.setFrameRange(c.start, c.end), this.duration = (c.end - c.start) / b * 1e3, this.time = 0) : console.warn("animation[" + a + "] undefined")
};
THREE.MorphAnimMesh.prototype.updateAnimation = function(a) {
    var b = this.duration / this.length;
    this.time += this.direction * a;
    if (this.mirroredLoop) {
        if (this.time > this.duration || 0 > this.time) this.direction *= -1, this.time > this.duration && (this.time = this.duration, this.directionBackwards = !0), 0 > this.time && (this.time = 0, this.directionBackwards = !1)
    } else this.time %= this.duration, 0 > this.time && (this.time += this.duration);
    a = this.startKeyframe + THREE.Math.clamp(Math.floor(this.time / b), 0, this.length - 1);
    a !== this.currentKeyframe && (this.morphTargetInfluences[this.lastKeyframe] = 0, this.morphTargetInfluences[this.currentKeyframe] = 1, this.morphTargetInfluences[a] = 0, this.lastKeyframe = this.currentKeyframe, this.currentKeyframe = a);
    b = this.time % b / b;
    this.directionBackwards && (b = 1 - b);
    this.morphTargetInfluences[this.currentKeyframe] = b;
    this.morphTargetInfluences[this.lastKeyframe] = 1 - b
};
THREE.MorphAnimMesh.prototype.interpolateTargets = function(a, b, c) {
    for (var d = this.morphTargetInfluences, e = 0, f = d.length; e < f; e++) d[e] = 0; - 1 < a && (d[a] = 1 - c); - 1 < b && (d[b] = c)
};
THREE.MorphAnimMesh.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.MorphAnimMesh(this.geometry, this.material));
    a.duration = this.duration;
    a.mirroredLoop = this.mirroredLoop;
    a.time = this.time;
    a.lastKeyframe = this.lastKeyframe;
    a.currentKeyframe = this.currentKeyframe;
    a.direction = this.direction;
    a.directionBackwards = this.directionBackwards;
    THREE.Mesh.prototype.clone.call(this, a);
    return a
};
THREE.LOD = function() {
    THREE.Object3D.call(this);
    this.objects = []
};
THREE.LOD.prototype = Object.create(THREE.Object3D.prototype);
THREE.LOD.prototype.addLevel = function(a, b) {
    void 0 === b && (b = 0);
    b = Math.abs(b);
    for (var c = 0; c < this.objects.length && !(b < this.objects[c].distance); c++);
    this.objects.splice(c, 0, {
        distance: b,
        object: a
    });
    this.add(a)
};
THREE.LOD.prototype.getObjectForDistance = function(a) {
    for (var b = 1, c = this.objects.length; b < c && !(a < this.objects[b].distance); b++);
    return this.objects[b - 1].object
};
THREE.LOD.prototype.raycast = function() {
    var a = new THREE.Vector3;
    return function(b, c) {
        a.setFromMatrixPosition(this.matrixWorld);
        var d = b.ray.origin.distanceTo(a);
        this.getObjectForDistance(d).raycast(b, c)
    }
}();
THREE.LOD.prototype.update = function() {
    var a = new THREE.Vector3,
        b = new THREE.Vector3;
    return function(c) {
        if (1 < this.objects.length) {
            a.setFromMatrixPosition(c.matrixWorld);
            b.setFromMatrixPosition(this.matrixWorld);
            c = a.distanceTo(b);
            this.objects[0].object.visible = !0;
            for (var d = 1, e = this.objects.length; d < e; d++)
                if (c >= this.objects[d].distance) this.objects[d - 1].object.visible = !1, this.objects[d].object.visible = !0;
                else break;
            for (; d < e; d++) this.objects[d].object.visible = !1
        }
    }
}();
THREE.LOD.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.LOD);
    THREE.Object3D.prototype.clone.call(this, a);
    for (var b = 0, c = this.objects.length; b < c; b++) {
        var d = this.objects[b].object.clone();
        d.visible = 0 === b;
        a.addLevel(d, this.objects[b].distance)
    }
    return a
};
THREE.Sprite = function() {
    var a = new Uint16Array([0, 1, 2, 0, 2, 3]),
        b = new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]),
        c = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        d = new THREE.BufferGeometry;
    d.addAttribute("index", new THREE.BufferAttribute(a, 1));
    d.addAttribute("position", new THREE.BufferAttribute(b, 3));
    d.addAttribute("uv", new THREE.BufferAttribute(c, 2));
    return function(a) {
        THREE.Object3D.call(this);
        this.type = "Sprite";
        this.geometry = d;
        this.material = void 0 !== a ? a : new THREE.SpriteMaterial
    }
}();
THREE.Sprite.prototype = Object.create(THREE.Object3D.prototype);
THREE.Sprite.prototype.raycast = function() {
    var a = new THREE.Vector3;
    return function(b, c) {
        a.setFromMatrixPosition(this.matrixWorld);
        var d = b.ray.distanceToPoint(a);
        d > this.scale.x || c.push({
            distance: d,
            point: this.position,
            face: null,
            object: this
        })
    }
}();
THREE.Sprite.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.Sprite(this.material));
    THREE.Object3D.prototype.clone.call(this, a);
    return a
};
THREE.Particle = THREE.Sprite;
THREE.LensFlare = function(a, b, c, d, e) {
    THREE.Object3D.call(this);
    this.lensFlares = [];
    this.positionScreen = new THREE.Vector3;
    this.customUpdateCallback = void 0;
    void 0 !== a && this.add(a, b, c, d, e)
};
THREE.LensFlare.prototype = Object.create(THREE.Object3D.prototype);
THREE.LensFlare.prototype.add = function(a, b, c, d, e, f) {
    void 0 === b && (b = -1);
    void 0 === c && (c = 0);
    void 0 === f && (f = 1);
    void 0 === e && (e = new THREE.Color(16777215));
    void 0 === d && (d = THREE.NormalBlending);
    c = Math.min(c, Math.max(0, c));
    this.lensFlares.push({
        texture: a,
        size: b,
        distance: c,
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        rotation: 1,
        opacity: f,
        color: e,
        blending: d
    })
};
THREE.LensFlare.prototype.updateLensFlares = function() {
    var a, b = this.lensFlares.length,
        c, d = 2 * -this.positionScreen.x,
        e = 2 * -this.positionScreen.y;
    for (a = 0; a < b; a++) c = this.lensFlares[a], c.x = this.positionScreen.x + d * c.distance, c.y = this.positionScreen.y + e * c.distance, c.wantedRotation = c.x * Math.PI * .25, c.rotation += .25 * (c.wantedRotation - c.rotation)
};
THREE.Scene = function() {
    THREE.Object3D.call(this);
    this.type = "Scene";
    this.overrideMaterial = this.fog = null;
    this.autoUpdate = !0
};
THREE.Scene.prototype = Object.create(THREE.Object3D.prototype);
THREE.Scene.prototype.clone = function(a) {
    void 0 === a && (a = new THREE.Scene);
    THREE.Object3D.prototype.clone.call(this, a);
    null !== this.fog && (a.fog = this.fog.clone());
    null !== this.overrideMaterial && (a.overrideMaterial = this.overrideMaterial.clone());
    a.autoUpdate = this.autoUpdate;
    a.matrixAutoUpdate = this.matrixAutoUpdate;
    return a
};
THREE.Fog = function(a, b, c) {
    this.name = "";
    this.color = new THREE.Color(a);
    this.near = void 0 !== b ? b : 1;
    this.far = void 0 !== c ? c : 1e3
};
THREE.Fog.prototype.clone = function() {
    return new THREE.Fog(this.color.getHex(), this.near, this.far)
};
THREE.FogExp2 = function(a, b) {
    this.name = "";
    this.color = new THREE.Color(a);
    this.density = void 0 !== b ? b : 25e-5
};
THREE.FogExp2.prototype.clone = function() {
    return new THREE.FogExp2(this.color.getHex(), this.density)
};
THREE.ShaderChunk = {};
THREE.ShaderChunk.alphatest_fragment = "#ifdef ALPHATEST\n\n    if ( gl_FragColor.a < ALPHATEST ) discard;\n\n#endif\n";
THREE.ShaderChunk.lights_lambert_vertex = "vLightFront = vec3( 0.0 );\n\n#ifdef DOUBLE_SIDED\n\n    vLightBack = vec3( 0.0 );\n\n#endif\n\ntransformedNormal = normalize( transformedNormal );\n\n#if MAX_DIR_LIGHTS > 0\n\nfor( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {\n\n    vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );\n   vec3 dirVector = normalize( lDirection.xyz );\n\n   float dotProduct = dot( transformedNormal, dirVector );\n   vec3 directionalLightWeighting = vec3( max( dotProduct, 0.0 ) );\n\n    #ifdef DOUBLE_SIDED\n\n     vec3 directionalLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );\n\n       #ifdef WRAP_AROUND\n\n          vec3 directionalLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );\n\n       #endif\n\n  #endif\n\n  #ifdef WRAP_AROUND\n\n      vec3 directionalLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );\n      directionalLightWeighting = mix( directionalLightWeighting, directionalLightWeightingHalf, wrapRGB );\n\n       #ifdef DOUBLE_SIDED\n\n         directionalLightWeightingBack = mix( directionalLightWeightingBack, directionalLightWeightingHalfBack, wrapRGB );\n\n       #endif\n\n  #endif\n\n  vLightFront += directionalLightColor[ i ] * directionalLightWeighting;\n\n  #ifdef DOUBLE_SIDED\n\n     vLightBack += directionalLightColor[ i ] * directionalLightWeightingBack;\n\n   #endif\n\n}\n\n#endif\n\n#if MAX_POINT_LIGHTS > 0\n\n   for( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {\n\n      vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );\n       vec3 lVector = lPosition.xyz - mvPosition.xyz;\n\n      float lDistance = 1.0;\n        if ( pointLightDistance[ i ] > 0.0 )\n          lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );\n\n      lVector = normalize( lVector );\n       float dotProduct = dot( transformedNormal, lVector );\n\n       vec3 pointLightWeighting = vec3( max( dotProduct, 0.0 ) );\n\n      #ifdef DOUBLE_SIDED\n\n         vec3 pointLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );\n\n         #ifdef WRAP_AROUND\n\n              vec3 pointLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );\n\n         #endif\n\n      #endif\n\n      #ifdef WRAP_AROUND\n\n          vec3 pointLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );\n            pointLightWeighting = mix( pointLightWeighting, pointLightWeightingHalf, wrapRGB );\n\n         #ifdef DOUBLE_SIDED\n\n             pointLightWeightingBack = mix( pointLightWeightingBack, pointLightWeightingHalfBack, wrapRGB );\n\n         #endif\n\n      #endif\n\n      vLightFront += pointLightColor[ i ] * pointLightWeighting * lDistance;\n\n      #ifdef DOUBLE_SIDED\n\n         vLightBack += pointLightColor[ i ] * pointLightWeightingBack * lDistance;\n\n       #endif\n\n  }\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0\n\n  for( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {\n\n       vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );\n        vec3 lVector = lPosition.xyz - mvPosition.xyz;\n\n      float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - worldPosition.xyz ) );\n\n     if ( spotEffect > spotLightAngleCos[ i ] ) {\n\n            spotEffect = max( pow( max( spotEffect, 0.0 ), spotLightExponent[ i ] ), 0.0 );\n\n         float lDistance = 1.0;\n            if ( spotLightDistance[ i ] > 0.0 )\n               lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );\n\n           lVector = normalize( lVector );\n\n         float dotProduct = dot( transformedNormal, lVector );\n         vec3 spotLightWeighting = vec3( max( dotProduct, 0.0 ) );\n\n           #ifdef DOUBLE_SIDED\n\n             vec3 spotLightWeightingBack = vec3( max( -dotProduct, 0.0 ) );\n\n              #ifdef WRAP_AROUND\n\n                  vec3 spotLightWeightingHalfBack = vec3( max( -0.5 * dotProduct + 0.5, 0.0 ) );\n\n              #endif\n\n          #endif\n\n          #ifdef WRAP_AROUND\n\n              vec3 spotLightWeightingHalf = vec3( max( 0.5 * dotProduct + 0.5, 0.0 ) );\n             spotLightWeighting = mix( spotLightWeighting, spotLightWeightingHalf, wrapRGB );\n\n                #ifdef DOUBLE_SIDED\n\n                 spotLightWeightingBack = mix( spotLightWeightingBack, spotLightWeightingHalfBack, wrapRGB );\n\n                #endif\n\n          #endif\n\n          vLightFront += spotLightColor[ i ] * spotLightWeighting * lDistance * spotEffect;\n\n           #ifdef DOUBLE_SIDED\n\n             vLightBack += spotLightColor[ i ] * spotLightWeightingBack * lDistance * spotEffect;\n\n            #endif\n\n      }\n\n   }\n\n#endif\n\n#if MAX_HEMI_LIGHTS > 0\n\n  for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {\n\n       vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );\n        vec3 lVector = normalize( lDirection.xyz );\n\n     float dotProduct = dot( transformedNormal, lVector );\n\n       float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;\n     float hemiDiffuseWeightBack = -0.5 * dotProduct + 0.5;\n\n      vLightFront += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );\n\n     #ifdef DOUBLE_SIDED\n\n         vLightBack += mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeightBack );\n\n      #endif\n\n  }\n\n#endif\n\nvLightFront = vLightFront * diffuse + ambient * ambientLightColor + emissive;\n\n#ifdef DOUBLE_SIDED\n\n vLightBack = vLightBack * diffuse + ambient * ambientLightColor + emissive;\n\n#endif";
THREE.ShaderChunk.map_particle_pars_fragment = "#ifdef USE_MAP\n\n  uniform sampler2D map;\n\n#endif";
THREE.ShaderChunk.default_vertex = "vec4 mvPosition;\n\n#ifdef USE_SKINNING\n\n mvPosition = modelViewMatrix * skinned;\n\n#endif\n\n#if !defined( USE_SKINNING ) && defined( USE_MORPHTARGETS )\n\n    mvPosition = modelViewMatrix * vec4( morphed, 1.0 );\n\n#endif\n\n#if !defined( USE_SKINNING ) && ! defined( USE_MORPHTARGETS )\n\n mvPosition = modelViewMatrix * vec4( position, 1.0 );\n\n#endif\n\ngl_Position = projectionMatrix * mvPosition;";
THREE.ShaderChunk.map_pars_fragment = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP )\n\n    varying vec2 vUv;\n\n#endif\n\n#ifdef USE_MAP\n\n   uniform sampler2D map;\n\n#endif";
THREE.ShaderChunk.skinnormal_vertex = "#ifdef USE_SKINNING\n\n  mat4 skinMatrix = mat4( 0.0 );\n    skinMatrix += skinWeight.x * boneMatX;\n    skinMatrix += skinWeight.y * boneMatY;\n    skinMatrix += skinWeight.z * boneMatZ;\n    skinMatrix += skinWeight.w * boneMatW;\n    skinMatrix  = bindMatrixInverse * skinMatrix * bindMatrix;\n\n  #ifdef USE_MORPHNORMALS\n\n vec4 skinnedNormal = skinMatrix * vec4( morphedNormal, 0.0 );\n\n   #else\n\n   vec4 skinnedNormal = skinMatrix * vec4( normal, 0.0 );\n\n  #endif\n\n#endif\n";
THREE.ShaderChunk.logdepthbuf_pars_vertex = "#ifdef USE_LOGDEPTHBUF\n\n #ifdef USE_LOGDEPTHBUF_EXT\n\n      varying float vFragDepth;\n\n   #endif\n\n  uniform float logDepthBufFC;\n\n#endif";
THREE.ShaderChunk.lightmap_pars_vertex = "#ifdef USE_LIGHTMAP\n\n   varying vec2 vUv2;\n\n#endif";
THREE.ShaderChunk.lights_phong_fragment = "vec3 normal = normalize( vNormal );\nvec3 viewPosition = normalize( vViewPosition );\n\n#ifdef DOUBLE_SIDED\n\n  normal = normal * ( -1.0 + 2.0 * float( gl_FrontFacing ) );\n\n#endif\n\n#ifdef USE_NORMALMAP\n\n   normal = perturbNormal2Arb( -vViewPosition, normal );\n\n#elif defined( USE_BUMPMAP )\n\n   normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );\n\n#endif\n\n#if MAX_POINT_LIGHTS > 0\n\n vec3 pointDiffuse = vec3( 0.0 );\n  vec3 pointSpecular = vec3( 0.0 );\n\n   for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {\n\n     vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );\n       vec3 lVector = lPosition.xyz + vViewPosition.xyz;\n\n       float lDistance = 1.0;\n        if ( pointLightDistance[ i ] > 0.0 )\n          lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );\n\n      lVector = normalize( lVector );\n\n             // diffuse\n\n      float dotProduct = dot( normal, lVector );\n\n      #ifdef WRAP_AROUND\n\n          float pointDiffuseWeightFull = max( dotProduct, 0.0 );\n            float pointDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );\n\n          vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );\n\n       #else\n\n           float pointDiffuseWeight = max( dotProduct, 0.0 );\n\n      #endif\n\n      pointDiffuse += diffuse * pointLightColor[ i ] * pointDiffuseWeight * lDistance;\n\n                // specular\n\n     vec3 pointHalfVector = normalize( lVector + viewPosition );\n       float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );\n        float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );\n\n        float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n        vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, pointHalfVector ), 0.0 ), 5.0 );\n     pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;\n\n }\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0\n\n  vec3 spotDiffuse = vec3( 0.0 );\n   vec3 spotSpecular = vec3( 0.0 );\n\n    for ( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {\n\n      vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );\n        vec3 lVector = lPosition.xyz + vViewPosition.xyz;\n\n       float lDistance = 1.0;\n        if ( spotLightDistance[ i ] > 0.0 )\n           lDistance = 1.0 - min( ( length( lVector ) / spotLightDistance[ i ] ), 1.0 );\n\n       lVector = normalize( lVector );\n\n     float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );\n\n        if ( spotEffect > spotLightAngleCos[ i ] ) {\n\n            spotEffect = max( pow( max( spotEffect, 0.0 ), spotLightExponent[ i ] ), 0.0 );\n\n                 // diffuse\n\n          float dotProduct = dot( normal, lVector );\n\n          #ifdef WRAP_AROUND\n\n              float spotDiffuseWeightFull = max( dotProduct, 0.0 );\n             float spotDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );\n\n               vec3 spotDiffuseWeight = mix( vec3( spotDiffuseWeightFull ), vec3( spotDiffuseWeightHalf ), wrapRGB );\n\n          #else\n\n               float spotDiffuseWeight = max( dotProduct, 0.0 );\n\n           #endif\n\n          spotDiffuse += diffuse * spotLightColor[ i ] * spotDiffuseWeight * lDistance * spotEffect;\n\n                  // specular\n\n         vec3 spotHalfVector = normalize( lVector + viewPosition );\n            float spotDotNormalHalf = max( dot( normal, spotHalfVector ), 0.0 );\n          float spotSpecularWeight = specularStrength * max( pow( spotDotNormalHalf, shininess ), 0.0 );\n\n          float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n            vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, spotHalfVector ), 0.0 ), 5.0 );\n          spotSpecular += schlick * spotLightColor[ i ] * spotSpecularWeight * spotDiffuseWeight * lDistance * specularNormalization * spotEffect;\n\n        }\n\n   }\n\n#endif\n\n#if MAX_DIR_LIGHTS > 0\n\n   vec3 dirDiffuse = vec3( 0.0 );\n    vec3 dirSpecular = vec3( 0.0 );\n\n for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {\n\n        vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );\n       vec3 dirVector = normalize( lDirection.xyz );\n\n               // diffuse\n\n      float dotProduct = dot( normal, dirVector );\n\n        #ifdef WRAP_AROUND\n\n          float dirDiffuseWeightFull = max( dotProduct, 0.0 );\n          float dirDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );\n\n            vec3 dirDiffuseWeight = mix( vec3( dirDiffuseWeightFull ), vec3( dirDiffuseWeightHalf ), wrapRGB );\n\n     #else\n\n           float dirDiffuseWeight = max( dotProduct, 0.0 );\n\n        #endif\n\n      dirDiffuse += diffuse * directionalLightColor[ i ] * dirDiffuseWeight;\n\n      // specular\n\n     vec3 dirHalfVector = normalize( dirVector + viewPosition );\n       float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );\n        float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );\n\n        /*\n        // fresnel term from skin shader\n      const float F0 = 0.128;\n\n     float base = 1.0 - dot( viewPosition, dirHalfVector );\n        float exponential = pow( base, 5.0 );\n\n       float fresnel = exponential + F0 * ( 1.0 - exponential );\n     */\n\n      /*\n        // fresnel term from fresnel shader\n       const float mFresnelBias = 0.08;\n      const float mFresnelScale = 0.3;\n      const float mFresnelPower = 5.0;\n\n        float fresnel = mFresnelBias + mFresnelScale * pow( 1.0 + dot( normalize( -viewPosition ), normal ), mFresnelPower );\n     */\n\n      float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n        //      dirSpecular += specular * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization * fresnel;\n\n      vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );\n     dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;\n\n\n   }\n\n#endif\n\n#if MAX_HEMI_LIGHTS > 0\n\n  vec3 hemiDiffuse = vec3( 0.0 );\n   vec3 hemiSpecular = vec3( 0.0 );\n\n    for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {\n\n       vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );\n        vec3 lVector = normalize( lDirection.xyz );\n\n     // diffuse\n\n      float dotProduct = dot( normal, lVector );\n        float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;\n\n       vec3 hemiColor = mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );\n\n       hemiDiffuse += diffuse * hemiColor;\n\n     // specular (sky light)\n\n     vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );\n     float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;\n        float hemiSpecularWeightSky = specularStrength * max( pow( max( hemiDotNormalHalfSky, 0.0 ), shininess ), 0.0 );\n\n        // specular (ground light)\n\n      vec3 lVectorGround = -lVector;\n\n      vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );\n        float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;\n      float hemiSpecularWeightGround = specularStrength * max( pow( max( hemiDotNormalHalfGround, 0.0 ), shininess ), 0.0 );\n\n      float dotProductGround = dot( normal, lVectorGround );\n\n      float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n        vec3 schlickSky = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, hemiHalfVectorSky ), 0.0 ), 5.0 );\n        vec3 schlickGround = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVectorGround, hemiHalfVectorGround ), 0.0 ), 5.0 );\n        hemiSpecular += hemiColor * specularNormalization * ( schlickSky * hemiSpecularWeightSky * max( dotProduct, 0.0 ) + schlickGround * hemiSpecularWeightGround * max( dotProductGround, 0.0 ) );\n\n  }\n\n#endif\n\nvec3 totalDiffuse = vec3( 0.0 );\nvec3 totalSpecular = vec3( 0.0 );\n\n#if MAX_DIR_LIGHTS > 0\n\n    totalDiffuse += dirDiffuse;\n   totalSpecular += dirSpecular;\n\n#endif\n\n#if MAX_HEMI_LIGHTS > 0\n\n  totalDiffuse += hemiDiffuse;\n  totalSpecular += hemiSpecular;\n\n#endif\n\n#if MAX_POINT_LIGHTS > 0\n\n    totalDiffuse += pointDiffuse;\n totalSpecular += pointSpecular;\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0\n\n    totalDiffuse += spotDiffuse;\n  totalSpecular += spotSpecular;\n\n#endif\n\n#ifdef METAL\n\n    gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient + totalSpecular );\n\n#else\n\n   gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient ) + totalSpecular;\n\n#endif";
THREE.ShaderChunk.fog_pars_fragment = "#ifdef USE_FOG\n\n   uniform vec3 fogColor;\n\n  #ifdef FOG_EXP2\n\n     uniform float fogDensity;\n\n   #else\n\n       uniform float fogNear;\n        uniform float fogFar;\n #endif\n\n#endif";
THREE.ShaderChunk.morphnormal_vertex = "#ifdef USE_MORPHNORMALS\n\n vec3 morphedNormal = vec3( 0.0 );\n\n   morphedNormal += ( morphNormal0 - normal ) * morphTargetInfluences[ 0 ];\n  morphedNormal += ( morphNormal1 - normal ) * morphTargetInfluences[ 1 ];\n  morphedNormal += ( morphNormal2 - normal ) * morphTargetInfluences[ 2 ];\n  morphedNormal += ( morphNormal3 - normal ) * morphTargetInfluences[ 3 ];\n\n    morphedNormal += normal;\n\n#endif";
THREE.ShaderChunk.envmap_pars_fragment = "#ifdef USE_ENVMAP\n\n uniform float reflectivity;\n   uniform samplerCube envMap;\n   uniform float flipEnvMap;\n uniform int combine;\n\n    #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\n      uniform bool useRefract;\n      uniform float refractionRatio;\n\n  #else\n\n       varying vec3 vReflect;\n\n  #endif\n\n#endif";
THREE.ShaderChunk.logdepthbuf_fragment = "#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)\n\n  gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;\n\n#endif";
THREE.ShaderChunk.normalmap_pars_fragment = "#ifdef USE_NORMALMAP\n\n   uniform sampler2D normalMap;\n  uniform vec2 normalScale;\n\n           // Per-Pixel Tangent Space Normal Mapping\n         // http://hacksoflife.blogspot.ch/2009/11/per-pixel-tangent-space-normal-mapping.html\n\n   vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {\n\n        vec3 q0 = dFdx( eye_pos.xyz );\n        vec3 q1 = dFdy( eye_pos.xyz );\n        vec2 st0 = dFdx( vUv.st );\n        vec2 st1 = dFdy( vUv.st );\n\n      vec3 S = normalize( q0 * st1.t - q1 * st0.t );\n        vec3 T = normalize( -q0 * st1.s + q1 * st0.s );\n       vec3 N = normalize( surf_norm );\n\n        vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;\n      mapN.xy = normalScale * mapN.xy;\n      mat3 tsn = mat3( S, T, N );\n       return normalize( tsn * mapN );\n\n }\n\n#endif\n";
THREE.ShaderChunk.lights_phong_pars_vertex = "#if MAX_SPOT_LIGHTS > 0 || defined( USE_BUMPMAP ) || defined( USE_ENVMAP )\n\n    varying vec3 vWorldPosition;\n\n#endif\n";
THREE.ShaderChunk.lightmap_pars_fragment = "#ifdef USE_LIGHTMAP\n\n varying vec2 vUv2;\n    uniform sampler2D lightMap;\n\n#endif";
THREE.ShaderChunk.shadowmap_vertex = "#ifdef USE_SHADOWMAP\n\n  for( int i = 0; i < MAX_SHADOWS; i ++ ) {\n\n       vShadowCoord[ i ] = shadowMatrix[ i ] * worldPosition;\n\n  }\n\n#endif";
THREE.ShaderChunk.lights_phong_vertex = "#if MAX_SPOT_LIGHTS > 0 || defined( USE_BUMPMAP ) || defined( USE_ENVMAP )\n\n vWorldPosition = worldPosition.xyz;\n\n#endif";
THREE.ShaderChunk.map_fragment = "#ifdef USE_MAP\n\n    vec4 texelColor = texture2D( map, vUv );\n\n    #ifdef GAMMA_INPUT\n\n      texelColor.xyz *= texelColor.xyz;\n\n   #endif\n\n  gl_FragColor = gl_FragColor * texelColor;\n\n#endif";
THREE.ShaderChunk.lightmap_vertex = "#ifdef USE_LIGHTMAP\n\n    vUv2 = uv2;\n\n#endif";
THREE.ShaderChunk.map_particle_fragment = "#ifdef USE_MAP\n\n   gl_FragColor = gl_FragColor * texture2D( map, vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y ) );\n\n#endif";
THREE.ShaderChunk.color_pars_fragment = "#ifdef USE_COLOR\n\n   varying vec3 vColor;\n\n#endif\n";
THREE.ShaderChunk.color_vertex = "#ifdef USE_COLOR\n\n  #ifdef GAMMA_INPUT\n\n      vColor = color * color;\n\n #else\n\n       vColor = color;\n\n #endif\n\n#endif";
THREE.ShaderChunk.skinning_vertex = "#ifdef USE_SKINNING\n\n    #ifdef USE_MORPHTARGETS\n\n vec4 skinVertex = bindMatrix * vec4( morphed, 1.0 );\n\n    #else\n\n   vec4 skinVertex = bindMatrix * vec4( position, 1.0 );\n\n   #endif\n\n  vec4 skinned = vec4( 0.0 );\n   skinned += boneMatX * skinVertex * skinWeight.x;\n  skinned += boneMatY * skinVertex * skinWeight.y;\n  skinned += boneMatZ * skinVertex * skinWeight.z;\n  skinned += boneMatW * skinVertex * skinWeight.w;\n  skinned  = bindMatrixInverse * skinned;\n\n#endif\n";
THREE.ShaderChunk.envmap_pars_vertex = "#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP ) && ! defined( PHONG )\n\n   varying vec3 vReflect;\n\n  uniform float refractionRatio;\n    uniform bool useRefract;\n\n#endif\n";
THREE.ShaderChunk.linear_to_gamma_fragment = "#ifdef GAMMA_OUTPUT\n\n   gl_FragColor.xyz = sqrt( gl_FragColor.xyz );\n\n#endif";
THREE.ShaderChunk.color_pars_vertex = "#ifdef USE_COLOR\n\n varying vec3 vColor;\n\n#endif";
THREE.ShaderChunk.lights_lambert_pars_vertex = "uniform vec3 ambient;\nuniform vec3 diffuse;\nuniform vec3 emissive;\n\nuniform vec3 ambientLightColor;\n\n#if MAX_DIR_LIGHTS > 0\n\n   uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];\n uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];\n\n#endif\n\n#if MAX_HEMI_LIGHTS > 0\n\n  uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];\n  uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];\n   uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];\n\n#endif\n\n#if MAX_POINT_LIGHTS > 0\n\n uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];\n uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];\n  uniform float pointLightDistance[ MAX_POINT_LIGHTS ];\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0\n\n  uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];\n   uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];\n    uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];\n\n#endif\n\n#ifdef WRAP_AROUND\n\n uniform vec3 wrapRGB;\n\n#endif\n";
THREE.ShaderChunk.map_pars_vertex = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP )\n\n  varying vec2 vUv;\n uniform vec4 offsetRepeat;\n\n#endif\n";
THREE.ShaderChunk.envmap_fragment = "#ifdef USE_ENVMAP\n\n  vec3 reflectVec;\n\n    #if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG )\n\n      vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );\n\n     // http://en.wikibooks.org/wiki/GLSL_Programming/Applying_Matrix_Transformations\n      // Transforming Normal Vectors with the Inverse Transformation\n\n      vec3 worldNormal = normalize( vec3( vec4( normal, 0.0 ) * viewMatrix ) );\n\n       if ( useRefract ) {\n\n         reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );\n\n       } else { \n\n           reflectVec = reflect( cameraToVertex, worldNormal );\n\n        }\n\n   #else\n\n       reflectVec = vReflect;\n\n  #endif\n\n  #ifdef DOUBLE_SIDED\n\n     float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );\n      vec4 cubeColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\n  #else\n\n       vec4 cubeColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );\n\n   #endif\n\n  #ifdef GAMMA_INPUT\n\n      cubeColor.xyz *= cubeColor.xyz;\n\n #endif\n\n  if ( combine == 1 ) {\n\n       gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularStrength * reflectivity );\n\n } else if ( combine == 2 ) {\n\n        gl_FragColor.xyz += cubeColor.xyz * specularStrength * reflectivity;\n\n    } else {\n\n        gl_FragColor.xyz = mix( gl_FragColor.xyz, gl_FragColor.xyz * cubeColor.xyz, specularStrength * reflectivity );\n\n  }\n\n#endif";
THREE.ShaderChunk.specularmap_pars_fragment = "#ifdef USE_SPECULARMAP\n\n   uniform sampler2D specularMap;\n\n#endif";
THREE.ShaderChunk.logdepthbuf_vertex = "#ifdef USE_LOGDEPTHBUF\n\n  gl_Position.z = log2(max(1e-6, gl_Position.w + 1.0)) * logDepthBufFC;\n\n   #ifdef USE_LOGDEPTHBUF_EXT\n\n      vFragDepth = 1.0 + gl_Position.w;\n\n#else\n\n      gl_Position.z = (gl_Position.z - 1.0) * gl_Position.w;\n\n  #endif\n\n#endif";
THREE.ShaderChunk.morphtarget_pars_vertex = "#ifdef USE_MORPHTARGETS\n\n    #ifndef USE_MORPHNORMALS\n\n    uniform float morphTargetInfluences[ 8 ];\n\n   #else\n\n   uniform float morphTargetInfluences[ 4 ];\n\n   #endif\n\n#endif";
THREE.ShaderChunk.specularmap_fragment = "float specularStrength;\n\n#ifdef USE_SPECULARMAP\n\n vec4 texelSpecular = texture2D( specularMap, vUv );\n   specularStrength = texelSpecular.r;\n\n#else\n\n    specularStrength = 1.0;\n\n#endif";
THREE.ShaderChunk.fog_fragment = "#ifdef USE_FOG\n\n    #ifdef USE_LOGDEPTHBUF_EXT\n\n      float depth = gl_FragDepthEXT / gl_FragCoord.w;\n\n #else\n\n       float depth = gl_FragCoord.z / gl_FragCoord.w;\n\n  #endif\n\n  #ifdef FOG_EXP2\n\n     const float LOG2 = 1.442695;\n      float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );\n       fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n\n #else\n\n       float fogFactor = smoothstep( fogNear, fogFar, depth );\n\n #endif\n    \n  gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n\n#endif";
THREE.ShaderChunk.bumpmap_pars_fragment = "#ifdef USE_BUMPMAP\n\n   uniform sampler2D bumpMap;\n    uniform float bumpScale;\n\n            // Derivative maps - bump mapping unparametrized surfaces by Morten Mikkelsen\n         //  http://mmikkelsen3d.blogspot.sk/2011/07/derivative-maps.html\n\n            // Evaluate the derivative of the height w.r.t. screen-space using forward differencing (listing 2)\n\n vec2 dHdxy_fwd() {\n\n      vec2 dSTdx = dFdx( vUv );\n     vec2 dSTdy = dFdy( vUv );\n\n       float Hll = bumpScale * texture2D( bumpMap, vUv ).x;\n      float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;\n        float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;\n\n      return vec2( dBx, dBy );\n\n    }\n\n   vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {\n\n        vec3 vSigmaX = dFdx( surf_pos );\n      vec3 vSigmaY = dFdy( surf_pos );\n      vec3 vN = surf_norm;        // normalized\n\n       vec3 R1 = cross( vSigmaY, vN );\n       vec3 R2 = cross( vN, vSigmaX );\n\n     float fDet = dot( vSigmaX, R1 );\n\n        vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );\n      return normalize( abs( fDet ) * surf_norm - vGrad );\n\n    }\n\n#endif";
THREE.ShaderChunk.defaultnormal_vertex = "vec3 objectNormal;\n\n#ifdef USE_SKINNING\n\n objectNormal = skinnedNormal.xyz;\n\n#endif\n\n#if !defined( USE_SKINNING ) && defined( USE_MORPHNORMALS )\n\n  objectNormal = morphedNormal;\n\n#endif\n\n#if !defined( USE_SKINNING ) && ! defined( USE_MORPHNORMALS )\n\n    objectNormal = normal;\n\n#endif\n\n#ifdef FLIP_SIDED\n\n   objectNormal = -objectNormal;\n\n#endif\n\nvec3 transformedNormal = normalMatrix * objectNormal;";
THREE.ShaderChunk.lights_phong_pars_fragment = "uniform vec3 ambientLightColor;\n\n#if MAX_DIR_LIGHTS > 0\n\n   uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];\n uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];\n\n#endif\n\n#if MAX_HEMI_LIGHTS > 0\n\n  uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];\n  uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];\n   uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];\n\n#endif\n\n#if MAX_POINT_LIGHTS > 0\n\n uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];\n\n   uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];\n  uniform float pointLightDistance[ MAX_POINT_LIGHTS ];\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0\n\n  uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];\n   uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];\n    uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];\n\n uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];\n\n#endif\n\n#if MAX_SPOT_LIGHTS > 0 || defined( USE_BUMPMAP ) || defined( USE_ENVMAP )\n\n varying vec3 vWorldPosition;\n\n#endif\n\n#ifdef WRAP_AROUND\n\n    uniform vec3 wrapRGB;\n\n#endif\n\nvarying vec3 vViewPosition;\nvarying vec3 vNormal;";
THREE.ShaderChunk.skinbase_vertex = "#ifdef USE_SKINNING\n\n    mat4 boneMatX = getBoneMatrix( skinIndex.x );\n mat4 boneMatY = getBoneMatrix( skinIndex.y );\n mat4 boneMatZ = getBoneMatrix( skinIndex.z );\n mat4 boneMatW = getBoneMatrix( skinIndex.w );\n\n#endif";
THREE.ShaderChunk.map_vertex = "#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP )\n\n   vUv = uv * offsetRepeat.zw + offsetRepeat.xy;\n\n#endif";
THREE.ShaderChunk.lightmap_fragment = "#ifdef USE_LIGHTMAP\n\n  gl_FragColor = gl_FragColor * texture2D( lightMap, vUv2 );\n\n#endif";
THREE.ShaderChunk.shadowmap_pars_vertex = "#ifdef USE_SHADOWMAP\n\n varying vec4 vShadowCoord[ MAX_SHADOWS ];\n uniform mat4 shadowMatrix[ MAX_SHADOWS ];\n\n#endif";
THREE.ShaderChunk.color_fragment = "#ifdef USE_COLOR\n\n    gl_FragColor = gl_FragColor * vec4( vColor, 1.0 );\n\n#endif";
THREE.ShaderChunk.morphtarget_vertex = "#ifdef USE_MORPHTARGETS\n\n vec3 morphed = vec3( 0.0 );\n   morphed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];\n  morphed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];\n  morphed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];\n  morphed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];\n\n    #ifndef USE_MORPHNORMALS\n\n    morphed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];\n  morphed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];\n  morphed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];\n  morphed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];\n\n    #endif\n\n  morphed += position;\n\n#endif";
THREE.ShaderChunk.envmap_vertex = "#if defined( USE_ENVMAP ) && ! defined( USE_BUMPMAP ) && ! defined( USE_NORMALMAP ) && ! defined( PHONG )\n\n    vec3 worldNormal = mat3( modelMatrix[ 0 ].xyz, modelMatrix[ 1 ].xyz, modelMatrix[ 2 ].xyz ) * objectNormal;\n   worldNormal = normalize( worldNormal );\n\n vec3 cameraToVertex = normalize( worldPosition.xyz - cameraPosition );\n\n  if ( useRefract ) {\n\n     vReflect = refract( cameraToVertex, worldNormal, refractionRatio );\n\n } else {\n\n        vReflect = reflect( cameraToVertex, worldNormal );\n\n  }\n\n#endif";
THREE.ShaderChunk.shadowmap_fragment = "#ifdef USE_SHADOWMAP\n\n    #ifdef SHADOWMAP_DEBUG\n\n      vec3 frustumColors[3];\n        frustumColors[0] = vec3( 1.0, 0.5, 0.0 );\n     frustumColors[1] = vec3( 0.0, 1.0, 0.8 );\n     frustumColors[2] = vec3( 0.0, 0.5, 1.0 );\n\n   #endif\n\n  #ifdef SHADOWMAP_CASCADE\n\n        int inFrustumCount = 0;\n\n #endif\n\n  float fDepth;\n vec3 shadowColor = vec3( 1.0 );\n\n for( int i = 0; i < MAX_SHADOWS; i ++ ) {\n\n       vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;\n\n             // if ( something && something ) breaks ATI OpenGL shader compiler\n                // if ( all( something, something ) ) using this instead\n\n        bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );\n        bool inFrustum = all( inFrustumVec );\n\n               // don't shadow pixels outside of light frustum\n               // use just first frustum (for cascades)\n              // don't shadow pixels behind far plane of light frustum\n\n        #ifdef SHADOWMAP_CASCADE\n\n            inFrustumCount += int( inFrustum );\n           bvec3 frustumTestVec = bvec3( inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0 );\n\n       #else\n\n           bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );\n\n        #endif\n\n      bool frustumTest = all( frustumTestVec );\n\n       if ( frustumTest ) {\n\n            shadowCoord.z += shadowBias[ i ];\n\n           #if defined( SHADOWMAP_TYPE_PCF )\n\n                       // Percentage-close filtering\n                     // (9 pixel kernel)\n                       // http://fabiensanglard.net/shadowmappingPCF/\n\n              float shadow = 0.0;\n\n     /*\n                        // nested loops breaks shader compiler / validator on some ATI cards when using OpenGL\n                        // must enroll loop manually\n\n                for ( float y = -1.25; y <= 1.25; y += 1.25 )\n                 for ( float x = -1.25; x <= 1.25; x += 1.25 ) {\n\n                     vec4 rgbaDepth = texture2D( shadowMap[ i ], vec2( x * xPixelOffset, y * yPixelOffset ) + shadowCoord.xy );\n\n                              // doesn't seem to produce any noticeable visual difference compared to simple texture2D lookup\n                               //vec4 rgbaDepth = texture2DProj( shadowMap[ i ], vec4( vShadowCoord[ i ].w * ( vec2( x * xPixelOffset, y * yPixelOffset ) + shadowCoord.xy ), 0.05, vShadowCoord[ i ].w ) );\n\n                       float fDepth = unpackDepth( rgbaDepth );\n\n                        if ( fDepth < shadowCoord.z )\n                         shadow += 1.0;\n\n              }\n\n               shadow /= 9.0;\n\n      */\n\n              const float shadowDelta = 1.0 / 9.0;\n\n                float xPixelOffset = 1.0 / shadowMapSize[ i ].x;\n              float yPixelOffset = 1.0 / shadowMapSize[ i ].y;\n\n                float dx0 = -1.25 * xPixelOffset;\n             float dy0 = -1.25 * yPixelOffset;\n             float dx1 = 1.25 * xPixelOffset;\n              float dy1 = 1.25 * yPixelOffset;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );\n              if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );\n               if ( fDepth < shadowCoord.z ) shadow += shadowDelta;\n\n                shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );\n\n         #elif defined( SHADOWMAP_TYPE_PCF_SOFT )\n\n                        // Percentage-close filtering\n                     // (9 pixel kernel)\n                       // http://fabiensanglard.net/shadowmappingPCF/\n\n              float shadow = 0.0;\n\n             float xPixelOffset = 1.0 / shadowMapSize[ i ].x;\n              float yPixelOffset = 1.0 / shadowMapSize[ i ].y;\n\n                float dx0 = -1.0 * xPixelOffset;\n              float dy0 = -1.0 * yPixelOffset;\n              float dx1 = 1.0 * xPixelOffset;\n               float dy1 = 1.0 * yPixelOffset;\n\n             mat3 shadowKernel;\n                mat3 depthKernel;\n\n               depthKernel[0][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );\n                depthKernel[0][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );\n                depthKernel[0][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );\n                depthKernel[1][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );\n                depthKernel[1][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );\n               depthKernel[1][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );\n                depthKernel[2][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );\n                depthKernel[2][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );\n                depthKernel[2][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );\n\n              vec3 shadowZ = vec3( shadowCoord.z );\n             shadowKernel[0] = vec3(lessThan(depthKernel[0], shadowZ ));\n               shadowKernel[0] *= vec3(0.25);\n\n              shadowKernel[1] = vec3(lessThan(depthKernel[1], shadowZ ));\n               shadowKernel[1] *= vec3(0.25);\n\n              shadowKernel[2] = vec3(lessThan(depthKernel[2], shadowZ ));\n               shadowKernel[2] *= vec3(0.25);\n\n              vec2 fractionalCoord = 1.0 - fract( shadowCoord.xy * shadowMapSize[i].xy );\n\n             shadowKernel[0] = mix( shadowKernel[1], shadowKernel[0], fractionalCoord.x );\n             shadowKernel[1] = mix( shadowKernel[2], shadowKernel[1], fractionalCoord.x );\n\n               vec4 shadowValues;\n                shadowValues.x = mix( shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y );\n                shadowValues.y = mix( shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y );\n                shadowValues.z = mix( shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y );\n                shadowValues.w = mix( shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.y );\n\n              shadow = dot( shadowValues, vec4( 1.0 ) );\n\n              shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );\n\n         #else\n\n               vec4 rgbaDepth = texture2D( shadowMap[ i ], shadowCoord.xy );\n             float fDepth = unpackDepth( rgbaDepth );\n\n                if ( fDepth < shadowCoord.z )\n\n       // spot with multiple shadows is darker\n\n                 shadowColor = shadowColor * vec3( 1.0 - shadowDarkness[ i ] );\n\n      // spot with multiple shadows has the same color as single shadow spot\n\n      //                  shadowColor = min( shadowColor, vec3( shadowDarkness[ i ] ) );\n\n          #endif\n\n      }\n\n\n     #ifdef SHADOWMAP_DEBUG\n\n          #ifdef SHADOWMAP_CASCADE\n\n                if ( inFrustum && inFrustumCount == 1 ) gl_FragColor.xyz *= frustumColors[ i ];\n\n         #else\n\n               if ( inFrustum ) gl_FragColor.xyz *= frustumColors[ i ];\n\n            #endif\n\n      #endif\n\n  }\n\n   #ifdef GAMMA_OUTPUT\n\n     shadowColor *= shadowColor;\n\n #endif\n\n  gl_FragColor.xyz = gl_FragColor.xyz * shadowColor;\n\n#endif\n";
THREE.ShaderChunk.worldpos_vertex = "#if defined( USE_ENVMAP ) || defined( PHONG ) || defined( LAMBERT ) || defined ( USE_SHADOWMAP )\n\n   #ifdef USE_SKINNING\n\n     vec4 worldPosition = modelMatrix * skinned;\n\n #endif\n\n  #if defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )\n\n        vec4 worldPosition = modelMatrix * vec4( morphed, 1.0 );\n\n    #endif\n\n  #if ! defined( USE_MORPHTARGETS ) && ! defined( USE_SKINNING )\n\n      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n\n   #endif\n\n#endif";
THREE.ShaderChunk.shadowmap_pars_fragment = "#ifdef USE_SHADOWMAP\n\n   uniform sampler2D shadowMap[ MAX_SHADOWS ];\n   uniform vec2 shadowMapSize[ MAX_SHADOWS ];\n\n  uniform float shadowDarkness[ MAX_SHADOWS ];\n  uniform float shadowBias[ MAX_SHADOWS ];\n\n    varying vec4 vShadowCoord[ MAX_SHADOWS ];\n\n   float unpackDepth( const in vec4 rgba_depth ) {\n\n     const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );\n        float depth = dot( rgba_depth, bit_shift );\n       return depth;\n\n   }\n\n#endif";
THREE.ShaderChunk.skinning_pars_vertex = "#ifdef USE_SKINNING\n\n   uniform mat4 bindMatrix;\n  uniform mat4 bindMatrixInverse;\n\n #ifdef BONE_TEXTURE\n\n     uniform sampler2D boneTexture;\n        uniform int boneTextureWidth;\n     uniform int boneTextureHeight;\n\n      mat4 getBoneMatrix( const in float i ) {\n\n            float j = i * 4.0;\n            float x = mod( j, float( boneTextureWidth ) );\n            float y = floor( j / float( boneTextureWidth ) );\n\n           float dx = 1.0 / float( boneTextureWidth );\n           float dy = 1.0 / float( boneTextureHeight );\n\n            y = dy * ( y + 0.5 );\n\n           vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );\n          vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );\n          vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );\n          vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );\n\n            mat4 bone = mat4( v1, v2, v3, v4 );\n\n         return bone;\n\n        }\n\n   #else\n\n       uniform mat4 boneGlobalMatrices[ MAX_BONES ];\n\n       mat4 getBoneMatrix( const in float i ) {\n\n            mat4 bone = boneGlobalMatrices[ int(i) ];\n         return bone;\n\n        }\n\n   #endif\n\n#endif\n";
THREE.ShaderChunk.logdepthbuf_pars_fragment = "#ifdef USE_LOGDEPTHBUF\n\n   uniform float logDepthBufFC;\n\n    #ifdef USE_LOGDEPTHBUF_EXT\n\n      #extension GL_EXT_frag_depth : enable\n     varying float vFragDepth;\n\n   #endif\n\n#endif";
THREE.ShaderChunk.alphamap_fragment = "#ifdef USE_ALPHAMAP\n\n  gl_FragColor.a *= texture2D( alphaMap, vUv ).g;\n\n#endif\n";
THREE.ShaderChunk.alphamap_pars_fragment = "#ifdef USE_ALPHAMAP\n\n uniform sampler2D alphaMap;\n\n#endif\n";
THREE.UniformsUtils = {
    merge: function(a) {
        for (var b = {}, c = 0; c < a.length; c++) {
            var d = this.clone(a[c]),
                e;
            for (e in d) b[e] = d[e]
        }
        return b
    },
    clone: function(a) {
        var b = {},
            c;
        for (c in a) {
            b[c] = {};
            for (var d in a[c]) {
                var e = a[c][d];
                b[c][d] = e instanceof THREE.Color || e instanceof THREE.Vector2 || e instanceof THREE.Vector3 || e instanceof THREE.Vector4 || e instanceof THREE.Matrix4 || e instanceof THREE.Texture ? e.clone() : e instanceof Array ? e.slice() : e
            }
        }
        return b
    }
};
THREE.UniformsLib = {
    common: {
        diffuse: {
            type: "c",
            value: new THREE.Color(15658734)
        },
        opacity: {
            type: "f",
            value: 1
        },
        map: {
            type: "t",
            value: null
        },
        offsetRepeat: {
            type: "v4",
            value: new THREE.Vector4(0, 0, 1, 1)
        },
        lightMap: {
            type: "t",
            value: null
        },
        specularMap: {
            type: "t",
            value: null
        },
        alphaMap: {
            type: "t",
            value: null
        },
        envMap: {
            type: "t",
            value: null
        },
        flipEnvMap: {
            type: "f",
            value: -1
        },
        useRefract: {
            type: "i",
            value: 0
        },
        reflectivity: {
            type: "f",
            value: 1
        },
        refractionRatio: {
            type: "f",
            value: .98
        },
        combine: {
            type: "i",
            value: 0
        },
        morphTargetInfluences: {
            type: "f",
            value: 0
        }
    },
    bump: {
        bumpMap: {
            type: "t",
            value: null
        },
        bumpScale: {
            type: "f",
            value: 1
        }
    },
    normalmap: {
        normalMap: {
            type: "t",
            value: null
        },
        normalScale: {
            type: "v2",
            value: new THREE.Vector2(1, 1)
        }
    },
    fog: {
        fogDensity: {
            type: "f",
            value: 25e-5
        },
        fogNear: {
            type: "f",
            value: 1
        },
        fogFar: {
            type: "f",
            value: 2e3
        },
        fogColor: {
            type: "c",
            value: new THREE.Color(16777215)
        }
    },
    lights: {
        ambientLightColor: {
            type: "fv",
            value: []
        },
        directionalLightDirection: {
            type: "fv",
            value: []
        },
        directionalLightColor: {
            type: "fv",
            value: []
        },
        hemisphereLightDirection: {
            type: "fv",
            value: []
        },
        hemisphereLightSkyColor: {
            type: "fv",
            value: []
        },
        hemisphereLightGroundColor: {
            type: "fv",
            value: []
        },
        pointLightColor: {
            type: "fv",
            value: []
        },
        pointLightPosition: {
            type: "fv",
            value: []
        },
        pointLightDistance: {
            type: "fv1",
            value: []
        },
        spotLightColor: {
            type: "fv",
            value: []
        },
        spotLightPosition: {
            type: "fv",
            value: []
        },
        spotLightDirection: {
            type: "fv",
            value: []
        },
        spotLightDistance: {
            type: "fv1",
            value: []
        },
        spotLightAngleCos: {
            type: "fv1",
            value: []
        },
        spotLightExponent: {
            type: "fv1",
            value: []
        }
    },
    particle: {
        psColor: {
            type: "c",
            value: new THREE.Color(15658734)
        },
        opacity: {
            type: "f",
            value: 1
        },
        size: {
            type: "f",
            value: 1
        },
        scale: {
            type: "f",
            value: 1
        },
        map: {
            type: "t",
            value: null
        },
        fogDensity: {
            type: "f",
            value: 25e-5
        },
        fogNear: {
            type: "f",
            value: 1
        },
        fogFar: {
            type: "f",
            value: 2e3
        },
        fogColor: {
            type: "c",
            value: new THREE.Color(16777215)
        }
    },
    shadowmap: {
        shadowMap: {
            type: "tv",
            value: []
        },
        shadowMapSize: {
            type: "v2v",
            value: []
        },
        shadowBias: {
            type: "fv1",
            value: []
        },
        shadowDarkness: {
            type: "fv1",
            value: []
        },
        shadowMatrix: {
            type: "m4v",
            value: []
        }
    }
};
THREE.ShaderLib = {
    basic: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common, THREE.UniformsLib.fog, THREE.UniformsLib.shadowmap]),
        vertexShader: [THREE.ShaderChunk.map_pars_vertex, THREE.ShaderChunk.lightmap_pars_vertex, THREE.ShaderChunk.envmap_pars_vertex, THREE.ShaderChunk.color_pars_vertex, THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.skinning_pars_vertex, THREE.ShaderChunk.shadowmap_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.map_vertex, THREE.ShaderChunk.lightmap_vertex, THREE.ShaderChunk.color_vertex, THREE.ShaderChunk.skinbase_vertex, "  #ifdef USE_ENVMAP", THREE.ShaderChunk.morphnormal_vertex, THREE.ShaderChunk.skinnormal_vertex, THREE.ShaderChunk.defaultnormal_vertex, "    #endif", THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.skinning_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, THREE.ShaderChunk.worldpos_vertex, THREE.ShaderChunk.envmap_vertex, THREE.ShaderChunk.shadowmap_vertex, "}"].join("\n"),
        fragmentShader: ["uniform vec3 diffuse;\nuniform float opacity;", THREE.ShaderChunk.color_pars_fragment, THREE.ShaderChunk.map_pars_fragment, THREE.ShaderChunk.alphamap_pars_fragment, THREE.ShaderChunk.lightmap_pars_fragment, THREE.ShaderChunk.envmap_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.shadowmap_pars_fragment, THREE.ShaderChunk.specularmap_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n    gl_FragColor = vec4( diffuse, opacity );", THREE.ShaderChunk.logdepthbuf_fragment, THREE.ShaderChunk.map_fragment, THREE.ShaderChunk.alphamap_fragment, THREE.ShaderChunk.alphatest_fragment, THREE.ShaderChunk.specularmap_fragment, THREE.ShaderChunk.lightmap_fragment, THREE.ShaderChunk.color_fragment, THREE.ShaderChunk.envmap_fragment, THREE.ShaderChunk.shadowmap_fragment, THREE.ShaderChunk.linear_to_gamma_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n")
    },
    lambert: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common, THREE.UniformsLib.fog, THREE.UniformsLib.lights, THREE.UniformsLib.shadowmap, {
            ambient: {
                type: "c",
                value: new THREE.Color(16777215)
            },
            emissive: {
                type: "c",
                value: new THREE.Color(0)
            },
            wrapRGB: {
                type: "v3",
                value: new THREE.Vector3(1, 1, 1)
            }
        }]),
        vertexShader: ["#define LAMBERT\nvarying vec3 vLightFront;\n#ifdef DOUBLE_SIDED\n   varying vec3 vLightBack;\n#endif", THREE.ShaderChunk.map_pars_vertex, THREE.ShaderChunk.lightmap_pars_vertex, THREE.ShaderChunk.envmap_pars_vertex, THREE.ShaderChunk.lights_lambert_pars_vertex, THREE.ShaderChunk.color_pars_vertex, THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.skinning_pars_vertex, THREE.ShaderChunk.shadowmap_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.map_vertex, THREE.ShaderChunk.lightmap_vertex, THREE.ShaderChunk.color_vertex, THREE.ShaderChunk.morphnormal_vertex, THREE.ShaderChunk.skinbase_vertex, THREE.ShaderChunk.skinnormal_vertex, THREE.ShaderChunk.defaultnormal_vertex, THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.skinning_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, THREE.ShaderChunk.worldpos_vertex, THREE.ShaderChunk.envmap_vertex, THREE.ShaderChunk.lights_lambert_vertex, THREE.ShaderChunk.shadowmap_vertex, "}"].join("\n"),
        fragmentShader: ["uniform float opacity;\nvarying vec3 vLightFront;\n#ifdef DOUBLE_SIDED\n  varying vec3 vLightBack;\n#endif", THREE.ShaderChunk.color_pars_fragment, THREE.ShaderChunk.map_pars_fragment, THREE.ShaderChunk.alphamap_pars_fragment, THREE.ShaderChunk.lightmap_pars_fragment, THREE.ShaderChunk.envmap_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.shadowmap_pars_fragment, THREE.ShaderChunk.specularmap_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n   gl_FragColor = vec4( vec3( 1.0 ), opacity );", THREE.ShaderChunk.logdepthbuf_fragment, THREE.ShaderChunk.map_fragment, THREE.ShaderChunk.alphamap_fragment, THREE.ShaderChunk.alphatest_fragment, THREE.ShaderChunk.specularmap_fragment, " #ifdef DOUBLE_SIDED\n       if ( gl_FrontFacing )\n         gl_FragColor.xyz *= vLightFront;\n      else\n          gl_FragColor.xyz *= vLightBack;\n   #else\n     gl_FragColor.xyz *= vLightFront;\n  #endif", THREE.ShaderChunk.lightmap_fragment, THREE.ShaderChunk.color_fragment, THREE.ShaderChunk.envmap_fragment, THREE.ShaderChunk.shadowmap_fragment, THREE.ShaderChunk.linear_to_gamma_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n")
    },
    phong: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common, THREE.UniformsLib.bump, THREE.UniformsLib.normalmap, THREE.UniformsLib.fog, THREE.UniformsLib.lights, THREE.UniformsLib.shadowmap, {
            ambient: {
                type: "c",
                value: new THREE.Color(16777215)
            },
            emissive: {
                type: "c",
                value: new THREE.Color(0)
            },
            specular: {
                type: "c",
                value: new THREE.Color(1118481)
            },
            shininess: {
                type: "f",
                value: 30
            },
            wrapRGB: {
                type: "v3",
                value: new THREE.Vector3(1, 1, 1)
            }
        }]),
        vertexShader: ["#define PHONG\nvarying vec3 vViewPosition;\nvarying vec3 vNormal;", THREE.ShaderChunk.map_pars_vertex, THREE.ShaderChunk.lightmap_pars_vertex, THREE.ShaderChunk.envmap_pars_vertex, THREE.ShaderChunk.lights_phong_pars_vertex, THREE.ShaderChunk.color_pars_vertex, THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.skinning_pars_vertex, THREE.ShaderChunk.shadowmap_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.map_vertex, THREE.ShaderChunk.lightmap_vertex, THREE.ShaderChunk.color_vertex, THREE.ShaderChunk.morphnormal_vertex, THREE.ShaderChunk.skinbase_vertex, THREE.ShaderChunk.skinnormal_vertex, THREE.ShaderChunk.defaultnormal_vertex, "  vNormal = normalize( transformedNormal );", THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.skinning_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, "  vViewPosition = -mvPosition.xyz;", THREE.ShaderChunk.worldpos_vertex, THREE.ShaderChunk.envmap_vertex, THREE.ShaderChunk.lights_phong_vertex, THREE.ShaderChunk.shadowmap_vertex, "}"].join("\n"),
        fragmentShader: ["#define PHONG\nuniform vec3 diffuse;\nuniform float opacity;\nuniform vec3 ambient;\nuniform vec3 emissive;\nuniform vec3 specular;\nuniform float shininess;", THREE.ShaderChunk.color_pars_fragment, THREE.ShaderChunk.map_pars_fragment, THREE.ShaderChunk.alphamap_pars_fragment, THREE.ShaderChunk.lightmap_pars_fragment, THREE.ShaderChunk.envmap_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.lights_phong_pars_fragment, THREE.ShaderChunk.shadowmap_pars_fragment, THREE.ShaderChunk.bumpmap_pars_fragment, THREE.ShaderChunk.normalmap_pars_fragment, THREE.ShaderChunk.specularmap_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n  gl_FragColor = vec4( vec3( 1.0 ), opacity );", THREE.ShaderChunk.logdepthbuf_fragment, THREE.ShaderChunk.map_fragment, THREE.ShaderChunk.alphamap_fragment, THREE.ShaderChunk.alphatest_fragment, THREE.ShaderChunk.specularmap_fragment, THREE.ShaderChunk.lights_phong_fragment, THREE.ShaderChunk.lightmap_fragment, THREE.ShaderChunk.color_fragment, THREE.ShaderChunk.envmap_fragment, THREE.ShaderChunk.shadowmap_fragment, THREE.ShaderChunk.linear_to_gamma_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n")
    },
    particle_basic: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.particle, THREE.UniformsLib.shadowmap]),
        vertexShader: ["uniform float size;\nuniform float scale;", THREE.ShaderChunk.color_pars_vertex, THREE.ShaderChunk.shadowmap_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.color_vertex, " vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    #ifdef USE_SIZEATTENUATION\n        gl_PointSize = size * ( scale / length( mvPosition.xyz ) );\n   #else\n     gl_PointSize = size;\n  #endif\n    gl_Position = projectionMatrix * mvPosition;", THREE.ShaderChunk.logdepthbuf_vertex, THREE.ShaderChunk.worldpos_vertex, THREE.ShaderChunk.shadowmap_vertex, "}"].join("\n"),
        fragmentShader: ["uniform vec3 psColor;\nuniform float opacity;", THREE.ShaderChunk.color_pars_fragment, THREE.ShaderChunk.map_particle_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.shadowmap_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n    gl_FragColor = vec4( psColor, opacity );", THREE.ShaderChunk.logdepthbuf_fragment, THREE.ShaderChunk.map_particle_fragment, THREE.ShaderChunk.alphatest_fragment, THREE.ShaderChunk.color_fragment, THREE.ShaderChunk.shadowmap_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n")
    },
    dashed: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.common, THREE.UniformsLib.fog, {
            scale: {
                type: "f",
                value: 1
            },
            dashSize: {
                type: "f",
                value: 1
            },
            totalSize: {
                type: "f",
                value: 2
            }
        }]),
        vertexShader: ["uniform float scale;\nattribute float lineDistance;\nvarying float vLineDistance;", THREE.ShaderChunk.color_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.color_vertex, "  vLineDistance = scale * lineDistance;\n vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    gl_Position = projectionMatrix * mvPosition;", THREE.ShaderChunk.logdepthbuf_vertex, "}"].join("\n"),
        fragmentShader: ["uniform vec3 diffuse;\nuniform float opacity;\nuniform float dashSize;\nuniform float totalSize;\nvarying float vLineDistance;", THREE.ShaderChunk.color_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n    if ( mod( vLineDistance, totalSize ) > dashSize ) {\n       discard;\n  }\n gl_FragColor = vec4( diffuse, opacity );", THREE.ShaderChunk.logdepthbuf_fragment, THREE.ShaderChunk.color_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n")
    },
    depth: {
        uniforms: {
            mNear: {
                type: "f",
                value: 1
            },
            mFar: {
                type: "f",
                value: 2e3
            },
            opacity: {
                type: "f",
                value: 1
            }
        },
        vertexShader: [THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, "}"].join("\n"),
        fragmentShader: ["uniform float mNear;\nuniform float mFar;\nuniform float opacity;", THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {", THREE.ShaderChunk.logdepthbuf_fragment, "   #ifdef USE_LOGDEPTHBUF_EXT\n        float depth = gl_FragDepthEXT / gl_FragCoord.w;\n   #else\n     float depth = gl_FragCoord.z / gl_FragCoord.w;\n    #endif\n    float color = 1.0 - smoothstep( mNear, mFar, depth );\n gl_FragColor = vec4( vec3( color ), opacity );\n}"].join("\n")
    },
    normal: {
        uniforms: {
            opacity: {
                type: "f",
                value: 1
            }
        },
        vertexShader: ["varying vec3 vNormal;", THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {\n  vNormal = normalize( normalMatrix * normal );", THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, "}"].join("\n"),
        fragmentShader: ["uniform float opacity;\nvarying vec3 vNormal;", THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n gl_FragColor = vec4( 0.5 * normalize( vNormal ) + 0.5, opacity );", THREE.ShaderChunk.logdepthbuf_fragment, "}"].join("\n")
    },
    normalmap: {
        uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, THREE.UniformsLib.lights, THREE.UniformsLib.shadowmap, {
            enableAO: {
                type: "i",
                value: 0
            },
            enableDiffuse: {
                type: "i",
                value: 0
            },
            enableSpecular: {
                type: "i",
                value: 0
            },
            enableReflection: {
                type: "i",
                value: 0
            },
            enableDisplacement: {
                type: "i",
                value: 0
            },
            tDisplacement: {
                type: "t",
                value: null
            },
            tDiffuse: {
                type: "t",
                value: null
            },
            tCube: {
                type: "t",
                value: null
            },
            tNormal: {
                type: "t",
                value: null
            },
            tSpecular: {
                type: "t",
                value: null
            },
            tAO: {
                type: "t",
                value: null
            },
            uNormalScale: {
                type: "v2",
                value: new THREE.Vector2(1, 1)
            },
            uDisplacementBias: {
                type: "f",
                value: 0
            },
            uDisplacementScale: {
                type: "f",
                value: 1
            },
            diffuse: {
                type: "c",
                value: new THREE.Color(16777215)
            },
            specular: {
                type: "c",
                value: new THREE.Color(1118481)
            },
            ambient: {
                type: "c",
                value: new THREE.Color(16777215)
            },
            shininess: {
                type: "f",
                value: 30
            },
            opacity: {
                type: "f",
                value: 1
            },
            useRefract: {
                type: "i",
                value: 0
            },
            refractionRatio: {
                type: "f",
                value: .98
            },
            reflectivity: {
                type: "f",
                value: .5
            },
            uOffset: {
                type: "v2",
                value: new THREE.Vector2(0, 0)
            },
            uRepeat: {
                type: "v2",
                value: new THREE.Vector2(1, 1)
            },
            wrapRGB: {
                type: "v3",
                value: new THREE.Vector3(1, 1, 1)
            }
        }]),
        fragmentShader: ["uniform vec3 ambient;\nuniform vec3 diffuse;\nuniform vec3 specular;\nuniform float shininess;\nuniform float opacity;\nuniform bool enableDiffuse;\nuniform bool enableSpecular;\nuniform bool enableAO;\nuniform bool enableReflection;\nuniform sampler2D tDiffuse;\nuniform sampler2D tNormal;\nuniform sampler2D tSpecular;\nuniform sampler2D tAO;\nuniform samplerCube tCube;\nuniform vec2 uNormalScale;\nuniform bool useRefract;\nuniform float refractionRatio;\nuniform float reflectivity;\nvarying vec3 vTangent;\nvarying vec3 vBinormal;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nuniform vec3 ambientLightColor;\n#if MAX_DIR_LIGHTS > 0\n uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];\n uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];\n#endif\n#if MAX_HEMI_LIGHTS > 0\n    uniform vec3 hemisphereLightSkyColor[ MAX_HEMI_LIGHTS ];\n  uniform vec3 hemisphereLightGroundColor[ MAX_HEMI_LIGHTS ];\n   uniform vec3 hemisphereLightDirection[ MAX_HEMI_LIGHTS ];\n#endif\n#if MAX_POINT_LIGHTS > 0\n   uniform vec3 pointLightColor[ MAX_POINT_LIGHTS ];\n uniform vec3 pointLightPosition[ MAX_POINT_LIGHTS ];\n  uniform float pointLightDistance[ MAX_POINT_LIGHTS ];\n#endif\n#if MAX_SPOT_LIGHTS > 0\n    uniform vec3 spotLightColor[ MAX_SPOT_LIGHTS ];\n   uniform vec3 spotLightPosition[ MAX_SPOT_LIGHTS ];\n    uniform vec3 spotLightDirection[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightAngleCos[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightExponent[ MAX_SPOT_LIGHTS ];\n   uniform float spotLightDistance[ MAX_SPOT_LIGHTS ];\n#endif\n#ifdef WRAP_AROUND\n   uniform vec3 wrapRGB;\n#endif\nvarying vec3 vWorldPosition;\nvarying vec3 vViewPosition;", THREE.ShaderChunk.shadowmap_pars_fragment, THREE.ShaderChunk.fog_pars_fragment, THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {", THREE.ShaderChunk.logdepthbuf_fragment, "  gl_FragColor = vec4( vec3( 1.0 ), opacity );\n  vec3 specularTex = vec3( 1.0 );\n   vec3 normalTex = texture2D( tNormal, vUv ).xyz * 2.0 - 1.0;\n   normalTex.xy *= uNormalScale;\n normalTex = normalize( normalTex );\n   if( enableDiffuse ) {\n     #ifdef GAMMA_INPUT\n            vec4 texelColor = texture2D( tDiffuse, vUv );\n         texelColor.xyz *= texelColor.xyz;\n         gl_FragColor = gl_FragColor * texelColor;\n     #else\n         gl_FragColor = gl_FragColor * texture2D( tDiffuse, vUv );\n     #endif\n    }\n if( enableAO ) {\n      #ifdef GAMMA_INPUT\n            vec4 aoColor = texture2D( tAO, vUv );\n         aoColor.xyz *= aoColor.xyz;\n           gl_FragColor.xyz = gl_FragColor.xyz * aoColor.xyz;\n        #else\n         gl_FragColor.xyz = gl_FragColor.xyz * texture2D( tAO, vUv ).xyz;\n      #endif\n    }", THREE.ShaderChunk.alphatest_fragment, " if( enableSpecular )\n      specularTex = texture2D( tSpecular, vUv ).xyz;\n    mat3 tsb = mat3( normalize( vTangent ), normalize( vBinormal ), normalize( vNormal ) );\n   vec3 finalNormal = tsb * normalTex;\n   #ifdef FLIP_SIDED\n     finalNormal = -finalNormal;\n   #endif\n    vec3 normal = normalize( finalNormal );\n   vec3 viewPosition = normalize( vViewPosition );\n   #if MAX_POINT_LIGHTS > 0\n      vec3 pointDiffuse = vec3( 0.0 );\n      vec3 pointSpecular = vec3( 0.0 );\n     for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {\n           vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );\n           vec3 pointVector = lPosition.xyz + vViewPosition.xyz;\n         float pointDistance = 1.0;\n            if ( pointLightDistance[ i ] > 0.0 )\n              pointDistance = 1.0 - min( ( length( pointVector ) / pointLightDistance[ i ] ), 1.0 );\n            pointVector = normalize( pointVector );\n           #ifdef WRAP_AROUND\n                float pointDiffuseWeightFull = max( dot( normal, pointVector ), 0.0 );\n                float pointDiffuseWeightHalf = max( 0.5 * dot( normal, pointVector ) + 0.5, 0.0 );\n                vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );\n         #else\n             float pointDiffuseWeight = max( dot( normal, pointVector ), 0.0 );\n            #endif\n            pointDiffuse += pointDistance * pointLightColor[ i ] * diffuse * pointDiffuseWeight;\n          vec3 pointHalfVector = normalize( pointVector + viewPosition );\n           float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );\n            float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );\n         float specularNormalization = ( shininess + 2.0 ) / 8.0;\n          vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( pointVector, pointHalfVector ), 0.0 ), 5.0 );\n         pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * pointDistance * specularNormalization;\n       }\n #endif\n    #if MAX_SPOT_LIGHTS > 0\n       vec3 spotDiffuse = vec3( 0.0 );\n       vec3 spotSpecular = vec3( 0.0 );\n      for ( int i = 0; i < MAX_SPOT_LIGHTS; i ++ ) {\n            vec4 lPosition = viewMatrix * vec4( spotLightPosition[ i ], 1.0 );\n            vec3 spotVector = lPosition.xyz + vViewPosition.xyz;\n          float spotDistance = 1.0;\n         if ( spotLightDistance[ i ] > 0.0 )\n               spotDistance = 1.0 - min( ( length( spotVector ) / spotLightDistance[ i ] ), 1.0 );\n           spotVector = normalize( spotVector );\n         float spotEffect = dot( spotLightDirection[ i ], normalize( spotLightPosition[ i ] - vWorldPosition ) );\n          if ( spotEffect > spotLightAngleCos[ i ] ) {\n              spotEffect = max( pow( max( spotEffect, 0.0 ), spotLightExponent[ i ] ), 0.0 );\n               #ifdef WRAP_AROUND\n                    float spotDiffuseWeightFull = max( dot( normal, spotVector ), 0.0 );\n                  float spotDiffuseWeightHalf = max( 0.5 * dot( normal, spotVector ) + 0.5, 0.0 );\n                  vec3 spotDiffuseWeight = mix( vec3( spotDiffuseWeightFull ), vec3( spotDiffuseWeightHalf ), wrapRGB );\n                #else\n                 float spotDiffuseWeight = max( dot( normal, spotVector ), 0.0 );\n              #endif\n                spotDiffuse += spotDistance * spotLightColor[ i ] * diffuse * spotDiffuseWeight * spotEffect;\n             vec3 spotHalfVector = normalize( spotVector + viewPosition );\n             float spotDotNormalHalf = max( dot( normal, spotHalfVector ), 0.0 );\n              float spotSpecularWeight = specularTex.r * max( pow( spotDotNormalHalf, shininess ), 0.0 );\n               float specularNormalization = ( shininess + 2.0 ) / 8.0;\n              vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( spotVector, spotHalfVector ), 0.0 ), 5.0 );\n               spotSpecular += schlick * spotLightColor[ i ] * spotSpecularWeight * spotDiffuseWeight * spotDistance * specularNormalization * spotEffect;\n           }\n     }\n #endif\n    #if MAX_DIR_LIGHTS > 0\n        vec3 dirDiffuse = vec3( 0.0 );\n        vec3 dirSpecular = vec3( 0.0 );\n       for( int i = 0; i < MAX_DIR_LIGHTS; i++ ) {\n           vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );\n           vec3 dirVector = normalize( lDirection.xyz );\n         #ifdef WRAP_AROUND\n                float directionalLightWeightingFull = max( dot( normal, dirVector ), 0.0 );\n               float directionalLightWeightingHalf = max( 0.5 * dot( normal, dirVector ) + 0.5, 0.0 );\n               vec3 dirDiffuseWeight = mix( vec3( directionalLightWeightingFull ), vec3( directionalLightWeightingHalf ), wrapRGB );\n         #else\n             float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );\n            #endif\n            dirDiffuse += directionalLightColor[ i ] * diffuse * dirDiffuseWeight;\n            vec3 dirHalfVector = normalize( dirVector + viewPosition );\n           float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );\n            float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );\n         float specularNormalization = ( shininess + 2.0 ) / 8.0;\n          vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );\n         dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;\n       }\n #endif\n    #if MAX_HEMI_LIGHTS > 0\n       vec3 hemiDiffuse = vec3( 0.0 );\n       vec3 hemiSpecular = vec3( 0.0 );\n      for( int i = 0; i < MAX_HEMI_LIGHTS; i ++ ) {\n         vec4 lDirection = viewMatrix * vec4( hemisphereLightDirection[ i ], 0.0 );\n            vec3 lVector = normalize( lDirection.xyz );\n           float dotProduct = dot( normal, lVector );\n            float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;\n         vec3 hemiColor = mix( hemisphereLightGroundColor[ i ], hemisphereLightSkyColor[ i ], hemiDiffuseWeight );\n         hemiDiffuse += diffuse * hemiColor;\n           vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );\n         float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;\n            float hemiSpecularWeightSky = specularTex.r * max( pow( max( hemiDotNormalHalfSky, 0.0 ), shininess ), 0.0 );\n         vec3 lVectorGround = -lVector;\n            vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );\n            float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;\n          float hemiSpecularWeightGround = specularTex.r * max( pow( max( hemiDotNormalHalfGround, 0.0 ), shininess ), 0.0 );\n           float dotProductGround = dot( normal, lVectorGround );\n            float specularNormalization = ( shininess + 2.0 ) / 8.0;\n          vec3 schlickSky = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, hemiHalfVectorSky ), 0.0 ), 5.0 );\n            vec3 schlickGround = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVectorGround, hemiHalfVectorGround ), 0.0 ), 5.0 );\n            hemiSpecular += hemiColor * specularNormalization * ( schlickSky * hemiSpecularWeightSky * max( dotProduct, 0.0 ) + schlickGround * hemiSpecularWeightGround * max( dotProductGround, 0.0 ) );\n        }\n #endif\n    vec3 totalDiffuse = vec3( 0.0 );\n  vec3 totalSpecular = vec3( 0.0 );\n #if MAX_DIR_LIGHTS > 0\n        totalDiffuse += dirDiffuse;\n       totalSpecular += dirSpecular;\n #endif\n    #if MAX_HEMI_LIGHTS > 0\n       totalDiffuse += hemiDiffuse;\n      totalSpecular += hemiSpecular;\n    #endif\n    #if MAX_POINT_LIGHTS > 0\n      totalDiffuse += pointDiffuse;\n     totalSpecular += pointSpecular;\n   #endif\n    #if MAX_SPOT_LIGHTS > 0\n       totalDiffuse += spotDiffuse;\n      totalSpecular += spotSpecular;\n    #endif\n    #ifdef METAL\n      gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient + totalSpecular );\n #else\n     gl_FragColor.xyz = gl_FragColor.xyz * ( totalDiffuse + ambientLightColor * ambient ) + totalSpecular;\n #endif\n    if ( enableReflection ) {\n     vec3 vReflect;\n        vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );\n       if ( useRefract ) {\n           vReflect = refract( cameraToVertex, normal, refractionRatio );\n        } else {\n          vReflect = reflect( cameraToVertex, normal );\n     }\n     vec4 cubeColor = textureCube( tCube, vec3( -vReflect.x, vReflect.yz ) );\n      #ifdef GAMMA_INPUT\n            cubeColor.xyz *= cubeColor.xyz;\n       #endif\n        gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularTex.r * reflectivity );\n  }", THREE.ShaderChunk.shadowmap_fragment, THREE.ShaderChunk.linear_to_gamma_fragment, THREE.ShaderChunk.fog_fragment, "}"].join("\n"),
        vertexShader: ["attribute vec4 tangent;\nuniform vec2 uOffset;\nuniform vec2 uRepeat;\nuniform bool enableDisplacement;\n#ifdef VERTEX_TEXTURES\n   uniform sampler2D tDisplacement;\n  uniform float uDisplacementScale;\n uniform float uDisplacementBias;\n#endif\nvarying vec3 vTangent;\nvarying vec3 vBinormal;\nvarying vec3 vNormal;\nvarying vec2 vUv;\nvarying vec3 vWorldPosition;\nvarying vec3 vViewPosition;", THREE.ShaderChunk.skinning_pars_vertex, THREE.ShaderChunk.shadowmap_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.skinbase_vertex, THREE.ShaderChunk.skinnormal_vertex, " #ifdef USE_SKINNING\n       vNormal = normalize( normalMatrix * skinnedNormal.xyz );\n      vec4 skinnedTangent = skinMatrix * vec4( tangent.xyz, 0.0 );\n      vTangent = normalize( normalMatrix * skinnedTangent.xyz );\n    #else\n     vNormal = normalize( normalMatrix * normal );\n     vTangent = normalize( normalMatrix * tangent.xyz );\n   #endif\n    vBinormal = normalize( cross( vNormal, vTangent ) * tangent.w );\n  vUv = uv * uRepeat + uOffset;\n vec3 displacedPosition;\n   #ifdef VERTEX_TEXTURES\n        if ( enableDisplacement ) {\n           vec3 dv = texture2D( tDisplacement, uv ).xyz;\n         float df = uDisplacementScale * dv.x + uDisplacementBias;\n         displacedPosition = position + normalize( normal ) * df;\n      } else {\n          #ifdef USE_SKINNING\n               vec4 skinVertex = bindMatrix * vec4( position, 1.0 );\n             vec4 skinned = vec4( 0.0 );\n               skinned += boneMatX * skinVertex * skinWeight.x;\n              skinned += boneMatY * skinVertex * skinWeight.y;\n              skinned += boneMatZ * skinVertex * skinWeight.z;\n              skinned += boneMatW * skinVertex * skinWeight.w;\n              skinned  = bindMatrixInverse * skinned;\n               displacedPosition = skinned.xyz;\n          #else\n             displacedPosition = position;\n         #endif\n        }\n #else\n     #ifdef USE_SKINNING\n           vec4 skinVertex = bindMatrix * vec4( position, 1.0 );\n         vec4 skinned = vec4( 0.0 );\n           skinned += boneMatX * skinVertex * skinWeight.x;\n          skinned += boneMatY * skinVertex * skinWeight.y;\n          skinned += boneMatZ * skinVertex * skinWeight.z;\n          skinned += boneMatW * skinVertex * skinWeight.w;\n          skinned  = bindMatrixInverse * skinned;\n           displacedPosition = skinned.xyz;\n      #else\n         displacedPosition = position;\n     #endif\n    #endif\n    vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );\n   vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );\n    gl_Position = projectionMatrix * mvPosition;", THREE.ShaderChunk.logdepthbuf_vertex, "  vWorldPosition = worldPosition.xyz;\n   vViewPosition = -mvPosition.xyz;\n  #ifdef USE_SHADOWMAP\n      for( int i = 0; i < MAX_SHADOWS; i ++ ) {\n         vShadowCoord[ i ] = shadowMatrix[ i ] * worldPosition;\n        }\n #endif\n}"].join("\n")
    },
    cube: {
        uniforms: {
            tCube: {
                type: "t",
                value: null
            },
            tFlip: {
                type: "f",
                value: -1
            }
        },
        vertexShader: ["varying vec3 vWorldPosition;", THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {\n  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n vWorldPosition = worldPosition.xyz;\n   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", THREE.ShaderChunk.logdepthbuf_vertex, "}"].join("\n"),
        fragmentShader: ["uniform samplerCube tCube;\nuniform float tFlip;\nvarying vec3 vWorldPosition;", THREE.ShaderChunk.logdepthbuf_pars_fragment, "void main() {\n    gl_FragColor = textureCube( tCube, vec3( tFlip * vWorldPosition.x, vWorldPosition.yz ) );", THREE.ShaderChunk.logdepthbuf_fragment, "}"].join("\n")
    },
    depthRGBA: {
        uniforms: {},
        vertexShader: [THREE.ShaderChunk.morphtarget_pars_vertex, THREE.ShaderChunk.skinning_pars_vertex, THREE.ShaderChunk.logdepthbuf_pars_vertex, "void main() {", THREE.ShaderChunk.skinbase_vertex, THREE.ShaderChunk.morphtarget_vertex, THREE.ShaderChunk.skinning_vertex, THREE.ShaderChunk.default_vertex, THREE.ShaderChunk.logdepthbuf_vertex, "}"].join("\n"),
        fragmentShader: [THREE.ShaderChunk.logdepthbuf_pars_fragment, "vec4 pack_depth( const in float depth ) {\n  const vec4 bit_shift = vec4( 256.0 * 256.0 * 256.0, 256.0 * 256.0, 256.0, 1.0 );\n  const vec4 bit_mask = vec4( 0.0, 1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0 );\n vec4 res = mod( depth * bit_shift * vec4( 255 ), vec4( 256 ) ) / vec4( 255 );\n res -= res.xxyz * bit_mask;\n   return res;\n}\nvoid main() {", THREE.ShaderChunk.logdepthbuf_fragment, "   #ifdef USE_LOGDEPTHBUF_EXT\n        gl_FragData[ 0 ] = pack_depth( gl_FragDepthEXT );\n #else\n     gl_FragData[ 0 ] = pack_depth( gl_FragCoord.z );\n  #endif\n}"].join("\n")
    }
};
THREE.WebGLRenderer = function(a) {
    function b(a) {
        var b = a.geometry;
        a = a.material;
        var c = b.vertices.length;
        if (a.attributes) {
            void 0 === b.__webglCustomAttributesList && (b.__webglCustomAttributesList = []);
            for (var d in a.attributes) {
                var e = a.attributes[d];
                if (!e.__webglInitialized || e.createUniqueBuffers) {
                    e.__webglInitialized = !0;
                    var f = 1;
                    "v2" === e.type ? f = 2 : "v3" === e.type ? f = 3 : "v4" === e.type ? f = 4 : "c" === e.type && (f = 3);
                    e.size = f;
                    e.array = new Float32Array(c * f);
                    e.buffer = l.createBuffer();
                    e.buffer.belongsToAttribute = d;
                    e.needsUpdate = !0
                }
                b.__webglCustomAttributesList.push(e)
            }
        }
    }

    function c(a, b) {
        var c = b.geometry,
            e = a.faces3,
            f = 3 * e.length,
            g = 1 * e.length,
            h = 3 * e.length,
            e = d(b, a);
        a.__vertexArray = new Float32Array(3 * f);
        a.__normalArray = new Float32Array(3 * f);
        a.__colorArray = new Float32Array(3 * f);
        a.__uvArray = new Float32Array(2 * f);
        1 < c.faceVertexUvs.length && (a.__uv2Array = new Float32Array(2 * f));
        c.hasTangents && (a.__tangentArray = new Float32Array(4 * f));
        b.geometry.skinWeights.length && b.geometry.skinIndices.length && (a.__skinIndexArray = new Float32Array(4 * f), a.__skinWeightArray = new Float32Array(4 * f));
        c = null !== pa.get("OES_element_index_uint") && 21845 < g ? Uint32Array : Uint16Array;
        a.__typeArray = c;
        a.__faceArray = new c(3 * g);
        a.__lineArray = new c(2 * h);
        var k;
        if (a.numMorphTargets)
            for (a.__morphTargetsArrays = [], c = 0, k = a.numMorphTargets; c < k; c++) a.__morphTargetsArrays.push(new Float32Array(3 * f));
        if (a.numMorphNormals)
            for (a.__morphNormalsArrays = [], c = 0, k = a.numMorphNormals; c < k; c++) a.__morphNormalsArrays.push(new Float32Array(3 * f));
        a.__webglFaceCount = 3 * g;
        a.__webglLineCount = 2 * h;
        if (e.attributes) {
            void 0 === a.__webglCustomAttributesList && (a.__webglCustomAttributesList = []);
            for (var m in e.attributes) {
                var g = e.attributes[m],
                    h = {},
                    n;
                for (n in g) h[n] = g[n];
                if (!h.__webglInitialized || h.createUniqueBuffers) h.__webglInitialized = !0, c = 1, "v2" === h.type ? c = 2 : "v3" === h.type ? c = 3 : "v4" === h.type ? c = 4 : "c" === h.type && (c = 3), h.size = c, h.array = new Float32Array(f * c), h.buffer = l.createBuffer(), h.buffer.belongsToAttribute = m, g.needsUpdate = !0, h.__original = g;
                a.__webglCustomAttributesList.push(h)
            }
        }
        a.__inittedArrays = !0
    }

    function d(a, b) {
        return a.material instanceof THREE.MeshFaceMaterial ? a.material.materials[b.materialIndex] : a.material
    }

    function e(a, b, c, d) {
        c = c.attributes;
        var e = b.attributes;
        b = b.attributesKeys;
        for (var f = 0, k = b.length; f < k; f++) {
            var m = b[f],
                n = e[m];
            if (0 <= n) {
                var p = c[m];
                void 0 !== p ? (m = p.itemSize, l.bindBuffer(l.ARRAY_BUFFER, p.buffer), g(n), l.vertexAttribPointer(n, m, l.FLOAT, !1, 0, d * m * 4)) : void 0 !== a.defaultAttributeValues && (2 === a.defaultAttributeValues[m].length ? l.vertexAttrib2fv(n, a.defaultAttributeValues[m]) : 3 === a.defaultAttributeValues[m].length && l.vertexAttrib3fv(n, a.defaultAttributeValues[m]))
            }
        }
        h()
    }

    function f() {
        for (var a = 0, b = wb.length; a < b; a++) wb[a] = 0
    }

    function g(a) {
        wb[a] = 1;
        0 === ib[a] && (l.enableVertexAttribArray(a), ib[a] = 1)
    }

    function h() {
        for (var a = 0, b = ib.length; a < b; a++) ib[a] !== wb[a] && (l.disableVertexAttribArray(a), ib[a] = 0)
    }

    function k(a, b) {
        return a.material.id !== b.material.id ? b.material.id - a.material.id : a.z !== b.z ? b.z - a.z : a.id - b.id
    }

    function n(a, b) {
        return a.z !== b.z ? a.z - b.z : a.id - b.id
    }

    function p(a, b) {
        return b[0] - a[0]
    }

    function q(a, e) {
        if (!1 !== e.visible) {
            if (!(e instanceof THREE.Scene || e instanceof THREE.Group)) {
                void 0 === e.__webglInit && (e.__webglInit = !0, e._modelViewMatrix = new THREE.Matrix4, e._normalMatrix = new THREE.Matrix3, e.addEventListener("removed", Hc));
                var f = e.geometry;
                if (void 0 !== f && void 0 === f.__webglInit && (f.__webglInit = !0, f.addEventListener("dispose", Ic), !(f instanceof THREE.BufferGeometry)))
                    if (e instanceof THREE.Mesh) s(a, e, f);
                    else if (e instanceof THREE.Line) {
                    if (void 0 === f.__webglVertexBuffer) {
                        f.__webglVertexBuffer = l.createBuffer();
                        f.__webglColorBuffer = l.createBuffer();
                        f.__webglLineDistanceBuffer = l.createBuffer();
                        J.info.memory.geometries++;
                        var g = f.vertices.length;
                        f.__vertexArray = new Float32Array(3 * g);
                        f.__colorArray = new Float32Array(3 * g);
                        f.__lineDistanceArray = new Float32Array(1 * g);
                        f.__webglLineCount = g;
                        b(e);
                        f.verticesNeedUpdate = !0;
                        f.colorsNeedUpdate = !0;
                        f.lineDistancesNeedUpdate = !0
                    }
                } else if (e instanceof THREE.PointCloud && void 0 === f.__webglVertexBuffer) {
                    f.__webglVertexBuffer = l.createBuffer();
                    f.__webglColorBuffer = l.createBuffer();
                    J.info.memory.geometries++;
                    var h = f.vertices.length;
                    f.__vertexArray = new Float32Array(3 * h);
                    f.__colorArray = new Float32Array(3 * h);
                    f.__sortArray = [];
                    f.__webglParticleCount = h;
                    b(e);
                    f.verticesNeedUpdate = !0;
                    f.colorsNeedUpdate = !0
                }
                if (void 0 === e.__webglActive)
                    if (e.__webglActive = !0, e instanceof THREE.Mesh)
                        if (f instanceof THREE.BufferGeometry) u(ob, f, e);
                        else {
                            if (f instanceof THREE.Geometry)
                                for (var k = xb[f.id], m = 0, n = k.length; m < n; m++) u(ob, k[m], e)
                        }
                else e instanceof THREE.Line || e instanceof THREE.PointCloud ? u(ob, f, e) : (e instanceof THREE.ImmediateRenderObject || e.immediateRenderCallback) && jb.push({
                    id: null,
                    object: e,
                    opaque: null,
                    transparent: null,
                    z: 0
                });
                if (e instanceof THREE.Light) cb.push(e);
                else if (e instanceof THREE.Sprite) yb.push(e);
                else if (e instanceof THREE.LensFlare) Ra.push(e);
                else {
                    var t = ob[e.id];
                    if (t && (!1 === e.frustumCulled || !0 === Ec.intersectsObject(e))) {
                        var r = e.geometry,
                            w, G;
                        if (r instanceof THREE.BufferGeometry)
                            for (var x = r.attributes, D = r.attributesKeys, E = 0, B = D.length; E < B; E++) {
                                var A = D[E],
                                    K = x[A];
                                void 0 === K.buffer && (K.buffer = l.createBuffer(), K.needsUpdate = !0);
                                if (!0 === K.needsUpdate) {
                                    var F = "index" === A ? l.ELEMENT_ARRAY_BUFFER : l.ARRAY_BUFFER;
                                    l.bindBuffer(F, K.buffer);
                                    l.bufferData(F, K.array, l.STATIC_DRAW);
                                    K.needsUpdate = !1
                                }
                            } else if (e instanceof THREE.Mesh) {
                                !0 === r.groupsNeedUpdate && s(a, e, r);
                                for (var H = xb[r.id], O = 0, Q = H.length; O < Q; O++) {
                                    var R = H[O];
                                    G = d(e, R);
                                    !0 === r.groupsNeedUpdate && c(R, e);
                                    w = G.attributes && v(G);
                                    if (r.verticesNeedUpdate || r.morphTargetsNeedUpdate || r.elementsNeedUpdate || r.uvsNeedUpdate || r.normalsNeedUpdate || r.colorsNeedUpdate || r.tangentsNeedUpdate || w) {
                                        var C = R,
                                            P = e,
                                            S = l.DYNAMIC_DRAW,
                                            T = !r.dynamic,
                                            X = G;
                                        if (C.__inittedArrays) {
                                            var bb = X && void 0 !== X.shading && X.shading === THREE.SmoothShading,
                                                M = void 0,
                                                ea = void 0,
                                                Y = void 0,
                                                ca = void 0,
                                                ma = void 0,
                                                pa = void 0,
                                                sa = void 0,
                                                Fa = void 0,
                                                la = void 0,
                                                hb = void 0,
                                                za = void 0,
                                                aa = void 0,
                                                $ = void 0,
                                                Z = void 0,
                                                ya = void 0,
                                                qa = void 0,
                                                L = void 0,
                                                Ga = void 0,
                                                na = void 0,
                                                nc = void 0,
                                                ia = void 0,
                                                oc = void 0,
                                                pc = void 0,
                                                qc = void 0,
                                                Ba = void 0,
                                                zb = void 0,
                                                Ab = void 0,
                                                Ha = void 0,
                                                Bb = void 0,
                                                Aa = void 0,
                                                va = void 0,
                                                Cb = void 0,
                                                Oa = void 0,
                                                Qb = void 0,
                                                Ma = void 0,
                                                ib = void 0,
                                                Ya = void 0,
                                                Za = void 0,
                                                uc = void 0,
                                                Rb = void 0,
                                                db = 0,
                                                eb = 0,
                                                qb = 0,
                                                rb = 0,
                                                Db = 0,
                                                Sa = 0,
                                                Ca = 0,
                                                Pa = 0,
                                                Ka = 0,
                                                ja = 0,
                                                ta = 0,
                                                I = 0,
                                                Ia = void 0,
                                                Qa = C.__vertexArray,
                                                sb = C.__uvArray,
                                                fb = C.__uv2Array,
                                                Ta = C.__normalArray,
                                                ra = C.__tangentArray,
                                                La = C.__colorArray,
                                                Ua = C.__skinIndexArray,
                                                Va = C.__skinWeightArray,
                                                Eb = C.__morphTargetsArrays,
                                                Jc = C.__morphNormalsArrays,
                                                Kb = C.__webglCustomAttributesList,
                                                z = void 0,
                                                Sb = C.__faceArray,
                                                Ja = C.__lineArray,
                                                wa = P.geometry,
                                                $a = wa.elementsNeedUpdate,
                                                Kc = wa.uvsNeedUpdate,
                                                ec = wa.normalsNeedUpdate,
                                                da = wa.tangentsNeedUpdate,
                                                wb = wa.colorsNeedUpdate,
                                                U = wa.morphTargetsNeedUpdate,
                                                fa = wa.vertices,
                                                N = C.faces3,
                                                xa = wa.faces,
                                                ua = wa.faceVertexUvs[0],
                                                Lc = wa.faceVertexUvs[1],
                                                Fc = wa.skinIndices,
                                                Tb = wa.skinWeights,
                                                kb = wa.morphTargets,
                                                Da = wa.morphNormals;
                                            if (wa.verticesNeedUpdate) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++) ca = xa[N[M]], aa = fa[ca.a], $ = fa[ca.b], Z = fa[ca.c], Qa[eb] = aa.x, Qa[eb + 1] = aa.y, Qa[eb + 2] = aa.z, Qa[eb + 3] = $.x, Qa[eb + 4] = $.y, Qa[eb + 5] = $.z, Qa[eb + 6] = Z.x, Qa[eb + 7] = Z.y, Qa[eb + 8] = Z.z, eb += 9;
                                                l.bindBuffer(l.ARRAY_BUFFER, C.__webglVertexBuffer);
                                                l.bufferData(l.ARRAY_BUFFER, Qa, S)
                                            }
                                            if (U)
                                                for (Ma = 0, ib = kb.length; Ma < ib; Ma++) {
                                                    M = ta = 0;
                                                    for (ea = N.length; M < ea; M++) uc = N[M], ca = xa[uc], aa = kb[Ma].vertices[ca.a], $ = kb[Ma].vertices[ca.b], Z = kb[Ma].vertices[ca.c], Ya = Eb[Ma], Ya[ta] = aa.x, Ya[ta + 1] = aa.y, Ya[ta + 2] = aa.z, Ya[ta + 3] = $.x, Ya[ta + 4] = $.y, Ya[ta + 5] = $.z, Ya[ta + 6] = Z.x, Ya[ta + 7] = Z.y, Ya[ta + 8] = Z.z, X.morphNormals && (bb ? (Rb = Da[Ma].vertexNormals[uc], Ga = Rb.a, na = Rb.b, nc = Rb.c) : nc = na = Ga = Da[Ma].faceNormals[uc], Za = Jc[Ma], Za[ta] = Ga.x, Za[ta + 1] = Ga.y, Za[ta + 2] = Ga.z, Za[ta + 3] = na.x, Za[ta + 4] = na.y, Za[ta + 5] = na.z, Za[ta + 6] = nc.x, Za[ta + 7] = nc.y, Za[ta + 8] = nc.z), ta += 9;
                                                    l.bindBuffer(l.ARRAY_BUFFER, C.__webglMorphTargetsBuffers[Ma]);
                                                    l.bufferData(l.ARRAY_BUFFER, Eb[Ma], S);
                                                    X.morphNormals && (l.bindBuffer(l.ARRAY_BUFFER, C.__webglMorphNormalsBuffers[Ma]), l.bufferData(l.ARRAY_BUFFER, Jc[Ma], S))
                                                }
                                            if (Tb.length) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++) ca = xa[N[M]], qc = Tb[ca.a], Ba = Tb[ca.b], zb = Tb[ca.c], Va[ja] = qc.x, Va[ja + 1] = qc.y, Va[ja + 2] = qc.z, Va[ja + 3] = qc.w, Va[ja + 4] = Ba.x, Va[ja + 5] = Ba.y, Va[ja + 6] = Ba.z, Va[ja + 7] = Ba.w, Va[ja + 8] = zb.x, Va[ja + 9] = zb.y, Va[ja + 10] = zb.z, Va[ja + 11] = zb.w, Ab = Fc[ca.a], Ha = Fc[ca.b], Bb = Fc[ca.c], Ua[ja] = Ab.x, Ua[ja + 1] = Ab.y, Ua[ja + 2] = Ab.z, Ua[ja + 3] = Ab.w, Ua[ja + 4] = Ha.x, Ua[ja + 5] = Ha.y, Ua[ja + 6] = Ha.z, Ua[ja + 7] = Ha.w, Ua[ja + 8] = Bb.x, Ua[ja + 9] = Bb.y, Ua[ja + 10] = Bb.z, Ua[ja + 11] = Bb.w, ja += 12;
                                                0 < ja && (l.bindBuffer(l.ARRAY_BUFFER, C.__webglSkinIndicesBuffer), l.bufferData(l.ARRAY_BUFFER, Ua, S), l.bindBuffer(l.ARRAY_BUFFER, C.__webglSkinWeightsBuffer), l.bufferData(l.ARRAY_BUFFER, Va, S))
                                            }
                                            if (wb) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++) ca = xa[N[M]], sa = ca.vertexColors, Fa = ca.color, 3 === sa.length && X.vertexColors === THREE.VertexColors ? (ia = sa[0], oc = sa[1], pc = sa[2]) : pc = oc = ia = Fa, La[Ka] = ia.r, La[Ka + 1] = ia.g, La[Ka + 2] = ia.b, La[Ka + 3] = oc.r, La[Ka + 4] = oc.g, La[Ka + 5] = oc.b, La[Ka + 6] = pc.r, La[Ka + 7] = pc.g, La[Ka + 8] = pc.b, Ka += 9;
                                                0 < Ka && (l.bindBuffer(l.ARRAY_BUFFER, C.__webglColorBuffer), l.bufferData(l.ARRAY_BUFFER, La, S))
                                            }
                                            if (da && wa.hasTangents) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++) ca = xa[N[M]], la = ca.vertexTangents, ya = la[0], qa = la[1], L = la[2], ra[Ca] = ya.x, ra[Ca + 1] = ya.y, ra[Ca + 2] = ya.z, ra[Ca + 3] = ya.w, ra[Ca + 4] = qa.x, ra[Ca + 5] = qa.y, ra[Ca + 6] = qa.z, ra[Ca + 7] = qa.w, ra[Ca + 8] = L.x, ra[Ca + 9] = L.y, ra[Ca + 10] = L.z, ra[Ca + 11] = L.w, Ca += 12;
                                                l.bindBuffer(l.ARRAY_BUFFER, C.__webglTangentBuffer);
                                                l.bufferData(l.ARRAY_BUFFER, ra, S)
                                            }
                                            if (ec) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++)
                                                    if (ca = xa[N[M]], ma = ca.vertexNormals, pa = ca.normal, 3 === ma.length && bb)
                                                        for (Aa = 0; 3 > Aa; Aa++) Cb = ma[Aa], Ta[Sa] = Cb.x, Ta[Sa + 1] = Cb.y, Ta[Sa + 2] = Cb.z, Sa += 3;
                                                    else
                                                        for (Aa = 0; 3 > Aa; Aa++) Ta[Sa] = pa.x, Ta[Sa + 1] = pa.y, Ta[Sa + 2] = pa.z, Sa += 3;
                                                l.bindBuffer(l.ARRAY_BUFFER, C.__webglNormalBuffer);
                                                l.bufferData(l.ARRAY_BUFFER, Ta, S)
                                            }
                                            if (Kc && ua) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++)
                                                    if (Y = N[M], hb = ua[Y], void 0 !== hb)
                                                        for (Aa = 0; 3 > Aa; Aa++) Oa = hb[Aa], sb[qb] = Oa.x, sb[qb + 1] = Oa.y, qb += 2;
                                                0 < qb && (l.bindBuffer(l.ARRAY_BUFFER, C.__webglUVBuffer), l.bufferData(l.ARRAY_BUFFER, sb, S))
                                            }
                                            if (Kc && Lc) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++)
                                                    if (Y = N[M], za = Lc[Y], void 0 !== za)
                                                        for (Aa = 0; 3 > Aa; Aa++) Qb = za[Aa], fb[rb] = Qb.x, fb[rb + 1] = Qb.y, rb += 2;
                                                0 < rb && (l.bindBuffer(l.ARRAY_BUFFER, C.__webglUV2Buffer), l.bufferData(l.ARRAY_BUFFER, fb, S))
                                            }
                                            if ($a) {
                                                M = 0;
                                                for (ea = N.length; M < ea; M++) Sb[Db] = db, Sb[Db + 1] = db + 1, Sb[Db + 2] = db + 2, Db += 3, Ja[Pa] = db, Ja[Pa + 1] = db + 1, Ja[Pa + 2] = db, Ja[Pa + 3] = db + 2, Ja[Pa + 4] = db + 1, Ja[Pa + 5] = db + 2, Pa += 6, db += 3;
                                                l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, C.__webglFaceBuffer);
                                                l.bufferData(l.ELEMENT_ARRAY_BUFFER, Sb, S);
                                                l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, C.__webglLineBuffer);
                                                l.bufferData(l.ELEMENT_ARRAY_BUFFER, Ja, S)
                                            }
                                            if (Kb)
                                                for (Aa = 0, va = Kb.length; Aa < va; Aa++)
                                                    if (z = Kb[Aa], z.__original.needsUpdate) {
                                                        I = 0;
                                                        if (1 === z.size)
                                                            if (void 0 === z.boundTo || "vertices" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) ca = xa[N[M]], z.array[I] = z.value[ca.a], z.array[I + 1] = z.value[ca.b], z.array[I + 2] = z.value[ca.c], I += 3;
                                                            else {
                                                                if ("faces" === z.boundTo)
                                                                    for (M = 0, ea = N.length; M < ea; M++) Ia = z.value[N[M]], z.array[I] = Ia, z.array[I + 1] = Ia, z.array[I + 2] = Ia, I += 3
                                                            }
                                                        else if (2 === z.size)
                                                            if (void 0 === z.boundTo || "vertices" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) ca = xa[N[M]], aa = z.value[ca.a], $ = z.value[ca.b], Z = z.value[ca.c], z.array[I] = aa.x, z.array[I + 1] = aa.y, z.array[I + 2] = $.x, z.array[I + 3] = $.y, z.array[I + 4] = Z.x, z.array[I + 5] = Z.y, I += 6;
                                                            else {
                                                                if ("faces" === z.boundTo)
                                                                    for (M = 0, ea = N.length; M < ea; M++) Z = $ = aa = Ia = z.value[N[M]], z.array[I] = aa.x, z.array[I + 1] = aa.y, z.array[I + 2] = $.x, z.array[I + 3] = $.y, z.array[I + 4] = Z.x, z.array[I + 5] = Z.y, I += 6
                                                            }
                                                        else if (3 === z.size) {
                                                            var ka;
                                                            ka = "c" === z.type ? ["r", "g", "b"] : ["x", "y", "z"];
                                                            if (void 0 === z.boundTo || "vertices" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) ca = xa[N[M]], aa = z.value[ca.a], $ = z.value[ca.b], Z = z.value[ca.c], z.array[I] = aa[ka[0]], z.array[I + 1] = aa[ka[1]], z.array[I + 2] = aa[ka[2]], z.array[I + 3] = $[ka[0]], z.array[I + 4] = $[ka[1]], z.array[I + 5] = $[ka[2]], z.array[I + 6] = Z[ka[0]], z.array[I + 7] = Z[ka[1]], z.array[I + 8] = Z[ka[2]], I += 9;
                                                            else if ("faces" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) Z = $ = aa = Ia = z.value[N[M]], z.array[I] = aa[ka[0]], z.array[I + 1] = aa[ka[1]], z.array[I + 2] = aa[ka[2]], z.array[I + 3] = $[ka[0]], z.array[I + 4] = $[ka[1]], z.array[I + 5] = $[ka[2]], z.array[I + 6] = Z[ka[0]], z.array[I + 7] = Z[ka[1]], z.array[I + 8] = Z[ka[2]], I += 9;
                                                            else if ("faceVertices" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) Ia = z.value[N[M]], aa = Ia[0], $ = Ia[1], Z = Ia[2], z.array[I] = aa[ka[0]], z.array[I + 1] = aa[ka[1]], z.array[I + 2] = aa[ka[2]], z.array[I + 3] = $[ka[0]], z.array[I + 4] = $[ka[1]], z.array[I + 5] = $[ka[2]], z.array[I + 6] = Z[ka[0]], z.array[I + 7] = Z[ka[1]], z.array[I + 8] = Z[ka[2]], I += 9
                                                        } else if (4 === z.size)
                                                            if (void 0 === z.boundTo || "vertices" === z.boundTo)
                                                                for (M = 0, ea = N.length; M < ea; M++) ca = xa[N[M]], aa = z.value[ca.a], $ = z.value[ca.b], Z = z.value[ca.c], z.array[I] = aa.x, z.array[I + 1] = aa.y, z.array[I + 2] = aa.z, z.array[I + 3] = aa.w, z.array[I + 4] = $.x, z.array[I + 5] = $.y, z.array[I + 6] = $.z, z.array[I + 7] = $.w, z.array[I + 8] = Z.x, z.array[I + 9] = Z.y, z.array[I + 10] = Z.z, z.array[I + 11] = Z.w, I += 12;
                                                            else if ("faces" === z.boundTo)
                                                            for (M = 0, ea = N.length; M < ea; M++) Z = $ = aa = Ia = z.value[N[M]], z.array[I] = aa.x, z.array[I + 1] = aa.y, z.array[I + 2] = aa.z, z.array[I + 3] = aa.w, z.array[I + 4] = $.x, z.array[I + 5] = $.y, z.array[I + 6] = $.z, z.array[I + 7] = $.w, z.array[I + 8] = Z.x, z.array[I + 9] = Z.y, z.array[I + 10] = Z.z, z.array[I + 11] = Z.w, I += 12;
                                                        else if ("faceVertices" === z.boundTo)
                                                            for (M = 0, ea = N.length; M < ea; M++) Ia = z.value[N[M]], aa = Ia[0], $ = Ia[1], Z = Ia[2], z.array[I] = aa.x, z.array[I + 1] = aa.y, z.array[I + 2] = aa.z, z.array[I + 3] = aa.w, z.array[I + 4] = $.x, z.array[I + 5] = $.y, z.array[I + 6] = $.z, z.array[I + 7] = $.w, z.array[I + 8] = Z.x, z.array[I + 9] = Z.y, z.array[I + 10] = Z.z, z.array[I + 11] = Z.w, I += 12;
                                                        l.bindBuffer(l.ARRAY_BUFFER, z.buffer);
                                                        l.bufferData(l.ARRAY_BUFFER, z.array, S)
                                                    }
                                            T && (delete C.__inittedArrays, delete C.__colorArray, delete C.__normalArray, delete C.__tangentArray, delete C.__uvArray, delete C.__uv2Array, delete C.__faceArray, delete C.__vertexArray, delete C.__lineArray, delete C.__skinIndexArray, delete C.__skinWeightArray)
                                        }
                                    }
                                }
                                r.verticesNeedUpdate = !1;
                                r.morphTargetsNeedUpdate = !1;
                                r.elementsNeedUpdate = !1;
                                r.uvsNeedUpdate = !1;
                                r.normalsNeedUpdate = !1;
                                r.colorsNeedUpdate = !1;
                                r.tangentsNeedUpdate = !1;
                                G.attributes && y(G)
                            } else if (e instanceof THREE.Line) {
                            G = d(e, r);
                            w = G.attributes && v(G);
                            if (r.verticesNeedUpdate || r.colorsNeedUpdate || r.lineDistancesNeedUpdate || w) {
                                var Zb = l.DYNAMIC_DRAW,
                                    ab, Fb, gb, $b, ga, vc, dc = r.vertices,
                                    fc = r.colors,
                                    Pb = r.lineDistances,
                                    kc = dc.length,
                                    lc = fc.length,
                                    mc = Pb.length,
                                    wc = r.__vertexArray,
                                    xc = r.__colorArray,
                                    jc = r.__lineDistanceArray,
                                    sc = r.colorsNeedUpdate,
                                    tc = r.lineDistancesNeedUpdate,
                                    gc = r.__webglCustomAttributesList,
                                    yc, Lb, Ea, hc, Wa, oa;
                                if (r.verticesNeedUpdate) {
                                    for (ab = 0; ab < kc; ab++) $b = dc[ab], ga = 3 * ab, wc[ga] = $b.x, wc[ga + 1] = $b.y, wc[ga + 2] = $b.z;
                                    l.bindBuffer(l.ARRAY_BUFFER, r.__webglVertexBuffer);
                                    l.bufferData(l.ARRAY_BUFFER, wc, Zb)
                                }
                                if (sc) {
                                    for (Fb = 0; Fb < lc; Fb++) vc = fc[Fb], ga = 3 * Fb, xc[ga] = vc.r, xc[ga + 1] = vc.g, xc[ga + 2] = vc.b;
                                    l.bindBuffer(l.ARRAY_BUFFER, r.__webglColorBuffer);
                                    l.bufferData(l.ARRAY_BUFFER, xc, Zb)
                                }
                                if (tc) {
                                    for (gb = 0; gb < mc; gb++) jc[gb] = Pb[gb];
                                    l.bindBuffer(l.ARRAY_BUFFER, r.__webglLineDistanceBuffer);
                                    l.bufferData(l.ARRAY_BUFFER, jc, Zb)
                                }
                                if (gc)
                                    for (yc = 0, Lb = gc.length; yc < Lb; yc++)
                                        if (oa = gc[yc], oa.needsUpdate && (void 0 === oa.boundTo || "vertices" === oa.boundTo)) {
                                            ga = 0;
                                            hc = oa.value.length;
                                            if (1 === oa.size)
                                                for (Ea = 0; Ea < hc; Ea++) oa.array[Ea] = oa.value[Ea];
                                            else if (2 === oa.size)
                                                for (Ea = 0; Ea < hc; Ea++) Wa = oa.value[Ea], oa.array[ga] = Wa.x, oa.array[ga + 1] = Wa.y, ga += 2;
                                            else if (3 === oa.size)
                                                if ("c" === oa.type)
                                                    for (Ea = 0; Ea < hc; Ea++) Wa = oa.value[Ea], oa.array[ga] = Wa.r, oa.array[ga + 1] = Wa.g, oa.array[ga + 2] = Wa.b, ga += 3;
                                                else
                                                    for (Ea = 0; Ea < hc; Ea++) Wa = oa.value[Ea], oa.array[ga] = Wa.x, oa.array[ga + 1] = Wa.y, oa.array[ga + 2] = Wa.z, ga += 3;
                                            else if (4 === oa.size)
                                                for (Ea = 0; Ea < hc; Ea++) Wa = oa.value[Ea], oa.array[ga] = Wa.x, oa.array[ga + 1] = Wa.y, oa.array[ga + 2] = Wa.z, oa.array[ga + 3] = Wa.w, ga += 4;
                                            l.bindBuffer(l.ARRAY_BUFFER, oa.buffer);
                                            l.bufferData(l.ARRAY_BUFFER, oa.array, Zb)
                                        }
                            }
                            r.verticesNeedUpdate = !1;
                            r.colorsNeedUpdate = !1;
                            r.lineDistancesNeedUpdate = !1;
                            G.attributes && y(G)
                        } else if (e instanceof THREE.PointCloud) {
                            G = d(e, r);
                            w = G.attributes && v(G);
                            if (r.verticesNeedUpdate || r.colorsNeedUpdate || e.sortParticles || w) {
                                var Mb = l.DYNAMIC_DRAW,
                                    Xa, tb, ub, W, vb, Ub, zc = r.vertices,
                                    pb = zc.length,
                                    Nb = r.colors,
                                    Ob = Nb.length,
                                    ac = r.__vertexArray,
                                    bc = r.__colorArray,
                                    Gb = r.__sortArray,
                                    Xb = r.verticesNeedUpdate,
                                    Yb = r.colorsNeedUpdate,
                                    Hb = r.__webglCustomAttributesList,
                                    lb, ic, ba, mb, ha, V;
                                if (e.sortParticles) {
                                    Gc.copy(Ac);
                                    Gc.multiply(e.matrixWorld);
                                    for (Xa = 0; Xa < pb; Xa++) ub = zc[Xa], Na.copy(ub), Na.applyProjection(Gc), Gb[Xa] = [Na.z, Xa];
                                    Gb.sort(p);
                                    for (Xa = 0; Xa < pb; Xa++) ub = zc[Gb[Xa][1]], W = 3 * Xa, ac[W] = ub.x, ac[W + 1] = ub.y, ac[W + 2] = ub.z;
                                    for (tb = 0; tb < Ob; tb++) W = 3 * tb, Ub = Nb[Gb[tb][1]], bc[W] = Ub.r, bc[W + 1] = Ub.g, bc[W + 2] = Ub.b;
                                    if (Hb)
                                        for (lb = 0, ic = Hb.length; lb < ic; lb++)
                                            if (V = Hb[lb], void 0 === V.boundTo || "vertices" === V.boundTo)
                                                if (W = 0, mb = V.value.length, 1 === V.size)
                                                    for (ba = 0; ba < mb; ba++) vb = Gb[ba][1], V.array[ba] = V.value[vb];
                                                else if (2 === V.size)
                                        for (ba = 0; ba < mb; ba++) vb = Gb[ba][1], ha = V.value[vb], V.array[W] = ha.x, V.array[W + 1] = ha.y, W += 2;
                                    else if (3 === V.size)
                                        if ("c" === V.type)
                                            for (ba = 0; ba < mb; ba++) vb = Gb[ba][1], ha = V.value[vb], V.array[W] = ha.r, V.array[W + 1] = ha.g, V.array[W + 2] = ha.b, W += 3;
                                        else
                                            for (ba = 0; ba < mb; ba++) vb = Gb[ba][1], ha = V.value[vb], V.array[W] = ha.x, V.array[W + 1] = ha.y, V.array[W + 2] = ha.z, W += 3;
                                    else if (4 === V.size)
                                        for (ba = 0; ba < mb; ba++) vb = Gb[ba][1], ha = V.value[vb], V.array[W] = ha.x, V.array[W + 1] = ha.y, V.array[W + 2] = ha.z, V.array[W + 3] = ha.w, W += 4
                                } else {
                                    if (Xb)
                                        for (Xa = 0; Xa < pb; Xa++) ub = zc[Xa], W = 3 * Xa, ac[W] = ub.x, ac[W + 1] = ub.y, ac[W + 2] = ub.z;
                                    if (Yb)
                                        for (tb = 0; tb < Ob; tb++) Ub = Nb[tb], W = 3 * tb, bc[W] = Ub.r, bc[W + 1] = Ub.g, bc[W + 2] = Ub.b;
                                    if (Hb)
                                        for (lb = 0, ic = Hb.length; lb < ic; lb++)
                                            if (V = Hb[lb], V.needsUpdate && (void 0 === V.boundTo || "vertices" === V.boundTo))
                                                if (mb = V.value.length, W = 0, 1 === V.size)
                                                    for (ba = 0; ba < mb; ba++) V.array[ba] = V.value[ba];
                                                else if (2 === V.size)
                                        for (ba = 0; ba < mb; ba++) ha = V.value[ba], V.array[W] = ha.x, V.array[W + 1] = ha.y, W += 2;
                                    else if (3 === V.size)
                                        if ("c" === V.type)
                                            for (ba = 0; ba < mb; ba++) ha = V.value[ba], V.array[W] = ha.r, V.array[W + 1] = ha.g, V.array[W + 2] = ha.b, W += 3;
                                        else
                                            for (ba = 0; ba < mb; ba++) ha = V.value[ba], V.array[W] = ha.x, V.array[W + 1] = ha.y, V.array[W + 2] = ha.z, W += 3;
                                    else if (4 === V.size)
                                        for (ba = 0; ba < mb; ba++) ha = V.value[ba], V.array[W] = ha.x, V.array[W + 1] = ha.y, V.array[W + 2] = ha.z, V.array[W + 3] = ha.w, W += 4
                                }
                                if (Xb || e.sortParticles) l.bindBuffer(l.ARRAY_BUFFER, r.__webglVertexBuffer), l.bufferData(l.ARRAY_BUFFER, ac, Mb);
                                if (Yb || e.sortParticles) l.bindBuffer(l.ARRAY_BUFFER, r.__webglColorBuffer), l.bufferData(l.ARRAY_BUFFER, bc, Mb);
                                if (Hb)
                                    for (lb = 0, ic = Hb.length; lb < ic; lb++)
                                        if (V = Hb[lb], V.needsUpdate || e.sortParticles) l.bindBuffer(l.ARRAY_BUFFER, V.buffer), l.bufferData(l.ARRAY_BUFFER, V.array, Mb)
                            }
                            r.verticesNeedUpdate = !1;
                            r.colorsNeedUpdate = !1;
                            G.attributes && y(G)
                        }
                        for (var cc = 0, nb = t.length; cc < nb; cc++) {
                            var Bc = t[cc],
                                Vb = Bc,
                                rc = Vb.object,
                                Cc = Vb.buffer,
                                Dc = rc.geometry,
                                Wb = rc.material;
                            Wb instanceof THREE.MeshFaceMaterial ? (Wb = Wb.materials[Dc instanceof THREE.BufferGeometry ? 0 : Cc.materialIndex], Vb.material = Wb, Wb.transparent ? Ib.push(Vb) : Jb.push(Vb)) : Wb && (Vb.material = Wb, Wb.transparent ? Ib.push(Vb) : Jb.push(Vb));
                            Bc.render = !0;
                            !0 === J.sortObjects && (null !== e.renderDepth ? Bc.z = e.renderDepth : (Na.setFromMatrixPosition(e.matrixWorld), Na.applyProjection(Ac), Bc.z = Na.z))
                        }
                    }
                }
            }
            cc = 0;
            for (nb = e.children.length; cc < nb; cc++) q(a, e.children[cc])
        }
    }

    function m(a, b, c, d, e, f) {
        for (var g, h = a.length - 1; - 1 !== h; h--) {
            g = a[h];
            var k = g.object,
                l = g.buffer;
            x(k, b);
            if (f) g = f;
            else {
                g = g.material;
                if (!g) continue;
                e && J.setBlending(g.blending, g.blendEquation, g.blendSrc, g.blendDst);
                J.setDepthTest(g.depthTest);
                J.setDepthWrite(g.depthWrite);
                B(g.polygonOffset, g.polygonOffsetFactor, g.polygonOffsetUnits)
            }
            J.setMaterialFaces(g);
            l instanceof THREE.BufferGeometry ? J.renderBufferDirect(b, c, d, g, l, k) : J.renderBuffer(b, c, d, g, l, k)
        }
    }

    function r(a, b, c, d, e, f, g) {
        for (var h, k = 0, l = a.length; k < l; k++) {
            h = a[k];
            var m = h.object;
            if (m.visible) {
                if (g) h = g;
                else {
                    h = h[b];
                    if (!h) continue;
                    f && J.setBlending(h.blending, h.blendEquation, h.blendSrc, h.blendDst);
                    J.setDepthTest(h.depthTest);
                    J.setDepthWrite(h.depthWrite);
                    B(h.polygonOffset, h.polygonOffsetFactor, h.polygonOffsetUnits)
                }
                J.renderImmediateObject(c, d, e, h, m)
            }
        }
    }

    function t(a) {
        var b = a.object.material;
        b.transparent ? (a.transparent = b, a.opaque = null) : (a.opaque = b, a.transparent = null)
    }

    function s(a, b, d) {
        var e = b.material,
            f = !1;
        if (void 0 === xb[d.id] || !0 === d.groupsNeedUpdate) {
            delete ob[b.id];
            a = xb;
            for (var g = d.id, e = e instanceof THREE.MeshFaceMaterial, h = pa.get("OES_element_index_uint") ? 4294967296 : 65535, k, f = {}, m = d.morphTargets.length, n = d.morphNormals.length, p, r = {}, q = [], t = 0, s = d.faces.length; t < s; t++) {
                k = d.faces[t];
                var v = e ? k.materialIndex : 0;
                v in f || (f[v] = {
                    hash: v,
                    counter: 0
                });
                k = f[v].hash + "_" + f[v].counter;
                k in r || (p = {
                    id: rc++,
                    faces3: [],
                    materialIndex: v,
                    vertices: 0,
                    numMorphTargets: m,
                    numMorphNormals: n
                }, r[k] = p, q.push(p));
                r[k].vertices + 3 > h && (f[v].counter += 1, k = f[v].hash + "_" + f[v].counter, k in r || (p = {
                    id: rc++,
                    faces3: [],
                    materialIndex: v,
                    vertices: 0,
                    numMorphTargets: m,
                    numMorphNormals: n
                }, r[k] = p, q.push(p)));
                r[k].faces3.push(t);
                r[k].vertices += 3
            }
            a[g] = q;
            d.groupsNeedUpdate = !1
        }
        a = xb[d.id];
        g = 0;
        for (e = a.length; g < e; g++) {
            h = a[g];
            if (void 0 === h.__webglVertexBuffer) {
                f = h;
                f.__webglVertexBuffer = l.createBuffer();
                f.__webglNormalBuffer = l.createBuffer();
                f.__webglTangentBuffer = l.createBuffer();
                f.__webglColorBuffer = l.createBuffer();
                f.__webglUVBuffer = l.createBuffer();
                f.__webglUV2Buffer = l.createBuffer();
                f.__webglSkinIndicesBuffer = l.createBuffer();
                f.__webglSkinWeightsBuffer = l.createBuffer();
                f.__webglFaceBuffer = l.createBuffer();
                f.__webglLineBuffer = l.createBuffer();
                n = m = void 0;
                if (f.numMorphTargets)
                    for (f.__webglMorphTargetsBuffers = [], m = 0, n = f.numMorphTargets; m < n; m++) f.__webglMorphTargetsBuffers.push(l.createBuffer());
                if (f.numMorphNormals)
                    for (f.__webglMorphNormalsBuffers = [], m = 0, n = f.numMorphNormals; m < n; m++) f.__webglMorphNormalsBuffers.push(l.createBuffer());
                J.info.memory.geometries++;
                c(h, b);
                d.verticesNeedUpdate = !0;
                d.morphTargetsNeedUpdate = !0;
                d.elementsNeedUpdate = !0;
                d.uvsNeedUpdate = !0;
                d.normalsNeedUpdate = !0;
                d.tangentsNeedUpdate = !0;
                f = d.colorsNeedUpdate = !0
            } else f = !1;
            (f || void 0 === b.__webglActive) && u(ob, h, b)
        }
        b.__webglActive = !0
    }

    function u(a, b, c) {
        var d = c.id;
        a[d] = a[d] || [];
        a[d].push({
            id: d,
            buffer: b,
            object: c,
            material: null,
            z: 0
        })
    }

    function v(a) {
        for (var b in a.attributes)
            if (a.attributes[b].needsUpdate) return !0;
        return !1
    }

    function y(a) {
        for (var b in a.attributes) a.attributes[b].needsUpdate = !1
    }

    function G(a, b, c, d, e) {
        var f, g, h, k;
        dc = 0;
        if (d.needsUpdate) {
            d.program && Cc(d);
            d.addEventListener("dispose", Dc);
            var m;
            d instanceof THREE.MeshDepthMaterial ? m = "depth" : d instanceof THREE.MeshNormalMaterial ? m = "normal" : d instanceof THREE.MeshBasicMaterial ? m = "basic" : d instanceof THREE.MeshLambertMaterial ? m = "lambert" : d instanceof THREE.MeshPhongMaterial ? m = "phong" : d instanceof THREE.LineBasicMaterial ? m = "basic" : d instanceof THREE.LineDashedMaterial ? m = "dashed" : d instanceof THREE.PointCloudMaterial && (m = "particle_basic");
            if (m) {
                var n = THREE.ShaderLib[m];
                d.__webglShader = {
                    uniforms: THREE.UniformsUtils.clone(n.uniforms),
                    vertexShader: n.vertexShader,
                    fragmentShader: n.fragmentShader
                }
            } else d.__webglShader = {
                uniforms: d.uniforms,
                vertexShader: d.vertexShader,
                fragmentShader: d.fragmentShader
            };
            for (var p = 0, r = 0, q = 0, t = 0, s = 0, u = b.length; s < u; s++) {
                var v = b[s];
                v.onlyShadow || !1 === v.visible || (v instanceof THREE.DirectionalLight && p++, v instanceof THREE.PointLight && r++, v instanceof THREE.SpotLight && q++, v instanceof THREE.HemisphereLight && t++)
            }
            f = p;
            g = r;
            h = q;
            k = t;
            for (var y, G = 0, x = 0, B = b.length; x < B; x++) {
                var A = b[x];
                A.castShadow && (A instanceof THREE.SpotLight && G++, A instanceof THREE.DirectionalLight && !A.shadowCascade && G++)
            }
            y = G;
            var C;
            if (jc && e && e.skeleton && e.skeleton.useVertexTexture) C = 1024;
            else {
                var H = l.getParameter(l.MAX_VERTEX_UNIFORM_VECTORS),
                    S = Math.floor((H - 20) / 4);
                void 0 !== e && e instanceof THREE.SkinnedMesh && (S = Math.min(e.skeleton.bones.length, S), S < e.skeleton.bones.length && console.warn("WebGLRenderer: too many bones - " + e.skeleton.bones.length + ", this GPU supports just " + S + " (try OpenGL instead of ANGLE)"));
                C = S
            }
            var P = {
                    precision: X,
                    supportsVertexTextures: sc,
                    map: !!d.map,
                    envMap: !!d.envMap,
                    lightMap: !!d.lightMap,
                    bumpMap: !!d.bumpMap,
                    normalMap: !!d.normalMap,
                    specularMap: !!d.specularMap,
                    alphaMap: !!d.alphaMap,
                    vertexColors: d.vertexColors,
                    fog: c,
                    useFog: d.fog,
                    fogExp: c instanceof THREE.FogExp2,
                    sizeAttenuation: d.sizeAttenuation,
                    logarithmicDepthBuffer: Fa,
                    skinning: d.skinning,
                    maxBones: C,
                    useVertexTexture: jc && e && e.skeleton && e.skeleton.useVertexTexture,
                    morphTargets: d.morphTargets,
                    morphNormals: d.morphNormals,
                    maxMorphTargets: J.maxMorphTargets,
                    maxMorphNormals: J.maxMorphNormals,
                    maxDirLights: f,
                    maxPointLights: g,
                    maxSpotLights: h,
                    maxHemiLights: k,
                    maxShadows: y,
                    shadowMapEnabled: J.shadowMapEnabled && e.receiveShadow && 0 < y,
                    shadowMapType: J.shadowMapType,
                    shadowMapDebug: J.shadowMapDebug,
                    shadowMapCascade: J.shadowMapCascade,
                    alphaTest: d.alphaTest,
                    metal: d.metal,
                    wrapAround: d.wrapAround,
                    doubleSided: d.side === THREE.DoubleSide,
                    flipSided: d.side === THREE.BackSide
                },
                T = [];
            m ? T.push(m) : (T.push(d.fragmentShader), T.push(d.vertexShader));
            if (void 0 !== d.defines)
                for (var bb in d.defines) T.push(bb), T.push(d.defines[bb]);
            for (bb in P) T.push(bb), T.push(P[bb]);
            for (var M = T.join(), Y, jb = 0, ca = hb.length; jb < ca; jb++) {
                var cb = hb[jb];
                if (cb.code === M) {
                    Y = cb;
                    Y.usedTimes++;
                    break
                }
            }
            void 0 === Y && (Y = new THREE.WebGLProgram(J, M, d, P), hb.push(Y), J.info.memory.programs = hb.length);
            d.program = Y;
            var ob = Y.attributes;
            if (d.morphTargets) {
                d.numSupportedMorphTargets = 0;
                for (var ma, pa = "morphTarget", la = 0; la < J.maxMorphTargets; la++) ma = pa + la, 0 <= ob[ma] && d.numSupportedMorphTargets++
            }
            if (d.morphNormals)
                for (d.numSupportedMorphNormals = 0, pa = "morphNormal", la = 0; la < J.maxMorphNormals; la++) ma = pa + la, 0 <= ob[ma] && d.numSupportedMorphNormals++;
            d.uniformsList = [];
            for (var Jb in d.__webglShader.uniforms) {
                var za = d.program.uniforms[Jb];
                za && d.uniformsList.push([d.__webglShader.uniforms[Jb], za])
            }
            d.needsUpdate = !1
        }
        d.morphTargets && !e.__webglMorphTargetInfluences && (e.__webglMorphTargetInfluences = new Float32Array(J.maxMorphTargets));
        var aa = !1,
            $ = !1,
            Z = !1,
            yb = d.program,
            qa = yb.uniforms,
            L = d.__webglShader.uniforms;
        yb.id !== tc && (l.useProgram(yb.program), tc = yb.id, Z = $ = aa = !0);
        d.id !== Kb && (-1 === Kb && (Z = !0), Kb = d.id, $ = !0);
        if (aa || a !== ec) l.uniformMatrix4fv(qa.projectionMatrix, !1, a.projectionMatrix.elements), Fa && l.uniform1f(qa.logDepthBufFC, 2 / (Math.log(a.far + 1) / Math.LN2)), a !== ec && (ec = a), (d instanceof THREE.ShaderMaterial || d instanceof THREE.MeshPhongMaterial || d.envMap) && null !== qa.cameraPosition && (Na.setFromMatrixPosition(a.matrixWorld), l.uniform3f(qa.cameraPosition, Na.x, Na.y, Na.z)), (d instanceof THREE.MeshPhongMaterial || d instanceof THREE.MeshLambertMaterial || d instanceof THREE.ShaderMaterial || d.skinning) && null !== qa.viewMatrix && l.uniformMatrix4fv(qa.viewMatrix, !1, a.matrixWorldInverse.elements);
        if (d.skinning)
            if (e.bindMatrix && null !== qa.bindMatrix && l.uniformMatrix4fv(qa.bindMatrix, !1, e.bindMatrix.elements), e.bindMatrixInverse && null !== qa.bindMatrixInverse && l.uniformMatrix4fv(qa.bindMatrixInverse, !1, e.bindMatrixInverse.elements), jc && e.skeleton && e.skeleton.useVertexTexture) {
                if (null !== qa.boneTexture) {
                    var Ib = K();
                    l.uniform1i(qa.boneTexture, Ib);
                    J.setTexture(e.skeleton.boneTexture, Ib)
                }
                null !== qa.boneTextureWidth && l.uniform1i(qa.boneTextureWidth, e.skeleton.boneTextureWidth);
                null !== qa.boneTextureHeight && l.uniform1i(qa.boneTextureHeight, e.skeleton.boneTextureHeight)
            } else e.skeleton && e.skeleton.boneMatrices && null !== qa.boneGlobalMatrices && l.uniformMatrix4fv(qa.boneGlobalMatrices, !1, e.skeleton.boneMatrices);
        if ($) {
            c && d.fog && (L.fogColor.value = c.color, c instanceof THREE.Fog ? (L.fogNear.value = c.near, L.fogFar.value = c.far) : c instanceof THREE.FogExp2 && (L.fogDensity.value = c.density));
            if (d instanceof THREE.MeshPhongMaterial || d instanceof THREE.MeshLambertMaterial || d.lights) {
                if (fc) {
                    var Z = !0,
                        na, Ra, ia, ya = 0,
                        Ga = 0,
                        Oa = 0,
                        Ba, zb, Ab, Ha, Bb, Aa, va = Mc,
                        Cb = va.directional.colors,
                        ib = va.directional.positions,
                        Qb = va.point.colors,
                        Ma = va.point.positions,
                        xb = va.point.distances,
                        Ya = va.spot.colors,
                        Za = va.spot.positions,
                        Mb = va.spot.distances,
                        Rb = va.spot.directions,
                        db = va.spot.anglesCos,
                        eb = va.spot.exponents,
                        qb = va.hemi.skyColors,
                        rb = va.hemi.groundColors,
                        Db = va.hemi.positions,
                        Sa = 0,
                        Ca = 0,
                        Pa = 0,
                        Ka = 0,
                        ja = 0,
                        ta = 0,
                        I = 0,
                        Ia = 0,
                        Qa = 0,
                        sb = 0,
                        fb = 0,
                        Ta = 0;
                    na = 0;
                    for (Ra = b.length; na < Ra; na++) ia = b[na], ia.onlyShadow || (Ba = ia.color, Ha = ia.intensity, Aa = ia.distance, ia instanceof THREE.AmbientLight ? ia.visible && (J.gammaInput ? (ya += Ba.r * Ba.r, Ga += Ba.g * Ba.g, Oa += Ba.b * Ba.b) : (ya += Ba.r, Ga += Ba.g, Oa += Ba.b)) : ia instanceof THREE.DirectionalLight ? (ja += 1, ia.visible && (sa.setFromMatrixPosition(ia.matrixWorld), Na.setFromMatrixPosition(ia.target.matrixWorld), sa.sub(Na), sa.normalize(), Qa = 3 * Sa, ib[Qa] = sa.x, ib[Qa + 1] = sa.y, ib[Qa + 2] = sa.z, J.gammaInput ? D(Cb, Qa, Ba, Ha * Ha) : E(Cb, Qa, Ba, Ha), Sa += 1)) : ia instanceof THREE.PointLight ? (ta += 1, ia.visible && (sb = 3 * Ca, J.gammaInput ? D(Qb, sb, Ba, Ha * Ha) : E(Qb, sb, Ba, Ha), Na.setFromMatrixPosition(ia.matrixWorld), Ma[sb] = Na.x, Ma[sb + 1] = Na.y, Ma[sb + 2] = Na.z, xb[Ca] = Aa, Ca += 1)) : ia instanceof THREE.SpotLight ? (I += 1, ia.visible && (fb = 3 * Pa, J.gammaInput ? D(Ya, fb, Ba, Ha * Ha) : E(Ya, fb, Ba, Ha), sa.setFromMatrixPosition(ia.matrixWorld), Za[fb] = sa.x, Za[fb + 1] = sa.y, Za[fb + 2] = sa.z, Mb[Pa] = Aa, Na.setFromMatrixPosition(ia.target.matrixWorld), sa.sub(Na), sa.normalize(), Rb[fb] = sa.x, Rb[fb + 1] = sa.y, Rb[fb + 2] = sa.z, db[Pa] = Math.cos(ia.angle), eb[Pa] = ia.exponent, Pa += 1)) : ia instanceof THREE.HemisphereLight && (Ia += 1, ia.visible && (sa.setFromMatrixPosition(ia.matrixWorld), sa.normalize(), Ta = 3 * Ka, Db[Ta] = sa.x, Db[Ta + 1] = sa.y, Db[Ta + 2] = sa.z, zb = ia.color, Ab = ia.groundColor, J.gammaInput ? (Bb = Ha * Ha, D(qb, Ta, zb, Bb), D(rb, Ta, Ab, Bb)) : (E(qb, Ta, zb, Ha), E(rb, Ta, Ab, Ha)), Ka += 1)));
                    na = 3 * Sa;
                    for (Ra = Math.max(Cb.length, 3 * ja); na < Ra; na++) Cb[na] = 0;
                    na = 3 * Ca;
                    for (Ra = Math.max(Qb.length, 3 * ta); na < Ra; na++) Qb[na] = 0;
                    na = 3 * Pa;
                    for (Ra = Math.max(Ya.length, 3 * I); na < Ra; na++) Ya[na] = 0;
                    na = 3 * Ka;
                    for (Ra = Math.max(qb.length, 3 * Ia); na < Ra; na++) qb[na] = 0;
                    na = 3 * Ka;
                    for (Ra = Math.max(rb.length, 3 * Ia); na < Ra; na++) rb[na] = 0;
                    va.directional.length = Sa;
                    va.point.length = Ca;
                    va.spot.length = Pa;
                    va.hemi.length = Ka;
                    va.ambient[0] = ya;
                    va.ambient[1] = Ga;
                    va.ambient[2] = Oa;
                    fc = !1
                }
                if (Z) {
                    var ra = Mc;
                    L.ambientLightColor.value = ra.ambient;
                    L.directionalLightColor.value = ra.directional.colors;
                    L.directionalLightDirection.value = ra.directional.positions;
                    L.pointLightColor.value = ra.point.colors;
                    L.pointLightPosition.value = ra.point.positions;
                    L.pointLightDistance.value = ra.point.distances;
                    L.spotLightColor.value = ra.spot.colors;
                    L.spotLightPosition.value = ra.spot.positions;
                    L.spotLightDistance.value = ra.spot.distances;
                    L.spotLightDirection.value = ra.spot.directions;
                    L.spotLightAngleCos.value = ra.spot.anglesCos;
                    L.spotLightExponent.value = ra.spot.exponents;
                    L.hemisphereLightSkyColor.value = ra.hemi.skyColors;
                    L.hemisphereLightGroundColor.value = ra.hemi.groundColors;
                    L.hemisphereLightDirection.value = ra.hemi.positions;
                    w(L, !0)
                } else w(L, !1)
            }
            if (d instanceof THREE.MeshBasicMaterial || d instanceof THREE.MeshLambertMaterial || d instanceof THREE.MeshPhongMaterial) {
                L.opacity.value = d.opacity;
                J.gammaInput ? L.diffuse.value.copyGammaToLinear(d.color) : L.diffuse.value = d.color;
                L.map.value = d.map;
                L.lightMap.value = d.lightMap;
                L.specularMap.value = d.specularMap;
                L.alphaMap.value = d.alphaMap;
                d.bumpMap && (L.bumpMap.value = d.bumpMap, L.bumpScale.value = d.bumpScale);
                d.normalMap && (L.normalMap.value = d.normalMap, L.normalScale.value.copy(d.normalScale));
                var La;
                d.map ? La = d.map : d.specularMap ? La = d.specularMap : d.normalMap ? La = d.normalMap : d.bumpMap ? La = d.bumpMap : d.alphaMap && (La = d.alphaMap);
                if (void 0 !== La) {
                    var Ua = La.offset,
                        Va = La.repeat;
                    L.offsetRepeat.value.set(Ua.x, Ua.y, Va.x, Va.y)
                }
                L.envMap.value = d.envMap;
                L.flipEnvMap.value = d.envMap instanceof THREE.WebGLRenderTargetCube ? 1 : -1;
                L.reflectivity.value = d.reflectivity;
                L.refractionRatio.value = d.refractionRatio;
                L.combine.value = d.combine;
                L.useRefract.value = d.envMap && d.envMap.mapping instanceof THREE.CubeRefractionMapping
            }
            d instanceof THREE.LineBasicMaterial ? (L.diffuse.value = d.color, L.opacity.value = d.opacity) : d instanceof THREE.LineDashedMaterial ? (L.diffuse.value = d.color, L.opacity.value = d.opacity, L.dashSize.value = d.dashSize, L.totalSize.value = d.dashSize + d.gapSize, L.scale.value = d.scale) : d instanceof THREE.PointCloudMaterial ? (L.psColor.value = d.color, L.opacity.value = d.opacity, L.size.value = d.size, L.scale.value = O.height / 2, L.map.value = d.map) : d instanceof THREE.MeshPhongMaterial ? (L.shininess.value = d.shininess, J.gammaInput ? (L.ambient.value.copyGammaToLinear(d.ambient), L.emissive.value.copyGammaToLinear(d.emissive), L.specular.value.copyGammaToLinear(d.specular)) : (L.ambient.value = d.ambient, L.emissive.value = d.emissive, L.specular.value = d.specular), d.wrapAround && L.wrapRGB.value.copy(d.wrapRGB)) : d instanceof THREE.MeshLambertMaterial ? (J.gammaInput ? (L.ambient.value.copyGammaToLinear(d.ambient), L.emissive.value.copyGammaToLinear(d.emissive)) : (L.ambient.value = d.ambient, L.emissive.value = d.emissive), d.wrapAround && L.wrapRGB.value.copy(d.wrapRGB)) : d instanceof THREE.MeshDepthMaterial ? (L.mNear.value = a.near, L.mFar.value = a.far, L.opacity.value = d.opacity) : d instanceof THREE.MeshNormalMaterial && (L.opacity.value = d.opacity);
            if (e.receiveShadow && !d._shadowPass && L.shadowMatrix)
                for (var Eb = 0, pb = 0, Nb = b.length; pb < Nb; pb++) {
                    var z = b[pb];
                    z.castShadow && (z instanceof THREE.SpotLight || z instanceof THREE.DirectionalLight && !z.shadowCascade) && (L.shadowMap.value[Eb] = z.shadowMap, L.shadowMapSize.value[Eb] = z.shadowMapSize, L.shadowMatrix.value[Eb] = z.shadowMatrix, L.shadowDarkness.value[Eb] = z.shadowDarkness, L.shadowBias.value[Eb] = z.shadowBias, Eb++)
                }
            for (var Sb = d.uniformsList, Ja, wa, $a, nb = 0, Pb = Sb.length; nb < Pb; nb++) {
                var da = Sb[nb][0];
                if (!1 !== da.needsUpdate) {
                    var wb = da.type,
                        U = da.value,
                        fa = Sb[nb][1];
                    switch (wb) {
                        case "1i":
                            l.uniform1i(fa, U);
                            break;
                        case "1f":
                            l.uniform1f(fa, U);
                            break;
                        case "2f":
                            l.uniform2f(fa, U[0], U[1]);
                            break;
                        case "3f":
                            l.uniform3f(fa, U[0], U[1], U[2]);
                            break;
                        case "4f":
                            l.uniform4f(fa, U[0], U[1], U[2], U[3]);
                            break;
                        case "1iv":
                            l.uniform1iv(fa, U);
                            break;
                        case "3iv":
                            l.uniform3iv(fa, U);
                            break;
                        case "1fv":
                            l.uniform1fv(fa, U);
                            break;
                        case "2fv":
                            l.uniform2fv(fa, U);
                            break;
                        case "3fv":
                            l.uniform3fv(fa, U);
                            break;
                        case "4fv":
                            l.uniform4fv(fa, U);
                            break;
                        case "Matrix3fv":
                            l.uniformMatrix3fv(fa, !1, U);
                            break;
                        case "Matrix4fv":
                            l.uniformMatrix4fv(fa, !1, U);
                            break;
                        case "i":
                            l.uniform1i(fa, U);
                            break;
                        case "f":
                            l.uniform1f(fa, U);
                            break;
                        case "v2":
                            l.uniform2f(fa, U.x, U.y);
                            break;
                        case "v3":
                            l.uniform3f(fa, U.x, U.y, U.z);
                            break;
                        case "v4":
                            l.uniform4f(fa, U.x, U.y, U.z, U.w);
                            break;
                        case "c":
                            l.uniform3f(fa, U.r, U.g, U.b);
                            break;
                        case "iv1":
                            l.uniform1iv(fa, U);
                            break;
                        case "iv":
                            l.uniform3iv(fa, U);
                            break;
                        case "fv1":
                            l.uniform1fv(fa, U);
                            break;
                        case "fv":
                            l.uniform3fv(fa, U);
                            break;
                        case "v2v":
                            void 0 === da._array && (da._array = new Float32Array(2 * U.length));
                            for (var N = 0, xa = U.length; N < xa; N++) $a = 2 * N, da._array[$a] = U[N].x, da._array[$a + 1] = U[N].y;
                            l.uniform2fv(fa, da._array);
                            break;
                        case "v3v":
                            void 0 === da._array && (da._array = new Float32Array(3 * U.length));
                            N = 0;
                            for (xa = U.length; N < xa; N++) $a = 3 * N, da._array[$a] = U[N].x, da._array[$a + 1] = U[N].y, da._array[$a + 2] = U[N].z;
                            l.uniform3fv(fa, da._array);
                            break;
                        case "v4v":
                            void 0 === da._array && (da._array = new Float32Array(4 * U.length));
                            N = 0;
                            for (xa = U.length; N < xa; N++) $a = 4 * N, da._array[$a] = U[N].x, da._array[$a + 1] = U[N].y, da._array[$a + 2] = U[N].z, da._array[$a + 3] = U[N].w;
                            l.uniform4fv(fa, da._array);
                            break;
                        case "m3":
                            l.uniformMatrix3fv(fa, !1, U.elements);
                            break;
                        case "m3v":
                            void 0 === da._array && (da._array = new Float32Array(9 * U.length));
                            N = 0;
                            for (xa = U.length; N < xa; N++) U[N].flattenToArrayOffset(da._array, 9 * N);
                            l.uniformMatrix3fv(fa, !1, da._array);
                            break;
                        case "m4":
                            l.uniformMatrix4fv(fa, !1, U.elements);
                            break;
                        case "m4v":
                            void 0 === da._array && (da._array = new Float32Array(16 * U.length));
                            N = 0;
                            for (xa = U.length; N < xa; N++) U[N].flattenToArrayOffset(da._array, 16 * N);
                            l.uniformMatrix4fv(fa, !1, da._array);
                            break;
                        case "t":
                            Ja = U;
                            wa = K();
                            l.uniform1i(fa, wa);
                            if (!Ja) continue;
                            if (Ja instanceof THREE.CubeTexture || Ja.image instanceof Array && 6 === Ja.image.length) {
                                var ua = Ja,
                                    Lb = wa;
                                if (6 === ua.image.length)
                                    if (ua.needsUpdate) {
                                        ua.image.__webglTextureCube || (ua.addEventListener("dispose", gc), ua.image.__webglTextureCube = l.createTexture(), J.info.memory.textures++);
                                        l.activeTexture(l.TEXTURE0 + Lb);
                                        l.bindTexture(l.TEXTURE_CUBE_MAP, ua.image.__webglTextureCube);
                                        l.pixelStorei(l.UNPACK_FLIP_Y_WEBGL, ua.flipY);
                                        for (var Ob = ua instanceof THREE.CompressedTexture, Tb = ua.image[0] instanceof THREE.DataTexture, kb = [], Da = 0; 6 > Da; Da++) kb[Da] = !J.autoScaleCubemaps || Ob || Tb ? Tb ? ua.image[Da].image : ua.image[Da] : R(ua.image[Da], $c);
                                        var ka = kb[0],
                                            Zb = THREE.Math.isPowerOfTwo(ka.width) && THREE.Math.isPowerOfTwo(ka.height),
                                            ab = Q(ua.format),
                                            Fb = Q(ua.type);
                                        F(l.TEXTURE_CUBE_MAP, ua, Zb);
                                        for (Da = 0; 6 > Da; Da++)
                                            if (Ob)
                                                for (var gb, $b = kb[Da].mipmaps, ga = 0, Xb = $b.length; ga < Xb; ga++) gb = $b[ga], ua.format !== THREE.RGBAFormat && ua.format !== THREE.RGBFormat ? -1 < Nc().indexOf(ab) ? l.compressedTexImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X + Da, ga, ab, gb.width, gb.height, 0, gb.data) : console.warn("Attempt to load unsupported compressed texture format") : l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X + Da, ga, ab, gb.width, gb.height, 0, ab, Fb, gb.data);
                                            else Tb ? l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X + Da, 0, ab, kb[Da].width, kb[Da].height, 0, ab, Fb, kb[Da].data) : l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X + Da, 0, ab, ab, Fb, kb[Da]);
                                        ua.generateMipmaps && Zb && l.generateMipmap(l.TEXTURE_CUBE_MAP);
                                        ua.needsUpdate = !1;
                                        if (ua.onUpdate) ua.onUpdate()
                                    } else l.activeTexture(l.TEXTURE0 + Lb), l.bindTexture(l.TEXTURE_CUBE_MAP, ua.image.__webglTextureCube)
                            } else if (Ja instanceof THREE.WebGLRenderTargetCube) {
                                var Yb = Ja;
                                l.activeTexture(l.TEXTURE0 + wa);
                                l.bindTexture(l.TEXTURE_CUBE_MAP, Yb.__webglTexture)
                            } else J.setTexture(Ja, wa);
                            break;
                        case "tv":
                            void 0 === da._array && (da._array = []);
                            N = 0;
                            for (xa = da.value.length; N < xa; N++) da._array[N] = K();
                            l.uniform1iv(fa, da._array);
                            N = 0;
                            for (xa = da.value.length; N < xa; N++) Ja = da.value[N], wa = da._array[N], Ja && J.setTexture(Ja, wa);
                            break;
                        default:
                            console.warn("THREE.WebGLRenderer: Unknown uniform type: " + wb)
                    }
                }
            }
        }
        l.uniformMatrix4fv(qa.modelViewMatrix, !1, e._modelViewMatrix.elements);
        qa.normalMatrix && l.uniformMatrix3fv(qa.normalMatrix, !1, e._normalMatrix.elements);
        null !== qa.modelMatrix && l.uniformMatrix4fv(qa.modelMatrix, !1, e.matrixWorld.elements);
        return yb
    }

    function w(a, b) {
        a.ambientLightColor.needsUpdate = b;
        a.directionalLightColor.needsUpdate = b;
        a.directionalLightDirection.needsUpdate = b;
        a.pointLightColor.needsUpdate = b;
        a.pointLightPosition.needsUpdate = b;
        a.pointLightDistance.needsUpdate = b;
        a.spotLightColor.needsUpdate = b;
        a.spotLightPosition.needsUpdate = b;
        a.spotLightDistance.needsUpdate = b;
        a.spotLightDirection.needsUpdate = b;
        a.spotLightAngleCos.needsUpdate = b;
        a.spotLightExponent.needsUpdate = b;
        a.hemisphereLightSkyColor.needsUpdate = b;
        a.hemisphereLightGroundColor.needsUpdate = b;
        a.hemisphereLightDirection.needsUpdate = b
    }

    function K() {
        var a = dc;
        a >= Oc && console.warn("WebGLRenderer: trying to use " + a + " texture units while this GPU supports only " + Oc);
        dc += 1;
        return a
    }

    function x(a, b) {
        a._modelViewMatrix.multiplyMatrices(b.matrixWorldInverse, a.matrixWorld);
        a._normalMatrix.getNormalMatrix(a._modelViewMatrix)
    }

    function D(a, b, c, d) {
        a[b] = c.r * c.r * d;
        a[b + 1] = c.g * c.g * d;
        a[b + 2] = c.b * c.b * d
    }

    function E(a, b, c, d) {
        a[b] = c.r * d;
        a[b + 1] = c.g * d;
        a[b + 2] = c.b * d
    }

    function A(a) {
        a !== Pc && (l.lineWidth(a), Pc = a)
    }

    function B(a, b, c) {
        Qc !== a && (a ? l.enable(l.POLYGON_OFFSET_FILL) : l.disable(l.POLYGON_OFFSET_FILL), Qc = a);
        !a || Rc === b && Sc === c || (l.polygonOffset(b, c), Rc = b, Sc = c)
    }

    function F(a, b, c) {
        c ? (l.texParameteri(a, l.TEXTURE_WRAP_S, Q(b.wrapS)), l.texParameteri(a, l.TEXTURE_WRAP_T, Q(b.wrapT)), l.texParameteri(a, l.TEXTURE_MAG_FILTER, Q(b.magFilter)), l.texParameteri(a, l.TEXTURE_MIN_FILTER, Q(b.minFilter))) : (l.texParameteri(a, l.TEXTURE_WRAP_S, l.CLAMP_TO_EDGE), l.texParameteri(a, l.TEXTURE_WRAP_T, l.CLAMP_TO_EDGE), l.texParameteri(a, l.TEXTURE_MAG_FILTER, T(b.magFilter)), l.texParameteri(a, l.TEXTURE_MIN_FILTER, T(b.minFilter)));
        (c = pa.get("EXT_texture_filter_anisotropic")) && b.type !== THREE.FloatType && (1 < b.anisotropy || b.__oldAnisotropy) && (l.texParameterf(a, c.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(b.anisotropy, J.getMaxAnisotropy())), b.__oldAnisotropy = b.anisotropy)
    }

    function R(a, b) {
        if (a.width > b || a.height > b) {
            var c = b / Math.max(a.width, a.height),
                d = document.createElement("canvas");
            d.width = Math.floor(a.width * c);
            d.height = Math.floor(a.height * c);
            d.getContext("2d").drawImage(a, 0, 0, a.width, a.height, 0, 0, d.width, d.height);
            console.log("THREE.WebGLRenderer:", a, "is too big (" + a.width + "x" + a.height + "). Resized to " + d.width + "x" + d.height + ".");
            return d
        }
        return a
    }

    function H(a, b) {
        l.bindRenderbuffer(l.RENDERBUFFER, a);
        b.depthBuffer && !b.stencilBuffer ? (l.renderbufferStorage(l.RENDERBUFFER, l.DEPTH_COMPONENT16, b.width, b.height), l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_ATTACHMENT, l.RENDERBUFFER, a)) : b.depthBuffer && b.stencilBuffer ? (l.renderbufferStorage(l.RENDERBUFFER, l.DEPTH_STENCIL, b.width, b.height), l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_STENCIL_ATTACHMENT, l.RENDERBUFFER, a)) : l.renderbufferStorage(l.RENDERBUFFER, l.RGBA4, b.width, b.height)
    }

    function C(a) {
        a instanceof THREE.WebGLRenderTargetCube ? (l.bindTexture(l.TEXTURE_CUBE_MAP, a.__webglTexture), l.generateMipmap(l.TEXTURE_CUBE_MAP), l.bindTexture(l.TEXTURE_CUBE_MAP, null)) : (l.bindTexture(l.TEXTURE_2D, a.__webglTexture), l.generateMipmap(l.TEXTURE_2D), l.bindTexture(l.TEXTURE_2D, null))
    }

    function T(a) {
        return a === THREE.NearestFilter || a === THREE.NearestMipMapNearestFilter || a === THREE.NearestMipMapLinearFilter ? l.NEAREST : l.LINEAR
    }

    function Q(a) {
        var b;
        if (a === THREE.RepeatWrapping) return l.REPEAT;
        if (a === THREE.ClampToEdgeWrapping) return l.CLAMP_TO_EDGE;
        if (a === THREE.MirroredRepeatWrapping) return l.MIRRORED_REPEAT;
        if (a === THREE.NearestFilter) return l.NEAREST;
        if (a === THREE.NearestMipMapNearestFilter) return l.NEAREST_MIPMAP_NEAREST;
        if (a === THREE.NearestMipMapLinearFilter) return l.NEAREST_MIPMAP_LINEAR;
        if (a === THREE.LinearFilter) return l.LINEAR;
        if (a === THREE.LinearMipMapNearestFilter) return l.LINEAR_MIPMAP_NEAREST;
        if (a === THREE.LinearMipMapLinearFilter) return l.LINEAR_MIPMAP_LINEAR;
        if (a === THREE.UnsignedByteType) return l.UNSIGNED_BYTE;
        if (a === THREE.UnsignedShort4444Type) return l.UNSIGNED_SHORT_4_4_4_4;
        if (a === THREE.UnsignedShort5551Type) return l.UNSIGNED_SHORT_5_5_5_1;
        if (a === THREE.UnsignedShort565Type) return l.UNSIGNED_SHORT_5_6_5;
        if (a === THREE.ByteType) return l.BYTE;
        if (a === THREE.ShortType) return l.SHORT;
        if (a === THREE.UnsignedShortType) return l.UNSIGNED_SHORT;
        if (a === THREE.IntType) return l.INT;
        if (a === THREE.UnsignedIntType) return l.UNSIGNED_INT;
        if (a === THREE.FloatType) return l.FLOAT;
        if (a === THREE.AlphaFormat) return l.ALPHA;
        if (a === THREE.RGBFormat) return l.RGB;
        if (a === THREE.RGBAFormat) return l.RGBA;
        if (a === THREE.LuminanceFormat) return l.LUMINANCE;
        if (a === THREE.LuminanceAlphaFormat) return l.LUMINANCE_ALPHA;
        if (a === THREE.AddEquation) return l.FUNC_ADD;
        if (a === THREE.SubtractEquation) return l.FUNC_SUBTRACT;
        if (a === THREE.ReverseSubtractEquation) return l.FUNC_REVERSE_SUBTRACT;
        if (a === THREE.ZeroFactor) return l.ZERO;
        if (a === THREE.OneFactor) return l.ONE;
        if (a === THREE.SrcColorFactor) return l.SRC_COLOR;
        if (a === THREE.OneMinusSrcColorFactor) return l.ONE_MINUS_SRC_COLOR;
        if (a === THREE.SrcAlphaFactor) return l.SRC_ALPHA;
        if (a === THREE.OneMinusSrcAlphaFactor) return l.ONE_MINUS_SRC_ALPHA;
        if (a === THREE.DstAlphaFactor) return l.DST_ALPHA;
        if (a === THREE.OneMinusDstAlphaFactor) return l.ONE_MINUS_DST_ALPHA;
        if (a === THREE.DstColorFactor) return l.DST_COLOR;
        if (a === THREE.OneMinusDstColorFactor) return l.ONE_MINUS_DST_COLOR;
        if (a === THREE.SrcAlphaSaturateFactor) return l.SRC_ALPHA_SATURATE;
        b = pa.get("WEBGL_compressed_texture_s3tc");
        if (null !== b) {
            if (a === THREE.RGB_S3TC_DXT1_Format) return b.COMPRESSED_RGB_S3TC_DXT1_EXT;
            if (a === THREE.RGBA_S3TC_DXT1_Format) return b.COMPRESSED_RGBA_S3TC_DXT1_EXT;
            if (a === THREE.RGBA_S3TC_DXT3_Format) return b.COMPRESSED_RGBA_S3TC_DXT3_EXT;
            if (a === THREE.RGBA_S3TC_DXT5_Format) return b.COMPRESSED_RGBA_S3TC_DXT5_EXT
        }
        b = pa.get("WEBGL_compressed_texture_pvrtc");
        if (null !== b) {
            if (a === THREE.RGB_PVRTC_4BPPV1_Format) return b.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
            if (a === THREE.RGB_PVRTC_2BPPV1_Format) return b.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
            if (a === THREE.RGBA_PVRTC_4BPPV1_Format) return b.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
            if (a === THREE.RGBA_PVRTC_2BPPV1_Format) return b.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
        }
        b = pa.get("EXT_blend_minmax");
        if (null !== b) {
            if (a === THREE.MinEquation) return b.MIN_EXT;
            if (a === THREE.MaxEquation) return b.MAX_EXT
        }
        return 0
    }
    console.log("THREE.WebGLRenderer", THREE.REVISION);
    a = a || {};
    var O = void 0 !== a.canvas ? a.canvas : document.createElement("canvas"),
        S = void 0 !== a.context ? a.context : null,
        X = void 0 !== a.precision ? a.precision : "highp",
        Y = void 0 !== a.alpha ? a.alpha : !1,
        la = void 0 !== a.depth ? a.depth : !0,
        ma = void 0 !== a.stencil ? a.stencil : !0,
        ya = void 0 !== a.antialias ? a.antialias : !1,
        P = void 0 !== a.premultipliedAlpha ? a.premultipliedAlpha : !0,
        Ga = void 0 !== a.preserveDrawingBuffer ? a.preserveDrawingBuffer : !1,
        Fa = void 0 !== a.logarithmicDepthBuffer ? a.logarithmicDepthBuffer : !1,
        za = new THREE.Color(0),
        bb = 0,
        cb = [],
        ob = {},
        jb = [],
        Jb = [],
        Ib = [],
        yb = [],
        Ra = [];
    this.domElement = O;
    this.context = null;
    this.devicePixelRatio = void 0 !== a.devicePixelRatio ? a.devicePixelRatio : void 0 !== self.devicePixelRatio ? self.devicePixelRatio : 1;
    this.sortObjects = this.autoClearStencil = this.autoClearDepth = this.autoClearColor = this.autoClear = !0;
    this.shadowMapEnabled = this.gammaOutput = this.gammaInput = !1;
    this.shadowMapType = THREE.PCFShadowMap;
    this.shadowMapCullFace = THREE.CullFaceFront;
    this.shadowMapCascade = this.shadowMapDebug = !1;
    this.maxMorphTargets = 8;
    this.maxMorphNormals = 4;
    this.autoScaleCubemaps = !0;
    this.info = {
        memory: {
            programs: 0,
            geometries: 0,
            textures: 0
        },
        render: {
            calls: 0,
            vertices: 0,
            faces: 0,
            points: 0
        }
    };
    var J = this,
        hb = [],
        tc = null,
        Tc = null,
        Kb = -1,
        Oa = -1,
        ec = null,
        dc = 0,
        Lb = -1,
        Mb = -1,
        pb = -1,
        Nb = -1,
        Ob = -1,
        Xb = -1,
        Yb = -1,
        nb = -1,
        Qc = null,
        Rc = null,
        Sc = null,
        Pc = null,
        Pb = 0,
        kc = 0,
        lc = O.width,
        mc = O.height,
        Uc = 0,
        Vc = 0,
        wb = new Uint8Array(16),
        ib = new Uint8Array(16),
        Ec = new THREE.Frustum,
        Ac = new THREE.Matrix4,
        Gc = new THREE.Matrix4,
        Na = new THREE.Vector3,
        sa = new THREE.Vector3,
        fc = !0,
        Mc = {
            ambient: [0, 0, 0],
            directional: {
                length: 0,
                colors: [],
                positions: []
            },
            point: {
                length: 0,
                colors: [],
                positions: [],
                distances: []
            },
            spot: {
                length: 0,
                colors: [],
                positions: [],
                distances: [],
                directions: [],
                anglesCos: [],
                exponents: []
            },
            hemi: {
                length: 0,
                skyColors: [],
                groundColors: [],
                positions: []
            }
        },
        l;
    try {
        var Wc = {
            alpha: Y,
            depth: la,
            stencil: ma,
            antialias: ya,
            premultipliedAlpha: P,
            preserveDrawingBuffer: Ga
        };
        l = S || O.getContext("webgl", Wc) || O.getContext("experimental-webgl", Wc);
        if (null === l) {
            if (null !== O.getContext("webgl")) throw "Error creating WebGL context with your selected attributes.";
            throw "Error creating WebGL context."
        }
    } catch (ad) {
        console.error(ad)
    }
    void 0 === l.getShaderPrecisionFormat && (l.getShaderPrecisionFormat = function() {
        return {
            rangeMin: 1,
            rangeMax: 1,
            precision: 1
        }
    });
    var pa = new THREE.WebGLExtensions(l);
    pa.get("OES_texture_float");
    pa.get("OES_texture_float_linear");
    pa.get("OES_standard_derivatives");
    Fa && pa.get("EXT_frag_depth");
    l.clearColor(0, 0, 0, 1);
    l.clearDepth(1);
    l.clearStencil(0);
    l.enable(l.DEPTH_TEST);
    l.depthFunc(l.LEQUAL);
    l.frontFace(l.CCW);
    l.cullFace(l.BACK);
    l.enable(l.CULL_FACE);
    l.enable(l.BLEND);
    l.blendEquation(l.FUNC_ADD);
    l.blendFunc(l.SRC_ALPHA, l.ONE_MINUS_SRC_ALPHA);
    l.viewport(Pb, kc, lc, mc);
    l.clearColor(za.r, za.g, za.b, bb);
    this.context = l;
    var Oc = l.getParameter(l.MAX_TEXTURE_IMAGE_UNITS),
        bd = l.getParameter(l.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
        cd = l.getParameter(l.MAX_TEXTURE_SIZE),
        $c = l.getParameter(l.MAX_CUBE_MAP_TEXTURE_SIZE),
        sc = 0 < bd,
        jc = sc && pa.get("OES_texture_float"),
        dd = l.getShaderPrecisionFormat(l.VERTEX_SHADER, l.HIGH_FLOAT),
        ed = l.getShaderPrecisionFormat(l.VERTEX_SHADER, l.MEDIUM_FLOAT);
    l.getShaderPrecisionFormat(l.VERTEX_SHADER, l.LOW_FLOAT);
    var fd = l.getShaderPrecisionFormat(l.FRAGMENT_SHADER, l.HIGH_FLOAT),
        gd = l.getShaderPrecisionFormat(l.FRAGMENT_SHADER, l.MEDIUM_FLOAT);
    l.getShaderPrecisionFormat(l.FRAGMENT_SHADER, l.LOW_FLOAT);
    var Nc = function() {
            var a;
            return function() {
                if (void 0 !== a) return a;
                a = [];
                if (pa.get("WEBGL_compressed_texture_pvrtc") || pa.get("WEBGL_compressed_texture_s3tc"))
                    for (var b = l.getParameter(l.COMPRESSED_TEXTURE_FORMATS), c = 0; c < b.length; c++) a.push(b[c]);
                return a
            }
        }(),
        hd = 0 < dd.precision && 0 < fd.precision,
        Xc = 0 < ed.precision && 0 < gd.precision;
    "highp" !== X || hd || (Xc ? (X = "mediump", console.warn("THREE.WebGLRenderer: highp not supported, using mediump.")) : (X = "lowp", console.warn("THREE.WebGLRenderer: highp and mediump not supported, using lowp.")));
    "mediump" !== X || Xc || (X = "lowp", console.warn("THREE.WebGLRenderer: mediump not supported, using lowp."));
    var id = new THREE.ShadowMapPlugin(this, cb, ob, jb),
        jd = new THREE.SpritePlugin(this, yb),
        kd = new THREE.LensFlarePlugin(this, Ra);
    this.getContext = function() {
        return l
    };
    this.supportsVertexTextures = function() {
        return sc
    };
    this.supportsFloatTextures = function() {
        return pa.get("OES_texture_float")
    };
    this.supportsStandardDerivatives = function() {
        return pa.get("OES_standard_derivatives")
    };
    this.supportsCompressedTextureS3TC = function() {
        return pa.get("WEBGL_compressed_texture_s3tc")
    };
    this.supportsCompressedTexturePVRTC = function() {
        return pa.get("WEBGL_compressed_texture_pvrtc")
    };
    this.supportsBlendMinMax = function() {
        return pa.get("EXT_blend_minmax")
    };
    this.getMaxAnisotropy = function() {
        var a;
        return function() {
            if (void 0 !== a) return a;
            var b = pa.get("EXT_texture_filter_anisotropic");
            return a = null !== b ? l.getParameter(b.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0
        }
    }();
    this.getPrecision = function() {
        return X
    };
    this.setSize = function(a, b, c) {
        O.width = a * this.devicePixelRatio;
        O.height = b * this.devicePixelRatio;
        !1 !== c && (O.style.width = a + "px", O.style.height = b + "px");
        this.setViewport(0, 0, a, b)
    };
    this.setViewport = function(a, b, c, d) {
        Pb = a * this.devicePixelRatio;
        kc = b * this.devicePixelRatio;
        lc = c * this.devicePixelRatio;
        mc = d * this.devicePixelRatio;
        l.viewport(Pb, kc, lc, mc)
    };
    this.setScissor = function(a, b, c, d) {
        l.scissor(a * this.devicePixelRatio, b * this.devicePixelRatio, c * this.devicePixelRatio, d * this.devicePixelRatio)
    };
    this.enableScissorTest = function(a) {
        a ? l.enable(l.SCISSOR_TEST) : l.disable(l.SCISSOR_TEST)
    };
    this.setClearColor = function(a, b) {
        za.set(a);
        bb = void 0 !== b ? b : 1;
        l.clearColor(za.r, za.g, za.b, bb)
    };
    this.setClearColorHex = function(a, b) {
        console.warn("THREE.WebGLRenderer: .setClearColorHex() is being removed. Use .setClearColor() instead.");
        this.setClearColor(a, b)
    };
    this.getClearColor = function() {
        return za
    };
    this.getClearAlpha = function() {
        return bb
    };
    this.clear = function(a, b, c) {
        var d = 0;
        if (void 0 === a || a) d |= l.COLOR_BUFFER_BIT;
        if (void 0 === b || b) d |= l.DEPTH_BUFFER_BIT;
        if (void 0 === c || c) d |= l.STENCIL_BUFFER_BIT;
        l.clear(d)
    };
    this.clearColor = function() {
        l.clear(l.COLOR_BUFFER_BIT)
    };
    this.clearDepth = function() {
        l.clear(l.DEPTH_BUFFER_BIT)
    };
    this.clearStencil = function() {
        l.clear(l.STENCIL_BUFFER_BIT)
    };
    this.clearTarget = function(a, b, c, d) {
        this.setRenderTarget(a);
        this.clear(b, c, d)
    };
    this.resetGLState = function() {
        ec = tc = null;
        Kb = Oa = Mb = Lb = nb = Yb = pb = -1;
        fc = !0
    };
    var Hc = function(a) {
            a.target.traverse(function(a) {
                a.removeEventListener("remove", Hc);
                if (a instanceof THREE.Mesh || a instanceof THREE.PointCloud || a instanceof THREE.Line) delete ob[a.id];
                else if (a instanceof THREE.ImmediateRenderObject || a.immediateRenderCallback)
                    for (var b = jb, c = b.length - 1; 0 <= c; c--) b[c].object === a && b.splice(c, 1);
                delete a.__webglInit;
                delete a._modelViewMatrix;
                delete a._normalMatrix;
                delete a.__webglActive
            })
        },
        Ic = function(a) {
            a = a.target;
            a.removeEventListener("dispose", Ic);
            delete a.__webglInit;
            if (a instanceof THREE.BufferGeometry) {
                for (var b in a.attributes) {
                    var c = a.attributes[b];
                    void 0 !== c.buffer && (l.deleteBuffer(c.buffer), delete c.buffer)
                }
                J.info.memory.geometries--
            } else if (b = xb[a.id], void 0 !== b) {
                for (var c = 0, d = b.length; c < d; c++) {
                    var e = b[c];
                    if (void 0 !== e.numMorphTargets) {
                        for (var f = 0, g = e.numMorphTargets; f < g; f++) l.deleteBuffer(e.__webglMorphTargetsBuffers[f]);
                        delete e.__webglMorphTargetsBuffers
                    }
                    if (void 0 !== e.numMorphNormals) {
                        f = 0;
                        for (g = e.numMorphNormals; f < g; f++) l.deleteBuffer(e.__webglMorphNormalsBuffers[f]);
                        delete e.__webglMorphNormalsBuffers
                    }
                    Yc(e)
                }
                delete xb[a.id]
            } else Yc(a);
            Oa = -1
        },
        gc = function(a) {
            a = a.target;
            a.removeEventListener("dispose", gc);
            a.image && a.image.__webglTextureCube ? (l.deleteTexture(a.image.__webglTextureCube), delete a.image.__webglTextureCube) : void 0 !== a.__webglInit && (l.deleteTexture(a.__webglTexture), delete a.__webglTexture, delete a.__webglInit);
            J.info.memory.textures--
        },
        Zc = function(a) {
            a = a.target;
            a.removeEventListener("dispose", Zc);
            if (a && void 0 !== a.__webglTexture) {
                l.deleteTexture(a.__webglTexture);
                delete a.__webglTexture;
                if (a instanceof THREE.WebGLRenderTargetCube)
                    for (var b = 0; 6 > b; b++) l.deleteFramebuffer(a.__webglFramebuffer[b]), l.deleteRenderbuffer(a.__webglRenderbuffer[b]);
                else l.deleteFramebuffer(a.__webglFramebuffer), l.deleteRenderbuffer(a.__webglRenderbuffer);
                delete a.__webglFramebuffer;
                delete a.__webglRenderbuffer
            }
            J.info.memory.textures--
        },
        Dc = function(a) {
            a = a.target;
            a.removeEventListener("dispose", Dc);
            Cc(a)
        },
        Yc = function(a) {
            for (var b = "__webglVertexBuffer __webglNormalBuffer __webglTangentBuffer __webglColorBuffer __webglUVBuffer __webglUV2Buffer __webglSkinIndicesBuffer __webglSkinWeightsBuffer __webglFaceBuffer __webglLineBuffer __webglLineDistanceBuffer".split(" "), c = 0, d = b.length; c < d; c++) {
                var e = b[c];
                void 0 !== a[e] && (l.deleteBuffer(a[e]), delete a[e])
            }
            if (void 0 !== a.__webglCustomAttributesList) {
                for (e in a.__webglCustomAttributesList) l.deleteBuffer(a.__webglCustomAttributesList[e].buffer);
                delete a.__webglCustomAttributesList
            }
            J.info.memory.geometries--
        },
        Cc = function(a) {
            var b = a.program.program;
            if (void 0 !== b) {
                a.program = void 0;
                var c, d, e = !1;
                a = 0;
                for (c = hb.length; a < c; a++)
                    if (d = hb[a], d.program === b) {
                        d.usedTimes--;
                        0 === d.usedTimes && (e = !0);
                        break
                    }
                if (!0 === e) {
                    e = [];
                    a = 0;
                    for (c = hb.length; a < c; a++) d = hb[a], d.program !== b && e.push(d);
                    hb = e;
                    l.deleteProgram(b);
                    J.info.memory.programs--
                }
            }
        };
    this.renderBufferImmediate = function(a, b, c) {
        f();
        a.hasPositions && !a.__webglVertexBuffer && (a.__webglVertexBuffer = l.createBuffer());
        a.hasNormals && !a.__webglNormalBuffer && (a.__webglNormalBuffer = l.createBuffer());
        a.hasUvs && !a.__webglUvBuffer && (a.__webglUvBuffer = l.createBuffer());
        a.hasColors && !a.__webglColorBuffer && (a.__webglColorBuffer = l.createBuffer());
        a.hasPositions && (l.bindBuffer(l.ARRAY_BUFFER, a.__webglVertexBuffer), l.bufferData(l.ARRAY_BUFFER, a.positionArray, l.DYNAMIC_DRAW), g(b.attributes.position), l.vertexAttribPointer(b.attributes.position, 3, l.FLOAT, !1, 0, 0));
        if (a.hasNormals) {
            l.bindBuffer(l.ARRAY_BUFFER, a.__webglNormalBuffer);
            if (c.shading === THREE.FlatShading) {
                var d, e, k, m, n, p, r, q, t, s, v, u = 3 * a.count;
                for (v = 0; v < u; v += 9) s = a.normalArray, d = s[v], e = s[v + 1], k = s[v + 2], m = s[v + 3], p = s[v + 4], q = s[v + 5], n = s[v + 6], r = s[v + 7], t = s[v + 8], d = (d + m + n) / 3, e = (e + p + r) / 3, k = (k + q + t) / 3, s[v] = d, s[v + 1] = e, s[v + 2] = k, s[v + 3] = d, s[v + 4] = e, s[v + 5] = k, s[v + 6] = d, s[v + 7] = e, s[v + 8] = k
            }
            l.bufferData(l.ARRAY_BUFFER, a.normalArray, l.DYNAMIC_DRAW);
            g(b.attributes.normal);
            l.vertexAttribPointer(b.attributes.normal, 3, l.FLOAT, !1, 0, 0)
        }
        a.hasUvs && c.map && (l.bindBuffer(l.ARRAY_BUFFER, a.__webglUvBuffer), l.bufferData(l.ARRAY_BUFFER, a.uvArray, l.DYNAMIC_DRAW), g(b.attributes.uv), l.vertexAttribPointer(b.attributes.uv, 2, l.FLOAT, !1, 0, 0));
        a.hasColors && c.vertexColors !== THREE.NoColors && (l.bindBuffer(l.ARRAY_BUFFER, a.__webglColorBuffer), l.bufferData(l.ARRAY_BUFFER, a.colorArray, l.DYNAMIC_DRAW), g(b.attributes.color), l.vertexAttribPointer(b.attributes.color, 3, l.FLOAT, !1, 0, 0));
        h();
        l.drawArrays(l.TRIANGLES, 0, a.count);
        a.count = 0
    };
    this.renderBufferDirect = function(a, b, c, d, g, h) {
        if (!1 !== d.visible)
            if (a = G(a, b, c, d, h), b = !1, c = 16777215 * g.id + 2 * a.id + (d.wireframe ? 1 : 0), c !== Oa && (Oa = c, b = !0), b && f(), h instanceof THREE.Mesh)
                if (h = !0 === d.wireframe ? l.LINES : l.TRIANGLES, c = g.attributes.index) {
                    var k, m;
                    c.array instanceof Uint32Array && pa.get("OES_element_index_uint") ? (k = l.UNSIGNED_INT, m = 4) : (k = l.UNSIGNED_SHORT, m = 2);
                    var n = g.offsets;
                    if (0 === n.length) b && (e(d, a, g, 0), l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, c.buffer)), l.drawElements(h, c.array.length, k, 0), J.info.render.calls++, J.info.render.vertices += c.array.length, J.info.render.faces += c.array.length / 3;
                    else {
                        b = !0;
                        for (var p = 0, r = n.length; p < r; p++) {
                            var q = n[p].index;
                            b && (e(d, a, g, q), l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, c.buffer));
                            l.drawElements(h, n[p].count, k, n[p].start * m);
                            J.info.render.calls++;
                            J.info.render.vertices += n[p].count;
                            J.info.render.faces += n[p].count / 3
                        }
                    }
                } else b && e(d, a, g, 0), d = g.attributes.position, l.drawArrays(h, 0, d.array.length / 3), J.info.render.calls++, J.info.render.vertices += d.array.length / 3, J.info.render.faces += d.array.length / 9;
        else if (h instanceof THREE.PointCloud) b && e(d, a, g, 0), d = g.attributes.position, l.drawArrays(l.POINTS, 0, d.array.length / 3), J.info.render.calls++, J.info.render.points += d.array.length / 3;
        else if (h instanceof THREE.Line)
            if (h = h.mode === THREE.LineStrip ? l.LINE_STRIP : l.LINES, A(d.linewidth), c = g.attributes.index)
                if (c.array instanceof Uint32Array ? (k = l.UNSIGNED_INT, m = 4) : (k = l.UNSIGNED_SHORT, m = 2), n = g.offsets, 0 === n.length) b && (e(d, a, g, 0), l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, c.buffer)), l.drawElements(h, c.array.length, k, 0), J.info.render.calls++, J.info.render.vertices += c.array.length;
                else
                    for (1 < n.length && (b = !0), p = 0, r = n.length; p < r; p++) q = n[p].index, b && (e(d, a, g, q), l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, c.buffer)), l.drawElements(h, n[p].count, k, n[p].start * m), J.info.render.calls++, J.info.render.vertices += n[p].count;
        else b && e(d, a, g, 0), d = g.attributes.position, l.drawArrays(h, 0, d.array.length / 3), J.info.render.calls++, J.info.render.points += d.array.length / 3
    };
    this.renderBuffer = function(a, b, c, d, e, k) {
        if (!1 !== d.visible) {
            c = G(a, b, c, d, k);
            b = c.attributes;
            a = !1;
            c = 16777215 * e.id + 2 * c.id + (d.wireframe ? 1 : 0);
            c !== Oa && (Oa = c, a = !0);
            a && f();
            if (!d.morphTargets && 0 <= b.position) a && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglVertexBuffer), g(b.position), l.vertexAttribPointer(b.position, 3, l.FLOAT, !1, 0, 0));
            else if (k.morphTargetBase) {
                c = d.program.attributes; - 1 !== k.morphTargetBase && 0 <= c.position ? (l.bindBuffer(l.ARRAY_BUFFER, e.__webglMorphTargetsBuffers[k.morphTargetBase]), g(c.position), l.vertexAttribPointer(c.position, 3, l.FLOAT, !1, 0, 0)) : 0 <= c.position && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglVertexBuffer), g(c.position), l.vertexAttribPointer(c.position, 3, l.FLOAT, !1, 0, 0));
                if (k.morphTargetForcedOrder.length)
                    for (var m = 0, n = k.morphTargetForcedOrder, r = k.morphTargetInfluences; m < d.numSupportedMorphTargets && m < n.length;) 0 <= c["morphTarget" + m] && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglMorphTargetsBuffers[n[m]]), g(c["morphTarget" + m]), l.vertexAttribPointer(c["morphTarget" + m], 3, l.FLOAT, !1, 0, 0)), 0 <= c["morphNormal" + m] && d.morphNormals && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglMorphNormalsBuffers[n[m]]), g(c["morphNormal" + m]), l.vertexAttribPointer(c["morphNormal" + m], 3, l.FLOAT, !1, 0, 0)), k.__webglMorphTargetInfluences[m] = r[n[m]], m++;
                else {
                    var n = [],
                        r = k.morphTargetInfluences,
                        q, t = r.length;
                    for (q = 0; q < t; q++) m = r[q], 0 < m && n.push([m, q]);
                    n.length > d.numSupportedMorphTargets ? (n.sort(p), n.length = d.numSupportedMorphTargets) : n.length > d.numSupportedMorphNormals ? n.sort(p) : 0 === n.length && n.push([0, 0]);
                    for (m = 0; m < d.numSupportedMorphTargets;) n[m] ? (q = n[m][1], 0 <= c["morphTarget" + m] && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglMorphTargetsBuffers[q]), g(c["morphTarget" + m]), l.vertexAttribPointer(c["morphTarget" + m], 3, l.FLOAT, !1, 0, 0)), 0 <= c["morphNormal" + m] && d.morphNormals && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglMorphNormalsBuffers[q]), g(c["morphNormal" + m]), l.vertexAttribPointer(c["morphNormal" + m], 3, l.FLOAT, !1, 0, 0)), k.__webglMorphTargetInfluences[m] = r[q]) : k.__webglMorphTargetInfluences[m] = 0, m++
                }
                null !== d.program.uniforms.morphTargetInfluences && l.uniform1fv(d.program.uniforms.morphTargetInfluences, k.__webglMorphTargetInfluences)
            }
            if (a) {
                if (e.__webglCustomAttributesList)
                    for (c = 0, r = e.__webglCustomAttributesList.length; c < r; c++) n = e.__webglCustomAttributesList[c], 0 <= b[n.buffer.belongsToAttribute] && (l.bindBuffer(l.ARRAY_BUFFER, n.buffer), g(b[n.buffer.belongsToAttribute]), l.vertexAttribPointer(b[n.buffer.belongsToAttribute], n.size, l.FLOAT, !1, 0, 0));
                0 <= b.color && (0 < k.geometry.colors.length || 0 < k.geometry.faces.length ? (l.bindBuffer(l.ARRAY_BUFFER, e.__webglColorBuffer), g(b.color), l.vertexAttribPointer(b.color, 3, l.FLOAT, !1, 0, 0)) : void 0 !== d.defaultAttributeValues && l.vertexAttrib3fv(b.color, d.defaultAttributeValues.color));
                0 <= b.normal && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglNormalBuffer), g(b.normal), l.vertexAttribPointer(b.normal, 3, l.FLOAT, !1, 0, 0));
                0 <= b.tangent && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglTangentBuffer), g(b.tangent), l.vertexAttribPointer(b.tangent, 4, l.FLOAT, !1, 0, 0));
                0 <= b.uv && (k.geometry.faceVertexUvs[0] ? (l.bindBuffer(l.ARRAY_BUFFER, e.__webglUVBuffer), g(b.uv), l.vertexAttribPointer(b.uv, 2, l.FLOAT, !1, 0, 0)) : void 0 !== d.defaultAttributeValues && l.vertexAttrib2fv(b.uv, d.defaultAttributeValues.uv));
                0 <= b.uv2 && (k.geometry.faceVertexUvs[1] ? (l.bindBuffer(l.ARRAY_BUFFER, e.__webglUV2Buffer), g(b.uv2), l.vertexAttribPointer(b.uv2, 2, l.FLOAT, !1, 0, 0)) : void 0 !== d.defaultAttributeValues && l.vertexAttrib2fv(b.uv2, d.defaultAttributeValues.uv2));
                d.skinning && 0 <= b.skinIndex && 0 <= b.skinWeight && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglSkinIndicesBuffer), g(b.skinIndex), l.vertexAttribPointer(b.skinIndex, 4, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, e.__webglSkinWeightsBuffer), g(b.skinWeight), l.vertexAttribPointer(b.skinWeight, 4, l.FLOAT, !1, 0, 0));
                0 <= b.lineDistance && (l.bindBuffer(l.ARRAY_BUFFER, e.__webglLineDistanceBuffer), g(b.lineDistance), l.vertexAttribPointer(b.lineDistance, 1, l.FLOAT, !1, 0, 0))
            }
            h();
            k instanceof THREE.Mesh ? (k = e.__typeArray === Uint32Array ? l.UNSIGNED_INT : l.UNSIGNED_SHORT, d.wireframe ? (A(d.wireframeLinewidth), a && l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, e.__webglLineBuffer), l.drawElements(l.LINES, e.__webglLineCount, k, 0)) : (a && l.bindBuffer(l.ELEMENT_ARRAY_BUFFER, e.__webglFaceBuffer), l.drawElements(l.TRIANGLES, e.__webglFaceCount, k, 0)), J.info.render.calls++, J.info.render.vertices += e.__webglFaceCount, J.info.render.faces += e.__webglFaceCount / 3) : k instanceof THREE.Line ? (k = k.mode === THREE.LineStrip ? l.LINE_STRIP : l.LINES, A(d.linewidth), l.drawArrays(k, 0, e.__webglLineCount), J.info.render.calls++) : k instanceof THREE.PointCloud && (l.drawArrays(l.POINTS, 0, e.__webglParticleCount), J.info.render.calls++, J.info.render.points += e.__webglParticleCount)
        }
    };
    this.render = function(a, b, c, d) {
        if (!1 === b instanceof THREE.Camera) console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");
        else {
            var e = a.fog;
            Kb = Oa = -1;
            ec = null;
            fc = !0;
            !0 === a.autoUpdate && a.updateMatrixWorld();
            void 0 === b.parent && b.updateMatrixWorld();
            a.traverse(function(a) {
                a instanceof THREE.SkinnedMesh && a.skeleton.update()
            });
            b.matrixWorldInverse.getInverse(b.matrixWorld);
            Ac.multiplyMatrices(b.projectionMatrix, b.matrixWorldInverse);
            Ec.setFromMatrix(Ac);
            cb.length = 0;
            Jb.length = 0;
            Ib.length = 0;
            yb.length = 0;
            Ra.length = 0;
            q(a, a);
            !0 === J.sortObjects && (Jb.sort(k), Ib.sort(n));
            id.render(a, b);
            J.info.render.calls = 0;
            J.info.render.vertices = 0;
            J.info.render.faces = 0;
            J.info.render.points = 0;
            this.setRenderTarget(c);
            (this.autoClear || d) && this.clear(this.autoClearColor, this.autoClearDepth, this.autoClearStencil);
            d = 0;
            for (var f = jb.length; d < f; d++) {
                var g = jb[d],
                    h = g.object;
                h.visible && (x(h, b), t(g))
            }
            a.overrideMaterial ? (d = a.overrideMaterial, this.setBlending(d.blending, d.blendEquation, d.blendSrc, d.blendDst), this.setDepthTest(d.depthTest), this.setDepthWrite(d.depthWrite), B(d.polygonOffset, d.polygonOffsetFactor, d.polygonOffsetUnits), m(Jb, b, cb, e, !0, d), m(Ib, b, cb, e, !0, d), r(jb, "", b, cb, e, !1, d)) : (d = null, this.setBlending(THREE.NoBlending), m(Jb, b, cb, e, !1, d), r(jb, "opaque", b, cb, e, !1, d), m(Ib, b, cb, e, !0, d), r(jb, "transparent", b, cb, e, !0, d));
            jd.render(a, b);
            kd.render(a, b, Uc, Vc);
            c && c.generateMipmaps && c.minFilter !== THREE.NearestFilter && c.minFilter !== THREE.LinearFilter && C(c);
            this.setDepthTest(!0);
            this.setDepthWrite(!0)
        }
    };
    this.renderImmediateObject = function(a, b, c, d, e) {
        var f = G(a, b, c, d, e);
        Oa = -1;
        J.setMaterialFaces(d);
        e.immediateRenderCallback ? e.immediateRenderCallback(f, l, Ec) : e.render(function(a) {
            J.renderBufferImmediate(a, f, d)
        })
    };
    var xb = {},
        rc = 0;
    this.setFaceCulling = function(a, b) {
        a === THREE.CullFaceNone ? l.disable(l.CULL_FACE) : (b === THREE.FrontFaceDirectionCW ? l.frontFace(l.CW) : l.frontFace(l.CCW), a === THREE.CullFaceBack ? l.cullFace(l.BACK) : a === THREE.CullFaceFront ? l.cullFace(l.FRONT) : l.cullFace(l.FRONT_AND_BACK), l.enable(l.CULL_FACE))
    };
    this.setMaterialFaces = function(a) {
        var b = a.side === THREE.DoubleSide;
        a = a.side === THREE.BackSide;
        Lb !== b && (b ? l.disable(l.CULL_FACE) : l.enable(l.CULL_FACE), Lb = b);
        Mb !== a && (a ? l.frontFace(l.CW) : l.frontFace(l.CCW), Mb = a)
    };
    this.setDepthTest = function(a) {
        Yb !== a && (a ? l.enable(l.DEPTH_TEST) : l.disable(l.DEPTH_TEST), Yb = a)
    };
    this.setDepthWrite = function(a) {
        nb !== a && (l.depthMask(a), nb = a)
    };
    this.setBlending = function(a, b, c, d) {
        a !== pb && (a === THREE.NoBlending ? l.disable(l.BLEND) : a === THREE.AdditiveBlending ? (l.enable(l.BLEND), l.blendEquation(l.FUNC_ADD), l.blendFunc(l.SRC_ALPHA, l.ONE)) : a === THREE.SubtractiveBlending ? (l.enable(l.BLEND), l.blendEquation(l.FUNC_ADD), l.blendFunc(l.ZERO, l.ONE_MINUS_SRC_COLOR)) : a === THREE.MultiplyBlending ? (l.enable(l.BLEND), l.blendEquation(l.FUNC_ADD), l.blendFunc(l.ZERO, l.SRC_COLOR)) : a === THREE.CustomBlending ? l.enable(l.BLEND) : (l.enable(l.BLEND), l.blendEquationSeparate(l.FUNC_ADD, l.FUNC_ADD), l.blendFuncSeparate(l.SRC_ALPHA, l.ONE_MINUS_SRC_ALPHA, l.ONE, l.ONE_MINUS_SRC_ALPHA)), pb = a);
        if (a === THREE.CustomBlending) {
            if (b !== Nb && (l.blendEquation(Q(b)), Nb = b), c !== Ob || d !== Xb) l.blendFunc(Q(c), Q(d)), Ob = c, Xb = d
        } else Xb = Ob = Nb = null
    };
    this.uploadTexture = function(a) {
        void 0 === a.__webglInit && (a.__webglInit = !0, a.addEventListener("dispose", gc), a.__webglTexture = l.createTexture(), J.info.memory.textures++);
        l.bindTexture(l.TEXTURE_2D, a.__webglTexture);
        l.pixelStorei(l.UNPACK_FLIP_Y_WEBGL, a.flipY);
        l.pixelStorei(l.UNPACK_PREMULTIPLY_ALPHA_WEBGL, a.premultiplyAlpha);
        l.pixelStorei(l.UNPACK_ALIGNMENT, a.unpackAlignment);
        a.image = R(a.image, cd);
        var b = a.image,
            c = THREE.Math.isPowerOfTwo(b.width) && THREE.Math.isPowerOfTwo(b.height),
            d = Q(a.format),
            e = Q(a.type);
        F(l.TEXTURE_2D, a, c);
        var f = a.mipmaps;
        if (a instanceof THREE.DataTexture)
            if (0 < f.length && c) {
                for (var g = 0, h = f.length; g < h; g++) b = f[g], l.texImage2D(l.TEXTURE_2D, g, d, b.width, b.height, 0, d, e, b.data);
                a.generateMipmaps = !1
            } else l.texImage2D(l.TEXTURE_2D, 0, d, b.width, b.height, 0, d, e, b.data);
        else if (a instanceof THREE.CompressedTexture)
            for (g = 0, h = f.length; g < h; g++) b = f[g], a.format !== THREE.RGBAFormat && a.format !== THREE.RGBFormat ? -1 < Nc().indexOf(d) ? l.compressedTexImage2D(l.TEXTURE_2D, g, d, b.width, b.height, 0, b.data) : console.warn("Attempt to load unsupported compressed texture format") : l.texImage2D(l.TEXTURE_2D, g, d, b.width, b.height, 0, d, e, b.data);
        else if (0 < f.length && c) {
            g = 0;
            for (h = f.length; g < h; g++) b = f[g], l.texImage2D(l.TEXTURE_2D, g, d, d, e, b);
            a.generateMipmaps = !1
        } else l.texImage2D(l.TEXTURE_2D, 0, d, d, e, a.image);
        a.generateMipmaps && c && l.generateMipmap(l.TEXTURE_2D);
        a.needsUpdate = !1;
        if (a.onUpdate) a.onUpdate()
    };
    this.setTexture = function(a, b) {
        l.activeTexture(l.TEXTURE0 + b);
        a.needsUpdate ? J.uploadTexture(a) : l.bindTexture(l.TEXTURE_2D, a.__webglTexture)
    };
    this.setRenderTarget = function(a) {
        var b = a instanceof THREE.WebGLRenderTargetCube;
        if (a && void 0 === a.__webglFramebuffer) {
            void 0 === a.depthBuffer && (a.depthBuffer = !0);
            void 0 === a.stencilBuffer && (a.stencilBuffer = !0);
            a.addEventListener("dispose", Zc);
            a.__webglTexture = l.createTexture();
            J.info.memory.textures++;
            var c = THREE.Math.isPowerOfTwo(a.width) && THREE.Math.isPowerOfTwo(a.height),
                d = Q(a.format),
                e = Q(a.type);
            if (b) {
                a.__webglFramebuffer = [];
                a.__webglRenderbuffer = [];
                l.bindTexture(l.TEXTURE_CUBE_MAP, a.__webglTexture);
                F(l.TEXTURE_CUBE_MAP, a, c);
                for (var f = 0; 6 > f; f++) {
                    a.__webglFramebuffer[f] = l.createFramebuffer();
                    a.__webglRenderbuffer[f] = l.createRenderbuffer();
                    l.texImage2D(l.TEXTURE_CUBE_MAP_POSITIVE_X + f, 0, d, a.width, a.height, 0, d, e, null);
                    var g = a,
                        h = l.TEXTURE_CUBE_MAP_POSITIVE_X + f;
                    l.bindFramebuffer(l.FRAMEBUFFER, a.__webglFramebuffer[f]);
                    l.framebufferTexture2D(l.FRAMEBUFFER, l.COLOR_ATTACHMENT0, h, g.__webglTexture, 0);
                    H(a.__webglRenderbuffer[f], a)
                }
                c && l.generateMipmap(l.TEXTURE_CUBE_MAP)
            } else a.__webglFramebuffer = l.createFramebuffer(), a.__webglRenderbuffer = a.shareDepthFrom ? a.shareDepthFrom.__webglRenderbuffer : l.createRenderbuffer(), l.bindTexture(l.TEXTURE_2D, a.__webglTexture), F(l.TEXTURE_2D, a, c), l.texImage2D(l.TEXTURE_2D, 0, d, a.width, a.height, 0, d, e, null), d = l.TEXTURE_2D, l.bindFramebuffer(l.FRAMEBUFFER, a.__webglFramebuffer), l.framebufferTexture2D(l.FRAMEBUFFER, l.COLOR_ATTACHMENT0, d, a.__webglTexture, 0), a.shareDepthFrom ? a.depthBuffer && !a.stencilBuffer ? l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_ATTACHMENT, l.RENDERBUFFER, a.__webglRenderbuffer) : a.depthBuffer && a.stencilBuffer && l.framebufferRenderbuffer(l.FRAMEBUFFER, l.DEPTH_STENCIL_ATTACHMENT, l.RENDERBUFFER, a.__webglRenderbuffer) : H(a.__webglRenderbuffer, a), c && l.generateMipmap(l.TEXTURE_2D);
            b ? l.bindTexture(l.TEXTURE_CUBE_MAP, null) : l.bindTexture(l.TEXTURE_2D, null);
            l.bindRenderbuffer(l.RENDERBUFFER, null);
            l.bindFramebuffer(l.FRAMEBUFFER, null)
        }
        a ? (b = b ? a.__webglFramebuffer[a.activeCubeFace] : a.__webglFramebuffer, c = a.width, a = a.height, e = d = 0) : (b = null, c = lc, a = mc, d = Pb, e = kc);
        b !== Tc && (l.bindFramebuffer(l.FRAMEBUFFER, b), l.viewport(d, e, c, a), Tc = b);
        Uc = c;
        Vc = a
    };
    this.initMaterial = function() {
        console.warn("THREE.WebGLRenderer: .initMaterial() has been removed.")
    };
    this.addPrePlugin = function() {
        console.warn("THREE.WebGLRenderer: .addPrePlugin() has been removed.")
    };
    this.addPostPlugin = function() {
        console.warn("THREE.WebGLRenderer: .addPostPlugin() has been removed.")
    };
    this.updateShadowMap = function() {
        console.warn("THREE.WebGLRenderer: .updateShadowMap() has been removed.")
    }
};
THREE.WebGLRenderTarget = function(a, b, c) {
    this.width = a;
    this.height = b;
    c = c || {};
    this.wrapS = void 0 !== c.wrapS ? c.wrapS : THREE.ClampToEdgeWrapping;
    this.wrapT = void 0 !== c.wrapT ? c.wrapT : THREE.ClampToEdgeWrapping;
    this.magFilter = void 0 !== c.magFilter ? c.magFilter : THREE.LinearFilter;
    this.minFilter = void 0 !== c.minFilter ? c.minFilter : THREE.LinearMipMapLinearFilter;
    this.anisotropy = void 0 !== c.anisotropy ? c.anisotropy : 1;
    this.offset = new THREE.Vector2(0, 0);
    this.repeat = new THREE.Vector2(1, 1);
    this.format = void 0 !== c.format ? c.format : THREE.RGBAFormat;
    this.type = void 0 !== c.type ? c.type : THREE.UnsignedByteType;
    this.depthBuffer = void 0 !== c.depthBuffer ? c.depthBuffer : !0;
    this.stencilBuffer = void 0 !== c.stencilBuffer ? c.stencilBuffer : !0;
    this.generateMipmaps = !0;
    this.shareDepthFrom = null
};
THREE.WebGLRenderTarget.prototype = {
    constructor: THREE.WebGLRenderTarget,
    setSize: function(a, b) {
        this.width = a;
        this.height = b
    },
    clone: function() {
        var a = new THREE.WebGLRenderTarget(this.width, this.height);
        a.wrapS = this.wrapS;
        a.wrapT = this.wrapT;
        a.magFilter = this.magFilter;
        a.minFilter = this.minFilter;
        a.anisotropy = this.anisotropy;
        a.offset.copy(this.offset);
        a.repeat.copy(this.repeat);
        a.format = this.format;
        a.type = this.type;
        a.depthBuffer = this.depthBuffer;
        a.stencilBuffer = this.stencilBuffer;
        a.generateMipmaps = this.generateMipmaps;
        a.shareDepthFrom = this.shareDepthFrom;
        return a
    },
    dispose: function() {
        this.dispatchEvent({
            type: "dispose"
        })
    }
};
THREE.EventDispatcher.prototype.apply(THREE.WebGLRenderTarget.prototype);
THREE.WebGLRenderTargetCube = function(a, b, c) {
    THREE.WebGLRenderTarget.call(this, a, b, c);
    this.activeCubeFace = 0
};
THREE.WebGLRenderTargetCube.prototype = Object.create(THREE.WebGLRenderTarget.prototype);
THREE.WebGLExtensions = function(a) {
    var b = {};
    this.get = function(c) {
        if (void 0 !== b[c]) return b[c];
        var d;
        switch (c) {
            case "OES_texture_float":
                d = a.getExtension("OES_texture_float");
                break;
            case "OES_texture_float_linear":
                d = a.getExtension("OES_texture_float_linear");
                break;
            case "OES_standard_derivatives":
                d = a.getExtension("OES_standard_derivatives");
                break;
            case "EXT_texture_filter_anisotropic":
                d = a.getExtension("EXT_texture_filter_anisotropic") || a.getExtension("MOZ_EXT_texture_filter_anisotropic") || a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
                break;
            case "WEBGL_compressed_texture_s3tc":
                d = a.getExtension("WEBGL_compressed_texture_s3tc") || a.getExtension("MOZ_WEBGL_compressed_texture_s3tc") || a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");
                break;
            case "WEBGL_compressed_texture_pvrtc":
                d = a.getExtension("WEBGL_compressed_texture_pvrtc") || a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");
                break;
            case "OES_element_index_uint":
                d = a.getExtension("OES_element_index_uint");
                break;
            case "EXT_blend_minmax":
                d = a.getExtension("EXT_blend_minmax");
                break;
            case "EXT_frag_depth":
                d = a.getExtension("EXT_frag_depth")
        }
        null === d && console.log("THREE.WebGLRenderer: " + c + " extension not supported.");
        return b[c] = d
    }
};
THREE.WebGLProgram = function() {
    var a = 0;
    return function(b, c, d, e) {
        var f = b.context,
            g = d.defines,
            h = d.__webglShader.uniforms,
            k = d.attributes,
            n = d.__webglShader.vertexShader,
            p = d.__webglShader.fragmentShader,
            q = d.index0AttributeName;
        void 0 === q && !0 === e.morphTargets && (q = "position");
        var m = "SHADOWMAP_TYPE_BASIC";
        e.shadowMapType === THREE.PCFShadowMap ? m = "SHADOWMAP_TYPE_PCF" : e.shadowMapType === THREE.PCFSoftShadowMap && (m = "SHADOWMAP_TYPE_PCF_SOFT");
        var r, t;
        r = [];
        for (var s in g) t = g[s], !1 !== t && (t = "#define " + s + " " + t, r.push(t));
        r = r.join("\n");
        g = f.createProgram();
        d instanceof THREE.RawShaderMaterial ? b = d = "" : (d = ["precision " + e.precision + " float;", "precision " + e.precision + " int;", r, e.supportsVertexTextures ? "#define VERTEX_TEXTURES" : "", b.gammaInput ? "#define GAMMA_INPUT" : "", b.gammaOutput ? "#define GAMMA_OUTPUT" : "", "#define MAX_DIR_LIGHTS " + e.maxDirLights, "#define MAX_POINT_LIGHTS " + e.maxPointLights, "#define MAX_SPOT_LIGHTS " + e.maxSpotLights, "#define MAX_HEMI_LIGHTS " + e.maxHemiLights, "#define MAX_SHADOWS " + e.maxShadows, "#define MAX_BONES " + e.maxBones, e.map ? "#define USE_MAP" : "", e.envMap ? "#define USE_ENVMAP" : "", e.lightMap ? "#define USE_LIGHTMAP" : "", e.bumpMap ? "#define USE_BUMPMAP" : "", e.normalMap ? "#define USE_NORMALMAP" : "", e.specularMap ? "#define USE_SPECULARMAP" : "", e.alphaMap ? "#define USE_ALPHAMAP" : "", e.vertexColors ? "#define USE_COLOR" : "", e.skinning ? "#define USE_SKINNING" : "", e.useVertexTexture ? "#define BONE_TEXTURE" : "", e.morphTargets ? "#define USE_MORPHTARGETS" : "", e.morphNormals ? "#define USE_MORPHNORMALS" : "", e.wrapAround ? "#define WRAP_AROUND" : "", e.doubleSided ? "#define DOUBLE_SIDED" : "", e.flipSided ? "#define FLIP_SIDED" : "", e.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", e.shadowMapEnabled ? "#define " + m : "", e.shadowMapDebug ? "#define SHADOWMAP_DEBUG" : "", e.shadowMapCascade ? "#define SHADOWMAP_CASCADE" : "", e.sizeAttenuation ? "#define USE_SIZEATTENUATION" : "", e.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "", "uniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\nuniform vec3 cameraPosition;\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec2 uv;\nattribute vec2 uv2;\n#ifdef USE_COLOR\n    attribute vec3 color;\n#endif\n#ifdef USE_MORPHTARGETS\n    attribute vec3 morphTarget0;\n  attribute vec3 morphTarget1;\n  attribute vec3 morphTarget2;\n  attribute vec3 morphTarget3;\n  #ifdef USE_MORPHNORMALS\n       attribute vec3 morphNormal0;\n      attribute vec3 morphNormal1;\n      attribute vec3 morphNormal2;\n      attribute vec3 morphNormal3;\n  #else\n     attribute vec3 morphTarget4;\n      attribute vec3 morphTarget5;\n      attribute vec3 morphTarget6;\n      attribute vec3 morphTarget7;\n  #endif\n#endif\n#ifdef USE_SKINNING\n   attribute vec4 skinIndex;\n attribute vec4 skinWeight;\n#endif\n"].join("\n"), b = ["precision " + e.precision + " float;", "precision " + e.precision + " int;", e.bumpMap || e.normalMap ? "#extension GL_OES_standard_derivatives : enable" : "", r, "#define MAX_DIR_LIGHTS " + e.maxDirLights, "#define MAX_POINT_LIGHTS " + e.maxPointLights, "#define MAX_SPOT_LIGHTS " + e.maxSpotLights, "#define MAX_HEMI_LIGHTS " + e.maxHemiLights, "#define MAX_SHADOWS " + e.maxShadows, e.alphaTest ? "#define ALPHATEST " + e.alphaTest : "", b.gammaInput ? "#define GAMMA_INPUT" : "", b.gammaOutput ? "#define GAMMA_OUTPUT" : "", e.useFog && e.fog ? "#define USE_FOG" : "", e.useFog && e.fogExp ? "#define FOG_EXP2" : "", e.map ? "#define USE_MAP" : "", e.envMap ? "#define USE_ENVMAP" : "", e.lightMap ? "#define USE_LIGHTMAP" : "", e.bumpMap ? "#define USE_BUMPMAP" : "", e.normalMap ? "#define USE_NORMALMAP" : "", e.specularMap ? "#define USE_SPECULARMAP" : "", e.alphaMap ? "#define USE_ALPHAMAP" : "", e.vertexColors ? "#define USE_COLOR" : "", e.metal ? "#define METAL" : "", e.wrapAround ? "#define WRAP_AROUND" : "", e.doubleSided ? "#define DOUBLE_SIDED" : "", e.flipSided ? "#define FLIP_SIDED" : "", e.shadowMapEnabled ? "#define USE_SHADOWMAP" : "", e.shadowMapEnabled ? "#define " + m : "", e.shadowMapDebug ? "#define SHADOWMAP_DEBUG" : "", e.shadowMapCascade ? "#define SHADOWMAP_CASCADE" : "", e.logarithmicDepthBuffer ? "#define USE_LOGDEPTHBUF" : "", "uniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\n"].join("\n"));
        n = new THREE.WebGLShader(f, f.VERTEX_SHADER, d + n);
        p = new THREE.WebGLShader(f, f.FRAGMENT_SHADER, b + p);
        f.attachShader(g, n);
        f.attachShader(g, p);
        void 0 !== q && f.bindAttribLocation(g, 0, q);
        f.linkProgram(g);
        !1 === f.getProgramParameter(g, f.LINK_STATUS) && (console.error("THREE.WebGLProgram: Could not initialise shader."), console.error("gl.VALIDATE_STATUS", f.getProgramParameter(g, f.VALIDATE_STATUS)), console.error("gl.getError()", f.getError()));
        "" !== f.getProgramInfoLog(g) && console.warn("THREE.WebGLProgram: gl.getProgramInfoLog()", f.getProgramInfoLog(g));
        f.deleteShader(n);
        f.deleteShader(p);
        q = "viewMatrix modelViewMatrix projectionMatrix normalMatrix modelMatrix cameraPosition morphTargetInfluences bindMatrix bindMatrixInverse".split(" ");
        e.useVertexTexture ? (q.push("boneTexture"), q.push("boneTextureWidth"), q.push("boneTextureHeight")) : q.push("boneGlobalMatrices");
        e.logarithmicDepthBuffer && q.push("logDepthBufFC");
        for (var u in h) q.push(u);
        h = q;
        u = {};
        q = 0;
        for (b = h.length; q < b; q++) m = h[q], u[m] = f.getUniformLocation(g, m);
        this.uniforms = u;
        q = "position normal uv uv2 tangent color skinIndex skinWeight lineDistance".split(" ");
        for (h = 0; h < e.maxMorphTargets; h++) q.push("morphTarget" + h);
        for (h = 0; h < e.maxMorphNormals; h++) q.push("morphNormal" + h);
        for (var v in k) q.push(v);
        e = q;
        k = {};
        v = 0;
        for (h = e.length; v < h; v++) u = e[v], k[u] = f.getAttribLocation(g, u);
        this.attributes = k;
        this.attributesKeys = Object.keys(this.attributes);
        this.id = a++;
        this.code = c;
        this.usedTimes = 1;
        this.program = g;
        this.vertexShader = n;
        this.fragmentShader = p;
        return this
    }
}();
THREE.WebGLShader = function() {
    var a = function(a) {
        a = a.split("\n");
        for (var c = 0; c < a.length; c++) a[c] = c + 1 + ": " + a[c];
        return a.join("\n")
    };
    return function(b, c, d) {
        c = b.createShader(c);
        b.shaderSource(c, d);
        b.compileShader(c);
        !1 === b.getShaderParameter(c, b.COMPILE_STATUS) && console.error("THREE.WebGLShader: Shader couldn't compile.");
        "" !== b.getShaderInfoLog(c) && (console.warn("THREE.WebGLShader: gl.getShaderInfoLog()", b.getShaderInfoLog(c)), console.warn(a(d)));
        return c
    }
}();
THREE.LensFlarePlugin = function(a, b) {
    var c, d, e, f, g, h, k, n, p, q, m = a.context,
        r, t, s, u, v, y;
    this.render = function(G, w, K, x) {
        if (0 !== b.length) {
            G = new THREE.Vector3;
            var D = x / K,
                E = .5 * K,
                A = .5 * x,
                B = 16 / x,
                F = new THREE.Vector2(B * D, B),
                R = new THREE.Vector3(1, 1, 0),
                H = new THREE.Vector2(1, 1);
            if (void 0 === s) {
                var B = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, 1, 0, 1]),
                    C = new Uint16Array([0, 1, 2, 0, 2, 3]);
                r = m.createBuffer();
                t = m.createBuffer();
                m.bindBuffer(m.ARRAY_BUFFER, r);
                m.bufferData(m.ARRAY_BUFFER, B, m.STATIC_DRAW);
                m.bindBuffer(m.ELEMENT_ARRAY_BUFFER, t);
                m.bufferData(m.ELEMENT_ARRAY_BUFFER, C, m.STATIC_DRAW);
                v = m.createTexture();
                y = m.createTexture();
                m.bindTexture(m.TEXTURE_2D, v);
                m.texImage2D(m.TEXTURE_2D, 0, m.RGB, 16, 16, 0, m.RGB, m.UNSIGNED_BYTE, null);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_WRAP_S, m.CLAMP_TO_EDGE);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_WRAP_T, m.CLAMP_TO_EDGE);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_MAG_FILTER, m.NEAREST);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_MIN_FILTER, m.NEAREST);
                m.bindTexture(m.TEXTURE_2D, y);
                m.texImage2D(m.TEXTURE_2D, 0, m.RGBA, 16, 16, 0, m.RGBA, m.UNSIGNED_BYTE, null);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_WRAP_S, m.CLAMP_TO_EDGE);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_WRAP_T, m.CLAMP_TO_EDGE);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_MAG_FILTER, m.NEAREST);
                m.texParameteri(m.TEXTURE_2D, m.TEXTURE_MIN_FILTER, m.NEAREST);
                var B = (u = 0 < m.getParameter(m.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) ? {
                        vertexShader: "uniform lowp int renderType;\nuniform vec3 screenPosition;\nuniform vec2 scale;\nuniform float rotation;\nuniform sampler2D occlusionMap;\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUV;\nvarying float vVisibility;\nvoid main() {\nvUV = uv;\nvec2 pos = position;\nif( renderType == 2 ) {\nvec4 visibility = texture2D( occlusionMap, vec2( 0.1, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.1 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.5 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.1, 0.9 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.1, 0.5 ) );\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.5 ) );\nvVisibility =        visibility.r / 9.0;\nvVisibility *= 1.0 - visibility.g / 9.0;\nvVisibility *=       visibility.b / 9.0;\nvVisibility *= 1.0 - visibility.a / 9.0;\npos.x = cos( rotation ) * position.x - sin( rotation ) * position.y;\npos.y = sin( rotation ) * position.x + cos( rotation ) * position.y;\n}\ngl_Position = vec4( ( pos * scale + screenPosition.xy ).xy, screenPosition.z, 1.0 );\n}",
                        fragmentShader: "uniform lowp int renderType;\nuniform sampler2D map;\nuniform float opacity;\nuniform vec3 color;\nvarying vec2 vUV;\nvarying float vVisibility;\nvoid main() {\nif( renderType == 0 ) {\ngl_FragColor = vec4( 1.0, 0.0, 1.0, 0.0 );\n} else if( renderType == 1 ) {\ngl_FragColor = texture2D( map, vUV );\n} else {\nvec4 texture = texture2D( map, vUV );\ntexture.a *= opacity * vVisibility;\ngl_FragColor = texture;\ngl_FragColor.rgb *= color;\n}\n}"
                    } : {
                        vertexShader: "uniform lowp int renderType;\nuniform vec3 screenPosition;\nuniform vec2 scale;\nuniform float rotation;\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUV;\nvoid main() {\nvUV = uv;\nvec2 pos = position;\nif( renderType == 2 ) {\npos.x = cos( rotation ) * position.x - sin( rotation ) * position.y;\npos.y = sin( rotation ) * position.x + cos( rotation ) * position.y;\n}\ngl_Position = vec4( ( pos * scale + screenPosition.xy ).xy, screenPosition.z, 1.0 );\n}",
                        fragmentShader: "precision mediump float;\nuniform lowp int renderType;\nuniform sampler2D map;\nuniform sampler2D occlusionMap;\nuniform float opacity;\nuniform vec3 color;\nvarying vec2 vUV;\nvoid main() {\nif( renderType == 0 ) {\ngl_FragColor = vec4( texture2D( map, vUV ).rgb, 0.0 );\n} else if( renderType == 1 ) {\ngl_FragColor = texture2D( map, vUV );\n} else {\nfloat visibility = texture2D( occlusionMap, vec2( 0.5, 0.1 ) ).a;\nvisibility += texture2D( occlusionMap, vec2( 0.9, 0.5 ) ).a;\nvisibility += texture2D( occlusionMap, vec2( 0.5, 0.9 ) ).a;\nvisibility += texture2D( occlusionMap, vec2( 0.1, 0.5 ) ).a;\nvisibility = ( 1.0 - visibility / 4.0 );\nvec4 texture = texture2D( map, vUV );\ntexture.a *= opacity * visibility;\ngl_FragColor = texture;\ngl_FragColor.rgb *= color;\n}\n}"
                    },
                    C = m.createProgram(),
                    T = m.createShader(m.FRAGMENT_SHADER),
                    Q = m.createShader(m.VERTEX_SHADER),
                    O = "precision " + a.getPrecision() + " float;\n";
                m.shaderSource(T, O + B.fragmentShader);
                m.shaderSource(Q, O + B.vertexShader);
                m.compileShader(T);
                m.compileShader(Q);
                m.attachShader(C, T);
                m.attachShader(C, Q);
                m.linkProgram(C);
                s = C;
                p = m.getAttribLocation(s, "position");
                q = m.getAttribLocation(s, "uv");
                c = m.getUniformLocation(s, "renderType");
                d = m.getUniformLocation(s, "map");
                e = m.getUniformLocation(s, "occlusionMap");
                f = m.getUniformLocation(s, "opacity");
                g = m.getUniformLocation(s, "color");
                h = m.getUniformLocation(s, "scale");
                k = m.getUniformLocation(s, "rotation");
                n = m.getUniformLocation(s, "screenPosition")
            }
            m.useProgram(s);
            m.enableVertexAttribArray(p);
            m.enableVertexAttribArray(q);
            m.uniform1i(e, 0);
            m.uniform1i(d, 1);
            m.bindBuffer(m.ARRAY_BUFFER, r);
            m.vertexAttribPointer(p, 2, m.FLOAT, !1, 16, 0);
            m.vertexAttribPointer(q, 2, m.FLOAT, !1, 16, 8);
            m.bindBuffer(m.ELEMENT_ARRAY_BUFFER, t);
            m.disable(m.CULL_FACE);
            m.depthMask(!1);
            C = 0;
            for (T = b.length; C < T; C++)
                if (B = 16 / x, F.set(B * D, B), Q = b[C], G.set(Q.matrixWorld.elements[12], Q.matrixWorld.elements[13], Q.matrixWorld.elements[14]), G.applyMatrix4(w.matrixWorldInverse), G.applyProjection(w.projectionMatrix), R.copy(G), H.x = R.x * E + E, H.y = R.y * A + A, u || 0 < H.x && H.x < K && 0 < H.y && H.y < x) {
                    m.activeTexture(m.TEXTURE1);
                    m.bindTexture(m.TEXTURE_2D, v);
                    m.copyTexImage2D(m.TEXTURE_2D, 0, m.RGB, H.x - 8, H.y - 8, 16, 16, 0);
                    m.uniform1i(c, 0);
                    m.uniform2f(h, F.x, F.y);
                    m.uniform3f(n, R.x, R.y, R.z);
                    m.disable(m.BLEND);
                    m.enable(m.DEPTH_TEST);
                    m.drawElements(m.TRIANGLES, 6, m.UNSIGNED_SHORT, 0);
                    m.activeTexture(m.TEXTURE0);
                    m.bindTexture(m.TEXTURE_2D, y);
                    m.copyTexImage2D(m.TEXTURE_2D, 0, m.RGBA, H.x - 8, H.y - 8, 16, 16, 0);
                    m.uniform1i(c, 1);
                    m.disable(m.DEPTH_TEST);
                    m.activeTexture(m.TEXTURE1);
                    m.bindTexture(m.TEXTURE_2D, v);
                    m.drawElements(m.TRIANGLES, 6, m.UNSIGNED_SHORT, 0);
                    Q.positionScreen.copy(R);
                    Q.customUpdateCallback ? Q.customUpdateCallback(Q) : Q.updateLensFlares();
                    m.uniform1i(c, 2);
                    m.enable(m.BLEND);
                    for (var O = 0, S = Q.lensFlares.length; O < S; O++) {
                        var X = Q.lensFlares[O];
                        .001 < X.opacity && .001 < X.scale && (R.x = X.x, R.y = X.y, R.z = X.z, B = X.size * X.scale / x, F.x = B * D, F.y = B, m.uniform3f(n, R.x, R.y, R.z), m.uniform2f(h, F.x, F.y), m.uniform1f(k, X.rotation), m.uniform1f(f, X.opacity), m.uniform3f(g, X.color.r, X.color.g, X.color.b), a.setBlending(X.blending, X.blendEquation, X.blendSrc, X.blendDst), a.setTexture(X.texture, 1), m.drawElements(m.TRIANGLES, 6, m.UNSIGNED_SHORT, 0))
                    }
                }
            m.enable(m.CULL_FACE);
            m.enable(m.DEPTH_TEST);
            m.depthMask(!0);
            a.resetGLState()
        }
    }
};
THREE.ShadowMapPlugin = function(a, b, c, d) {
    function e(a, b, d) {
        if (b.visible) {
            var f = c[b.id];
            if (f && b.castShadow && (!1 === b.frustumCulled || !0 === p.intersectsObject(b)))
                for (var g = 0, h = f.length; g < h; g++) {
                    var k = f[g];
                    b._modelViewMatrix.multiplyMatrices(d.matrixWorldInverse, b.matrixWorld);
                    s.push(k)
                }
            g = 0;
            for (h = b.children.length; g < h; g++) e(a, b.children[g], d)
        }
    }
    var f = a.context,
        g, h, k, n, p = new THREE.Frustum,
        q = new THREE.Matrix4,
        m = new THREE.Vector3,
        r = new THREE.Vector3,
        t = new THREE.Vector3,
        s = [],
        u = THREE.ShaderLib.depthRGBA,
        v = THREE.UniformsUtils.clone(u.uniforms);
    g = new THREE.ShaderMaterial({
        uniforms: v,
        vertexShader: u.vertexShader,
        fragmentShader: u.fragmentShader
    });
    h = new THREE.ShaderMaterial({
        uniforms: v,
        vertexShader: u.vertexShader,
        fragmentShader: u.fragmentShader,
        morphTargets: !0
    });
    k = new THREE.ShaderMaterial({
        uniforms: v,
        vertexShader: u.vertexShader,
        fragmentShader: u.fragmentShader,
        skinning: !0
    });
    n = new THREE.ShaderMaterial({
        uniforms: v,
        vertexShader: u.vertexShader,
        fragmentShader: u.fragmentShader,
        morphTargets: !0,
        skinning: !0
    });
    g._shadowPass = !0;
    h._shadowPass = !0;
    k._shadowPass = !0;
    n._shadowPass = !0;
    this.render = function(c, v) {
        if (!1 !== a.shadowMapEnabled) {
            var u, K, x, D, E, A, B, F, R = [];
            D = 0;
            f.clearColor(1, 1, 1, 1);
            f.disable(f.BLEND);
            f.enable(f.CULL_FACE);
            f.frontFace(f.CCW);
            a.shadowMapCullFace === THREE.CullFaceFront ? f.cullFace(f.FRONT) : f.cullFace(f.BACK);
            a.setDepthTest(!0);
            u = 0;
            for (K = b.length; u < K; u++)
                if (x = b[u], x.castShadow)
                    if (x instanceof THREE.DirectionalLight && x.shadowCascade)
                        for (E = 0; E < x.shadowCascadeCount; E++) {
                            var H;
                            if (x.shadowCascadeArray[E]) H = x.shadowCascadeArray[E];
                            else {
                                B = x;
                                var C = E;
                                H = new THREE.DirectionalLight;
                                H.isVirtual = !0;
                                H.onlyShadow = !0;
                                H.castShadow = !0;
                                H.shadowCameraNear = B.shadowCameraNear;
                                H.shadowCameraFar = B.shadowCameraFar;
                                H.shadowCameraLeft = B.shadowCameraLeft;
                                H.shadowCameraRight = B.shadowCameraRight;
                                H.shadowCameraBottom = B.shadowCameraBottom;
                                H.shadowCameraTop = B.shadowCameraTop;
                                H.shadowCameraVisible = B.shadowCameraVisible;
                                H.shadowDarkness = B.shadowDarkness;
                                H.shadowBias = B.shadowCascadeBias[C];
                                H.shadowMapWidth = B.shadowCascadeWidth[C];
                                H.shadowMapHeight = B.shadowCascadeHeight[C];
                                H.pointsWorld = [];
                                H.pointsFrustum = [];
                                F = H.pointsWorld;
                                A = H.pointsFrustum;
                                for (var T = 0; 8 > T; T++) F[T] = new THREE.Vector3, A[T] = new THREE.Vector3;
                                F = B.shadowCascadeNearZ[C];
                                B = B.shadowCascadeFarZ[C];
                                A[0].set(-1, -1, F);
                                A[1].set(1, -1, F);
                                A[2].set(-1, 1, F);
                                A[3].set(1, 1, F);
                                A[4].set(-1, -1, B);
                                A[5].set(1, -1, B);
                                A[6].set(-1, 1, B);
                                A[7].set(1, 1, B);
                                H.originalCamera = v;
                                A = new THREE.Gyroscope;
                                A.position.copy(x.shadowCascadeOffset);
                                A.add(H);
                                A.add(H.target);
                                v.add(A);
                                x.shadowCascadeArray[E] = H;
                                console.log("Created virtualLight", H)
                            }
                            C = x;
                            F = E;
                            B = C.shadowCascadeArray[F];
                            B.position.copy(C.position);
                            B.target.position.copy(C.target.position);
                            B.lookAt(B.target);
                            B.shadowCameraVisible = C.shadowCameraVisible;
                            B.shadowDarkness = C.shadowDarkness;
                            B.shadowBias = C.shadowCascadeBias[F];
                            A = C.shadowCascadeNearZ[F];
                            C = C.shadowCascadeFarZ[F];
                            B = B.pointsFrustum;
                            B[0].z = A;
                            B[1].z = A;
                            B[2].z = A;
                            B[3].z = A;
                            B[4].z = C;
                            B[5].z = C;
                            B[6].z = C;
                            B[7].z = C;
                            R[D] = H;
                            D++
                        } else R[D] = x, D++;
            u = 0;
            for (K = R.length; u < K; u++) {
                x = R[u];
                x.shadowMap || (E = THREE.LinearFilter, a.shadowMapType === THREE.PCFSoftShadowMap && (E = THREE.NearestFilter), x.shadowMap = new THREE.WebGLRenderTarget(x.shadowMapWidth, x.shadowMapHeight, {
                    minFilter: E,
                    magFilter: E,
                    format: THREE.RGBAFormat
                }), x.shadowMapSize = new THREE.Vector2(x.shadowMapWidth, x.shadowMapHeight), x.shadowMatrix = new THREE.Matrix4);
                if (!x.shadowCamera) {
                    if (x instanceof THREE.SpotLight) x.shadowCamera = new THREE.PerspectiveCamera(x.shadowCameraFov, x.shadowMapWidth / x.shadowMapHeight, x.shadowCameraNear, x.shadowCameraFar);
                    else if (x instanceof THREE.DirectionalLight) x.shadowCamera = new THREE.OrthographicCamera(x.shadowCameraLeft, x.shadowCameraRight, x.shadowCameraTop, x.shadowCameraBottom, x.shadowCameraNear, x.shadowCameraFar);
                    else {
                        console.error("Unsupported light type for shadow");
                        continue
                    }
                    c.add(x.shadowCamera);
                    !0 === c.autoUpdate && c.updateMatrixWorld()
                }
                x.shadowCameraVisible && !x.cameraHelper && (x.cameraHelper = new THREE.CameraHelper(x.shadowCamera), c.add(x.cameraHelper));
                if (x.isVirtual && H.originalCamera == v) {
                    E = v;
                    D = x.shadowCamera;
                    A = x.pointsFrustum;
                    B = x.pointsWorld;
                    m.set(Infinity, Infinity, Infinity);
                    r.set(-Infinity, -Infinity, -Infinity);
                    for (C = 0; 8 > C; C++) F = B[C], F.copy(A[C]), F.unproject(E), F.applyMatrix4(D.matrixWorldInverse), F.x < m.x && (m.x = F.x), F.x > r.x && (r.x = F.x), F.y < m.y && (m.y = F.y), F.y > r.y && (r.y = F.y), F.z < m.z && (m.z = F.z), F.z > r.z && (r.z = F.z);
                    D.left = m.x;
                    D.right = r.x;
                    D.top = r.y;
                    D.bottom = m.y;
                    D.updateProjectionMatrix()
                }
                D = x.shadowMap;
                A = x.shadowMatrix;
                E = x.shadowCamera;
                E.position.setFromMatrixPosition(x.matrixWorld);
                t.setFromMatrixPosition(x.target.matrixWorld);
                E.lookAt(t);
                E.updateMatrixWorld();
                E.matrixWorldInverse.getInverse(E.matrixWorld);
                x.cameraHelper && (x.cameraHelper.visible = x.shadowCameraVisible);
                x.shadowCameraVisible && x.cameraHelper.update();
                A.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
                A.multiply(E.projectionMatrix);
                A.multiply(E.matrixWorldInverse);
                q.multiplyMatrices(E.projectionMatrix, E.matrixWorldInverse);
                p.setFromMatrix(q);
                a.setRenderTarget(D);
                a.clear();
                s.length = 0;
                e(c, c, E);
                x = 0;
                for (D = s.length; x < D; x++) B = s[x], A = B.object, B = B.buffer, C = A.material instanceof THREE.MeshFaceMaterial ? A.material.materials[0] : A.material, F = void 0 !== A.geometry.morphTargets && 0 < A.geometry.morphTargets.length && C.morphTargets, T = A instanceof THREE.SkinnedMesh && C.skinning, F = A.customDepthMaterial ? A.customDepthMaterial : T ? F ? n : k : F ? h : g, a.setMaterialFaces(C), B instanceof THREE.BufferGeometry ? a.renderBufferDirect(E, b, null, F, B, A) : a.renderBuffer(E, b, null, F, B, A);
                x = 0;
                for (D = d.length; x < D; x++) B = d[x], A = B.object, A.visible && A.castShadow && (A._modelViewMatrix.multiplyMatrices(E.matrixWorldInverse, A.matrixWorld), a.renderImmediateObject(E, b, null, g, A))
            }
            u = a.getClearColor();
            K = a.getClearAlpha();
            f.clearColor(u.r, u.g, u.b, K);
            f.enable(f.BLEND);
            a.shadowMapCullFace === THREE.CullFaceFront && f.cullFace(f.BACK);
            a.resetGLState()
        }
    }
};
THREE.SpritePlugin = function(a, b) {
    var c, d, e, f, g, h, k, n, p, q, m, r, t, s, u, v, y;

    function G(a, b) {
        return a.z !== b.z ? b.z - a.z : b.id - a.id
    }
    var w = a.context,
        K, x, D, E;
    this.render = function(A, B) {
        if (0 !== b.length) {
            if (void 0 === D) {
                var F = new Float32Array([-.5, -.5, 0, 0, .5, -.5, 1, 0, .5, .5, 1, 1, -.5, .5, 0, 1]),
                    R = new Uint16Array([0, 1, 2, 0, 2, 3]);
                K = w.createBuffer();
                x = w.createBuffer();
                w.bindBuffer(w.ARRAY_BUFFER, K);
                w.bufferData(w.ARRAY_BUFFER, F, w.STATIC_DRAW);
                w.bindBuffer(w.ELEMENT_ARRAY_BUFFER, x);
                w.bufferData(w.ELEMENT_ARRAY_BUFFER, R, w.STATIC_DRAW);
                var F = w.createProgram(),
                    R = w.createShader(w.VERTEX_SHADER),
                    H = w.createShader(w.FRAGMENT_SHADER);
                w.shaderSource(R, ["precision " + a.getPrecision() + " float;", "uniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform float rotation;\nuniform vec2 scale;\nuniform vec2 uvOffset;\nuniform vec2 uvScale;\nattribute vec2 position;\nattribute vec2 uv;\nvarying vec2 vUV;\nvoid main() {\nvUV = uvOffset + uv * uvScale;\nvec2 alignedPosition = position * scale;\nvec2 rotatedPosition;\nrotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;\nrotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;\nvec4 finalPosition;\nfinalPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );\nfinalPosition.xy += rotatedPosition;\nfinalPosition = projectionMatrix * finalPosition;\ngl_Position = finalPosition;\n}"].join("\n"));
                w.shaderSource(H, ["precision " + a.getPrecision() + " float;", "uniform vec3 color;\nuniform sampler2D map;\nuniform float opacity;\nuniform int fogType;\nuniform vec3 fogColor;\nuniform float fogDensity;\nuniform float fogNear;\nuniform float fogFar;\nuniform float alphaTest;\nvarying vec2 vUV;\nvoid main() {\nvec4 texture = texture2D( map, vUV );\nif ( texture.a < alphaTest ) discard;\ngl_FragColor = vec4( color * texture.xyz, texture.a * opacity );\nif ( fogType > 0 ) {\nfloat depth = gl_FragCoord.z / gl_FragCoord.w;\nfloat fogFactor = 0.0;\nif ( fogType == 1 ) {\nfogFactor = smoothstep( fogNear, fogFar, depth );\n} else {\nconst float LOG2 = 1.442695;\nfloat fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );\nfogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n}\ngl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n}\n}"].join("\n"));
                w.compileShader(R);
                w.compileShader(H);
                w.attachShader(F, R);
                w.attachShader(F, H);
                w.linkProgram(F);
                D = F;
                v = w.getAttribLocation(D, "position");
                y = w.getAttribLocation(D, "uv");
                c = w.getUniformLocation(D, "uvOffset");
                d = w.getUniformLocation(D, "uvScale");
                e = w.getUniformLocation(D, "rotation");
                f = w.getUniformLocation(D, "scale");
                g = w.getUniformLocation(D, "color");
                h = w.getUniformLocation(D, "map");
                k = w.getUniformLocation(D, "opacity");
                n = w.getUniformLocation(D, "modelViewMatrix");
                p = w.getUniformLocation(D, "projectionMatrix");
                q = w.getUniformLocation(D, "fogType");
                m = w.getUniformLocation(D, "fogDensity");
                r = w.getUniformLocation(D, "fogNear");
                t = w.getUniformLocation(D, "fogFar");
                s = w.getUniformLocation(D, "fogColor");
                u = w.getUniformLocation(D, "alphaTest");
                F = document.createElement("canvas");
                F.width = 8;
                F.height = 8;
                R = F.getContext("2d");
                R.fillStyle = "white";
                R.fillRect(0, 0, 8, 8);
                E = new THREE.Texture(F);
                E.needsUpdate = !0
            }
            w.useProgram(D);
            w.enableVertexAttribArray(v);
            w.enableVertexAttribArray(y);
            w.disable(w.CULL_FACE);
            w.enable(w.BLEND);
            w.bindBuffer(w.ARRAY_BUFFER, K);
            w.vertexAttribPointer(v, 2, w.FLOAT, !1, 16, 0);
            w.vertexAttribPointer(y, 2, w.FLOAT, !1, 16, 8);
            w.bindBuffer(w.ELEMENT_ARRAY_BUFFER, x);
            w.uniformMatrix4fv(p, !1, B.projectionMatrix.elements);
            w.activeTexture(w.TEXTURE0);
            w.uniform1i(h, 0);
            R = F = 0;
            (H = A.fog) ? (w.uniform3f(s, H.color.r, H.color.g, H.color.b), H instanceof THREE.Fog ? (w.uniform1f(r, H.near), w.uniform1f(t, H.far), w.uniform1i(q, 1), R = F = 1) : H instanceof THREE.FogExp2 && (w.uniform1f(m, H.density), w.uniform1i(q, 2), R = F = 2)) : (w.uniform1i(q, 0), R = F = 0);
            for (var H = 0, C = b.length; H < C; H++) {
                var T = b[H];
                T._modelViewMatrix.multiplyMatrices(B.matrixWorldInverse, T.matrixWorld);
                T.z = null === T.renderDepth ? -T._modelViewMatrix.elements[14] : T.renderDepth
            }
            b.sort(G);
            for (var Q = [], H = 0, C = b.length; H < C; H++) {
                var T = b[H],
                    O = T.material;
                w.uniform1f(u, O.alphaTest);
                w.uniformMatrix4fv(n, !1, T._modelViewMatrix.elements);
                Q[0] = T.scale.x;
                Q[1] = T.scale.y;
                T = 0;
                A.fog && O.fog && (T = R);
                F !== T && (w.uniform1i(q, T), F = T);
                null !== O.map ? (w.uniform2f(c, O.map.offset.x, O.map.offset.y), w.uniform2f(d, O.map.repeat.x, O.map.repeat.y)) : (w.uniform2f(c, 0, 0), w.uniform2f(d, 1, 1));
                w.uniform1f(k, O.opacity);
                w.uniform3f(g, O.color.r, O.color.g, O.color.b);
                w.uniform1f(e, O.rotation);
                w.uniform2fv(f, Q);
                a.setBlending(O.blending, O.blendEquation, O.blendSrc, O.blendDst);
                a.setDepthTest(O.depthTest);
                a.setDepthWrite(O.depthWrite);
                O.map && O.map.image && O.map.image.width ? a.setTexture(O.map, 0) : a.setTexture(E, 0);
                w.drawElements(w.TRIANGLES, 6, w.UNSIGNED_SHORT, 0)
            }
            w.enable(w.CULL_FACE);
            a.resetGLState()
        }
    }
};
THREE.GeometryUtils = {
    merge: function(a, b, c) {
        console.warn("THREE.GeometryUtils: .merge() has been moved to Geometry. Use geometry.merge( geometry2, matrix, materialIndexOffset ) instead.");
        var d;
        b instanceof THREE.Mesh && (b.matrixAutoUpdate && b.updateMatrix(), d = b.matrix, b = b.geometry);
        a.merge(b, d, c)
    },
    center: function(a) {
        console.warn("THREE.GeometryUtils: .center() has been moved to Geometry. Use geometry.center() instead.");
        return a.center()
    }
};
THREE.ImageUtils = {
    crossOrigin: void 0,
    loadTexture: function(a, b, c, d) {
        var e = new THREE.ImageLoader;
        e.crossOrigin = this.crossOrigin;
        var f = new THREE.Texture(void 0, b);
        e.load(a, function(a) {
            f.image = a;
            f.needsUpdate = !0;
            c && c(f)
        }, void 0, function(a) {
            d && d(a)
        });
        f.sourceFile = a;
        return f
    },
    loadTextureCube: function(a, b, c, d) {
        var e = new THREE.ImageLoader;
        e.crossOrigin = this.crossOrigin;
        var f = new THREE.CubeTexture([], b);
        f.flipY = !1;
        var g = 0;
        b = function(b) {
            e.load(a[b], function(a) {
                f.images[b] = a;
                g += 1;
                6 === g && (f.needsUpdate = !0, c && c(f))
            })
        };
        d = 0;
        for (var h = a.length; d < h; ++d) b(d);
        return f
    },
    loadCompressedTexture: function() {
        console.error("THREE.ImageUtils.loadCompressedTexture has been removed. Use THREE.DDSLoader instead.")
    },
    loadCompressedTextureCube: function() {
        console.error("THREE.ImageUtils.loadCompressedTextureCube has been removed. Use THREE.DDSLoader instead.")
    },
    getNormalMap: function(a, b) {
        var c = function(a) {
            var b = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
            return [a[0] / b, a[1] / b, a[2] / b]
        };
        b |= 1;
        var d = a.width,
            e = a.height,
            f = document.createElement("canvas");
        f.width = d;
        f.height = e;
        var g = f.getContext("2d");
        g.drawImage(a, 0, 0);
        for (var h = g.getImageData(0, 0, d, e).data, k = g.createImageData(d, e), n = k.data, p = 0; p < d; p++)
            for (var q = 0; q < e; q++) {
                var m = 0 > q - 1 ? 0 : q - 1,
                    r = q + 1 > e - 1 ? e - 1 : q + 1,
                    t = 0 > p - 1 ? 0 : p - 1,
                    s = p + 1 > d - 1 ? d - 1 : p + 1,
                    u = [],
                    v = [0, 0, h[4 * (q * d + p)] / 255 * b];
                u.push([-1, 0, h[4 * (q * d + t)] / 255 * b]);
                u.push([-1, -1, h[4 * (m * d + t)] / 255 * b]);
                u.push([0, -1, h[4 * (m * d + p)] / 255 * b]);
                u.push([1, -1, h[4 * (m * d + s)] / 255 * b]);
                u.push([1, 0, h[4 * (q * d + s)] / 255 * b]);
                u.push([1, 1, h[4 * (r * d + s)] / 255 * b]);
                u.push([0, 1, h[4 * (r * d + p)] / 255 * b]);
                u.push([-1, 1, h[4 * (r * d + t)] / 255 * b]);
                m = [];
                t = u.length;
                for (r = 0; r < t; r++) {
                    var s = u[r],
                        y = u[(r + 1) % t],
                        s = [s[0] - v[0], s[1] - v[1], s[2] - v[2]],
                        y = [y[0] - v[0], y[1] - v[1], y[2] - v[2]];
                    m.push(c([s[1] * y[2] - s[2] * y[1], s[2] * y[0] - s[0] * y[2], s[0] * y[1] - s[1] * y[0]]))
                }
                u = [0, 0, 0];
                for (r = 0; r < m.length; r++) u[0] += m[r][0], u[1] += m[r][1], u[2] += m[r][2];
                u[0] /= m.length;
                u[1] /= m.length;
                u[2] /= m.length;
                v = 4 * (q * d + p);
                n[v] = (u[0] + 1) / 2 * 255 | 0;
                n[v + 1] = (u[1] + 1) / 2 * 255 | 0;
                n[v + 2] = 255 * u[2] | 0;
                n[v + 3] = 255
            }
        g.putImageData(k, 0, 0);
        return f
    },
    generateDataTexture: function(a, b, c) {
        var d = a * b,
            e = new Uint8Array(3 * d),
            f = Math.floor(255 * c.r),
            g = Math.floor(255 * c.g);
        c = Math.floor(255 * c.b);
        for (var h = 0; h < d; h++) e[3 * h] = f, e[3 * h + 1] = g, e[3 * h + 2] = c;
        a = new THREE.DataTexture(e, a, b, THREE.RGBFormat);
        a.needsUpdate = !0;
        return a
    }
};
THREE.SceneUtils = {
    createMultiMaterialObject: function(a, b) {
        for (var c = new THREE.Object3D, d = 0, e = b.length; d < e; d++) c.add(new THREE.Mesh(a, b[d]));
        return c
    },
    detach: function(a, b, c) {
        a.applyMatrix(b.matrixWorld);
        b.remove(a);
        c.add(a)
    },
    attach: function(a, b, c) {
        var d = new THREE.Matrix4;
        d.getInverse(c.matrixWorld);
        a.applyMatrix(d);
        b.remove(a);
        c.add(a)
    }
};
THREE.FontUtils = {
    faces: {},
    face: "helvetiker",
    weight: "normal",
    style: "normal",
    size: 150,
    divisions: 10,
    getFace: function() {
        try {
            return this.faces[this.face][this.weight][this.style]
        } catch (a) {
            throw "The font " + this.face + " with " + this.weight + " weight and " + this.style + " style is missing."
        }
    },
    loadFace: function(a) {
        var b = a.familyName.toLowerCase();
        this.faces[b] = this.faces[b] || {};
        this.faces[b][a.cssFontWeight] = this.faces[b][a.cssFontWeight] || {};
        this.faces[b][a.cssFontWeight][a.cssFontStyle] = a;
        return this.faces[b][a.cssFontWeight][a.cssFontStyle] = a
    },
    drawText: function(a) {
        var b = this.getFace(),
            c = this.size / b.resolution,
            d = 0,
            e = String(a).split(""),
            f = e.length,
            g = [];
        for (a = 0; a < f; a++) {
            var h = new THREE.Path,
                h = this.extractGlyphPoints(e[a], b, c, d, h),
                d = d + h.offset;
            g.push(h.path)
        }
        return {
            paths: g,
            offset: d / 2
        }
    },
    extractGlyphPoints: function(a, b, c, d, e) {
        var f = [],
            g, h, k, n, p, q, m, r, t, s, u, v = b.glyphs[a] || b.glyphs["?"];
        if (v) {
            if (v.o)
                for (b = v._cachedOutline || (v._cachedOutline = v.o.split(" ")), n = b.length, a = 0; a < n;) switch (k = b[a++], k) {
                    case "m":
                        k = b[a++] * c + d;
                        p = b[a++] * c;
                        e.moveTo(k, p);
                        break;
                    case "l":
                        k = b[a++] * c + d;
                        p = b[a++] * c;
                        e.lineTo(k, p);
                        break;
                    case "q":
                        k = b[a++] * c + d;
                        p = b[a++] * c;
                        r = b[a++] * c + d;
                        t = b[a++] * c;
                        e.quadraticCurveTo(r, t, k, p);
                        if (g = f[f.length - 1])
                            for (q = g.x, m = g.y, g = 1, h = this.divisions; g <= h; g++) {
                                var y = g / h;
                                THREE.Shape.Utils.b2(y, q, r, k);
                                THREE.Shape.Utils.b2(y, m, t, p)
                            }
                        break;
                    case "b":
                        if (k = b[a++] * c + d, p = b[a++] * c, r = b[a++] * c + d, t = b[a++] * c, s = b[a++] * c + d, u = b[a++] * c, e.bezierCurveTo(r, t, s, u, k, p), g = f[f.length - 1])
                            for (q = g.x, m = g.y, g = 1, h = this.divisions; g <= h; g++) y = g / h, THREE.Shape.Utils.b3(y, q, r, s, k), THREE.Shape.Utils.b3(y, m, t, u, p)
                }
            return {
                offset: v.ha * c,
                path: e
            }
        }
    }
};
THREE.FontUtils.generateShapes = function(a, b) {
    b = b || {};
    var c = void 0 !== b.curveSegments ? b.curveSegments : 4,
        d = void 0 !== b.font ? b.font : "helvetiker",
        e = void 0 !== b.weight ? b.weight : "normal",
        f = void 0 !== b.style ? b.style : "normal";
    THREE.FontUtils.size = void 0 !== b.size ? b.size : 100;
    THREE.FontUtils.divisions = c;
    THREE.FontUtils.face = d;
    THREE.FontUtils.weight = e;
    THREE.FontUtils.style = f;
    c = THREE.FontUtils.drawText(a).paths;
    d = [];
    e = 0;
    for (f = c.length; e < f; e++) Array.prototype.push.apply(d, c[e].toShapes());
    return d
};
(function(a) {
    var b = function(a) {
        for (var b = a.length, e = 0, f = b - 1, g = 0; g < b; f = g++) e += a[f].x * a[g].y - a[g].x * a[f].y;
        return .5 * e
    };
    a.Triangulate = function(a, d) {
        var e = a.length;
        if (3 > e) return null;
        var f = [],
            g = [],
            h = [],
            k, n, p;
        if (0 < b(a))
            for (n = 0; n < e; n++) g[n] = n;
        else
            for (n = 0; n < e; n++) g[n] = e - 1 - n;
        var q = 2 * e;
        for (n = e - 1; 2 < e;) {
            if (0 >= q--) {
                console.log("Warning, unable to triangulate polygon!");
                break
            }
            k = n;
            e <= k && (k = 0);
            n = k + 1;
            e <= n && (n = 0);
            p = n + 1;
            e <= p && (p = 0);
            var m;
            a: {
                var r = m = void 0,
                    t = void 0,
                    s = void 0,
                    u = void 0,
                    v = void 0,
                    y = void 0,
                    G = void 0,
                    w = void 0,
                    r = a[g[k]].x,
                    t = a[g[k]].y,
                    s = a[g[n]].x,
                    u = a[g[n]].y,
                    v = a[g[p]].x,
                    y = a[g[p]].y;
                if (1e-10 > (s - r) * (y - t) - (u - t) * (v - r)) m = !1;
                else {
                    var K = void 0,
                        x = void 0,
                        D = void 0,
                        E = void 0,
                        A = void 0,
                        B = void 0,
                        F = void 0,
                        R = void 0,
                        H = void 0,
                        C = void 0,
                        H = R = F = w = G = void 0,
                        K = v - s,
                        x = y - u,
                        D = r - v,
                        E = t - y,
                        A = s - r,
                        B = u - t;
                    for (m = 0; m < e; m++)
                        if (G = a[g[m]].x, w = a[g[m]].y, !(G === r && w === t || G === s && w === u || G === v && w === y) && (F = G - r, R = w - t, H = G - s, C = w - u, G -= v, w -= y, H = K * C - x * H, F = A * R - B * F, R = D * w - E * G, -1e-10 <= H && -1e-10 <= R && -1e-10 <= F)) {
                            m = !1;
                            break a
                        }
                    m = !0
                }
            }
            if (m) {
                f.push([a[g[k]], a[g[n]], a[g[p]]]);
                h.push([g[k], g[n], g[p]]);
                k = n;
                for (p = n + 1; p < e; k++, p++) g[k] = g[p];
                e--;
                q = 2 * e
            }
        }
        return d ? h : f
    };
    a.Triangulate.area = b;
    return a
})(THREE.FontUtils);
self._typeface_js = {
    faces: THREE.FontUtils.faces,
    loadFace: THREE.FontUtils.loadFace
};
THREE.typeface_js = self._typeface_js;
THREE.Audio = function(a) {
    THREE.Object3D.call(this);
    this.type = "Audio";
    this.context = a.context;
    this.source = this.context.createBufferSource();
    this.gain = this.context.createGain();
    this.gain.connect(this.context.destination);
    this.panner = this.context.createPanner();
    this.panner.connect(this.gain)
};
THREE.Audio.prototype = Object.create(THREE.Object3D.prototype);
THREE.Audio.prototype.load = function(a) {
    var b = this,
        c = new XMLHttpRequest;
    c.open("GET", a, !0);
    c.responseType = "arraybuffer";
    c.onload = function(a) {
        b.context.decodeAudioData(this.response, function(a) {
            b.source.buffer = a;
            b.source.connect(b.panner);
            b.source.start(0)
        })
    };
    c.send();
    return this
};
THREE.Audio.prototype.setLoop = function(a) {
    this.source.loop = a
};
THREE.Audio.prototype.setRefDistance = function(a) {
    this.panner.refDistance = a
};
THREE.Audio.prototype.setRolloffFactor = function(a) {
    this.panner.rolloffFactor = a
};
THREE.Audio.prototype.updateMatrixWorld = function() {
    var a = new THREE.Vector3;
    return function(b) {
        THREE.Object3D.prototype.updateMatrixWorld.call(this, b);
        a.setFromMatrixPosition(this.matrixWorld);
        this.panner.setPosition(a.x, a.y, a.z)
    }
}();
THREE.AudioListener = function() {
    THREE.Object3D.call(this);
    this.type = "AudioListener";
    this.context = new(window.AudioContext || window.webkitAudioContext)
};
THREE.AudioListener.prototype = Object.create(THREE.Object3D.prototype);
THREE.AudioListener.prototype.updateMatrixWorld = function() {
    var a = new THREE.Vector3,
        b = new THREE.Quaternion,
        c = new THREE.Vector3,
        d = new THREE.Vector3,
        e = new THREE.Vector3,
        f = new THREE.Vector3;
    return function(g) {
        THREE.Object3D.prototype.updateMatrixWorld.call(this, g);
        g = this.context.listener;
        this.matrixWorld.decompose(a, b, c);
        d.set(0, 0, -1).applyQuaternion(b);
        e.subVectors(a, f);
        g.setPosition(a.x, a.y, a.z);
        g.setOrientation(d.x, d.y, d.z, this.up.x, this.up.y, this.up.z);
        g.setVelocity(e.x, e.y, e.z);
        f.copy(a)
    }
}();
THREE.Curve = function() {};
THREE.Curve.prototype.getPoint = function(a) {
    console.log("Warning, getPoint() not implemented!");
    return null
};
THREE.Curve.prototype.getPointAt = function(a) {
    a = this.getUtoTmapping(a);
    return this.getPoint(a)
};
THREE.Curve.prototype.getPoints = function(a) {
    a || (a = 5);
    var b, c = [];
    for (b = 0; b <= a; b++) c.push(this.getPoint(b / a));
    return c
};
THREE.Curve.prototype.getSpacedPoints = function(a) {
    a || (a = 5);
    var b, c = [];
    for (b = 0; b <= a; b++) c.push(this.getPointAt(b / a));
    return c
};
THREE.Curve.prototype.getLength = function() {
    var a = this.getLengths();
    return a[a.length - 1]
};
THREE.Curve.prototype.getLengths = function(a) {
    a || (a = this.__arcLengthDivisions ? this.__arcLengthDivisions : 200);
    if (this.cacheArcLengths && this.cacheArcLengths.length == a + 1 && !this.needsUpdate) return this.cacheArcLengths;
    this.needsUpdate = !1;
    var b = [],
        c, d = this.getPoint(0),
        e, f = 0;
    b.push(0);
    for (e = 1; e <= a; e++) c = this.getPoint(e / a), f += c.distanceTo(d), b.push(f), d = c;
    return this.cacheArcLengths = b
};
THREE.Curve.prototype.updateArcLengths = function() {
    this.needsUpdate = !0;
    this.getLengths()
};
THREE.Curve.prototype.getUtoTmapping = function(a, b) {
    var c = this.getLengths(),
        d = 0,
        e = c.length,
        f;
    f = b ? b : a * c[e - 1];
    for (var g = 0, h = e - 1, k; g <= h;)
        if (d = Math.floor(g + (h - g) / 2), k = c[d] - f, 0 > k) g = d + 1;
        else if (0 < k) h = d - 1;
    else {
        h = d;
        break
    }
    d = h;
    if (c[d] == f) return d / (e - 1);
    g = c[d];
    return c = (d + (f - g) / (c[d + 1] - g)) / (e - 1)
};
THREE.Curve.prototype.getTangent = function(a) {
    var b = a - 1e-4;
    a += 1e-4;
    0 > b && (b = 0);
    1 < a && (a = 1);
    b = this.getPoint(b);
    return this.getPoint(a).clone().sub(b).normalize()
};
THREE.Curve.prototype.getTangentAt = function(a) {
    a = this.getUtoTmapping(a);
    return this.getTangent(a)
};
THREE.Curve.Utils = {
    tangentQuadraticBezier: function(a, b, c, d) {
        return 2 * (1 - a) * (c - b) + 2 * a * (d - c)
    },
    tangentCubicBezier: function(a, b, c, d, e) {
        return -3 * b * (1 - a) * (1 - a) + 3 * c * (1 - a) * (1 - a) - 6 * a * c * (1 - a) + 6 * a * d * (1 - a) - 3 * a * a * d + 3 * a * a * e
    },
    tangentSpline: function(a, b, c, d, e) {
        return 6 * a * a - 6 * a + (3 * a * a - 4 * a + 1) + (-6 * a * a + 6 * a) + (3 * a * a - 2 * a)
    },
    interpolate: function(a, b, c, d, e) {
        a = .5 * (c - a);
        d = .5 * (d - b);
        var f = e * e;
        return (2 * b - 2 * c + a + d) * e * f + (-3 * b + 3 * c - 2 * a - d) * f + a * e + b
    }
};
THREE.Curve.create = function(a, b) {
    a.prototype = Object.create(THREE.Curve.prototype);
    a.prototype.getPoint = b;
    return a
};
THREE.CurvePath = function() {
    this.curves = [];
    this.bends = [];
    this.autoClose = !1
};
THREE.CurvePath.prototype = Object.create(THREE.Curve.prototype);
THREE.CurvePath.prototype.add = function(a) {
    this.curves.push(a)
};
THREE.CurvePath.prototype.checkConnection = function() {};
THREE.CurvePath.prototype.closePath = function() {
    var a = this.curves[0].getPoint(0),
        b = this.curves[this.curves.length - 1].getPoint(1);
    a.equals(b) || this.curves.push(new THREE.LineCurve(b, a))
};
THREE.CurvePath.prototype.getPoint = function(a) {
    var b = a * this.getLength(),
        c = this.getCurveLengths();
    for (a = 0; a < c.length;) {
        if (c[a] >= b) return b = c[a] - b, a = this.curves[a], b = 1 - b / a.getLength(), a.getPointAt(b);
        a++
    }
    return null
};
THREE.CurvePath.prototype.getLength = function() {
    var a = this.getCurveLengths();
    return a[a.length - 1]
};
THREE.CurvePath.prototype.getCurveLengths = function() {
    if (this.cacheLengths && this.cacheLengths.length == this.curves.length) return this.cacheLengths;
    var a = [],
        b = 0,
        c, d = this.curves.length;
    for (c = 0; c < d; c++) b += this.curves[c].getLength(), a.push(b);
    return this.cacheLengths = a
};
THREE.CurvePath.prototype.getBoundingBox = function() {
    var a = this.getPoints(),
        b, c, d, e, f, g;
    b = c = Number.NEGATIVE_INFINITY;
    e = f = Number.POSITIVE_INFINITY;
    var h, k, n, p, q = a[0] instanceof THREE.Vector3;
    p = q ? new THREE.Vector3 : new THREE.Vector2;
    k = 0;
    for (n = a.length; k < n; k++) h = a[k], h.x > b ? b = h.x : h.x < e && (e = h.x), h.y > c ? c = h.y : h.y < f && (f = h.y), q && (h.z > d ? d = h.z : h.z < g && (g = h.z)), p.add(h);
    a = {
        minX: e,
        minY: f,
        maxX: b,
        maxY: c
    };
    q && (a.maxZ = d, a.minZ = g);
    return a
};
THREE.CurvePath.prototype.createPointsGeometry = function(a) {
    a = this.getPoints(a, !0);
    return this.createGeometry(a)
};
THREE.CurvePath.prototype.createSpacedPointsGeometry = function(a) {
    a = this.getSpacedPoints(a, !0);
    return this.createGeometry(a)
};
THREE.CurvePath.prototype.createGeometry = function(a) {
    for (var b = new THREE.Geometry, c = 0; c < a.length; c++) b.vertices.push(new THREE.Vector3(a[c].x, a[c].y, a[c].z || 0));
    return b
};
THREE.CurvePath.prototype.addWrapPath = function(a) {
    this.bends.push(a)
};
THREE.CurvePath.prototype.getTransformedPoints = function(a, b) {
    var c = this.getPoints(a),
        d, e;
    b || (b = this.bends);
    d = 0;
    for (e = b.length; d < e; d++) c = this.getWrapPoints(c, b[d]);
    return c
};
THREE.CurvePath.prototype.getTransformedSpacedPoints = function(a, b) {
    var c = this.getSpacedPoints(a),
        d, e;
    b || (b = this.bends);
    d = 0;
    for (e = b.length; d < e; d++) c = this.getWrapPoints(c, b[d]);
    return c
};
THREE.CurvePath.prototype.getWrapPoints = function(a, b) {
    var c = this.getBoundingBox(),
        d, e, f, g, h, k;
    d = 0;
    for (e = a.length; d < e; d++) f = a[d], g = f.x, h = f.y, k = g / c.maxX, k = b.getUtoTmapping(k, g), g = b.getPoint(k), k = b.getTangent(k), k.set(-k.y, k.x).multiplyScalar(h), f.x = g.x + k.x, f.y = g.y + k.y;
    return a
};
THREE.Gyroscope = function() {
    THREE.Object3D.call(this)
};
THREE.Gyroscope.prototype = Object.create(THREE.Object3D.prototype);
THREE.Gyroscope.prototype.updateMatrixWorld = function() {
    var a = new THREE.Vector3,
        b = new THREE.Quaternion,
        c = new THREE.Vector3,
        d = new THREE.Vector3,
        e = new THREE.Quaternion,
        f = new THREE.Vector3;
    return function(g) {
        this.matrixAutoUpdate && this.updateMatrix();
        if (this.matrixWorldNeedsUpdate || g) this.parent ? (this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix), this.matrixWorld.decompose(d, e, f), this.matrix.decompose(a, b, c), this.matrixWorld.compose(d, b, f)) : this.matrixWorld.copy(this.matrix), this.matrixWorldNeedsUpdate = !1, g = !0;
        for (var h = 0, k = this.children.length; h < k; h++) this.children[h].updateMatrixWorld(g)
    }
}();
THREE.Path = function(a) {
    THREE.CurvePath.call(this);
    this.actions = [];
    a && this.fromPoints(a)
};
THREE.Path.prototype = Object.create(THREE.CurvePath.prototype);
THREE.PathActions = {
    MOVE_TO: "moveTo",
    LINE_TO: "lineTo",
    QUADRATIC_CURVE_TO: "quadraticCurveTo",
    BEZIER_CURVE_TO: "bezierCurveTo",
    CSPLINE_THRU: "splineThru",
    ARC: "arc",
    ELLIPSE: "ellipse"
};
THREE.Path.prototype.fromPoints = function(a) {
    this.moveTo(a[0].x, a[0].y);
    for (var b = 1, c = a.length; b < c; b++) this.lineTo(a[b].x, a[b].y)
};
THREE.Path.prototype.moveTo = function(a, b) {
    var c = Array.prototype.slice.call(arguments);
    this.actions.push({
        action: THREE.PathActions.MOVE_TO,
        args: c
    })
};
THREE.Path.prototype.lineTo = function(a, b) {
    var c = Array.prototype.slice.call(arguments),
        d = this.actions[this.actions.length - 1].args,
        d = new THREE.LineCurve(new THREE.Vector2(d[d.length - 2], d[d.length - 1]), new THREE.Vector2(a, b));
    this.curves.push(d);
    this.actions.push({
        action: THREE.PathActions.LINE_TO,
        args: c
    })
};
THREE.Path.prototype.quadraticCurveTo = function(a, b, c, d) {
    var e = Array.prototype.slice.call(arguments),
        f = this.actions[this.actions.length - 1].args,
        f = new THREE.QuadraticBezierCurve(new THREE.Vector2(f[f.length - 2], f[f.length - 1]), new THREE.Vector2(a, b), new THREE.Vector2(c, d));
    this.curves.push(f);
    this.actions.push({
        action: THREE.PathActions.QUADRATIC_CURVE_TO,
        args: e
    })
};
THREE.Path.prototype.bezierCurveTo = function(a, b, c, d, e, f) {
    var g = Array.prototype.slice.call(arguments),
        h = this.actions[this.actions.length - 1].args,
        h = new THREE.CubicBezierCurve(new THREE.Vector2(h[h.length - 2], h[h.length - 1]), new THREE.Vector2(a, b), new THREE.Vector2(c, d), new THREE.Vector2(e, f));
    this.curves.push(h);
    this.actions.push({
        action: THREE.PathActions.BEZIER_CURVE_TO,
        args: g
    })
};
THREE.Path.prototype.splineThru = function(a) {
    var b = Array.prototype.slice.call(arguments),
        c = this.actions[this.actions.length - 1].args,
        c = [new THREE.Vector2(c[c.length - 2], c[c.length - 1])];
    Array.prototype.push.apply(c, a);
    c = new THREE.SplineCurve(c);
    this.curves.push(c);
    this.actions.push({
        action: THREE.PathActions.CSPLINE_THRU,
        args: b
    })
};
THREE.Path.prototype.arc = function(a, b, c, d, e, f) {
    var g = this.actions[this.actions.length - 1].args;
    this.absarc(a + g[g.length - 2], b + g[g.length - 1], c, d, e, f)
};
THREE.Path.prototype.absarc = function(a, b, c, d, e, f) {
    this.absellipse(a, b, c, c, d, e, f)
};
THREE.Path.prototype.ellipse = function(a, b, c, d, e, f, g) {
    var h = this.actions[this.actions.length - 1].args;
    this.absellipse(a + h[h.length - 2], b + h[h.length - 1], c, d, e, f, g)
};
THREE.Path.prototype.absellipse = function(a, b, c, d, e, f, g) {
    var h = Array.prototype.slice.call(arguments),
        k = new THREE.EllipseCurve(a, b, c, d, e, f, g);
    this.curves.push(k);
    k = k.getPoint(1);
    h.push(k.x);
    h.push(k.y);
    this.actions.push({
        action: THREE.PathActions.ELLIPSE,
        args: h
    })
};
THREE.Path.prototype.getSpacedPoints = function(a, b) {
    a || (a = 40);
    for (var c = [], d = 0; d < a; d++) c.push(this.getPoint(d / a));
    return c
};
THREE.Path.prototype.getPoints = function(a, b) {
    if (this.useSpacedPoints) return console.log("tata"), this.getSpacedPoints(a, b);
    a = a || 12;
    var c = [],
        d, e, f, g, h, k, n, p, q, m, r, t, s;
    d = 0;
    for (e = this.actions.length; d < e; d++) switch (f = this.actions[d], g = f.action, f = f.args, g) {
        case THREE.PathActions.MOVE_TO:
            c.push(new THREE.Vector2(f[0], f[1]));
            break;
        case THREE.PathActions.LINE_TO:
            c.push(new THREE.Vector2(f[0], f[1]));
            break;
        case THREE.PathActions.QUADRATIC_CURVE_TO:
            h = f[2];
            k = f[3];
            q = f[0];
            m = f[1];
            0 < c.length ? (g = c[c.length - 1], r = g.x, t = g.y) : (g = this.actions[d - 1].args, r = g[g.length - 2], t = g[g.length - 1]);
            for (f = 1; f <= a; f++) s = f / a, g = THREE.Shape.Utils.b2(s, r, q, h), s = THREE.Shape.Utils.b2(s, t, m, k), c.push(new THREE.Vector2(g, s));
            break;
        case THREE.PathActions.BEZIER_CURVE_TO:
            h = f[4];
            k = f[5];
            q = f[0];
            m = f[1];
            n = f[2];
            p = f[3];
            0 < c.length ? (g = c[c.length - 1], r = g.x, t = g.y) : (g = this.actions[d - 1].args, r = g[g.length - 2], t = g[g.length - 1]);
            for (f = 1; f <= a; f++) s = f / a, g = THREE.Shape.Utils.b3(s, r, q, n, h), s = THREE.Shape.Utils.b3(s, t, m, p, k), c.push(new THREE.Vector2(g, s));
            break;
        case THREE.PathActions.CSPLINE_THRU:
            g = this.actions[d - 1].args;
            s = [new THREE.Vector2(g[g.length - 2], g[g.length - 1])];
            g = a * f[0].length;
            s = s.concat(f[0]);
            s = new THREE.SplineCurve(s);
            for (f = 1; f <= g; f++) c.push(s.getPointAt(f / g));
            break;
        case THREE.PathActions.ARC:
            h = f[0];
            k = f[1];
            m = f[2];
            n = f[3];
            g = f[4];
            q = !!f[5];
            r = g - n;
            t = 2 * a;
            for (f = 1; f <= t; f++) s = f / t, q || (s = 1 - s), s = n + s * r, g = h + m * Math.cos(s), s = k + m * Math.sin(s), c.push(new THREE.Vector2(g, s));
            break;
        case THREE.PathActions.ELLIPSE:
            for (h = f[0], k = f[1], m = f[2], p = f[3], n = f[4], g = f[5], q = !!f[6], r = g - n, t = 2 * a, f = 1; f <= t; f++) s = f / t, q || (s = 1 - s), s = n + s * r, g = h + m * Math.cos(s), s = k + p * Math.sin(s), c.push(new THREE.Vector2(g, s))
    }
    d = c[c.length - 1];
    1e-10 > Math.abs(d.x - c[0].x) && 1e-10 > Math.abs(d.y - c[0].y) && c.splice(c.length - 1, 1);
    b && c.push(c[0]);
    return c
};
THREE.Path.prototype.toShapes = function(a, b) {
    function c(a) {
        for (var b = [], c = 0, d = a.length; c < d; c++) {
            var e = a[c],
                f = new THREE.Shape;
            f.actions = e.actions;
            f.curves = e.curves;
            b.push(f)
        }
        return b
    }

    function d(a, b) {
        for (var c = b.length, d = !1, e = c - 1, f = 0; f < c; e = f++) {
            var g = b[e],
                h = b[f],
                k = h.x - g.x,
                m = h.y - g.y;
            if (1e-10 < Math.abs(m)) {
                if (0 > m && (g = b[f], k = -k, h = b[e], m = -m), !(a.y < g.y || a.y > h.y))
                    if (a.y == g.y) {
                        if (a.x == g.x) return !0
                    } else {
                        e = m * (a.x - g.x) - k * (a.y - g.y);
                        if (0 == e) return !0;
                        0 > e || (d = !d)
                    }
            } else if (a.y == g.y && (h.x <= a.x && a.x <= g.x || g.x <= a.x && a.x <= h.x)) return !0
        }
        return d
    }
    var e = function(a) {
        var b, c, d, e, f = [],
            g = new THREE.Path;
        b = 0;
        for (c = a.length; b < c; b++) d = a[b], e = d.args, d = d.action, d == THREE.PathActions.MOVE_TO && 0 != g.actions.length && (f.push(g), g = new THREE.Path), g[d].apply(g, e);
        0 != g.actions.length && f.push(g);
        return f
    }(this.actions);
    if (0 == e.length) return [];
    if (!0 === b) return c(e);
    var f, g, h, k = [];
    if (1 == e.length) return g = e[0], h = new THREE.Shape, h.actions = g.actions, h.curves = g.curves, k.push(h), k;
    var n = !THREE.Shape.Utils.isClockWise(e[0].getPoints()),
        n = a ? !n : n;
    h = [];
    var p = [],
        q = [],
        m = 0,
        r;
    p[m] = void 0;
    q[m] = [];
    var t, s;
    t = 0;
    for (s = e.length; t < s; t++) g = e[t], r = g.getPoints(), f = THREE.Shape.Utils.isClockWise(r), (f = a ? !f : f) ? (!n && p[m] && m++, p[m] = {
        s: new THREE.Shape,
        p: r
    }, p[m].s.actions = g.actions, p[m].s.curves = g.curves, n && m++, q[m] = []) : q[m].push({
        h: g,
        p: r[0]
    });
    if (!p[0]) return c(e);
    if (1 < p.length) {
        t = !1;
        s = [];
        g = 0;
        for (e = p.length; g < e; g++) h[g] = [];
        g = 0;
        for (e = p.length; g < e; g++)
            for (f = q[g], n = 0; n < f.length; n++) {
                m = f[n];
                r = !0;
                for (var u = 0; u < p.length; u++) d(m.p, p[u].p) && (g != u && s.push({
                    froms: g,
                    tos: u,
                    hole: n
                }), r ? (r = !1, h[u].push(m)) : t = !0);
                r && h[g].push(m)
            }
        0 < s.length && (t || (q = h))
    }
    t = 0;
    for (s = p.length; t < s; t++)
        for (h = p[t].s, k.push(h), g = q[t], e = 0, f = g.length; e < f; e++) h.holes.push(g[e].h);
    return k
};
THREE.Shape = function() {
    THREE.Path.apply(this, arguments);
    this.holes = []
};
THREE.Shape.prototype = Object.create(THREE.Path.prototype);
THREE.Shape.prototype.extrude = function(a) {
    return new THREE.ExtrudeGeometry(this, a)
};
THREE.Shape.prototype.makeGeometry = function(a) {
    return new THREE.ShapeGeometry(this, a)
};
THREE.Shape.prototype.getPointsHoles = function(a) {
    var b, c = this.holes.length,
        d = [];
    for (b = 0; b < c; b++) d[b] = this.holes[b].getTransformedPoints(a, this.bends);
    return d
};
THREE.Shape.prototype.getSpacedPointsHoles = function(a) {
    var b, c = this.holes.length,
        d = [];
    for (b = 0; b < c; b++) d[b] = this.holes[b].getTransformedSpacedPoints(a, this.bends);
    return d
};
THREE.Shape.prototype.extractAllPoints = function(a) {
    return {
        shape: this.getTransformedPoints(a),
        holes: this.getPointsHoles(a)
    }
};
THREE.Shape.prototype.extractPoints = function(a) {
    return this.useSpacedPoints ? this.extractAllSpacedPoints(a) : this.extractAllPoints(a)
};
THREE.Shape.prototype.extractAllSpacedPoints = function(a) {
    return {
        shape: this.getTransformedSpacedPoints(a),
        holes: this.getSpacedPointsHoles(a)
    }
};
THREE.Shape.Utils = {
    triangulateShape: function(a, b) {
        function c(a, b, c) {
            return a.x != b.x ? a.x < b.x ? a.x <= c.x && c.x <= b.x : b.x <= c.x && c.x <= a.x : a.y < b.y ? a.y <= c.y && c.y <= b.y : b.y <= c.y && c.y <= a.y
        }

        function d(a, b, d, e, f) {
            var g = b.x - a.x,
                h = b.y - a.y,
                k = e.x - d.x,
                n = e.y - d.y,
                p = a.x - d.x,
                q = a.y - d.y,
                D = h * k - g * n,
                E = h * p - g * q;
            if (1e-10 < Math.abs(D)) {
                if (0 < D) {
                    if (0 > E || E > D) return [];
                    k = n * p - k * q;
                    if (0 > k || k > D) return []
                } else {
                    if (0 < E || E < D) return [];
                    k = n * p - k * q;
                    if (0 < k || k < D) return []
                }
                if (0 == k) return !f || 0 != E && E != D ? [a] : [];
                if (k == D) return !f || 0 != E && E != D ? [b] : [];
                if (0 == E) return [d];
                if (E == D) return [e];
                f = k / D;
                return [{
                    x: a.x + f * g,
                    y: a.y + f * h
                }]
            }
            if (0 != E || n * p != k * q) return [];
            h = 0 == g && 0 == h;
            k = 0 == k && 0 == n;
            if (h && k) return a.x != d.x || a.y != d.y ? [] : [a];
            if (h) return c(d, e, a) ? [a] : [];
            if (k) return c(a, b, d) ? [d] : [];
            0 != g ? (a.x < b.x ? (g = a, k = a.x, h = b, a = b.x) : (g = b, k = b.x, h = a, a = a.x), d.x < e.x ? (b = d, D = d.x, n = e, d = e.x) : (b = e, D = e.x, n = d, d = d.x)) : (a.y < b.y ? (g = a, k = a.y, h = b, a = b.y) : (g = b, k = b.y, h = a, a = a.y), d.y < e.y ? (b = d, D = d.y, n = e, d = e.y) : (b = e, D = e.y, n = d, d = d.y));
            return k <= D ? a < D ? [] : a == D ? f ? [] : [b] : a <= d ? [b, h] : [b, n] : k > d ? [] : k == d ? f ? [] : [g] : a <= d ? [g, h] : [g, n]
        }

        function e(a, b, c, d) {
            var e = b.x - a.x,
                f = b.y - a.y;
            b = c.x - a.x;
            c = c.y - a.y;
            var g = d.x - a.x;
            d = d.y - a.y;
            a = e * c - f * b;
            e = e * d - f * g;
            return 1e-10 < Math.abs(a) ? (b = g * c - d * b, 0 < a ? 0 <= e && 0 <= b : 0 <= e || 0 <= b) : 0 < e
        }
        var f, g, h, k, n, p = {};
        h = a.concat();
        f = 0;
        for (g = b.length; f < g; f++) Array.prototype.push.apply(h, b[f]);
        f = 0;
        for (g = h.length; f < g; f++) n = h[f].x + ":" + h[f].y, void 0 !== p[n] && console.log("Duplicate point", n), p[n] = f;
        f = function(a, b) {
            function c(a, b) {
                var d = h.length - 1,
                    f = a - 1;
                0 > f && (f = d);
                var g = a + 1;
                g > d && (g = 0);
                d = e(h[a], h[f], h[g], k[b]);
                if (!d) return !1;
                d = k.length - 1;
                f = b - 1;
                0 > f && (f = d);
                g = b + 1;
                g > d && (g = 0);
                return (d = e(k[b], k[f], k[g], h[a])) ? !0 : !1
            }

            function f(a, b) {
                var c, e;
                for (c = 0; c < h.length; c++)
                    if (e = c + 1, e %= h.length, e = d(a, b, h[c], h[e], !0), 0 < e.length) return !0;
                return !1
            }

            function g(a, c) {
                var e, f, h, k;
                for (e = 0; e < n.length; e++)
                    for (f = b[n[e]], h = 0; h < f.length; h++)
                        if (k = h + 1, k %= f.length, k = d(a, c, f[h], f[k], !0), 0 < k.length) return !0;
                return !1
            }
            var h = a.concat(),
                k, n = [],
                p, q, x, D, E, A = [],
                B, F, R, H = 0;
            for (p = b.length; H < p; H++) n.push(H);
            B = 0;
            for (var C = 2 * n.length; 0 < n.length;) {
                C--;
                if (0 > C) {
                    console.log("Infinite Loop! Holes left:" + n.length + ", Probably Hole outside Shape!");
                    break
                }
                for (q = B; q < h.length; q++) {
                    x = h[q];
                    p = -1;
                    for (H = 0; H < n.length; H++)
                        if (D = n[H], E = x.x + ":" + x.y + ":" + D, void 0 === A[E]) {
                            k = b[D];
                            for (F = 0; F < k.length; F++)
                                if (D = k[F], c(q, F) && !f(x, D) && !g(x, D)) {
                                    p = F;
                                    n.splice(H, 1);
                                    B = h.slice(0, q + 1);
                                    D = h.slice(q);
                                    F = k.slice(p);
                                    R = k.slice(0, p + 1);
                                    h = B.concat(F).concat(R).concat(D);
                                    B = q;
                                    break
                                }
                            if (0 <= p) break;
                            A[E] = !0
                        }
                    if (0 <= p) break
                }
            }
            return h
        }(a, b);
        var q = THREE.FontUtils.Triangulate(f, !1);
        f = 0;
        for (g = q.length; f < g; f++)
            for (k = q[f], h = 0; 3 > h; h++) n = k[h].x + ":" + k[h].y, n = p[n], void 0 !== n && (k[h] = n);
        return q.concat()
    },
    isClockWise: function(a) {
        return 0 > THREE.FontUtils.Triangulate.area(a)
    },
    b2p0: function(a, b) {
        var c = 1 - a;
        return c * c * b
    },
    b2p1: function(a, b) {
        return 2 * (1 - a) * a * b
    },
    b2p2: function(a, b) {
        return a * a * b
    },
    b2: function(a, b, c, d) {
        return this.b2p0(a, b) + this.b2p1(a, c) + this.b2p2(a, d)
    },
    b3p0: function(a, b) {
        var c = 1 - a;
        return c * c * c * b
    },
    b3p1: function(a, b) {
        var c = 1 - a;
        return 3 * c * c * a * b
    },
    b3p2: function(a, b) {
        return 3 * (1 - a) * a * a * b
    },
    b3p3: function(a, b) {
        return a * a * a * b
    },
    b3: function(a, b, c, d, e) {
        return this.b3p0(a, b) + this.b3p1(a, c) + this.b3p2(a, d) + this.b3p3(a, e)
    }
};
THREE.LineCurve = function(a, b) {
    this.v1 = a;
    this.v2 = b
};
THREE.LineCurve.prototype = Object.create(THREE.Curve.prototype);
THREE.LineCurve.prototype.getPoint = function(a) {
    var b = this.v2.clone().sub(this.v1);
    b.multiplyScalar(a).add(this.v1);
    return b
};
THREE.LineCurve.prototype.getPointAt = function(a) {
    return this.getPoint(a)
};
THREE.LineCurve.prototype.getTangent = function(a) {
    return this.v2.clone().sub(this.v1).normalize()
};
THREE.QuadraticBezierCurve = function(a, b, c) {
    this.v0 = a;
    this.v1 = b;
    this.v2 = c
};
THREE.QuadraticBezierCurve.prototype = Object.create(THREE.Curve.prototype);
THREE.QuadraticBezierCurve.prototype.getPoint = function(a) {
    var b = new THREE.Vector2;
    b.x = THREE.Shape.Utils.b2(a, this.v0.x, this.v1.x, this.v2.x);
    b.y = THREE.Shape.Utils.b2(a, this.v0.y, this.v1.y, this.v2.y);
    return b
};
THREE.QuadraticBezierCurve.prototype.getTangent = function(a) {
    var b = new THREE.Vector2;
    b.x = THREE.Curve.Utils.tangentQuadraticBezier(a, this.v0.x, this.v1.x, this.v2.x);
    b.y = THREE.Curve.Utils.tangentQuadraticBezier(a, this.v0.y, this.v1.y, this.v2.y);
    return b.normalize()
};
THREE.CubicBezierCurve = function(a, b, c, d) {
    this.v0 = a;
    this.v1 = b;
    this.v2 = c;
    this.v3 = d
};
THREE.CubicBezierCurve.prototype = Object.create(THREE.Curve.prototype);
THREE.CubicBezierCurve.prototype.getPoint = function(a) {
    var b;
    b = THREE.Shape.Utils.b3(a, this.v0.x, this.v1.x, this.v2.x, this.v3.x);
    a = THREE.Shape.Utils.b3(a, this.v0.y, this.v1.y, this.v2.y, this.v3.y);
    return new THREE.Vector2(b, a)
};
THREE.CubicBezierCurve.prototype.getTangent = function(a) {
    var b;
    b = THREE.Curve.Utils.tangentCubicBezier(a, this.v0.x, this.v1.x, this.v2.x, this.v3.x);
    a = THREE.Curve.Utils.tangentCubicBezier(a, this.v0.y, this.v1.y, this.v2.y, this.v3.y);
    b = new THREE.Vector2(b, a);
    b.normalize();
    return b
};
THREE.SplineCurve = function(a) {
    this.points = void 0 == a ? [] : a
};
THREE.SplineCurve.prototype = Object.create(THREE.Curve.prototype);
THREE.SplineCurve.prototype.getPoint = function(a) {
    var b = this.points;
    a *= b.length - 1;
    var c = Math.floor(a);
    a -= c;
    var d = b[0 == c ? c : c - 1],
        e = b[c],
        f = b[c > b.length - 2 ? b.length - 1 : c + 1],
        b = b[c > b.length - 3 ? b.length - 1 : c + 2],
        c = new THREE.Vector2;
    c.x = THREE.Curve.Utils.interpolate(d.x, e.x, f.x, b.x, a);
    c.y = THREE.Curve.Utils.interpolate(d.y, e.y, f.y, b.y, a);
    return c
};
THREE.EllipseCurve = function(a, b, c, d, e, f, g) {
    this.aX = a;
    this.aY = b;
    this.xRadius = c;
    this.yRadius = d;
    this.aStartAngle = e;
    this.aEndAngle = f;
    this.aClockwise = g
};
THREE.EllipseCurve.prototype = Object.create(THREE.Curve.prototype);
THREE.EllipseCurve.prototype.getPoint = function(a) {
    var b = this.aEndAngle - this.aStartAngle;
    0 > b && (b += 2 * Math.PI);
    b > 2 * Math.PI && (b -= 2 * Math.PI);
    a = !0 === this.aClockwise ? this.aEndAngle + (1 - a) * (2 * Math.PI - b) : this.aStartAngle + a * b;
    b = new THREE.Vector2;
    b.x = this.aX + this.xRadius * Math.cos(a);
    b.y = this.aY + this.yRadius * Math.sin(a);
    return b
};
THREE.ArcCurve = function(a, b, c, d, e, f) {
    THREE.EllipseCurve.call(this, a, b, c, c, d, e, f)
};
THREE.ArcCurve.prototype = Object.create(THREE.EllipseCurve.prototype);
THREE.LineCurve3 = THREE.Curve.create(function(a, b) {
    this.v1 = a;
    this.v2 = b
}, function(a) {
    var b = new THREE.Vector3;
    b.subVectors(this.v2, this.v1);
    b.multiplyScalar(a);
    b.add(this.v1);
    return b
});
THREE.QuadraticBezierCurve3 = THREE.Curve.create(function(a, b, c) {
    this.v0 = a;
    this.v1 = b;
    this.v2 = c
}, function(a) {
    var b = new THREE.Vector3;
    b.x = THREE.Shape.Utils.b2(a, this.v0.x, this.v1.x, this.v2.x);
    b.y = THREE.Shape.Utils.b2(a, this.v0.y, this.v1.y, this.v2.y);
    b.z = THREE.Shape.Utils.b2(a, this.v0.z, this.v1.z, this.v2.z);
    return b
});
THREE.CubicBezierCurve3 = THREE.Curve.create(function(a, b, c, d) {
    this.v0 = a;
    this.v1 = b;
    this.v2 = c;
    this.v3 = d
}, function(a) {
    var b = new THREE.Vector3;
    b.x = THREE.Shape.Utils.b3(a, this.v0.x, this.v1.x, this.v2.x, this.v3.x);
    b.y = THREE.Shape.Utils.b3(a, this.v0.y, this.v1.y, this.v2.y, this.v3.y);
    b.z = THREE.Shape.Utils.b3(a, this.v0.z, this.v1.z, this.v2.z, this.v3.z);
    return b
});
THREE.SplineCurve3 = THREE.Curve.create(function(a) {
    this.points = void 0 == a ? [] : a
}, function(a) {
    var b = this.points;
    a *= b.length - 1;
    var c = Math.floor(a);
    a -= c;
    var d = b[0 == c ? c : c - 1],
        e = b[c],
        f = b[c > b.length - 2 ? b.length - 1 : c + 1],
        b = b[c > b.length - 3 ? b.length - 1 : c + 2],
        c = new THREE.Vector3;
    c.x = THREE.Curve.Utils.interpolate(d.x, e.x, f.x, b.x, a);
    c.y = THREE.Curve.Utils.interpolate(d.y, e.y, f.y, b.y, a);
    c.z = THREE.Curve.Utils.interpolate(d.z, e.z, f.z, b.z, a);
    return c
});
THREE.ClosedSplineCurve3 = THREE.Curve.create(function(a) {
    this.points = void 0 == a ? [] : a
}, function(a) {
    var b = this.points;
    a *= b.length - 0;
    var c = Math.floor(a);
    a -= c;
    var c = c + (0 < c ? 0 : (Math.floor(Math.abs(c) / b.length) + 1) * b.length),
        d = b[(c - 1) % b.length],
        e = b[c % b.length],
        f = b[(c + 1) % b.length],
        b = b[(c + 2) % b.length],
        c = new THREE.Vector3;
    c.x = THREE.Curve.Utils.interpolate(d.x, e.x, f.x, b.x, a);
    c.y = THREE.Curve.Utils.interpolate(d.y, e.y, f.y, b.y, a);
    c.z = THREE.Curve.Utils.interpolate(d.z, e.z, f.z, b.z, a);
    return c
});
THREE.AnimationHandler = {
    LINEAR: 0,
    CATMULLROM: 1,
    CATMULLROM_FORWARD: 2,
    add: function() {
        console.warn("THREE.AnimationHandler.add() has been deprecated.")
    },
    get: function() {
        console.warn("THREE.AnimationHandler.get() has been deprecated.")
    },
    remove: function() {
        console.warn("THREE.AnimationHandler.remove() has been deprecated.")
    },
    animations: [],
    init: function(a) {
        if (!0 !== a.initialized) {
            for (var b = 0; b < a.hierarchy.length; b++) {
                for (var c = 0; c < a.hierarchy[b].keys.length; c++)
                    if (0 > a.hierarchy[b].keys[c].time && (a.hierarchy[b].keys[c].time = 0), void 0 !== a.hierarchy[b].keys[c].rot && !(a.hierarchy[b].keys[c].rot instanceof THREE.Quaternion)) {
                        var d = a.hierarchy[b].keys[c].rot;
                        a.hierarchy[b].keys[c].rot = (new THREE.Quaternion).fromArray(d)
                    }
                if (a.hierarchy[b].keys.length && void 0 !== a.hierarchy[b].keys[0].morphTargets) {
                    d = {};
                    for (c = 0; c < a.hierarchy[b].keys.length; c++)
                        for (var e = 0; e < a.hierarchy[b].keys[c].morphTargets.length; e++) {
                            var f = a.hierarchy[b].keys[c].morphTargets[e];
                            d[f] = -1
                        }
                    a.hierarchy[b].usedMorphTargets = d;
                    for (c = 0; c < a.hierarchy[b].keys.length; c++) {
                        var g = {};
                        for (f in d) {
                            for (e = 0; e < a.hierarchy[b].keys[c].morphTargets.length; e++)
                                if (a.hierarchy[b].keys[c].morphTargets[e] === f) {
                                    g[f] = a.hierarchy[b].keys[c].morphTargetsInfluences[e];
                                    break
                                }
                            e === a.hierarchy[b].keys[c].morphTargets.length && (g[f] = 0)
                        }
                        a.hierarchy[b].keys[c].morphTargetsInfluences = g
                    }
                }
                for (c = 1; c < a.hierarchy[b].keys.length; c++) a.hierarchy[b].keys[c].time === a.hierarchy[b].keys[c - 1].time && (a.hierarchy[b].keys.splice(c, 1), c--);
                for (c = 0; c < a.hierarchy[b].keys.length; c++) a.hierarchy[b].keys[c].index = c
            }
            a.initialized = !0;
            return a
        }
    },
    parse: function(a) {
        var b = function(a, c) {
                c.push(a);
                for (var d = 0; d < a.children.length; d++) b(a.children[d], c)
            },
            c = [];
        if (a instanceof THREE.SkinnedMesh)
            for (var d = 0; d < a.skeleton.bones.length; d++) c.push(a.skeleton.bones[d]);
        else b(a, c);
        return c
    },
    play: function(a) {
        -1 === this.animations.indexOf(a) && this.animations.push(a)
    },
    stop: function(a) {
        a = this.animations.indexOf(a); - 1 !== a && this.animations.splice(a, 1)
    },
    update: function(a) {
        for (var b = 0; b < this.animations.length; b++) this.animations[b].resetBlendWeights();
        for (b = 0; b < this.animations.length; b++) this.animations[b].update(a)
    }
};
THREE.Animation = function(a, b) {
    this.root = a;
    this.data = THREE.AnimationHandler.init(b);
    this.hierarchy = THREE.AnimationHandler.parse(a);
    this.currentTime = 0;
    this.timeScale = 1;
    this.isPlaying = !1;
    this.loop = !0;
    this.weight = 0;
    this.interpolationType = THREE.AnimationHandler.LINEAR
};
THREE.Animation.prototype.keyTypes = ["pos", "rot", "scl"];
THREE.Animation.prototype.play = function(a, b) {
    this.currentTime = void 0 !== a ? a : 0;
    this.weight = void 0 !== b ? b : 1;
    this.isPlaying = !0;
    this.reset();
    THREE.AnimationHandler.play(this)
};
THREE.Animation.prototype.stop = function() {
    this.isPlaying = !1;
    THREE.AnimationHandler.stop(this)
};
THREE.Animation.prototype.reset = function() {
    for (var a = 0, b = this.hierarchy.length; a < b; a++) {
        var c = this.hierarchy[a];
        c.matrixAutoUpdate = !0;
        void 0 === c.animationCache && (c.animationCache = {
            animations: {},
            blending: {
                positionWeight: 0,
                quaternionWeight: 0,
                scaleWeight: 0
            }
        });
        void 0 === c.animationCache.animations[this.data.name] && (c.animationCache.animations[this.data.name] = {}, c.animationCache.animations[this.data.name].prevKey = {
            pos: 0,
            rot: 0,
            scl: 0
        }, c.animationCache.animations[this.data.name].nextKey = {
            pos: 0,
            rot: 0,
            scl: 0
        }, c.animationCache.animations[this.data.name].originalMatrix = c.matrix);
        for (var c = c.animationCache.animations[this.data.name], d = 0; 3 > d; d++) {
            for (var e = this.keyTypes[d], f = this.data.hierarchy[a].keys[0], g = this.getNextKeyWith(e, a, 1); g.time < this.currentTime && g.index > f.index;) f = g, g = this.getNextKeyWith(e, a, g.index + 1);
            c.prevKey[e] = f;
            c.nextKey[e] = g
        }
    }
};
THREE.Animation.prototype.resetBlendWeights = function() {
    for (var a = 0, b = this.hierarchy.length; a < b; a++) {
        var c = this.hierarchy[a];
        void 0 !== c.animationCache && (c.animationCache.blending.positionWeight = 0, c.animationCache.blending.quaternionWeight = 0, c.animationCache.blending.scaleWeight = 0)
    }
};
THREE.Animation.prototype.update = function() {
    var a = [],
        b = new THREE.Vector3,
        c = new THREE.Vector3,
        d = new THREE.Quaternion,
        e = function(a, b) {
            var c = [],
                d = [],
                e, q, m, r, t, s;
            e = (a.length - 1) * b;
            q = Math.floor(e);
            e -= q;
            c[0] = 0 === q ? q : q - 1;
            c[1] = q;
            c[2] = q > a.length - 2 ? q : q + 1;
            c[3] = q > a.length - 3 ? q : q + 2;
            q = a[c[0]];
            r = a[c[1]];
            t = a[c[2]];
            s = a[c[3]];
            c = e * e;
            m = e * c;
            d[0] = f(q[0], r[0], t[0], s[0], e, c, m);
            d[1] = f(q[1], r[1], t[1], s[1], e, c, m);
            d[2] = f(q[2], r[2], t[2], s[2], e, c, m);
            return d
        },
        f = function(a, b, c, d, e, f, m) {
            a = .5 * (c - a);
            d = .5 * (d - b);
            return (2 * (b - c) + a + d) * m + (-3 * (b - c) - 2 * a - d) * f + a * e + b
        };
    return function(f) {
        if (!1 !== this.isPlaying && (this.currentTime += f * this.timeScale, 0 !== this.weight)) {
            f = this.data.length;
            if (this.currentTime > f || 0 > this.currentTime)
                if (this.loop) this.currentTime %= f, 0 > this.currentTime && (this.currentTime += f), this.reset();
                else {
                    this.stop();
                    return
                }
            f = 0;
            for (var h = this.hierarchy.length; f < h; f++)
                for (var k = this.hierarchy[f], n = k.animationCache.animations[this.data.name], p = k.animationCache.blending, q = 0; 3 > q; q++) {
                    var m = this.keyTypes[q],
                        r = n.prevKey[m],
                        t = n.nextKey[m];
                    if (0 < this.timeScale && t.time <= this.currentTime || 0 > this.timeScale && r.time >= this.currentTime) {
                        r = this.data.hierarchy[f].keys[0];
                        for (t = this.getNextKeyWith(m, f, 1); t.time < this.currentTime && t.index > r.index;) r = t, t = this.getNextKeyWith(m, f, t.index + 1);
                        n.prevKey[m] = r;
                        n.nextKey[m] = t
                    }
                    k.matrixAutoUpdate = !0;
                    k.matrixWorldNeedsUpdate = !0;
                    var s = (this.currentTime - r.time) / (t.time - r.time),
                        u = r[m],
                        v = t[m];
                    0 > s && (s = 0);
                    1 < s && (s = 1);
                    if ("pos" === m)
                        if (this.interpolationType === THREE.AnimationHandler.LINEAR) c.x = u[0] + (v[0] - u[0]) * s, c.y = u[1] + (v[1] - u[1]) * s, c.z = u[2] + (v[2] - u[2]) * s, r = this.weight / (this.weight + p.positionWeight), k.position.lerp(c, r), p.positionWeight += this.weight;
                        else {
                            if (this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD) a[0] = this.getPrevKeyWith("pos", f, r.index - 1).pos, a[1] = u, a[2] = v, a[3] = this.getNextKeyWith("pos", f, t.index + 1).pos, s = .33 * s + .33, t = e(a, s), r = this.weight / (this.weight + p.positionWeight), p.positionWeight += this.weight, m = k.position, m.x += (t[0] - m.x) * r, m.y += (t[1] - m.y) * r, m.z += (t[2] - m.z) * r, this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD && (s = e(a, 1.01 * s), b.set(s[0], s[1], s[2]), b.sub(m), b.y = 0, b.normalize(), s = Math.atan2(b.x, b.z), k.rotation.set(0, s, 0))
                        }
                    else "rot" === m ? (THREE.Quaternion.slerp(u, v, d, s), 0 === p.quaternionWeight ? (k.quaternion.copy(d), p.quaternionWeight = this.weight) : (r = this.weight / (this.weight + p.quaternionWeight), THREE.Quaternion.slerp(k.quaternion, d, k.quaternion, r), p.quaternionWeight += this.weight)) : "scl" === m && (c.x = u[0] + (v[0] - u[0]) * s, c.y = u[1] + (v[1] - u[1]) * s, c.z = u[2] + (v[2] - u[2]) * s, r = this.weight / (this.weight + p.scaleWeight), k.scale.lerp(c, r), p.scaleWeight += this.weight)
                }
            return !0
        }
    }
}();
THREE.Animation.prototype.getNextKeyWith = function(a, b, c) {
    var d = this.data.hierarchy[b].keys;
    for (c = this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ? c < d.length - 1 ? c : d.length - 1 : c % d.length; c < d.length; c++)
        if (void 0 !== d[c][a]) return d[c];
    return this.data.hierarchy[b].keys[0]
};
THREE.Animation.prototype.getPrevKeyWith = function(a, b, c) {
    var d = this.data.hierarchy[b].keys;
    for (c = this.interpolationType === THREE.AnimationHandler.CATMULLROM || this.interpolationType === THREE.AnimationHandler.CATMULLROM_FORWARD ? 0 < c ? c : 0 : 0 <= c ? c : c + d.length; 0 <= c; c--)
        if (void 0 !== d[c][a]) return d[c];
    return this.data.hierarchy[b].keys[d.length - 1]
};
THREE.KeyFrameAnimation = function(a) {
    this.root = a.node;
    this.data = THREE.AnimationHandler.init(a);
    this.hierarchy = THREE.AnimationHandler.parse(this.root);
    this.currentTime = 0;
    this.timeScale = .001;
    this.isPlaying = !1;
    this.loop = this.isPaused = !0;
    a = 0;
    for (var b = this.hierarchy.length; a < b; a++) {
        var c = this.data.hierarchy[a].sids,
            d = this.hierarchy[a];
        if (this.data.hierarchy[a].keys.length && c) {
            for (var e = 0; e < c.length; e++) {
                var f = c[e],
                    g = this.getNextKeyWith(f, a, 0);
                g && g.apply(f)
            }
            d.matrixAutoUpdate = !1;
            this.data.hierarchy[a].node.updateMatrix();
            d.matrixWorldNeedsUpdate = !0
        }
    }
};
THREE.KeyFrameAnimation.prototype.play = function(a) {
    this.currentTime = void 0 !== a ? a : 0;
    if (!1 === this.isPlaying) {
        this.isPlaying = !0;
        var b = this.hierarchy.length,
            c, d;
        for (a = 0; a < b; a++) c = this.hierarchy[a], d = this.data.hierarchy[a], void 0 === d.animationCache && (d.animationCache = {}, d.animationCache.prevKey = null, d.animationCache.nextKey = null, d.animationCache.originalMatrix = c.matrix), c = this.data.hierarchy[a].keys, c.length && (d.animationCache.prevKey = c[0], d.animationCache.nextKey = c[1], this.startTime = Math.min(c[0].time, this.startTime), this.endTime = Math.max(c[c.length - 1].time, this.endTime));
        this.update(0)
    }
    this.isPaused = !1;
    THREE.AnimationHandler.play(this)
};
THREE.KeyFrameAnimation.prototype.stop = function() {
    this.isPaused = this.isPlaying = !1;
    THREE.AnimationHandler.stop(this);
    for (var a = 0; a < this.data.hierarchy.length; a++) {
        var b = this.hierarchy[a],
            c = this.data.hierarchy[a];
        if (void 0 !== c.animationCache) {
            var d = c.animationCache.originalMatrix;
            d.copy(b.matrix);
            b.matrix = d;
            delete c.animationCache
        }
    }
};
THREE.KeyFrameAnimation.prototype.update = function(a) {
    if (!1 !== this.isPlaying) {
        this.currentTime += a * this.timeScale;
        a = this.data.length;
        !0 === this.loop && this.currentTime > a && (this.currentTime %= a);
        this.currentTime = Math.min(this.currentTime, a);
        a = 0;
        for (var b = this.hierarchy.length; a < b; a++) {
            var c = this.hierarchy[a],
                d = this.data.hierarchy[a],
                e = d.keys,
                d = d.animationCache;
            if (e.length) {
                var f = d.prevKey,
                    g = d.nextKey;
                if (g.time <= this.currentTime) {
                    for (; g.time < this.currentTime && g.index > f.index;) f = g, g = e[f.index + 1];
                    d.prevKey = f;
                    d.nextKey = g
                }
                g.time >= this.currentTime ? f.interpolate(g, this.currentTime) : f.interpolate(g, g.time);
                this.data.hierarchy[a].node.updateMatrix();
                c.matrixWorldNeedsUpdate = !0
            }
        }
    }
};
THREE.KeyFrameAnimation.prototype.getNextKeyWith = function(a, b, c) {
    b = this.data.hierarchy[b].keys;
    for (c %= b.length; c < b.length; c++)
        if (b[c].hasTarget(a)) return b[c];
    return b[0]
};
THREE.KeyFrameAnimation.prototype.getPrevKeyWith = function(a, b, c) {
    b = this.data.hierarchy[b].keys;
    for (c = 0 <= c ? c : c + b.length; 0 <= c; c--)
        if (b[c].hasTarget(a)) return b[c];
    return b[b.length - 1]
};
THREE.MorphAnimation = function(a) {
    this.mesh = a;
    this.frames = a.morphTargetInfluences.length;
    this.currentTime = 0;
    this.duration = 1e3;
    this.loop = !0;
    this.isPlaying = !1
};
THREE.MorphAnimation.prototype = {
    play: function() {
        this.isPlaying = !0
    },
    pause: function() {
        this.isPlaying = !1
    },
    update: function() {
        var a = 0,
            b = 0;
        return function(c) {
            if (!1 !== this.isPlaying) {
                this.currentTime += c;
                !0 === this.loop && this.currentTime > this.duration && (this.currentTime %= this.duration);
                this.currentTime = Math.min(this.currentTime, this.duration);
                c = this.duration / this.frames;
                var d = Math.floor(this.currentTime / c);
                d != b && (this.mesh.morphTargetInfluences[a] = 0, this.mesh.morphTargetInfluences[b] = 1, this.mesh.morphTargetInfluences[d] = 0, a = b, b = d);
                this.mesh.morphTargetInfluences[d] = this.currentTime % c / c;
                this.mesh.morphTargetInfluences[a] = 1 - this.mesh.morphTargetInfluences[d]
            }
        }
    }()
};
THREE.BoxGeometry = function(a, b, c, d, e, f) {
    function g(a, b, c, d, e, f, g, s) {
        var u, v = h.widthSegments,
            y = h.heightSegments,
            G = e / 2,
            w = f / 2,
            K = h.vertices.length;
        if ("x" === a && "y" === b || "y" === a && "x" === b) u = "z";
        else if ("x" === a && "z" === b || "z" === a && "x" === b) u = "y", y = h.depthSegments;
        else if ("z" === a && "y" === b || "y" === a && "z" === b) u = "x", v = h.depthSegments;
        var x = v + 1,
            D = y + 1,
            E = e / v,
            A = f / y,
            B = new THREE.Vector3;
        B[u] = 0 < g ? 1 : -1;
        for (e = 0; e < D; e++)
            for (f = 0; f < x; f++) {
                var F = new THREE.Vector3;
                F[a] = (f * E - G) * c;
                F[b] = (e * A - w) * d;
                F[u] = g;
                h.vertices.push(F)
            }
        for (e = 0; e < y; e++)
            for (f = 0; f < v; f++) w = f + x * e, a = f + x * (e + 1), b = f + 1 + x * (e + 1), c = f + 1 + x * e, d = new THREE.Vector2(f / v, 1 - e / y), g = new THREE.Vector2(f / v, 1 - (e + 1) / y), u = new THREE.Vector2((f + 1) / v, 1 - (e + 1) / y), G = new THREE.Vector2((f + 1) / v, 1 - e / y), w = new THREE.Face3(w + K, a + K, c + K), w.normal.copy(B), w.vertexNormals.push(B.clone(), B.clone(), B.clone()), w.materialIndex = s, h.faces.push(w), h.faceVertexUvs[0].push([d, g, G]), w = new THREE.Face3(a + K, b + K, c + K), w.normal.copy(B), w.vertexNormals.push(B.clone(), B.clone(), B.clone()), w.materialIndex = s, h.faces.push(w), h.faceVertexUvs[0].push([g.clone(), u, G.clone()])
    }
    THREE.Geometry.call(this);
    this.type = "BoxGeometry";
    this.parameters = {
        width: a,
        height: b,
        depth: c,
        widthSegments: d,
        heightSegments: e,
        depthSegments: f
    };
    this.widthSegments = d || 1;
    this.heightSegments = e || 1;
    this.depthSegments = f || 1;
    var h = this;
    d = a / 2;
    e = b / 2;
    f = c / 2;
    g("z", "y", -1, -1, c, b, d, 0);
    g("z", "y", 1, -1, c, b, -d, 1);
    g("x", "z", 1, 1, a, c, e, 2);
    g("x", "z", 1, -1, a, c, -e, 3);
    g("x", "y", 1, -1, a, b, f, 4);
    g("x", "y", -1, -1, a, b, -f, 5);
    this.mergeVertices()
};
THREE.BoxGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.CircleGeometry = function(a, b, c, d) {
    THREE.Geometry.call(this);
    this.type = "CircleGeometry";
    this.parameters = {
        radius: a,
        segments: b,
        thetaStart: c,
        thetaLength: d
    };
    a = a || 50;
    b = void 0 !== b ? Math.max(3, b) : 8;
    c = void 0 !== c ? c : 0;
    d = void 0 !== d ? d : 2 * Math.PI;
    var e, f = [];
    e = new THREE.Vector3;
    var g = new THREE.Vector2(.5, .5);
    this.vertices.push(e);
    f.push(g);
    for (e = 0; e <= b; e++) {
        var h = new THREE.Vector3,
            k = c + e / b * d;
        h.x = a * Math.cos(k);
        h.y = a * Math.sin(k);
        this.vertices.push(h);
        f.push(new THREE.Vector2((h.x / a + 1) / 2, (h.y / a + 1) / 2))
    }
    c = new THREE.Vector3(0, 0, 1);
    for (e = 1; e <= b; e++) this.faces.push(new THREE.Face3(e, e + 1, 0, [c.clone(), c.clone(), c.clone()])), this.faceVertexUvs[0].push([f[e].clone(), f[e + 1].clone(), g.clone()]);
    this.computeFaceNormals();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3, a)
};
THREE.CircleGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.CubeGeometry = function(a, b, c, d, e, f) {
    console.warn("THREE.CubeGeometry has been renamed to THREE.BoxGeometry.");
    return new THREE.BoxGeometry(a, b, c, d, e, f)
};
THREE.CylinderGeometry = function(a, b, c, d, e, f) {
    THREE.Geometry.call(this);
    this.type = "CylinderGeometry";
    this.parameters = {
        radiusTop: a,
        radiusBottom: b,
        height: c,
        radialSegments: d,
        heightSegments: e,
        openEnded: f
    };
    a = void 0 !== a ? a : 20;
    b = void 0 !== b ? b : 20;
    c = void 0 !== c ? c : 100;
    d = d || 8;
    e = e || 1;
    f = void 0 !== f ? f : !1;
    var g = c / 2,
        h, k, n = [],
        p = [];
    for (k = 0; k <= e; k++) {
        var q = [],
            m = [],
            r = k / e,
            t = r * (b - a) + a;
        for (h = 0; h <= d; h++) {
            var s = h / d,
                u = new THREE.Vector3;
            u.x = t * Math.sin(s * Math.PI * 2);
            u.y = -r * c + g;
            u.z = t * Math.cos(s * Math.PI * 2);
            this.vertices.push(u);
            q.push(this.vertices.length - 1);
            m.push(new THREE.Vector2(s, 1 - r))
        }
        n.push(q);
        p.push(m)
    }
    c = (b - a) / c;
    for (h = 0; h < d; h++)
        for (0 !== a ? (q = this.vertices[n[0][h]].clone(), m = this.vertices[n[0][h + 1]].clone()) : (q = this.vertices[n[1][h]].clone(), m = this.vertices[n[1][h + 1]].clone()), q.setY(Math.sqrt(q.x * q.x + q.z * q.z) * c).normalize(), m.setY(Math.sqrt(m.x * m.x + m.z * m.z) * c).normalize(), k = 0; k < e; k++) {
            var r = n[k][h],
                t = n[k + 1][h],
                s = n[k + 1][h + 1],
                u = n[k][h + 1],
                v = q.clone(),
                y = q.clone(),
                G = m.clone(),
                w = m.clone(),
                K = p[k][h].clone(),
                x = p[k + 1][h].clone(),
                D = p[k + 1][h + 1].clone(),
                E = p[k][h + 1].clone();
            this.faces.push(new THREE.Face3(r, t, u, [v, y, w]));
            this.faceVertexUvs[0].push([K, x, E]);
            this.faces.push(new THREE.Face3(t, s, u, [y.clone(), G, w.clone()]));
            this.faceVertexUvs[0].push([x.clone(), D, E.clone()])
        }
    if (!1 === f && 0 < a)
        for (this.vertices.push(new THREE.Vector3(0, g, 0)), h = 0; h < d; h++) r = n[0][h], t = n[0][h + 1], s = this.vertices.length - 1, v = new THREE.Vector3(0, 1, 0), y = new THREE.Vector3(0, 1, 0), G = new THREE.Vector3(0, 1, 0), K = p[0][h].clone(), x = p[0][h + 1].clone(), D = new THREE.Vector2(x.x, 0), this.faces.push(new THREE.Face3(r, t, s, [v, y, G])), this.faceVertexUvs[0].push([K, x, D]);
    if (!1 === f && 0 < b)
        for (this.vertices.push(new THREE.Vector3(0, -g, 0)), h = 0; h < d; h++) r = n[k][h + 1], t = n[k][h], s = this.vertices.length - 1, v = new THREE.Vector3(0, -1, 0), y = new THREE.Vector3(0, -1, 0), G = new THREE.Vector3(0, -1, 0), K = p[k][h + 1].clone(), x = p[k][h].clone(), D = new THREE.Vector2(x.x, 1), this.faces.push(new THREE.Face3(r, t, s, [v, y, G])), this.faceVertexUvs[0].push([K, x, D]);
    this.computeFaceNormals()
};
THREE.CylinderGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ExtrudeGeometry = function(a, b) {
    "undefined" !== typeof a && (THREE.Geometry.call(this), this.type = "ExtrudeGeometry", a = a instanceof Array ? a : [a], this.addShapeList(a, b), this.computeFaceNormals())
};
THREE.ExtrudeGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ExtrudeGeometry.prototype.addShapeList = function(a, b) {
    for (var c = a.length, d = 0; d < c; d++) this.addShape(a[d], b)
};
THREE.ExtrudeGeometry.prototype.addShape = function(a, b) {
    function c(a, b, c) {
        b || console.log("die");
        return b.clone().multiplyScalar(c).add(a)
    }

    function d(a, b, c) {
        var d = 1,
            d = a.x - b.x,
            e = a.y - b.y,
            f = c.x - a.x,
            g = c.y - a.y,
            h = d * d + e * e;
        if (1e-10 < Math.abs(d * g - e * f)) {
            var k = Math.sqrt(h),
                m = Math.sqrt(f * f + g * g),
                h = b.x - e / k;
            b = b.y + d / k;
            f = ((c.x - g / m - h) * g - (c.y + f / m - b) * f) / (d * g - e * f);
            c = h + d * f - a.x;
            a = b + e * f - a.y;
            d = c * c + a * a;
            if (2 >= d) return new THREE.Vector2(c, a);
            d = Math.sqrt(d / 2)
        } else a = !1, 1e-10 < d ? 1e-10 < f && (a = !0) : -1e-10 > d ? -1e-10 > f && (a = !0) : Math.sign(e) == Math.sign(g) && (a = !0), a ? (c = -e, a = d, d = Math.sqrt(h)) : (c = d, a = e, d = Math.sqrt(h / 2));
        return new THREE.Vector2(c / d, a / d)
    }

    function e(a, b) {
        var c, d;
        for (P = a.length; 0 <= --P;) {
            c = P;
            d = P - 1;
            0 > d && (d = a.length - 1);
            for (var e = 0, f = r + 2 * p, e = 0; e < f; e++) {
                var g = la * e,
                    h = la * (e + 1),
                    k = b + c + g,
                    g = b + d + g,
                    m = b + d + h,
                    h = b + c + h,
                    k = k + R,
                    g = g + R,
                    m = m + R,
                    h = h + R;
                F.faces.push(new THREE.Face3(k, g, h, null, null, y));
                F.faces.push(new THREE.Face3(g, m, h, null, null, y));
                k = G.generateSideWallUV(F, k, g, m, h);
                F.faceVertexUvs[0].push([k[0], k[1], k[3]]);
                F.faceVertexUvs[0].push([k[1], k[2], k[3]])
            }
        }
    }

    function f(a, b, c) {
        F.vertices.push(new THREE.Vector3(a, b, c))
    }

    function g(a, b, c) {
        a += R;
        b += R;
        c += R;
        F.faces.push(new THREE.Face3(a, b, c, null, null, v));
        a = G.generateTopUV(F, a, b, c);
        F.faceVertexUvs[0].push(a)
    }
    var h = void 0 !== b.amount ? b.amount : 100,
        k = void 0 !== b.bevelThickness ? b.bevelThickness : 6,
        n = void 0 !== b.bevelSize ? b.bevelSize : k - 2,
        p = void 0 !== b.bevelSegments ? b.bevelSegments : 3,
        q = void 0 !== b.bevelEnabled ? b.bevelEnabled : !0,
        m = void 0 !== b.curveSegments ? b.curveSegments : 12,
        r = void 0 !== b.steps ? b.steps : 1,
        t = b.extrudePath,
        s, u = !1,
        v = b.material,
        y = b.extrudeMaterial,
        G = void 0 !== b.UVGenerator ? b.UVGenerator : THREE.ExtrudeGeometry.WorldUVGenerator,
        w, K, x, D;
    t && (s = t.getSpacedPoints(r), u = !0, q = !1, w = void 0 !== b.frames ? b.frames : new THREE.TubeGeometry.FrenetFrames(t, r, !1), K = new THREE.Vector3, x = new THREE.Vector3, D = new THREE.Vector3);
    q || (n = k = p = 0);
    var E, A, B, F = this,
        R = this.vertices.length,
        t = a.extractPoints(m),
        m = t.shape,
        H = t.holes;
    if (t = !THREE.Shape.Utils.isClockWise(m)) {
        m = m.reverse();
        A = 0;
        for (B = H.length; A < B; A++) E = H[A], THREE.Shape.Utils.isClockWise(E) && (H[A] = E.reverse());
        t = !1
    }
    var C = THREE.Shape.Utils.triangulateShape(m, H),
        T = m;
    A = 0;
    for (B = H.length; A < B; A++) E = H[A], m = m.concat(E);
    var Q, O, S, X, Y, la = m.length,
        ma, ya = C.length,
        t = [],
        P = 0;
    S = T.length;
    Q = S - 1;
    for (O = P + 1; P < S; P++, Q++, O++) Q === S && (Q = 0), O === S && (O = 0), t[P] = d(T[P], T[Q], T[O]);
    var Ga = [],
        Fa, za = t.concat();
    A = 0;
    for (B = H.length; A < B; A++) {
        E = H[A];
        Fa = [];
        P = 0;
        S = E.length;
        Q = S - 1;
        for (O = P + 1; P < S; P++, Q++, O++) Q === S && (Q = 0), O === S && (O = 0), Fa[P] = d(E[P], E[Q], E[O]);
        Ga.push(Fa);
        za = za.concat(Fa)
    }
    for (Q = 0; Q < p; Q++) {
        S = Q / p;
        X = k * (1 - S);
        O = n * Math.sin(S * Math.PI / 2);
        P = 0;
        for (S = T.length; P < S; P++) Y = c(T[P], t[P], O), f(Y.x, Y.y, -X);
        A = 0;
        for (B = H.length; A < B; A++)
            for (E = H[A], Fa = Ga[A], P = 0, S = E.length; P < S; P++) Y = c(E[P], Fa[P], O), f(Y.x, Y.y, -X)
    }
    O = n;
    for (P = 0; P < la; P++) Y = q ? c(m[P], za[P], O) : m[P], u ? (x.copy(w.normals[0]).multiplyScalar(Y.x), K.copy(w.binormals[0]).multiplyScalar(Y.y), D.copy(s[0]).add(x).add(K), f(D.x, D.y, D.z)) : f(Y.x, Y.y, 0);
    for (S = 1; S <= r; S++)
        for (P = 0; P < la; P++) Y = q ? c(m[P], za[P], O) : m[P], u ? (x.copy(w.normals[S]).multiplyScalar(Y.x), K.copy(w.binormals[S]).multiplyScalar(Y.y), D.copy(s[S]).add(x).add(K), f(D.x, D.y, D.z)) : f(Y.x, Y.y, h / r * S);
    for (Q = p - 1; 0 <= Q; Q--) {
        S = Q / p;
        X = k * (1 - S);
        O = n * Math.sin(S * Math.PI / 2);
        P = 0;
        for (S = T.length; P < S; P++) Y = c(T[P], t[P], O), f(Y.x, Y.y, h + X);
        A = 0;
        for (B = H.length; A < B; A++)
            for (E = H[A], Fa = Ga[A], P = 0, S = E.length; P < S; P++) Y = c(E[P], Fa[P], O), u ? f(Y.x, Y.y + s[r - 1].y, s[r - 1].x + X) : f(Y.x, Y.y, h + X)
    }(function() {
        if (q) {
            var a;
            a = 0 * la;
            for (P = 0; P < ya; P++) ma = C[P], g(ma[2] + a, ma[1] + a, ma[0] + a);
            a = r + 2 * p;
            a *= la;
            for (P = 0; P < ya; P++) ma = C[P], g(ma[0] + a, ma[1] + a, ma[2] + a)
        } else {
            for (P = 0; P < ya; P++) ma = C[P], g(ma[2], ma[1], ma[0]);
            for (P = 0; P < ya; P++) ma = C[P], g(ma[0] + la * r, ma[1] + la * r, ma[2] + la * r)
        }
    })();
    (function() {
        var a = 0;
        e(T, a);
        a += T.length;
        A = 0;
        for (B = H.length; A < B; A++) E = H[A], e(E, a), a += E.length
    })()
};
THREE.ExtrudeGeometry.WorldUVGenerator = {
    generateTopUV: function(a, b, c, d) {
        a = a.vertices;
        b = a[b];
        c = a[c];
        d = a[d];
        return [new THREE.Vector2(b.x, b.y), new THREE.Vector2(c.x, c.y), new THREE.Vector2(d.x, d.y)]
    },
    generateSideWallUV: function(a, b, c, d, e) {
        a = a.vertices;
        b = a[b];
        c = a[c];
        d = a[d];
        e = a[e];
        return .01 > Math.abs(b.y - c.y) ? [new THREE.Vector2(b.x, 1 - b.z), new THREE.Vector2(c.x, 1 - c.z), new THREE.Vector2(d.x, 1 - d.z), new THREE.Vector2(e.x, 1 - e.z)] : [new THREE.Vector2(b.y, 1 - b.z), new THREE.Vector2(c.y, 1 - c.z), new THREE.Vector2(d.y, 1 - d.z), new THREE.Vector2(e.y, 1 - e.z)]
    }
};
THREE.ShapeGeometry = function(a, b) {
    THREE.Geometry.call(this);
    this.type = "ShapeGeometry";
    !1 === a instanceof Array && (a = [a]);
    this.addShapeList(a, b);
    this.computeFaceNormals()
};
THREE.ShapeGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ShapeGeometry.prototype.addShapeList = function(a, b) {
    for (var c = 0, d = a.length; c < d; c++) this.addShape(a[c], b);
    return this
};
THREE.ShapeGeometry.prototype.addShape = function(a, b) {
    void 0 === b && (b = {});
    var c = b.material,
        d = void 0 === b.UVGenerator ? THREE.ExtrudeGeometry.WorldUVGenerator : b.UVGenerator,
        e, f, g, h = this.vertices.length;
    e = a.extractPoints(void 0 !== b.curveSegments ? b.curveSegments : 12);
    var k = e.shape,
        n = e.holes;
    if (!THREE.Shape.Utils.isClockWise(k))
        for (k = k.reverse(), e = 0, f = n.length; e < f; e++) g = n[e], THREE.Shape.Utils.isClockWise(g) && (n[e] = g.reverse());
    var p = THREE.Shape.Utils.triangulateShape(k, n);
    e = 0;
    for (f = n.length; e < f; e++) g = n[e], k = k.concat(g);
    n = k.length;
    f = p.length;
    for (e = 0; e < n; e++) g = k[e], this.vertices.push(new THREE.Vector3(g.x, g.y, 0));
    for (e = 0; e < f; e++) n = p[e], k = n[0] + h, g = n[1] + h, n = n[2] + h, this.faces.push(new THREE.Face3(k, g, n, null, null, c)), this.faceVertexUvs[0].push(d.generateTopUV(this, k, g, n))
};
THREE.LatheGeometry = function(a, b, c, d) {
    THREE.Geometry.call(this);
    this.type = "LatheGeometry";
    this.parameters = {
        points: a,
        segments: b,
        phiStart: c,
        phiLength: d
    };
    b = b || 12;
    c = c || 0;
    d = d || 2 * Math.PI;
    for (var e = 1 / (a.length - 1), f = 1 / b, g = 0, h = b; g <= h; g++)
        for (var k = c + g * f * d, n = Math.cos(k), p = Math.sin(k), k = 0, q = a.length; k < q; k++) {
            var m = a[k],
                r = new THREE.Vector3;
            r.x = n * m.x - p * m.y;
            r.y = p * m.x + n * m.y;
            r.z = m.z;
            this.vertices.push(r)
        }
    c = a.length;
    g = 0;
    for (h = b; g < h; g++)
        for (k = 0, q = a.length - 1; k < q; k++) {
            b = p = k + c * g;
            d = p + c;
            var n = p + 1 + c,
                p = p + 1,
                m = g * f,
                r = k * e,
                t = m + f,
                s = r + e;
            this.faces.push(new THREE.Face3(b, d, p));
            this.faceVertexUvs[0].push([new THREE.Vector2(m, r), new THREE.Vector2(t, r), new THREE.Vector2(m, s)]);
            this.faces.push(new THREE.Face3(d, n, p));
            this.faceVertexUvs[0].push([new THREE.Vector2(t, r), new THREE.Vector2(t, s), new THREE.Vector2(m, s)])
        }
    this.mergeVertices();
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.LatheGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.PlaneGeometry = function(a, b, c, d) {
    console.info("THREE.PlaneGeometry: Consider using THREE.PlaneBufferGeometry for lower memory footprint.");
    THREE.Geometry.call(this);
    this.type = "PlaneGeometry";
    this.parameters = {
        width: a,
        height: b,
        widthSegments: c,
        heightSegments: d
    };
    this.fromBufferGeometry(new THREE.PlaneBufferGeometry(a, b, c, d))
};
THREE.PlaneGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.PlaneBufferGeometry = function(a, b, c, d) {
    THREE.BufferGeometry.call(this);
    this.type = "PlaneBufferGeometry";
    this.parameters = {
        width: a,
        height: b,
        widthSegments: c,
        heightSegments: d
    };
    var e = a / 2,
        f = b / 2;
    c = c || 1;
    d = d || 1;
    var g = c + 1,
        h = d + 1,
        k = a / c,
        n = b / d;
    b = new Float32Array(g * h * 3);
    a = new Float32Array(g * h * 3);
    for (var p = new Float32Array(g * h * 2), q = 0, m = 0, r = 0; r < h; r++)
        for (var t = r * n - f, s = 0; s < g; s++) b[q] = s * k - e, b[q + 1] = -t, a[q + 2] = 1, p[m] = s / c, p[m + 1] = 1 - r / d, q += 3, m += 2;
    q = 0;
    e = new(65535 < b.length / 3 ? Uint32Array : Uint16Array)(c * d * 6);
    for (r = 0; r < d; r++)
        for (s = 0; s < c; s++) f = s + g * (r + 1), h = s + 1 + g * (r + 1), k = s + 1 + g * r, e[q] = s + g * r, e[q + 1] = f, e[q + 2] = k, e[q + 3] = f, e[q + 4] = h, e[q + 5] = k, q += 6;
    this.addAttribute("index", new THREE.BufferAttribute(e, 1));
    this.addAttribute("position", new THREE.BufferAttribute(b, 3));
    this.addAttribute("normal", new THREE.BufferAttribute(a, 3));
    this.addAttribute("uv", new THREE.BufferAttribute(p, 2))
};
THREE.PlaneBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
THREE.RingGeometry = function(a, b, c, d, e, f) {
    THREE.Geometry.call(this);
    this.type = "RingGeometry";
    this.parameters = {
        innerRadius: a,
        outerRadius: b,
        thetaSegments: c,
        phiSegments: d,
        thetaStart: e,
        thetaLength: f
    };
    a = a || 0;
    b = b || 50;
    e = void 0 !== e ? e : 0;
    f = void 0 !== f ? f : 2 * Math.PI;
    c = void 0 !== c ? Math.max(3, c) : 8;
    d = void 0 !== d ? Math.max(1, d) : 8;
    var g, h = [],
        k = a,
        n = (b - a) / d;
    for (a = 0; a < d + 1; a++) {
        for (g = 0; g < c + 1; g++) {
            var p = new THREE.Vector3,
                q = e + g / c * f;
            p.x = k * Math.cos(q);
            p.y = k * Math.sin(q);
            this.vertices.push(p);
            h.push(new THREE.Vector2((p.x / b + 1) / 2, (p.y / b + 1) / 2))
        }
        k += n
    }
    b = new THREE.Vector3(0, 0, 1);
    for (a = 0; a < d; a++)
        for (e = a * (c + 1), g = 0; g < c; g++) f = q = g + e, n = q + c + 1, p = q + c + 2, this.faces.push(new THREE.Face3(f, n, p, [b.clone(), b.clone(), b.clone()])), this.faceVertexUvs[0].push([h[f].clone(), h[n].clone(), h[p].clone()]), f = q, n = q + c + 2, p = q + 1, this.faces.push(new THREE.Face3(f, n, p, [b.clone(), b.clone(), b.clone()])), this.faceVertexUvs[0].push([h[f].clone(), h[n].clone(), h[p].clone()]);
    this.computeFaceNormals();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3, k)
};
THREE.RingGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.SphereGeometry = function(a, b, c, d, e, f, g) {
    THREE.Geometry.call(this);
    this.type = "SphereGeometry";
    this.parameters = {
        radius: a,
        widthSegments: b,
        heightSegments: c,
        phiStart: d,
        phiLength: e,
        thetaStart: f,
        thetaLength: g
    };
    a = a || 50;
    b = Math.max(3, Math.floor(b) || 8);
    c = Math.max(2, Math.floor(c) || 6);
    d = void 0 !== d ? d : 0;
    e = void 0 !== e ? e : 2 * Math.PI;
    f = void 0 !== f ? f : 0;
    g = void 0 !== g ? g : Math.PI;
    var h, k, n = [],
        p = [];
    for (k = 0; k <= c; k++) {
        var q = [],
            m = [];
        for (h = 0; h <= b; h++) {
            var r = h / b,
                t = k / c,
                s = new THREE.Vector3;
            s.x = -a * Math.cos(d + r * e) * Math.sin(f + t * g);
            s.y = a * Math.cos(f + t * g);
            s.z = a * Math.sin(d + r * e) * Math.sin(f + t * g);
            this.vertices.push(s);
            q.push(this.vertices.length - 1);
            m.push(new THREE.Vector2(r, 1 - t))
        }
        n.push(q);
        p.push(m)
    }
    for (k = 0; k < c; k++)
        for (h = 0; h < b; h++) {
            d = n[k][h + 1];
            e = n[k][h];
            f = n[k + 1][h];
            g = n[k + 1][h + 1];
            var q = this.vertices[d].clone().normalize(),
                m = this.vertices[e].clone().normalize(),
                r = this.vertices[f].clone().normalize(),
                t = this.vertices[g].clone().normalize(),
                s = p[k][h + 1].clone(),
                u = p[k][h].clone(),
                v = p[k + 1][h].clone(),
                y = p[k + 1][h + 1].clone();
            Math.abs(this.vertices[d].y) === a ? (s.x = (s.x + u.x) / 2, this.faces.push(new THREE.Face3(d, f, g, [q, r, t])), this.faceVertexUvs[0].push([s, v, y])) : Math.abs(this.vertices[f].y) === a ? (v.x = (v.x + y.x) / 2, this.faces.push(new THREE.Face3(d, e, f, [q, m, r])), this.faceVertexUvs[0].push([s, u, v])) : (this.faces.push(new THREE.Face3(d, e, g, [q, m, t])), this.faceVertexUvs[0].push([s, u, y]), this.faces.push(new THREE.Face3(e, f, g, [m.clone(), r, t.clone()])), this.faceVertexUvs[0].push([u.clone(), v, y.clone()]))
        }
    this.computeFaceNormals();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3, a)
};
THREE.SphereGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TextGeometry = function(a, b) {
    b = b || {};
    var c = THREE.FontUtils.generateShapes(a, b);
    b.amount = void 0 !== b.height ? b.height : 50;
    void 0 === b.bevelThickness && (b.bevelThickness = 10);
    void 0 === b.bevelSize && (b.bevelSize = 8);
    void 0 === b.bevelEnabled && (b.bevelEnabled = !1);
    THREE.ExtrudeGeometry.call(this, c, b);
    this.type = "TextGeometry"
};
THREE.TextGeometry.prototype = Object.create(THREE.ExtrudeGeometry.prototype);
THREE.TorusGeometry = function(a, b, c, d, e) {
    THREE.Geometry.call(this);
    this.type = "TorusGeometry";
    this.parameters = {
        radius: a,
        tube: b,
        radialSegments: c,
        tubularSegments: d,
        arc: e
    };
    a = a || 100;
    b = b || 40;
    c = c || 8;
    d = d || 6;
    e = e || 2 * Math.PI;
    for (var f = new THREE.Vector3, g = [], h = [], k = 0; k <= c; k++)
        for (var n = 0; n <= d; n++) {
            var p = n / d * e,
                q = k / c * Math.PI * 2;
            f.x = a * Math.cos(p);
            f.y = a * Math.sin(p);
            var m = new THREE.Vector3;
            m.x = (a + b * Math.cos(q)) * Math.cos(p);
            m.y = (a + b * Math.cos(q)) * Math.sin(p);
            m.z = b * Math.sin(q);
            this.vertices.push(m);
            g.push(new THREE.Vector2(n / d, k / c));
            h.push(m.clone().sub(f).normalize())
        }
    for (k = 1; k <= c; k++)
        for (n = 1; n <= d; n++) a = (d + 1) * k + n - 1, b = (d + 1) * (k - 1) + n - 1, e = (d + 1) * (k - 1) + n, f = (d + 1) * k + n, p = new THREE.Face3(a, b, f, [h[a].clone(), h[b].clone(), h[f].clone()]), this.faces.push(p), this.faceVertexUvs[0].push([g[a].clone(), g[b].clone(), g[f].clone()]), p = new THREE.Face3(b, e, f, [h[b].clone(), h[e].clone(), h[f].clone()]), this.faces.push(p), this.faceVertexUvs[0].push([g[b].clone(), g[e].clone(), g[f].clone()]);
    this.computeFaceNormals()
};
THREE.TorusGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TorusKnotGeometry = function(a, b, c, d, e, f, g) {
    function h(a, b, c, d, e) {
        var f = Math.cos(a),
            g = Math.sin(a);
        a *= b / c;
        b = Math.cos(a);
        f *= d * (2 + b) * .5;
        g = d * (2 + b) * g * .5;
        d = e * d * Math.sin(a) * .5;
        return new THREE.Vector3(f, g, d)
    }
    THREE.Geometry.call(this);
    this.type = "TorusKnotGeometry";
    this.parameters = {
        radius: a,
        tube: b,
        radialSegments: c,
        tubularSegments: d,
        p: e,
        q: f,
        heightScale: g
    };
    a = a || 100;
    b = b || 40;
    c = c || 64;
    d = d || 8;
    e = e || 2;
    f = f || 3;
    g = g || 1;
    for (var k = Array(c), n = new THREE.Vector3, p = new THREE.Vector3, q = new THREE.Vector3, m = 0; m < c; ++m) {
        k[m] = Array(d);
        var r = m / c * 2 * e * Math.PI,
            t = h(r, f, e, a, g),
            r = h(r + .01, f, e, a, g);
        n.subVectors(r, t);
        p.addVectors(r, t);
        q.crossVectors(n, p);
        p.crossVectors(q, n);
        q.normalize();
        p.normalize();
        for (r = 0; r < d; ++r) {
            var s = r / d * 2 * Math.PI,
                u = -b * Math.cos(s),
                s = b * Math.sin(s),
                v = new THREE.Vector3;
            v.x = t.x + u * p.x + s * q.x;
            v.y = t.y + u * p.y + s * q.y;
            v.z = t.z + u * p.z + s * q.z;
            k[m][r] = this.vertices.push(v) - 1
        }
    }
    for (m = 0; m < c; ++m)
        for (r = 0; r < d; ++r) e = (m + 1) % c, f = (r + 1) % d, a = k[m][r], b = k[e][r], e = k[e][f], f = k[m][f], g = new THREE.Vector2(m / c, r / d), n = new THREE.Vector2((m + 1) / c, r / d), p = new THREE.Vector2((m + 1) / c, (r + 1) / d), q = new THREE.Vector2(m / c, (r + 1) / d), this.faces.push(new THREE.Face3(a, b, f)), this.faceVertexUvs[0].push([g, n, q]), this.faces.push(new THREE.Face3(b, e, f)), this.faceVertexUvs[0].push([n.clone(), p, q.clone()]);
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.TorusKnotGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TubeGeometry = function(a, b, c, d, e) {
    THREE.Geometry.call(this);
    this.type = "TubeGeometry";
    this.parameters = {
        path: a,
        segments: b,
        radius: c,
        radialSegments: d,
        closed: e
    };
    b = b || 64;
    c = c || 1;
    d = d || 8;
    e = e || !1;
    var f = [],
        g, h, k = b + 1,
        n, p, q, m, r = new THREE.Vector3,
        t, s, u;
    t = new THREE.TubeGeometry.FrenetFrames(a, b, e);
    s = t.normals;
    u = t.binormals;
    this.tangents = t.tangents;
    this.normals = s;
    this.binormals = u;
    for (t = 0; t < k; t++)
        for (f[t] = [], n = t / (k - 1), m = a.getPointAt(n), g = s[t], h = u[t], n = 0; n < d; n++) p = n / d * 2 * Math.PI, q = -c * Math.cos(p), p = c * Math.sin(p), r.copy(m), r.x += q * g.x + p * h.x, r.y += q * g.y + p * h.y, r.z += q * g.z + p * h.z, f[t][n] = this.vertices.push(new THREE.Vector3(r.x, r.y, r.z)) - 1;
    for (t = 0; t < b; t++)
        for (n = 0; n < d; n++) k = e ? (t + 1) % b : t + 1, r = (n + 1) % d, a = f[t][n], c = f[k][n], k = f[k][r], r = f[t][r], s = new THREE.Vector2(t / b, n / d), u = new THREE.Vector2((t + 1) / b, n / d), g = new THREE.Vector2((t + 1) / b, (n + 1) / d), h = new THREE.Vector2(t / b, (n + 1) / d), this.faces.push(new THREE.Face3(a, c, r)), this.faceVertexUvs[0].push([s, u, h]), this.faces.push(new THREE.Face3(c, k, r)), this.faceVertexUvs[0].push([u.clone(), g, h.clone()]);
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.TubeGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TubeGeometry.FrenetFrames = function(a, b, c) {
    new THREE.Vector3;
    var d = new THREE.Vector3;
    new THREE.Vector3;
    var e = [],
        f = [],
        g = [],
        h = new THREE.Vector3,
        k = new THREE.Matrix4;
    b += 1;
    var n, p, q;
    this.tangents = e;
    this.normals = f;
    this.binormals = g;
    for (n = 0; n < b; n++) p = n / (b - 1), e[n] = a.getTangentAt(p), e[n].normalize();
    f[0] = new THREE.Vector3;
    g[0] = new THREE.Vector3;
    a = Number.MAX_VALUE;
    n = Math.abs(e[0].x);
    p = Math.abs(e[0].y);
    q = Math.abs(e[0].z);
    n <= a && (a = n, d.set(1, 0, 0));
    p <= a && (a = p, d.set(0, 1, 0));
    q <= a && d.set(0, 0, 1);
    h.crossVectors(e[0], d).normalize();
    f[0].crossVectors(e[0], h);
    g[0].crossVectors(e[0], f[0]);
    for (n = 1; n < b; n++) f[n] = f[n - 1].clone(), g[n] = g[n - 1].clone(), h.crossVectors(e[n - 1], e[n]), 1e-4 < h.length() && (h.normalize(), d = Math.acos(THREE.Math.clamp(e[n - 1].dot(e[n]), -1, 1)), f[n].applyMatrix4(k.makeRotationAxis(h, d))), g[n].crossVectors(e[n], f[n]);
    if (c)
        for (d = Math.acos(THREE.Math.clamp(f[0].dot(f[b - 1]), -1, 1)), d /= b - 1, 0 < e[0].dot(h.crossVectors(f[0], f[b - 1])) && (d = -d), n = 1; n < b; n++) f[n].applyMatrix4(k.makeRotationAxis(e[n], d * n)), g[n].crossVectors(e[n], f[n])
};
THREE.PolyhedronGeometry = function(a, b, c, d) {
    function e(a) {
        var b = a.normalize().clone();
        b.index = k.vertices.push(b) - 1;
        var c = Math.atan2(a.z, -a.x) / 2 / Math.PI + .5;
        a = Math.atan2(-a.y, Math.sqrt(a.x * a.x + a.z * a.z)) / Math.PI + .5;
        b.uv = new THREE.Vector2(c, 1 - a);
        return b
    }

    function f(a, b, c) {
        var d = new THREE.Face3(a.index, b.index, c.index, [a.clone(), b.clone(), c.clone()]);
        k.faces.push(d);
        u.copy(a).add(b).add(c).divideScalar(3);
        d = Math.atan2(u.z, -u.x);
        k.faceVertexUvs[0].push([h(a.uv, a, d), h(b.uv, b, d), h(c.uv, c, d)])
    }

    function g(a, b) {
        var c = Math.pow(2, b);
        Math.pow(4, b);
        for (var d = e(k.vertices[a.a]), g = e(k.vertices[a.b]), h = e(k.vertices[a.c]), m = [], n = 0; n <= c; n++) {
            m[n] = [];
            for (var p = e(d.clone().lerp(h, n / c)), q = e(g.clone().lerp(h, n / c)), r = c - n, s = 0; s <= r; s++) m[n][s] = 0 == s && n == c ? p : e(p.clone().lerp(q, s / r))
        }
        for (n = 0; n < c; n++)
            for (s = 0; s < 2 * (c - n) - 1; s++) d = Math.floor(s / 2), 0 == s % 2 ? f(m[n][d + 1], m[n + 1][d], m[n][d]) : f(m[n][d + 1], m[n + 1][d + 1], m[n + 1][d])
    }

    function h(a, b, c) {
        0 > c && 1 === a.x && (a = new THREE.Vector2(a.x - 1, a.y));
        0 === b.x && 0 === b.z && (a = new THREE.Vector2(c / 2 / Math.PI + .5, a.y));
        return a.clone()
    }
    THREE.Geometry.call(this);
    this.type = "PolyhedronGeometry";
    this.parameters = {
        vertices: a,
        indices: b,
        radius: c,
        detail: d
    };
    c = c || 1;
    d = d || 0;
    for (var k = this, n = 0, p = a.length; n < p; n += 3) e(new THREE.Vector3(a[n], a[n + 1], a[n + 2]));
    a = this.vertices;
    for (var q = [], m = n = 0, p = b.length; n < p; n += 3, m++) {
        var r = a[b[n]],
            t = a[b[n + 1]],
            s = a[b[n + 2]];
        q[m] = new THREE.Face3(r.index, t.index, s.index, [r.clone(), t.clone(), s.clone()])
    }
    for (var u = new THREE.Vector3, n = 0, p = q.length; n < p; n++) g(q[n], d);
    n = 0;
    for (p = this.faceVertexUvs[0].length; n < p; n++) b = this.faceVertexUvs[0][n], d = b[0].x, a = b[1].x, q = b[2].x, m = Math.max(d, Math.max(a, q)), r = Math.min(d, Math.min(a, q)), .9 < m && .1 > r && (.2 > d && (b[0].x += 1), .2 > a && (b[1].x += 1), .2 > q && (b[2].x += 1));
    n = 0;
    for (p = this.vertices.length; n < p; n++) this.vertices[n].multiplyScalar(c);
    this.mergeVertices();
    this.computeFaceNormals();
    this.boundingSphere = new THREE.Sphere(new THREE.Vector3, c)
};
THREE.PolyhedronGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.DodecahedronGeometry = function(a, b) {
    this.parameters = {
        radius: a,
        detail: b
    };
    var c = (1 + Math.sqrt(5)) / 2,
        d = 1 / c;
    THREE.PolyhedronGeometry.call(this, [-1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 0, -d, -c, 0, -d, c, 0, d, -c, 0, d, c, -d, -c, 0, -d, c, 0, d, -c, 0, d, c, 0, -c, 0, -d, c, 0, -d, -c, 0, d, c, 0, d], [3, 11, 7, 3, 7, 15, 3, 15, 13, 7, 19, 17, 7, 17, 6, 7, 6, 15, 17, 4, 8, 17, 8, 10, 17, 10, 6, 8, 0, 16, 8, 16, 2, 8, 2, 10, 0, 12, 1, 0, 1, 18, 0, 18, 16, 6, 10, 2, 6, 2, 13, 6, 13, 15, 2, 16, 18, 2, 18, 3, 2, 3, 13, 18, 1, 9, 18, 9, 11, 18, 11, 3, 4, 14, 12, 4, 12, 0, 4, 0, 8, 11, 9, 5, 11, 5, 19, 11, 19, 7, 19, 5, 14, 19, 14, 4, 19, 4, 17, 1, 12, 14, 1, 14, 5, 1, 5, 9], a, b)
};
THREE.DodecahedronGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.IcosahedronGeometry = function(a, b) {
    var c = (1 + Math.sqrt(5)) / 2;
    THREE.PolyhedronGeometry.call(this, [-1, c, 0, 1, c, 0, -1, -c, 0, 1, -c, 0, 0, -1, c, 0, 1, c, 0, -1, -c, 0, 1, -c, c, 0, -1, c, 0, 1, -c, 0, -1, -c, 0, 1], [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1], a, b);
    this.type = "IcosahedronGeometry";
    this.parameters = {
        radius: a,
        detail: b
    }
};
THREE.IcosahedronGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.OctahedronGeometry = function(a, b) {
    this.parameters = {
        radius: a,
        detail: b
    };
    THREE.PolyhedronGeometry.call(this, [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1], [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2], a, b);
    this.type = "OctahedronGeometry";
    this.parameters = {
        radius: a,
        detail: b
    }
};
THREE.OctahedronGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.TetrahedronGeometry = function(a, b) {
    THREE.PolyhedronGeometry.call(this, [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1], [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1], a, b);
    this.type = "TetrahedronGeometry";
    this.parameters = {
        radius: a,
        detail: b
    }
};
THREE.TetrahedronGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.ParametricGeometry = function(a, b, c) {
    THREE.Geometry.call(this);
    this.type = "ParametricGeometry";
    this.parameters = {
        func: a,
        slices: b,
        stacks: c
    };
    var d = this.vertices,
        e = this.faces,
        f = this.faceVertexUvs[0],
        g, h, k, n, p = b + 1;
    for (g = 0; g <= c; g++)
        for (n = g / c, h = 0; h <= b; h++) k = h / b, k = a(k, n), d.push(k);
    var q, m, r, t;
    for (g = 0; g < c; g++)
        for (h = 0; h < b; h++) a = g * p + h, d = g * p + h + 1, n = (g + 1) * p + h + 1, k = (g + 1) * p + h, q = new THREE.Vector2(h / b, g / c), m = new THREE.Vector2((h + 1) / b, g / c), r = new THREE.Vector2((h + 1) / b, (g + 1) / c), t = new THREE.Vector2(h / b, (g + 1) / c), e.push(new THREE.Face3(a, d, k)), f.push([q, m, t]), e.push(new THREE.Face3(d, n, k)), f.push([m.clone(), r, t.clone()]);
    this.computeFaceNormals();
    this.computeVertexNormals()
};
THREE.ParametricGeometry.prototype = Object.create(THREE.Geometry.prototype);
THREE.AxisHelper = function(a) {
    a = a || 1;
    var b = new Float32Array([0, 0, 0, a, 0, 0, 0, 0, 0, 0, a, 0, 0, 0, 0, 0, 0, a]),
        c = new Float32Array([1, 0, 0, 1, .6, 0, 0, 1, 0, .6, 1, 0, 0, 0, 1, 0, .6, 1]);
    a = new THREE.BufferGeometry;
    a.addAttribute("position", new THREE.BufferAttribute(b, 3));
    a.addAttribute("color", new THREE.BufferAttribute(c, 3));
    b = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors
    });
    THREE.Line.call(this, a, b, THREE.LinePieces)
};
THREE.AxisHelper.prototype = Object.create(THREE.Line.prototype);
THREE.ArrowHelper = function() {
    var a = new THREE.Geometry;
    a.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0));
    var b = new THREE.CylinderGeometry(0, .5, 1, 5, 1);
    b.applyMatrix((new THREE.Matrix4).makeTranslation(0, -.5, 0));
    return function(c, d, e, f, g, h) {
        THREE.Object3D.call(this);
        void 0 === f && (f = 16776960);
        void 0 === e && (e = 1);
        void 0 === g && (g = .2 * e);
        void 0 === h && (h = .2 * g);
        this.position.copy(d);
        this.line = new THREE.Line(a, new THREE.LineBasicMaterial({
            color: f
        }));
        this.line.matrixAutoUpdate = !1;
        this.add(this.line);
        this.cone = new THREE.Mesh(b, new THREE.MeshBasicMaterial({
            color: f
        }));
        this.cone.matrixAutoUpdate = !1;
        this.add(this.cone);
        this.setDirection(c);
        this.setLength(e, g, h)
    }
}();
THREE.ArrowHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.ArrowHelper.prototype.setDirection = function() {
    var a = new THREE.Vector3,
        b;
    return function(c) {
        .99999 < c.y ? this.quaternion.set(0, 0, 0, 1) : -.99999 > c.y ? this.quaternion.set(1, 0, 0, 0) : (a.set(c.z, 0, -c.x).normalize(), b = Math.acos(c.y), this.quaternion.setFromAxisAngle(a, b))
    }
}();
THREE.ArrowHelper.prototype.setLength = function(a, b, c) {
    void 0 === b && (b = .2 * a);
    void 0 === c && (c = .2 * b);
    this.line.scale.set(1, a, 1);
    this.line.updateMatrix();
    this.cone.scale.set(c, b, c);
    this.cone.position.y = a;
    this.cone.updateMatrix()
};
THREE.ArrowHelper.prototype.setColor = function(a) {
    this.line.material.color.set(a);
    this.cone.material.color.set(a)
};
THREE.BoxHelper = function(a) {
    var b = new THREE.BufferGeometry;
    b.addAttribute("position", new THREE.BufferAttribute(new Float32Array(72), 3));
    THREE.Line.call(this, b, new THREE.LineBasicMaterial({
        color: 16776960
    }), THREE.LinePieces);
    void 0 !== a && this.update(a)
};
THREE.BoxHelper.prototype = Object.create(THREE.Line.prototype);
THREE.BoxHelper.prototype.update = function(a) {
    var b = a.geometry;
    null === b.boundingBox && b.computeBoundingBox();
    var c = b.boundingBox.min,
        b = b.boundingBox.max,
        d = this.geometry.attributes.position.array;
    d[0] = b.x;
    d[1] = b.y;
    d[2] = b.z;
    d[3] = c.x;
    d[4] = b.y;
    d[5] = b.z;
    d[6] = c.x;
    d[7] = b.y;
    d[8] = b.z;
    d[9] = c.x;
    d[10] = c.y;
    d[11] = b.z;
    d[12] = c.x;
    d[13] = c.y;
    d[14] = b.z;
    d[15] = b.x;
    d[16] = c.y;
    d[17] = b.z;
    d[18] = b.x;
    d[19] = c.y;
    d[20] = b.z;
    d[21] = b.x;
    d[22] = b.y;
    d[23] = b.z;
    d[24] = b.x;
    d[25] = b.y;
    d[26] = c.z;
    d[27] = c.x;
    d[28] = b.y;
    d[29] = c.z;
    d[30] = c.x;
    d[31] = b.y;
    d[32] = c.z;
    d[33] = c.x;
    d[34] = c.y;
    d[35] = c.z;
    d[36] = c.x;
    d[37] = c.y;
    d[38] = c.z;
    d[39] = b.x;
    d[40] = c.y;
    d[41] = c.z;
    d[42] = b.x;
    d[43] = c.y;
    d[44] = c.z;
    d[45] = b.x;
    d[46] = b.y;
    d[47] = c.z;
    d[48] = b.x;
    d[49] = b.y;
    d[50] = b.z;
    d[51] = b.x;
    d[52] = b.y;
    d[53] = c.z;
    d[54] = c.x;
    d[55] = b.y;
    d[56] = b.z;
    d[57] = c.x;
    d[58] = b.y;
    d[59] = c.z;
    d[60] = c.x;
    d[61] = c.y;
    d[62] = b.z;
    d[63] = c.x;
    d[64] = c.y;
    d[65] = c.z;
    d[66] = b.x;
    d[67] = c.y;
    d[68] = b.z;
    d[69] = b.x;
    d[70] = c.y;
    d[71] = c.z;
    this.geometry.attributes.position.needsUpdate = !0;
    this.geometry.computeBoundingSphere();
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1
};
THREE.BoundingBoxHelper = function(a, b) {
    var c = void 0 !== b ? b : 8947848;
    this.object = a;
    this.box = new THREE.Box3;
    THREE.Mesh.call(this, new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
        color: c,
        wireframe: !0
    }))
};
THREE.BoundingBoxHelper.prototype = Object.create(THREE.Mesh.prototype);
THREE.BoundingBoxHelper.prototype.update = function() {
    this.box.setFromObject(this.object);
    this.box.size(this.scale);
    this.box.center(this.position)
};
THREE.CameraHelper = function(a) {
    function b(a, b, d) {
        c(a, d);
        c(b, d)
    }

    function c(a, b) {
        d.vertices.push(new THREE.Vector3);
        d.colors.push(new THREE.Color(b));
        void 0 === f[a] && (f[a] = []);
        f[a].push(d.vertices.length - 1)
    }
    var d = new THREE.Geometry,
        e = new THREE.LineBasicMaterial({
            color: 16777215,
            vertexColors: THREE.FaceColors
        }),
        f = {};
    b("n1", "n2", 16755200);
    b("n2", "n4", 16755200);
    b("n4", "n3", 16755200);
    b("n3", "n1", 16755200);
    b("f1", "f2", 16755200);
    b("f2", "f4", 16755200);
    b("f4", "f3", 16755200);
    b("f3", "f1", 16755200);
    b("n1", "f1", 16755200);
    b("n2", "f2", 16755200);
    b("n3", "f3", 16755200);
    b("n4", "f4", 16755200);
    b("p", "n1", 16711680);
    b("p", "n2", 16711680);
    b("p", "n3", 16711680);
    b("p", "n4", 16711680);
    b("u1", "u2", 43775);
    b("u2", "u3", 43775);
    b("u3", "u1", 43775);
    b("c", "t", 16777215);
    b("p", "c", 3355443);
    b("cn1", "cn2", 3355443);
    b("cn3", "cn4", 3355443);
    b("cf1", "cf2", 3355443);
    b("cf3", "cf4", 3355443);
    THREE.Line.call(this, d, e, THREE.LinePieces);
    this.camera = a;
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1;
    this.pointMap = f;
    this.update()
};
THREE.CameraHelper.prototype = Object.create(THREE.Line.prototype);
THREE.CameraHelper.prototype.update = function() {
    var a, b, c = new THREE.Vector3,
        d = new THREE.Camera,
        e = function(e, g, h, k) {
            c.set(g, h, k).unproject(d);
            e = b[e];
            if (void 0 !== e)
                for (g = 0, h = e.length; g < h; g++) a.vertices[e[g]].copy(c)
        };
    return function() {
        a = this.geometry;
        b = this.pointMap;
        d.projectionMatrix.copy(this.camera.projectionMatrix);
        e("c", 0, 0, -1);
        e("t", 0, 0, 1);
        e("n1", -1, -1, -1);
        e("n2", 1, -1, -1);
        e("n3", -1, 1, -1);
        e("n4", 1, 1, -1);
        e("f1", -1, -1, 1);
        e("f2", 1, -1, 1);
        e("f3", -1, 1, 1);
        e("f4", 1, 1, 1);
        e("u1", .7, 1.1, -1);
        e("u2", -.7, 1.1, -1);
        e("u3", 0, 2, -1);
        e("cf1", -1, 0, 1);
        e("cf2", 1, 0, 1);
        e("cf3", 0, -1, 1);
        e("cf4", 0, 1, 1);
        e("cn1", -1, 0, -1);
        e("cn2", 1, 0, -1);
        e("cn3", 0, -1, -1);
        e("cn4", 0, 1, -1);
        a.verticesNeedUpdate = !0
    }
}();
THREE.DirectionalLightHelper = function(a, b) {
    THREE.Object3D.call(this);
    this.light = a;
    this.light.updateMatrixWorld();
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1;
    b = b || 1;
    var c = new THREE.Geometry;
    c.vertices.push(new THREE.Vector3(-b, b, 0), new THREE.Vector3(b, b, 0), new THREE.Vector3(b, -b, 0), new THREE.Vector3(-b, -b, 0), new THREE.Vector3(-b, b, 0));
    var d = new THREE.LineBasicMaterial({
        fog: !1
    });
    d.color.copy(this.light.color).multiplyScalar(this.light.intensity);
    this.lightPlane = new THREE.Line(c, d);
    this.add(this.lightPlane);
    c = new THREE.Geometry;
    c.vertices.push(new THREE.Vector3, new THREE.Vector3);
    d = new THREE.LineBasicMaterial({
        fog: !1
    });
    d.color.copy(this.light.color).multiplyScalar(this.light.intensity);
    this.targetLine = new THREE.Line(c, d);
    this.add(this.targetLine);
    this.update()
};
THREE.DirectionalLightHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.DirectionalLightHelper.prototype.dispose = function() {
    this.lightPlane.geometry.dispose();
    this.lightPlane.material.dispose();
    this.targetLine.geometry.dispose();
    this.targetLine.material.dispose()
};
THREE.DirectionalLightHelper.prototype.update = function() {
    var a = new THREE.Vector3,
        b = new THREE.Vector3,
        c = new THREE.Vector3;
    return function() {
        a.setFromMatrixPosition(this.light.matrixWorld);
        b.setFromMatrixPosition(this.light.target.matrixWorld);
        c.subVectors(b, a);
        this.lightPlane.lookAt(c);
        this.lightPlane.material.color.copy(this.light.color).multiplyScalar(this.light.intensity);
        this.targetLine.geometry.vertices[1].copy(c);
        this.targetLine.geometry.verticesNeedUpdate = !0;
        this.targetLine.material.color.copy(this.lightPlane.material.color)
    }
}();
THREE.EdgesHelper = function(a, b) {
    var c = void 0 !== b ? b : 16777215,
        d = [0, 0],
        e = {},
        f = function(a, b) {
            return a - b
        },
        g = ["a", "b", "c"],
        h = new THREE.BufferGeometry,
        k = a.geometry.clone();
    k.mergeVertices();
    k.computeFaceNormals();
    for (var n = k.vertices, k = k.faces, p = 0, q = 0, m = k.length; q < m; q++)
        for (var r = k[q], t = 0; 3 > t; t++) {
            d[0] = r[g[t]];
            d[1] = r[g[(t + 1) % 3]];
            d.sort(f);
            var s = d.toString();
            void 0 === e[s] ? (e[s] = {
                vert1: d[0],
                vert2: d[1],
                face1: q,
                face2: void 0
            }, p++) : e[s].face2 = q
        }
    d = new Float32Array(6 * p);
    f = 0;
    for (s in e)
        if (g = e[s], void 0 === g.face2 || .9999 > k[g.face1].normal.dot(k[g.face2].normal)) p = n[g.vert1], d[f++] = p.x, d[f++] = p.y, d[f++] = p.z, p = n[g.vert2], d[f++] = p.x, d[f++] = p.y, d[f++] = p.z;
    h.addAttribute("position", new THREE.BufferAttribute(d, 3));
    THREE.Line.call(this, h, new THREE.LineBasicMaterial({
        color: c
    }), THREE.LinePieces);
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1
};
THREE.EdgesHelper.prototype = Object.create(THREE.Line.prototype);
THREE.FaceNormalsHelper = function(a, b, c, d) {
    this.object = a;
    this.size = void 0 !== b ? b : 1;
    a = void 0 !== c ? c : 16776960;
    d = void 0 !== d ? d : 1;
    b = new THREE.Geometry;
    c = 0;
    for (var e = this.object.geometry.faces.length; c < e; c++) b.vertices.push(new THREE.Vector3, new THREE.Vector3);
    THREE.Line.call(this, b, new THREE.LineBasicMaterial({
        color: a,
        linewidth: d
    }), THREE.LinePieces);
    this.matrixAutoUpdate = !1;
    this.normalMatrix = new THREE.Matrix3;
    this.update()
};
THREE.FaceNormalsHelper.prototype = Object.create(THREE.Line.prototype);
THREE.FaceNormalsHelper.prototype.update = function() {
    var a = this.geometry.vertices,
        b = this.object,
        c = b.geometry.vertices,
        d = b.geometry.faces,
        e = b.matrixWorld;
    b.updateMatrixWorld(!0);
    this.normalMatrix.getNormalMatrix(e);
    for (var f = b = 0, g = d.length; b < g; b++, f += 2) {
        var h = d[b];
        a[f].copy(c[h.a]).add(c[h.b]).add(c[h.c]).divideScalar(3).applyMatrix4(e);
        a[f + 1].copy(h.normal).applyMatrix3(this.normalMatrix).normalize().multiplyScalar(this.size).add(a[f])
    }
    this.geometry.verticesNeedUpdate = !0;
    return this
};
THREE.GridHelper = function(a, b) {
    var c = new THREE.Geometry,
        d = new THREE.LineBasicMaterial({
            vertexColors: THREE.VertexColors
        });
    this.color1 = new THREE.Color(4473924);
    this.color2 = new THREE.Color(8947848);
    for (var e = -a; e <= a; e += b) {
        c.vertices.push(new THREE.Vector3(-a, 0, e), new THREE.Vector3(a, 0, e), new THREE.Vector3(e, 0, -a), new THREE.Vector3(e, 0, a));
        var f = 0 === e ? this.color1 : this.color2;
        c.colors.push(f, f, f, f)
    }
    THREE.Line.call(this, c, d, THREE.LinePieces)
};
THREE.GridHelper.prototype = Object.create(THREE.Line.prototype);
THREE.GridHelper.prototype.setColors = function(a, b) {
    this.color1.set(a);
    this.color2.set(b);
    this.geometry.colorsNeedUpdate = !0
};
THREE.HemisphereLightHelper = function(a, b, c, d) {
    THREE.Object3D.call(this);
    this.light = a;
    this.light.updateMatrixWorld();
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1;
    this.colors = [new THREE.Color, new THREE.Color];
    a = new THREE.SphereGeometry(b, 4, 2);
    a.applyMatrix((new THREE.Matrix4).makeRotationX(-Math.PI / 2));
    for (b = 0; 8 > b; b++) a.faces[b].color = this.colors[4 > b ? 0 : 1];
    b = new THREE.MeshBasicMaterial({
        vertexColors: THREE.FaceColors,
        wireframe: !0
    });
    this.lightSphere = new THREE.Mesh(a, b);
    this.add(this.lightSphere);
    this.update()
};
THREE.HemisphereLightHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.HemisphereLightHelper.prototype.dispose = function() {
    this.lightSphere.geometry.dispose();
    this.lightSphere.material.dispose()
};
THREE.HemisphereLightHelper.prototype.update = function() {
    var a = new THREE.Vector3;
    return function() {
        this.colors[0].copy(this.light.color).multiplyScalar(this.light.intensity);
        this.colors[1].copy(this.light.groundColor).multiplyScalar(this.light.intensity);
        this.lightSphere.lookAt(a.setFromMatrixPosition(this.light.matrixWorld).negate());
        this.lightSphere.geometry.colorsNeedUpdate = !0
    }
}();
THREE.PointLightHelper = function(a, b) {
    this.light = a;
    this.light.updateMatrixWorld();
    var c = new THREE.SphereGeometry(b, 4, 2),
        d = new THREE.MeshBasicMaterial({
            wireframe: !0,
            fog: !1
        });
    d.color.copy(this.light.color).multiplyScalar(this.light.intensity);
    THREE.Mesh.call(this, c, d);
    this.matrix = this.light.matrixWorld;
    this.matrixAutoUpdate = !1
};
THREE.PointLightHelper.prototype = Object.create(THREE.Mesh.prototype);
THREE.PointLightHelper.prototype.dispose = function() {
    this.geometry.dispose();
    this.material.dispose()
};
THREE.PointLightHelper.prototype.update = function() {
    this.material.color.copy(this.light.color).multiplyScalar(this.light.intensity)
};
THREE.SkeletonHelper = function(a) {
    this.bones = this.getBoneList(a);
    for (var b = new THREE.Geometry, c = 0; c < this.bones.length; c++) this.bones[c].parent instanceof THREE.Bone && (b.vertices.push(new THREE.Vector3), b.vertices.push(new THREE.Vector3), b.colors.push(new THREE.Color(0, 0, 1)), b.colors.push(new THREE.Color(0, 1, 0)));
    c = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors,
        depthTest: !1,
        depthWrite: !1,
        transparent: !0
    });
    THREE.Line.call(this, b, c, THREE.LinePieces);
    this.root = a;
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1;
    this.update()
};
THREE.SkeletonHelper.prototype = Object.create(THREE.Line.prototype);
THREE.SkeletonHelper.prototype.getBoneList = function(a) {
    var b = [];
    a instanceof THREE.Bone && b.push(a);
    for (var c = 0; c < a.children.length; c++) b.push.apply(b, this.getBoneList(a.children[c]));
    return b
};
THREE.SkeletonHelper.prototype.update = function() {
    for (var a = this.geometry, b = (new THREE.Matrix4).getInverse(this.root.matrixWorld), c = new THREE.Matrix4, d = 0, e = 0; e < this.bones.length; e++) {
        var f = this.bones[e];
        f.parent instanceof THREE.Bone && (c.multiplyMatrices(b, f.matrixWorld), a.vertices[d].setFromMatrixPosition(c), c.multiplyMatrices(b, f.parent.matrixWorld), a.vertices[d + 1].setFromMatrixPosition(c), d += 2)
    }
    a.verticesNeedUpdate = !0;
    a.computeBoundingSphere()
};
THREE.SpotLightHelper = function(a) {
    THREE.Object3D.call(this);
    this.light = a;
    this.light.updateMatrixWorld();
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1;
    a = new THREE.CylinderGeometry(0, 1, 1, 8, 1, !0);
    a.applyMatrix((new THREE.Matrix4).makeTranslation(0, -.5, 0));
    a.applyMatrix((new THREE.Matrix4).makeRotationX(-Math.PI / 2));
    var b = new THREE.MeshBasicMaterial({
        wireframe: !0,
        fog: !1
    });
    this.cone = new THREE.Mesh(a, b);
    this.add(this.cone);
    this.update()
};
THREE.SpotLightHelper.prototype = Object.create(THREE.Object3D.prototype);
THREE.SpotLightHelper.prototype.dispose = function() {
    this.cone.geometry.dispose();
    this.cone.material.dispose()
};
THREE.SpotLightHelper.prototype.update = function() {
    var a = new THREE.Vector3,
        b = new THREE.Vector3;
    return function() {
        var c = this.light.distance ? this.light.distance : 1e4,
            d = c * Math.tan(this.light.angle);
        this.cone.scale.set(d, d, c);
        a.setFromMatrixPosition(this.light.matrixWorld);
        b.setFromMatrixPosition(this.light.target.matrixWorld);
        this.cone.lookAt(b.sub(a));
        this.cone.material.color.copy(this.light.color).multiplyScalar(this.light.intensity)
    }
}();
THREE.VertexNormalsHelper = function(a, b, c, d) {
    this.object = a;
    this.size = void 0 !== b ? b : 1;
    b = void 0 !== c ? c : 16711680;
    d = void 0 !== d ? d : 1;
    c = new THREE.Geometry;
    a = a.geometry.faces;
    for (var e = 0, f = a.length; e < f; e++)
        for (var g = 0, h = a[e].vertexNormals.length; g < h; g++) c.vertices.push(new THREE.Vector3, new THREE.Vector3);
    THREE.Line.call(this, c, new THREE.LineBasicMaterial({
        color: b,
        linewidth: d
    }), THREE.LinePieces);
    this.matrixAutoUpdate = !1;
    this.normalMatrix = new THREE.Matrix3;
    this.update()
};
THREE.VertexNormalsHelper.prototype = Object.create(THREE.Line.prototype);
THREE.VertexNormalsHelper.prototype.update = function(a) {
    var b = new THREE.Vector3;
    return function(a) {
        a = ["a", "b", "c", "d"];
        this.object.updateMatrixWorld(!0);
        this.normalMatrix.getNormalMatrix(this.object.matrixWorld);
        for (var d = this.geometry.vertices, e = this.object.geometry.vertices, f = this.object.geometry.faces, g = this.object.matrixWorld, h = 0, k = 0, n = f.length; k < n; k++)
            for (var p = f[k], q = 0, m = p.vertexNormals.length; q < m; q++) {
                var r = p.vertexNormals[q];
                d[h].copy(e[p[a[q]]]).applyMatrix4(g);
                b.copy(r).applyMatrix3(this.normalMatrix).normalize().multiplyScalar(this.size);
                b.add(d[h]);
                h += 1;
                d[h].copy(b);
                h += 1
            }
        this.geometry.verticesNeedUpdate = !0;
        return this
    }
}();
THREE.VertexTangentsHelper = function(a, b, c, d) {
    this.object = a;
    this.size = void 0 !== b ? b : 1;
    b = void 0 !== c ? c : 255;
    d = void 0 !== d ? d : 1;
    c = new THREE.Geometry;
    a = a.geometry.faces;
    for (var e = 0, f = a.length; e < f; e++)
        for (var g = 0, h = a[e].vertexTangents.length; g < h; g++) c.vertices.push(new THREE.Vector3), c.vertices.push(new THREE.Vector3);
    THREE.Line.call(this, c, new THREE.LineBasicMaterial({
        color: b,
        linewidth: d
    }), THREE.LinePieces);
    this.matrixAutoUpdate = !1;
    this.update()
};
THREE.VertexTangentsHelper.prototype = Object.create(THREE.Line.prototype);
THREE.VertexTangentsHelper.prototype.update = function(a) {
    var b = new THREE.Vector3;
    return function(a) {
        a = ["a", "b", "c", "d"];
        this.object.updateMatrixWorld(!0);
        for (var d = this.geometry.vertices, e = this.object.geometry.vertices, f = this.object.geometry.faces, g = this.object.matrixWorld, h = 0, k = 0, n = f.length; k < n; k++)
            for (var p = f[k], q = 0, m = p.vertexTangents.length; q < m; q++) {
                var r = p.vertexTangents[q];
                d[h].copy(e[p[a[q]]]).applyMatrix4(g);
                b.copy(r).transformDirection(g).multiplyScalar(this.size);
                b.add(d[h]);
                h += 1;
                d[h].copy(b);
                h += 1
            }
        this.geometry.verticesNeedUpdate = !0;
        return this
    }
}();
THREE.WireframeHelper = function(a, b) {
    var c = void 0 !== b ? b : 16777215,
        d = [0, 0],
        e = {},
        f = function(a, b) {
            return a - b
        },
        g = ["a", "b", "c"],
        h = new THREE.BufferGeometry;
    if (a.geometry instanceof THREE.Geometry) {
        for (var k = a.geometry.vertices, n = a.geometry.faces, p = 0, q = new Uint32Array(6 * n.length), m = 0, r = n.length; m < r; m++)
            for (var t = n[m], s = 0; 3 > s; s++) {
                d[0] = t[g[s]];
                d[1] = t[g[(s + 1) % 3]];
                d.sort(f);
                var u = d.toString();
                void 0 === e[u] && (q[2 * p] = d[0], q[2 * p + 1] = d[1], e[u] = !0, p++)
            }
        d = new Float32Array(6 * p);
        m = 0;
        for (r = p; m < r; m++)
            for (s = 0; 2 > s; s++) p = k[q[2 * m + s]], g = 6 * m + 3 * s, d[g + 0] = p.x, d[g + 1] = p.y, d[g + 2] = p.z;
        h.addAttribute("position", new THREE.BufferAttribute(d, 3))
    } else if (a.geometry instanceof THREE.BufferGeometry) {
        if (void 0 !== a.geometry.attributes.index) {
            k = a.geometry.attributes.position.array;
            r = a.geometry.attributes.index.array;
            n = a.geometry.drawcalls;
            p = 0;
            0 === n.length && (n = [{
                count: r.length,
                index: 0,
                start: 0
            }]);
            for (var q = new Uint32Array(2 * r.length), t = 0, v = n.length; t < v; ++t)
                for (var s = n[t].start, u = n[t].count, g = n[t].index, m = s, y = s + u; m < y; m += 3)
                    for (s = 0; 3 > s; s++) d[0] = g + r[m + s], d[1] = g + r[m + (s + 1) % 3], d.sort(f), u = d.toString(), void 0 === e[u] && (q[2 * p] = d[0], q[2 * p + 1] = d[1], e[u] = !0, p++);
            d = new Float32Array(6 * p);
            m = 0;
            for (r = p; m < r; m++)
                for (s = 0; 2 > s; s++) g = 6 * m + 3 * s, p = 3 * q[2 * m + s], d[g + 0] = k[p], d[g + 1] = k[p + 1], d[g + 2] = k[p + 2]
        } else
            for (k = a.geometry.attributes.position.array, p = k.length / 3, q = p / 3, d = new Float32Array(6 * p), m = 0, r = q; m < r; m++)
                for (s = 0; 3 > s; s++) g = 18 * m + 6 * s, q = 9 * m + 3 * s, d[g + 0] = k[q], d[g + 1] = k[q + 1], d[g + 2] = k[q + 2], p = 9 * m + (s + 1) % 3 * 3, d[g + 3] = k[p], d[g + 4] = k[p + 1], d[g + 5] = k[p + 2];
        h.addAttribute("position", new THREE.BufferAttribute(d, 3))
    }
    THREE.Line.call(this, h, new THREE.LineBasicMaterial({
        color: c
    }), THREE.LinePieces);
    this.matrix = a.matrixWorld;
    this.matrixAutoUpdate = !1
};
THREE.WireframeHelper.prototype = Object.create(THREE.Line.prototype);
THREE.ImmediateRenderObject = function() {
    THREE.Object3D.call(this);
    this.render = function(a) {}
};
THREE.ImmediateRenderObject.prototype = Object.create(THREE.Object3D.prototype);
THREE.MorphBlendMesh = function(a, b) {
    THREE.Mesh.call(this, a, b);
    this.animationsMap = {};
    this.animationsList = [];
    var c = this.geometry.morphTargets.length;
    this.createAnimation("__default", 0, c - 1, c / 1);
    this.setAnimationWeight("__default", 1)
};
THREE.MorphBlendMesh.prototype = Object.create(THREE.Mesh.prototype);
THREE.MorphBlendMesh.prototype.createAnimation = function(a, b, c, d) {
    b = {
        startFrame: b,
        endFrame: c,
        length: c - b + 1,
        fps: d,
        duration: (c - b) / d,
        lastFrame: 0,
        currentFrame: 0,
        active: !1,
        time: 0,
        direction: 1,
        weight: 1,
        directionBackwards: !1,
        mirroredLoop: !1
    };
    this.animationsMap[a] = b;
    this.animationsList.push(b)
};
THREE.MorphBlendMesh.prototype.autoCreateAnimations = function(a) {
    for (var b = /([a-z]+)_?(\d+)/, c, d = {}, e = this.geometry, f = 0, g = e.morphTargets.length; f < g; f++) {
        var h = e.morphTargets[f].name.match(b);
        if (h && 1 < h.length) {
            var k = h[1];
            d[k] || (d[k] = {
                start: Infinity,
                end: -Infinity
            });
            h = d[k];
            f < h.start && (h.start = f);
            f > h.end && (h.end = f);
            c || (c = k)
        }
    }
    for (k in d) h = d[k], this.createAnimation(k, h.start, h.end, a);
    this.firstAnimation = c
};
THREE.MorphBlendMesh.prototype.setAnimationDirectionForward = function(a) {
    if (a = this.animationsMap[a]) a.direction = 1, a.directionBackwards = !1
};
THREE.MorphBlendMesh.prototype.setAnimationDirectionBackward = function(a) {
    if (a = this.animationsMap[a]) a.direction = -1, a.directionBackwards = !0
};
THREE.MorphBlendMesh.prototype.setAnimationFPS = function(a, b) {
    var c = this.animationsMap[a];
    c && (c.fps = b, c.duration = (c.end - c.start) / c.fps)
};
THREE.MorphBlendMesh.prototype.setAnimationDuration = function(a, b) {
    var c = this.animationsMap[a];
    c && (c.duration = b, c.fps = (c.end - c.start) / c.duration)
};
THREE.MorphBlendMesh.prototype.setAnimationWeight = function(a, b) {
    var c = this.animationsMap[a];
    c && (c.weight = b)
};
THREE.MorphBlendMesh.prototype.setAnimationTime = function(a, b) {
    var c = this.animationsMap[a];
    c && (c.time = b)
};
THREE.MorphBlendMesh.prototype.getAnimationTime = function(a) {
    var b = 0;
    if (a = this.animationsMap[a]) b = a.time;
    return b
};
THREE.MorphBlendMesh.prototype.getAnimationDuration = function(a) {
    var b = -1;
    if (a = this.animationsMap[a]) b = a.duration;
    return b
};
THREE.MorphBlendMesh.prototype.playAnimation = function(a) {
    var b = this.animationsMap[a];
    b ? (b.time = 0, b.active = !0) : console.warn("animation[" + a + "] undefined")
};
THREE.MorphBlendMesh.prototype.stopAnimation = function(a) {
    if (a = this.animationsMap[a]) a.active = !1
};
THREE.MorphBlendMesh.prototype.update = function(a) {
    for (var b = 0, c = this.animationsList.length; b < c; b++) {
        var d = this.animationsList[b];
        if (d.active) {
            var e = d.duration / d.length;
            d.time += d.direction * a;
            if (d.mirroredLoop) {
                if (d.time > d.duration || 0 > d.time) d.direction *= -1, d.time > d.duration && (d.time = d.duration, d.directionBackwards = !0), 0 > d.time && (d.time = 0, d.directionBackwards = !1)
            } else d.time %= d.duration, 0 > d.time && (d.time += d.duration);
            var f = d.startFrame + THREE.Math.clamp(Math.floor(d.time / e), 0, d.length - 1),
                g = d.weight;
            f !== d.currentFrame && (this.morphTargetInfluences[d.lastFrame] = 0, this.morphTargetInfluences[d.currentFrame] = 1 * g, this.morphTargetInfluences[f] = 0, d.lastFrame = d.currentFrame, d.currentFrame = f);
            e = d.time % e / e;
            d.directionBackwards && (e = 1 - e);
            this.morphTargetInfluences[d.currentFrame] = e * g;
            this.morphTargetInfluences[d.lastFrame] = (1 - e) * g
        }
    }
};
THREE.OrbitControls = function(object, domElement) {
    this.object = object;
    this.domElement = domElement !== undefined ? domElement : document;
    this.enabled = true;
    this.target = new THREE.Vector3;
    this.center = this.target;
    this.noZoom = false;
    this.zoomSpeed = 1;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.noRotate = false;
    this.rotateSpeed = 1;
    this.noPan = false;
    this.keyPanSpeed = 7;
    this.autoRotate = false;
    this.autoRotateSpeed = 2;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;
    this.noKeys = false;
    this.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };
    this.mouseButtons = {
        ORBIT: THREE.MOUSE.LEFT,
        ZOOM: THREE.MOUSE.MIDDLE,
        PAN: THREE.MOUSE.RIGHT
    };
    var scope = this;
    var EPS = 1e-6;
    var rotateStart = new THREE.Vector2;
    var rotateEnd = new THREE.Vector2;
    var rotateDelta = new THREE.Vector2;
    var panStart = new THREE.Vector2;
    var panEnd = new THREE.Vector2;
    var panDelta = new THREE.Vector2;
    var panOffset = new THREE.Vector3;
    var offset = new THREE.Vector3;
    var dollyStart = new THREE.Vector2;
    var dollyEnd = new THREE.Vector2;
    var dollyDelta = new THREE.Vector2;
    var phiDelta = 0;
    var thetaDelta = 0;
    var scale = 1;
    var pan = new THREE.Vector3;
    var lastPosition = new THREE.Vector3;
    var lastQuaternion = new THREE.Quaternion;
    var STATE = {
        NONE: -1,
        ROTATE: 0,
        DOLLY: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_DOLLY: 4,
        TOUCH_PAN: 5
    };
    var state = STATE.NONE;
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    var quat = (new THREE.Quaternion).setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();
    var changeEvent = {
        type: "change"
    };
    var startEvent = {
        type: "start"
    };
    var endEvent = {
        type: "end"
    };
    this.rotateLeft = function(angle) {
        if (angle === undefined) {
            angle = getAutoRotationAngle()
        }
        thetaDelta -= angle
    };
    this.rotateUp = function(angle) {
        if (angle === undefined) {
            angle = getAutoRotationAngle()
        }
        phiDelta -= angle
    };
    this.panLeft = function(distance) {
        var te = this.object.matrix.elements;
        panOffset.set(te[0], te[1], te[2]);
        panOffset.multiplyScalar(-distance);
        pan.add(panOffset)
    };
    this.panUp = function(distance) {
        var te = this.object.matrix.elements;
        panOffset.set(te[4], te[5], te[6]);
        panOffset.multiplyScalar(distance);
        pan.add(panOffset)
    };
    this.pan = function(deltaX, deltaY) {
        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
        if (scope.object.fov !== undefined) {
            var position = scope.object.position;
            var offset = position.clone().sub(scope.target);
            var targetDistance = offset.length();
            targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
            scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
            scope.panUp(2 * deltaY * targetDistance / element.clientHeight)
        } else if (scope.object.top !== undefined) {
            scope.panLeft(deltaX * (scope.object.right - scope.object.left) / element.clientWidth);
            scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight)
        } else {
            console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.")
        }
    };
    this.dollyIn = function(dollyScale) {
        if (dollyScale === undefined) {
            dollyScale = getZoomScale()
        }
        scale /= dollyScale
    };
    this.dollyOut = function(dollyScale) {
        if (dollyScale === undefined) {
            dollyScale = getZoomScale()
        }
        scale *= dollyScale
    };
    this.update = function() {
        var position = this.object.position;
        offset.copy(position).sub(this.target);
        offset.applyQuaternion(quat);
        var theta = Math.atan2(offset.x, offset.z);
        var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
        if (this.autoRotate) {
            this.rotateLeft(getAutoRotationAngle())
        }
        theta += thetaDelta;
        phi += phiDelta;
        theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));
        phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
        phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
        var radius = offset.length() * scale;
        radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));
        this.target.add(pan);
        offset.x = radius * Math.sin(phi) * Math.sin(theta);
        offset.y = radius * Math.cos(phi);
        offset.z = radius * Math.sin(phi) * Math.cos(theta);
        offset.applyQuaternion(quatInverse);
        position.copy(this.target).add(offset);
        this.object.lookAt(this.target);
        thetaDelta = 0;
        phiDelta = 0;
        scale = 1;
        pan.set(0, 0, 0);
        if (lastPosition.distanceToSquared(this.object.position) > EPS || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {
            this.dispatchEvent(changeEvent);
            lastPosition.copy(this.object.position);
            lastQuaternion.copy(this.object.quaternion)
        }
    };
    this.reset = function() {
        state = STATE.NONE;
        this.target.copy(this.target0);
        this.object.position.copy(this.position0);
        this.update()
    };

    function getAutoRotationAngle() {
        return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed
    }

    function getZoomScale() {
        return Math.pow(.95, scope.zoomSpeed)
    }

    function onMouseDown(event) {
        if (scope.enabled === false) return;
        event.preventDefault();
        if (event.button === scope.mouseButtons.ORBIT) {
            if (scope.noRotate === true) return;
            state = STATE.ROTATE;
            rotateStart.set(event.clientX, event.clientY)
        } else if (event.button === scope.mouseButtons.ZOOM) {
            if (scope.noZoom === true) return;
            state = STATE.DOLLY;
            dollyStart.set(event.clientX, event.clientY)
        } else if (event.button === scope.mouseButtons.PAN) {
            if (scope.noPan === true) return;
            state = STATE.PAN;
            panStart.set(event.clientX, event.clientY)
        }
        document.addEventListener("mousemove", onMouseMove, false);
        document.addEventListener("mouseup", onMouseUp, false);
        scope.dispatchEvent(startEvent)
    }

    function onMouseMove(event) {
        if (scope.enabled === false) return;
        event.preventDefault();
        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
        if (state === STATE.ROTATE) {
            if (scope.noRotate === true) return;
            rotateEnd.set(event.clientX, event.clientY);
            rotateDelta.subVectors(rotateEnd, rotateStart);
            scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
            scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
            rotateStart.copy(rotateEnd)
        } else if (state === STATE.DOLLY) {
            if (scope.noZoom === true) return;
            dollyEnd.set(event.clientX, event.clientY);
            dollyDelta.subVectors(dollyEnd, dollyStart);
            if (dollyDelta.y > 0) {
                scope.dollyIn()
            } else {
                scope.dollyOut()
            }
            dollyStart.copy(dollyEnd)
        } else if (state === STATE.PAN) {
            if (scope.noPan === true) return;
            panEnd.set(event.clientX, event.clientY);
            panDelta.subVectors(panEnd, panStart);
            scope.pan(panDelta.x, panDelta.y);
            panStart.copy(panEnd)
        }
        scope.update()
    }

    function onMouseUp() {
        if (scope.enabled === false) return;
        document.removeEventListener("mousemove", onMouseMove, false);
        document.removeEventListener("mouseup", onMouseUp, false);
        scope.dispatchEvent(endEvent);
        state = STATE.NONE
    }

    function onMouseWheel(event) {
        if (scope.enabled === false || scope.noZoom === true) return;
        event.preventDefault();
        event.stopPropagation();
        var delta = 0;
        if (event.wheelDelta !== undefined) {
            delta = event.wheelDelta
        } else if (event.detail !== undefined) {
            delta = -event.detail
        }
        if (delta > 0) {
            scope.dollyOut()
        } else {
            scope.dollyIn()
        }
        scope.update();
        scope.dispatchEvent(startEvent);
        scope.dispatchEvent(endEvent)
    }

    function onKeyDown(event) {
        if (scope.enabled === false || scope.noKeys === true || scope.noPan === true) return;
        switch (event.keyCode) {
            case scope.keys.UP:
                scope.pan(0, scope.keyPanSpeed);
                scope.update();
                break;
            case scope.keys.BOTTOM:
                scope.pan(0, -scope.keyPanSpeed);
                scope.update();
                break;
            case scope.keys.LEFT:
                scope.pan(scope.keyPanSpeed, 0);
                scope.update();
                break;
            case scope.keys.RIGHT:
                scope.pan(-scope.keyPanSpeed, 0);
                scope.update();
                break
        }
    }

    function touchstart(event) {
        if (scope.enabled === false) return;
        switch (event.touches.length) {
            case 1:
                if (scope.noRotate === true) return;
                state = STATE.TOUCH_ROTATE;
                rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
                break;
            case 2:
                if (scope.noZoom === true) return;
                state = STATE.TOUCH_DOLLY;
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                dollyStart.set(0, distance);
                break;
            case 3:
                if (scope.noPan === true) return;
                state = STATE.TOUCH_PAN;
                panStart.set(event.touches[0].pageX, event.touches[0].pageY);
                break;
            default:
                state = STATE.NONE
        }
        scope.dispatchEvent(startEvent)
    }

    function touchmove(event) {
        if (scope.enabled === false) return;
        event.preventDefault();
        event.stopPropagation();
        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
        switch (event.touches.length) {
            case 1:
                if (scope.noRotate === true) return;
                if (state !== STATE.TOUCH_ROTATE) return;
                rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                rotateDelta.subVectors(rotateEnd, rotateStart);
                scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
                scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
                rotateStart.copy(rotateEnd);
                scope.update();
                break;
            case 2:
                if (scope.noZoom === true) return;
                if (state !== STATE.TOUCH_DOLLY) return;
                var dx = event.touches[0].pageX - event.touches[1].pageX;
                var dy = event.touches[0].pageY - event.touches[1].pageY;
                var distance = Math.sqrt(dx * dx + dy * dy);
                dollyEnd.set(0, distance);
                dollyDelta.subVectors(dollyEnd, dollyStart);
                if (dollyDelta.y > 0) {
                    scope.dollyOut()
                } else {
                    scope.dollyIn()
                }
                dollyStart.copy(dollyEnd);
                scope.update();
                break;
            case 3:
                if (scope.noPan === true) return;
                if (state !== STATE.TOUCH_PAN) return;
                panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                panDelta.subVectors(panEnd, panStart);
                scope.pan(panDelta.x, panDelta.y);
                panStart.copy(panEnd);
                scope.update();
                break;
            default:
                state = STATE.NONE
        }
    }

    function touchend() {
        if (scope.enabled === false) return;
        scope.dispatchEvent(endEvent);
        state = STATE.NONE
    }
    this.domElement.addEventListener("contextmenu", function(event) {
        event.preventDefault()
    }, false);
    this.domElement.addEventListener("mousedown", onMouseDown, false);
    this.domElement.addEventListener("mousewheel", onMouseWheel, false);
    this.domElement.addEventListener("DOMMouseScroll", onMouseWheel, false);
    this.domElement.addEventListener("touchstart", touchstart, false);
    this.domElement.addEventListener("touchend", touchend, false);
    this.domElement.addEventListener("touchmove", touchmove, false);
    window.addEventListener("keydown", onKeyDown, false);
    this.update()
};
THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
(function(a) {
    StateMachine = {
        VERSION: "2.1.0",
        Result: {
            SUCCEEDED: 1,
            NOTRANSITION: 2,
            CANCELLED: 3,
            ASYNC: 4
        },
        Error: {
            INVALID_TRANSITION: 100,
            PENDING_TRANSITION: 200,
            INVALID_CALLBACK: 300
        },
        WILDCARD: "*",
        ASYNC: "async",
        create: function(f, g) {
            var i = typeof f.initial == "string" ? {
                state: f.initial
            } : f.initial;
            var e = g || f.target || {};
            var k = f.events || [];
            var h = f.callbacks || {};
            var c = {};
            var j = function(l) {
                var o = l.from instanceof Array ? l.from : l.from ? [l.from] : [StateMachine.WILDCARD];
                c[l.name] = c[l.name] || {};
                for (var m = 0; m < o.length; m++) {
                    c[l.name][o[m]] = l.to || o[m]
                }
            };
            if (i) {
                i.event = i.event || "startup";
                j({
                    name: i.event,
                    from: "none",
                    to: i.state
                })
            }
            for (var d = 0; d < k.length; d++) {
                j(k[d])
            }
            for (var b in c) {
                if (c.hasOwnProperty(b)) {
                    e[b] = StateMachine.buildEvent(b, c[b])
                }
            }
            for (var b in h) {
                if (h.hasOwnProperty(b)) {
                    e[b] = h[b]
                }
            }
            e.current = "none";
            e.is = function(l) {
                return this.current == l
            };
            e.can = function(l) {
                return !this.transition && (c[l].hasOwnProperty(this.current) || c[l].hasOwnProperty(StateMachine.WILDCARD))
            };
            e.cannot = function(l) {
                return !this.can(l)
            };
            e.error = f.error || function(n, r, q, m, l, p, o) {
                throw o || p
            };
            if (i && !i.defer) {
                e[i.event]()
            }
            return e
        },
        doCallback: function(g, d, c, i, h, b) {
            if (d) {
                try {
                    return d.apply(g, [c, i, h].concat(b))
                } catch (f) {
                    return g.error(c, i, h, b, StateMachine.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", f)
                }
            }
        },
        beforeEvent: function(d, c, f, e, b) {
            return StateMachine.doCallback(d, d["onbefore" + c], c, f, e, b)
        },
        afterEvent: function(d, c, f, e, b) {
            return StateMachine.doCallback(d, d["onafter" + c] || d["on" + c], c, f, e, b)
        },
        leaveState: function(d, c, f, e, b) {
            return StateMachine.doCallback(d, d["onleave" + f], c, f, e, b)
        },
        enterState: function(d, c, f, e, b) {
            return StateMachine.doCallback(d, d["onenter" + e] || d["on" + e], c, f, e, b)
        },
        changeState: function(d, c, f, e, b) {
            return StateMachine.doCallback(d, d.onchangestate, c, f, e, b)
        },
        buildEvent: function(b, c) {
            return function() {
                var h = this.current;
                var g = c[h] || c[StateMachine.WILDCARD] || h;
                var e = Array.prototype.slice.call(arguments);
                if (this.transition) {
                    return this.error(b, h, g, e, StateMachine.Error.PENDING_TRANSITION, "event " + b + " inappropriate because previous transition did not complete")
                }
                if (this.cannot(b)) {
                    return this.error(b, h, g, e, StateMachine.Error.INVALID_TRANSITION, "event " + b + " inappropriate in current state " + this.current)
                }
                if (false === StateMachine.beforeEvent(this, b, h, g, e)) {
                    return StateMachine.CANCELLED
                }
                if (h === g) {
                    StateMachine.afterEvent(this, b, h, g, e);
                    return StateMachine.NOTRANSITION
                }
                var f = this;
                this.transition = function() {
                    f.transition = null;
                    f.current = g;
                    StateMachine.enterState(f, b, h, g, e);
                    StateMachine.changeState(f, b, h, g, e);
                    StateMachine.afterEvent(f, b, h, g, e)
                };
                var d = StateMachine.leaveState(this, b, h, g, e);
                if (false === d) {
                    this.transition = null;
                    return StateMachine.CANCELLED
                } else {
                    if ("async" === d) {
                        return StateMachine.ASYNC
                    } else {
                        if (this.transition) {
                            this.transition()
                        }
                        return StateMachine.SUCCEEDED
                    }
                }
            }
        }
    };
    if ("function" === typeof define) {
        define([], function() {
            return StateMachine
        })
    } else {
        a.StateMachine = StateMachine
    }
})(this);
(function(a, b, c) {
    function g(a, c) {
        var d = b.createElement(a || "div"),
            e;
        for (e in c) d[e] = c[e];
        return d
    }

    function h(a) {
        for (var b = 1, c = arguments.length; b < c; b++) a.appendChild(arguments[b]);
        return a
    }

    function j(a, b, c, d) {
        var g = ["opacity", b, ~~(a * 100), c, d].join("-"),
            h = .01 + c / d * 100,
            j = Math.max(1 - (1 - a) / b * (100 - h), a),
            k = f.substring(0, f.indexOf("Animation")).toLowerCase(),
            l = k && "-" + k + "-" || "";
        return e[g] || (i.insertRule("@" + l + "keyframes " + g + "{" + "0%{opacity:" + j + "}" + h + "%{opacity:" + a + "}" + (h + .01) + "%{opacity:1}" + (h + b) % 100 + "%{opacity:" + a + "}" + "100%{opacity:" + j + "}" + "}", 0), e[g] = 1), g
    }

    function k(a, b) {
        var e = a.style,
            f, g;
        if (e[b] !== c) return b;
        b = b.charAt(0).toUpperCase() + b.slice(1);
        for (g = 0; g < d.length; g++) {
            f = d[g] + b;
            if (e[f] !== c) return f
        }
    }

    function l(a, b) {
        for (var c in b) a.style[k(a, c) || c] = b[c];
        return a
    }

    function m(a) {
        for (var b = 1; b < arguments.length; b++) {
            var d = arguments[b];
            for (var e in d) a[e] === c && (a[e] = d[e])
        }
        return a
    }

    function n(a) {
        var b = {
            x: a.offsetLeft,
            y: a.offsetTop
        };
        while (a = a.offsetParent) b.x += a.offsetLeft, b.y += a.offsetTop;
        return b
    }
    var d = ["webkit", "Moz", "ms", "O"],
        e = {},
        f, i = function() {
            var a = g("style");
            return h(b.getElementsByTagName("head")[0], a), a.sheet || a.styleSheet
        }(),
        o = {
            lines: 12,
            length: 7,
            width: 5,
            radius: 10,
            rotate: 0,
            color: "#000",
            speed: 1,
            trail: 100,
            opacity: .25,
            fps: 20,
            zIndex: 2e9,
            className: "spinner",
            top: "auto",
            left: "auto"
        },
        p = function q(a) {
            if (!this.spin) return new q(a);
            this.opts = m(a || {}, q.defaults, o)
        };
    p.defaults = {}, m(p.prototype, {
        spin: function(a) {
            this.stop();
            var b = this,
                c = b.opts,
                d = b.el = l(g(0, {
                    className: c.className
                }), {
                    position: "relative",
                    zIndex: c.zIndex
                }),
                e = c.radius + c.length + c.width,
                h, i;
            a && (a.insertBefore(d, a.firstChild || null), i = n(a), h = n(d), l(d, {
                left: (c.left == "auto" ? i.x - h.x + (a.offsetWidth >> 1) : c.left + e) + "px",
                top: (c.top == "auto" ? i.y - h.y + (a.offsetHeight >> 1) : c.top + e) + "px"
            })), d.setAttribute("aria-role", "progressbar"), b.lines(d, b.opts);
            if (!f) {
                var j = 0,
                    k = c.fps,
                    m = k / c.speed,
                    o = (1 - c.opacity) / (m * c.trail / 100),
                    p = m / c.lines;
                ! function q() {
                    j++;
                    for (var a = c.lines; a; a--) {
                        var e = Math.max(1 - (j + a * p) % m * o, c.opacity);
                        b.opacity(d, c.lines - a, e, c)
                    }
                    b.timeout = b.el && setTimeout(q, ~~(1e3 / k))
                }()
            }
            return b
        },
        stop: function() {
            var a = this.el;
            return a && (clearTimeout(this.timeout), a.parentNode && a.parentNode.removeChild(a), this.el = c), this
        },
        lines: function(a, b) {
            function e(a, d) {
                return l(g(), {
                    position: "absolute",
                    width: b.length + b.width + "px",
                    height: b.width + "px",
                    background: a,
                    boxShadow: d,
                    transformOrigin: "left",
                    transform: "rotate(" + ~~(360 / b.lines * c + b.rotate) + "deg) translate(" + b.radius + "px" + ",0)",
                    borderRadius: (b.width >> 1) + "px"
                })
            }
            var c = 0,
                d;
            for (; c < b.lines; c++) d = l(g(), {
                position: "absolute",
                top: 1 + ~(b.width / 2) + "px",
                transform: b.hwaccel ? "translate3d(0,0,0)" : "",
                opacity: b.opacity,
                animation: f && j(b.opacity, b.trail, c, b.lines) + " " + 1 / b.speed + "s linear infinite"
            }), b.shadow && h(d, l(e("#000", "0 0 4px #000"), {
                top: "2px"
            })), h(a, h(d, e(b.color, "0 0 1px rgba(0,0,0,.1)")));
            return a
        },
        opacity: function(a, b, c) {
            b < a.childNodes.length && (a.childNodes[b].style.opacity = c)
        }
    }), ! function() {
        function a(a, b) {
            return g("<" + a + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', b)
        }
        var b = l(g("group"), {
            behavior: "url(#default#VML)"
        });
        !k(b, "transform") && b.adj ? (i.addRule(".spin-vml", "behavior:url(#default#VML)"), p.prototype.lines = function(b, c) {
            function f() {
                return l(a("group", {
                    coordsize: e + " " + e,
                    coordorigin: -d + " " + -d
                }), {
                    width: e,
                    height: e
                })
            }

            function k(b, e, g) {
                h(i, h(l(f(), {
                    rotation: 360 / c.lines * b + "deg",
                    left: ~~e
                }), h(l(a("roundrect", {
                    arcsize: 1
                }), {
                    width: d,
                    height: c.width,
                    left: c.radius,
                    top: -c.width >> 1,
                    filter: g
                }), a("fill", {
                    color: c.color,
                    opacity: c.opacity
                }), a("stroke", {
                    opacity: 0
                }))))
            }
            var d = c.length + c.width,
                e = 2 * d,
                g = -(c.width + c.length) * 2 + "px",
                i = l(f(), {
                    position: "absolute",
                    top: g,
                    left: g
                }),
                j;
            if (c.shadow)
                for (j = 1; j <= c.lines; j++) k(j, -2, "progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");
            for (j = 1; j <= c.lines; j++) k(j);
            return h(b, i)
        }, p.prototype.opacity = function(a, b, c, d) {
            var e = a.firstChild;
            d = d.shadow && d.lines || 0, e && b + d < e.childNodes.length && (e = e.childNodes[b + d], e = e && e.firstChild, e = e && e.firstChild, e && (e.opacity = c))
        }) : f = k(b, "animation")
    }(), a.Spinner = p
})(window, document);
(function() {
    var a = {},
        b = this,
        c = b.async;
    typeof module != "undefined" && module.exports ? module.exports = a : b.async = a, a.noConflict = function() {
        return b.async = c, a
    };
    var d = function(a, b) {
            if (a.forEach) return a.forEach(b);
            for (var c = 0; c < a.length; c += 1) b(a[c], c, a)
        },
        e = function(a, b) {
            if (a.map) return a.map(b);
            var c = [];
            return d(a, function(a, d, e) {
                c.push(b(a, d, e))
            }), c
        },
        f = function(a, b, c) {
            return a.reduce ? a.reduce(b, c) : (d(a, function(a, d, e) {
                c = b(c, a, d, e)
            }), c)
        },
        g = function(a) {
            if (Object.keys) return Object.keys(a);
            var b = [];
            for (var c in a) a.hasOwnProperty(c) && b.push(c);
            return b
        };
    typeof process == "undefined" || !process.nextTick ? a.nextTick = function(a) {
        setTimeout(a, 0)
    } : a.nextTick = process.nextTick, a.forEach = function(a, b, c) {
        c = c || function() {};
        if (!a.length) return c();
        var e = 0;
        d(a, function(d) {
            b(d, function(b) {
                b ? (c(b), c = function() {}) : (e += 1, e === a.length && c())
            })
        })
    }, a.forEachSeries = function(a, b, c) {
        c = c || function() {};
        if (!a.length) return c();
        var d = 0,
            e = function() {
                b(a[d], function(b) {
                    b ? (c(b), c = function() {}) : (d += 1, d === a.length ? c() : e())
                })
            };
        e()
    }, a.forEachLimit = function(a, b, c, d) {
        d = d || function() {};
        if (!a.length || b <= 0) return d();
        var e = 0,
            f = 0,
            g = 0;
        (function h() {
            if (e === a.length) return d();
            while (g < b && f < a.length) c(a[f], function(b) {
                b ? (d(b), d = function() {}) : (e += 1, g -= 1, e === a.length ? d() : h())
            }), f += 1, g += 1
        })()
    };
    var h = function(b) {
            return function() {
                var c = Array.prototype.slice.call(arguments);
                return b.apply(null, [a.forEach].concat(c))
            }
        },
        i = function(b) {
            return function() {
                var c = Array.prototype.slice.call(arguments);
                return b.apply(null, [a.forEachSeries].concat(c))
            }
        },
        j = function(a, b, c, d) {
            var f = [];
            b = e(b, function(a, b) {
                return {
                    index: b,
                    value: a
                }
            }), a(b, function(a, b) {
                c(a.value, function(c, d) {
                    f[a.index] = d, b(c)
                })
            }, function(a) {
                d(a, f)
            })
        };
    a.map = h(j), a.mapSeries = i(j), a.reduce = function(b, c, d, e) {
        a.forEachSeries(b, function(a, b) {
            d(c, a, function(a, d) {
                c = d, b(a)
            })
        }, function(a) {
            e(a, c)
        })
    }, a.inject = a.reduce, a.foldl = a.reduce, a.reduceRight = function(b, c, d, f) {
        var g = e(b, function(a) {
            return a
        }).reverse();
        a.reduce(g, c, d, f)
    }, a.foldr = a.reduceRight;
    var k = function(a, b, c, d) {
        var f = [];
        b = e(b, function(a, b) {
            return {
                index: b,
                value: a
            }
        }), a(b, function(a, b) {
            c(a.value, function(c) {
                c && f.push(a), b()
            })
        }, function(a) {
            d(e(f.sort(function(a, b) {
                return a.index - b.index
            }), function(a) {
                return a.value
            }))
        })
    };
    a.filter = h(k), a.filterSeries = i(k), a.select = a.filter, a.selectSeries = a.filterSeries;
    var l = function(a, b, c, d) {
        var f = [];
        b = e(b, function(a, b) {
            return {
                index: b,
                value: a
            }
        }), a(b, function(a, b) {
            c(a.value, function(c) {
                c || f.push(a), b()
            })
        }, function(a) {
            d(e(f.sort(function(a, b) {
                return a.index - b.index
            }), function(a) {
                return a.value
            }))
        })
    };
    a.reject = h(l), a.rejectSeries = i(l);
    var m = function(a, b, c, d) {
        a(b, function(a, b) {
            c(a, function(c) {
                c ? (d(a), d = function() {}) : b()
            })
        }, function(a) {
            d()
        })
    };
    a.detect = h(m), a.detectSeries = i(m), a.some = function(b, c, d) {
        a.forEach(b, function(a, b) {
            c(a, function(a) {
                a && (d(!0), d = function() {}), b()
            })
        }, function(a) {
            d(!1)
        })
    }, a.any = a.some, a.every = function(b, c, d) {
        a.forEach(b, function(a, b) {
            c(a, function(a) {
                a || (d(!1), d = function() {}), b()
            })
        }, function(a) {
            d(!0)
        })
    }, a.all = a.every, a.sortBy = function(b, c, d) {
        a.map(b, function(a, b) {
            c(a, function(c, d) {
                c ? b(c) : b(null, {
                    value: a,
                    criteria: d
                })
            })
        }, function(a, b) {
            if (a) return d(a);
            var c = function(a, b) {
                var c = a.criteria,
                    d = b.criteria;
                return c < d ? -1 : c > d ? 1 : 0
            };
            d(null, e(b.sort(c), function(a) {
                return a.value
            }))
        })
    }, a.auto = function(a, b) {
        b = b || function() {};
        var c = g(a);
        if (!c.length) return b(null);
        var e = {},
            h = [],
            i = function(a) {
                h.unshift(a)
            },
            j = function(a) {
                for (var b = 0; b < h.length; b += 1)
                    if (h[b] === a) {
                        h.splice(b, 1);
                        return
                    }
            },
            k = function() {
                d(h.slice(0), function(a) {
                    a()
                })
            };
        i(function() {
            g(e).length === c.length && (b(null, e), b = function() {})
        }), d(c, function(c) {
            var d = a[c] instanceof Function ? [a[c]] : a[c],
                g = function(a) {
                    if (a) b(a), b = function() {};
                    else {
                        var d = Array.prototype.slice.call(arguments, 1);
                        d.length <= 1 && (d = d[0]), e[c] = d, k()
                    }
                },
                h = d.slice(0, Math.abs(d.length - 1)) || [],
                l = function() {
                    return f(h, function(a, b) {
                        return a && e.hasOwnProperty(b)
                    }, !0)
                };
            if (l()) d[d.length - 1](g, e);
            else {
                var m = function() {
                    l() && (j(m), d[d.length - 1](g, e))
                };
                i(m)
            }
        })
    }, a.waterfall = function(b, c) {
        c = c || function() {};
        if (!b.length) return c();
        var d = function(b) {
            return function(e) {
                if (e) c(e), c = function() {};
                else {
                    var f = Array.prototype.slice.call(arguments, 1),
                        g = b.next();
                    g ? f.push(d(g)) : f.push(c), a.nextTick(function() {
                        b.apply(null, f)
                    })
                }
            }
        };
        d(a.iterator(b))()
    }, a.parallel = function(b, c) {
        c = c || function() {};
        if (b.constructor === Array) a.map(b, function(a, b) {
            a && a(function(a) {
                var c = Array.prototype.slice.call(arguments, 1);
                c.length <= 1 && (c = c[0]), b.call(null, a, c)
            })
        }, c);
        else {
            var d = {};
            a.forEach(g(b), function(a, c) {
                b[a](function(b) {
                    var e = Array.prototype.slice.call(arguments, 1);
                    e.length <= 1 && (e = e[0]), d[a] = e, c(b)
                })
            }, function(a) {
                c(a, d)
            })
        }
    }, a.series = function(b, c) {
        c = c || function() {};
        if (b.constructor === Array) a.mapSeries(b, function(a, b) {
            a && a(function(a) {
                var c = Array.prototype.slice.call(arguments, 1);
                c.length <= 1 && (c = c[0]), b.call(null, a, c)
            })
        }, c);
        else {
            var d = {};
            a.forEachSeries(g(b), function(a, c) {
                b[a](function(b) {
                    var e = Array.prototype.slice.call(arguments, 1);
                    e.length <= 1 && (e = e[0]), d[a] = e, c(b)
                })
            }, function(a) {
                c(a, d)
            })
        }
    }, a.iterator = function(a) {
        var b = function(c) {
            var d = function() {
                return a.length && a[c].apply(null, arguments), d.next()
            };
            return d.next = function() {
                return c < a.length - 1 ? b(c + 1) : null
            }, d
        };
        return b(0)
    }, a.apply = function(a) {
        var b = Array.prototype.slice.call(arguments, 1);
        return function() {
            return a.apply(null, b.concat(Array.prototype.slice.call(arguments)))
        }
    };
    var n = function(a, b, c, d) {
        var e = [];
        a(b, function(a, b) {
            c(a, function(a, c) {
                e = e.concat(c || []), b(a)
            })
        }, function(a) {
            d(a, e)
        })
    };
    a.concat = h(n), a.concatSeries = i(n), a.whilst = function(b, c, d) {
        b() ? c(function(e) {
            if (e) return d(e);
            a.whilst(b, c, d)
        }) : d()
    }, a.until = function(b, c, d) {
        b() ? d() : c(function(e) {
            if (e) return d(e);
            a.until(b, c, d)
        })
    }, a.queue = function(b, c) {
        var e = 0,
            f = {
                tasks: [],
                concurrency: c,
                saturated: null,
                empty: null,
                drain: null,
                push: function(b, e) {
                    b.constructor !== Array && (b = [b]), d(b, function(b) {
                        f.tasks.push({
                            data: b,
                            callback: typeof e == "function" ? e : null
                        }), f.saturated && f.tasks.length == c && f.saturated(), a.nextTick(f.process)
                    })
                },
                process: function() {
                    if (e < f.concurrency && f.tasks.length) {
                        var a = f.tasks.shift();
                        f.empty && f.tasks.length == 0 && f.empty(), e += 1, b(a.data, function() {
                            e -= 1, a.callback && a.callback.apply(a, arguments), f.drain && f.tasks.length + e == 0 && f.drain(), f.process()
                        })
                    }
                },
                length: function() {
                    return f.tasks.length
                },
                running: function() {
                    return e
                }
            };
        return f
    };
    var o = function(a) {
        return function(b) {
            var c = Array.prototype.slice.call(arguments, 1);
            b.apply(null, c.concat([function(b) {
                var c = Array.prototype.slice.call(arguments, 1);
                typeof console != "undefined" && (b ? console.error && console.error(b) : console[a] && d(c, function(b) {
                    console[a](b)
                }))
            }]))
        }
    };
    a.log = o("log"), a.dir = o("dir"), a.memoize = function(a, b) {
        var c = {},
            d = {};
        b = b || function(a) {
            return a
        };
        var e = function() {
            var e = Array.prototype.slice.call(arguments),
                f = e.pop(),
                g = b.apply(null, e);
            g in c ? f.apply(null, c[g]) : g in d ? d[g].push(f) : (d[g] = [f], a.apply(null, e.concat([function() {
                c[g] = arguments;
                var a = d[g];
                delete d[g];
                for (var b = 0, e = a.length; b < e; b++) a[b].apply(null, arguments)
            }])))
        };
        return e.unmemoized = a, e
    }, a.unmemoize = function(a) {
        return function() {
            return (a.unmemoized || a).apply(null, arguments)
        }
    }
})();
(function() {
    var PianoKey, PianoKeyboard, PianoKeyboardDesign, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    PianoKeyboardDesign = function() {
        PianoKeyboardDesign.prototype.KeyType = {
            WhiteC: 0,
            WhiteD: 1,
            WhiteE: 2,
            WhiteF: 3,
            WhiteG: 4,
            WhiteA: 5,
            WhiteB: 6,
            Black: 7
        };
        PianoKeyboardDesign.prototype.whiteKeyStep = .236;
        PianoKeyboardDesign.prototype.whiteKeyWidth = .226;
        PianoKeyboardDesign.prototype.whiteKeyHeight = .22;
        PianoKeyboardDesign.prototype.whiteKeyLength = 1.5;
        PianoKeyboardDesign.prototype.blackKeyWidth = .1;
        PianoKeyboardDesign.prototype.blackKeyHeight = .24;
        PianoKeyboardDesign.prototype.blackKeyLength = 1;
        PianoKeyboardDesign.prototype.blackKeyShiftCDE = .0216;
        PianoKeyboardDesign.prototype.blackKeyShiftFGAB = .034;
        PianoKeyboardDesign.prototype.blackKeyPosY = .1;
        PianoKeyboardDesign.prototype.blackKeyPosZ = -.24;
        PianoKeyboardDesign.prototype.noteDropPosZ4WhiteKey = .25;
        PianoKeyboardDesign.prototype.noteDropPosZ4BlackKey = .75;
        PianoKeyboardDesign.prototype.whiteKeyColor = 16777215;
        PianoKeyboardDesign.prototype.blackKeyColor = 1118481;
        PianoKeyboardDesign.prototype.keyDip = .08;
        PianoKeyboardDesign.prototype.keyUpSpeed = .03;
        PianoKeyboardDesign.prototype.keyInfo = [];
        PianoKeyboardDesign.prototype.noteToColor = function() {
            var map, offset;
            map = MusicTheory.Synesthesia.map("August Aeppli (1940)");
            offset = MIDI.pianoKeyOffset;
            return function(note) {
                if (map[note - offset] == null) {
                    return 0
                }
                return parseInt(map[note - offset].hex, 16)
            }
        }();

        function PianoKeyboardDesign() {
            var i, _i;
            for (i = _i = 0; _i < 128; i = ++_i) {
                this.keyInfo[i] = {}
            }
            this._initKeyType();
            this._initKeyPos()
        }
        PianoKeyboardDesign.prototype._initKeyType = function() {
            var Black, KeyType, WhiteA, WhiteB, WhiteC, WhiteD, WhiteE, WhiteF, WhiteG, i, keyInfo, noteNo, _i;
            keyInfo = this.keyInfo, KeyType = this.KeyType;
            WhiteC = KeyType.WhiteC, WhiteD = KeyType.WhiteD, WhiteE = KeyType.WhiteE, WhiteF = KeyType.WhiteF, WhiteG = KeyType.WhiteG, WhiteA = KeyType.WhiteA, WhiteB = KeyType.WhiteB, Black = KeyType.Black;
            for (i = _i = 0; _i < 10; i = ++_i) {
                noteNo = i * 12;
                keyInfo[noteNo + 0].keyType = WhiteC;
                keyInfo[noteNo + 1].keyType = Black;
                keyInfo[noteNo + 2].keyType = WhiteD;
                keyInfo[noteNo + 3].keyType = Black;
                keyInfo[noteNo + 4].keyType = WhiteE;
                keyInfo[noteNo + 5].keyType = WhiteF;
                keyInfo[noteNo + 6].keyType = Black;
                keyInfo[noteNo + 7].keyType = WhiteG;
                keyInfo[noteNo + 8].keyType = Black;
                keyInfo[noteNo + 9].keyType = WhiteA;
                keyInfo[noteNo + 10].keyType = Black;
                keyInfo[noteNo + 11].keyType = WhiteB
            }
            noteNo = 120;
            keyInfo[noteNo + 0].keyType = WhiteC;
            keyInfo[noteNo + 1].keyType = Black;
            keyInfo[noteNo + 2].keyType = WhiteD;
            keyInfo[noteNo + 3].keyType = Black;
            keyInfo[noteNo + 4].keyType = WhiteE;
            keyInfo[noteNo + 5].keyType = WhiteF;
            keyInfo[noteNo + 6].keyType = Black;
            return keyInfo[noteNo + 7].keyType = WhiteB
        };
        PianoKeyboardDesign.prototype._initKeyPos = function() {
            var Black, KeyType, WhiteA, WhiteB, WhiteC, WhiteD, WhiteE, WhiteF, WhiteG, blackKeyShiftCDE, blackKeyShiftFGAB, keyInfo, noteNo, posX, prevKeyType, shift, whiteKeyStep, _i, _j, _results;
            KeyType = this.KeyType, keyInfo = this.keyInfo, whiteKeyStep = this.whiteKeyStep, blackKeyShiftCDE = this.blackKeyShiftCDE, blackKeyShiftFGAB = this.blackKeyShiftFGAB;
            WhiteC = KeyType.WhiteC, WhiteD = KeyType.WhiteD, WhiteE = KeyType.WhiteE, WhiteF = KeyType.WhiteF, WhiteG = KeyType.WhiteG, WhiteA = KeyType.WhiteA, WhiteB = KeyType.WhiteB, Black = KeyType.Black;
            noteNo = 0;
            prevKeyType = WhiteB;
            posX = 0;
            shift = 0;
            keyInfo[noteNo].keyCenterPosX = posX;
            prevKeyType = keyInfo[noteNo].keyType;
            for (noteNo = _i = 1; _i < 128; noteNo = ++_i) {
                if (prevKeyType === Black) {
                    if (keyInfo[noteNo].keyType === Black) {} else {
                        posX += whiteKeyStep / 2
                    }
                } else {
                    if (keyInfo[noteNo].keyType === Black) {
                        posX += whiteKeyStep / 2
                    } else {
                        posX += whiteKeyStep
                    }
                }
                keyInfo[noteNo].keyCenterPosX = posX;
                prevKeyType = keyInfo[noteNo].keyType
            }
            prevKeyType = WhiteC;
            _results = [];
            for (noteNo = _j = 0; _j < 128; noteNo = ++_j) {
                if (keyInfo[noteNo].keyType === Black) {
                    switch (prevKeyType) {
                        case WhiteC:
                            shift = -blackKeyShiftCDE;
                            break;
                        case WhiteD:
                            shift = +blackKeyShiftCDE;
                            break;
                        case WhiteF:
                            shift = -blackKeyShiftFGAB;
                            break;
                        case WhiteG:
                            shift = 0;
                            break;
                        case WhiteA:
                            shift = +blackKeyShiftFGAB;
                            break;
                        default:
                            shift = 0
                    }
                    if (noteNo === 126) {
                        shift = 0
                    }
                    keyInfo[noteNo].keyCenterPosX += shift
                }
                _results.push(prevKeyType = keyInfo[noteNo].keyType)
            }
            return _results
        };
        return PianoKeyboardDesign
    }();
    PianoKey = function() {
        function PianoKey(design, note) {
            var Black, KeyType, blackKeyColor, blackKeyHeight, blackKeyLength, blackKeyPosY, blackKeyPosZ, blackKeyWidth, geometry, keyCenterPosX, keyDip, keyInfo, keyType, keyUpSpeed, material, position, whiteKeyColor, whiteKeyHeight, whiteKeyLength, whiteKeyWidth, _ref;
            blackKeyWidth = design.blackKeyWidth, blackKeyHeight = design.blackKeyHeight, blackKeyLength = design.blackKeyLength, blackKeyColor = design.blackKeyColor, whiteKeyWidth = design.whiteKeyWidth, whiteKeyHeight = design.whiteKeyHeight, whiteKeyLength = design.whiteKeyLength, whiteKeyColor = design.whiteKeyColor, blackKeyPosY = design.blackKeyPosY, blackKeyPosZ = design.blackKeyPosZ, keyDip = design.keyDip, keyInfo = design.keyInfo, keyUpSpeed = design.keyUpSpeed, KeyType = design.KeyType;
            Black = KeyType.Black;
            _ref = keyInfo[note], keyType = _ref.keyType, keyCenterPosX = _ref.keyCenterPosX;
            if (keyType === Black) {
                geometry = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
                material = new THREE.MeshPhongMaterial({
                    color: blackKeyColor
                });
                position = new THREE.Vector3(keyCenterPosX, blackKeyPosY, blackKeyPosZ)
            } else {
                geometry = new THREE.BoxGeometry(whiteKeyWidth, whiteKeyHeight, whiteKeyLength);
                material = new THREE.MeshPhongMaterial({
                    color: whiteKeyColor,
                    emissive: 1118481
                });
                position = new THREE.Vector3(keyCenterPosX, 0, 0)
            }
            this.model = new THREE.Mesh(geometry, material);
            this.model.position.copy(position);
            this.keyUpSpeed = keyUpSpeed;
            this.originalY = position.y;
            this.pressedY = this.originalY - keyDip
        }
        PianoKey.prototype.press = function() {
            this.model.position.y = this.pressedY;
            return this.isPressed = true
        };
        PianoKey.prototype.release = function() {
            return this.isPressed = false
        };
        PianoKey.prototype.update = function() {
            var offset;
            if (this.model.position.y < this.originalY && !this.isPressed) {
                offset = this.originalY - this.model.position.y;
                return this.model.position.y += Math.min(offset, this.keyUpSpeed)
            }
        };
        return PianoKey
    }();
    PianoKeyboard = function() {
        function PianoKeyboard(design, noteToColor) {
            this.update = __bind(this.update, this);
            var key, note, _i, _ref;
            this.model = new THREE.Object3D;
            this.keys = [];
            for (note = _i = 0, _ref = design.keyInfo.length; 0 <= _ref ? _i < _ref : _i > _ref; note = 0 <= _ref ? ++_i : --_i) {
                key = new PianoKey(design, note);
                this.keys.push(key);
                if (20 < note && note < 109) {
                    this.model.add(key.model)
                }
            }
            this.model.y -= design.whiteKeyHeight / 2
        }
        PianoKeyboard.prototype.press = function(note) {
            return this.keys[note].press()
        };
        PianoKeyboard.prototype.release = function(note) {
            return this.keys[note].release()
        };
        PianoKeyboard.prototype.update = function() {
            var key, _i, _len, _ref, _results;
            _ref = this.keys;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                key = _ref[_i];
                _results.push(key.update())
            }
            return _results
        };
        return PianoKeyboard
    }();
    this.PianoKeyboardDesign = PianoKeyboardDesign;
    this.PianoKeyboard = PianoKeyboard
}).call(this);
(function() {
    var NoteRain, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    NoteRain = function() {
        NoteRain.prototype.lengthScale = .001;

        function NoteRain(pianoDesign) {
            this.pianoDesign = pianoDesign;
            this.update = __bind(this.update, this);
            this.model = new THREE.Object3D
        }
        NoteRain.prototype.setMidiData = function(midiData, callback) {
            var noteInfos;
            this.clear();
            noteInfos = this._getNoteInfos(midiData);
            return this._buildNoteMeshes(noteInfos, callback)
        };
        NoteRain.prototype.clear = function() {
            var child, _i, _len, _ref, _results;
            _ref = this.model.children.slice(0);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                _results.push(this.model.remove(child))
            }
            return _results
        };
        NoteRain.prototype._getNoteInfos = function(midiData) {
            var channel, currentTime, duration, event, interval, noteInfos, noteNumber, noteTimes, startTime, subtype, _i, _len, _ref, _ref1;
            currentTime = 0;
            noteInfos = [];
            noteTimes = [];
            for (_i = 0, _len = midiData.length; _i < _len; _i++) {
                _ref = midiData[_i], _ref1 = _ref[0], event = _ref1.event, interval = _ref[1];
                currentTime += interval;
                subtype = event.subtype, noteNumber = event.noteNumber, channel = event.channel;
                if (channel === 9) {
                    continue
                }
                if (subtype === "noteOn") {
                    noteTimes[noteNumber] = currentTime
                } else if (subtype === "noteOff") {
                    startTime = noteTimes[noteNumber];
                    duration = currentTime - startTime;
                    noteInfos.push({
                        noteNumber: noteNumber,
                        startTime: startTime,
                        duration: duration
                    })
                }
            }
            return noteInfos
        };
        NoteRain.prototype._buildNoteMeshes = function(noteInfos, callback) {
            var Black, KeyType, SIZE_OF_EACH_GROUP, blackKeyHeight, blackKeyWidth, group, groups, keyInfo, noteToColor, sleepTask, splitToGroups, tasks, _i, _len, _ref, _this = this;
            _ref = this.pianoDesign, blackKeyWidth = _ref.blackKeyWidth, blackKeyHeight = _ref.blackKeyHeight, keyInfo = _ref.keyInfo, KeyType = _ref.KeyType, noteToColor = _ref.noteToColor;
            Black = KeyType.Black;
            splitToGroups = function(items, sizeOfEachGroup) {
                var groups, i, numGroups, start, _i;
                groups = [];
                numGroups = Math.ceil(items.length / sizeOfEachGroup);
                start = 0;
                for (i = _i = 0; 0 <= numGroups ? _i < numGroups : _i > numGroups; i = 0 <= numGroups ? ++_i : --_i) {
                    groups[i] = items.slice(start, start + sizeOfEachGroup);
                    start += sizeOfEachGroup
                }
                return groups
            };
            sleepTask = function(done) {
                return setTimeout(function() {
                    return done(null)
                }, 0)
            };
            tasks = [];
            SIZE_OF_EACH_GROUP = 100;
            groups = splitToGroups(noteInfos, SIZE_OF_EACH_GROUP);
            for (_i = 0, _len = groups.length; _i < _len; _i++) {
                group = groups[_i];
                tasks.push(sleepTask);
                tasks.push(function(group) {
                    return function(done) {
                        var color, duration, geometry, length, material, mesh, noteInfo, noteNumber, startTime, x, y, z, _j, _len1;
                        for (_j = 0, _len1 = group.length; _j < _len1; _j++) {
                            noteInfo = group[_j];
                            noteNumber = noteInfo.noteNumber, startTime = noteInfo.startTime, duration = noteInfo.duration;
                            length = duration * _this.lengthScale;
                            x = keyInfo[noteNumber].keyCenterPosX;
                            y = startTime * _this.lengthScale + length / 2;
                            z = -.2;
                            if (keyInfo[noteNumber].keyType === Black) {
                                y += blackKeyHeight / 2
                            }
                            color = noteToColor(noteNumber);
                            geometry = new THREE.BoxGeometry(blackKeyWidth, length, blackKeyWidth);
                            material = new THREE.MeshPhongMaterial({
                                color: color,
                                emissive: color,
                                opacity: .7,
                                transparent: true
                            });
                            mesh = new THREE.Mesh(geometry, material);
                            mesh.position.set(x, y, z);
                            _this.model.add(mesh)
                        }
                        return done(null)
                    }
                }(group))
            }
            return async.series(tasks, function() {
                return typeof callback === "function" ? callback() : void 0
            })
        };
        NoteRain.prototype.update = function(playerCurrentTime) {
            return this.model.position.y = -playerCurrentTime * this.lengthScale
        };
        return NoteRain
    }();
    this.NoteRain = NoteRain
}).call(this);
(function() {
    var NoteParticles, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    NoteParticles = function() {
        NoteParticles.prototype.count = 30;
        NoteParticles.prototype.size = .2;
        NoteParticles.prototype.life = 10;

        function NoteParticles(pianoDesign) {
            var color, keyInfo, note, noteToColor, _i, _ref;
            this.pianoDesign = pianoDesign;
            this.createParticles = __bind(this.createParticles, this);
            this.update = __bind(this.update, this);
            noteToColor = pianoDesign.noteToColor, keyInfo = pianoDesign.keyInfo;
            this.model = new THREE.Object3D;
            this.materials = [];
            for (note = _i = 0, _ref = keyInfo.length; 0 <= _ref ? _i < _ref : _i > _ref; note = 0 <= _ref ? ++_i : --_i) {
                color = noteToColor(note);
                this.materials[note] = new THREE.PointCloudMaterial({
                    size: this.size,
                    map: this._generateTexture(color),
                    blending: THREE.AdditiveBlending,
                    transparent: true,
                    depthWrite: false,
                    color: color
                })
            }
        }
        NoteParticles.prototype._generateTexture = function(hexColor) {
            var canvas, context, gradient, height, texture, width;
            width = 32;
            height = 32;
            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            width = canvas.width, height = canvas.height;
            context = canvas.getContext("2d");
            gradient = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
            gradient.addColorStop(0, new THREE.Color(hexColor).getStyle());
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);
            texture = new THREE.Texture(canvas, new THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.LinearMipMapLinearFilter);
            texture.needsUpdate = true;
            return texture
        };
        NoteParticles.prototype.update = function() {
            var particle, particleSystem, _i, _j, _len, _len1, _ref, _ref1, _results;
            _ref = this.model.children.slice(0);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                particleSystem = _ref[_i];
                if (particleSystem.age++ > this.life) {
                    _results.push(this.model.remove(particleSystem))
                } else {
                    _ref1 = particleSystem.geometry.vertices;
                    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                        particle = _ref1[_j];
                        particle.add(particle.velocity)
                    }
                    _results.push(particleSystem.geometry.verticesNeedUpdate = true)
                }
            }
            return _results
        };
        NoteParticles.prototype.createParticles = function(note) {
            var Black, KeyType, geometry, i, keyCenterPosX, keyInfo, keyType, material, particle, particleSystem, posX, posY, posZ, _i, _ref, _ref1, _ref2;
            _ref = this.pianoDesign, keyInfo = _ref.keyInfo, KeyType = _ref.KeyType;
            Black = KeyType.Black;
            _ref1 = keyInfo[note], keyCenterPosX = _ref1.keyCenterPosX, keyType = _ref1.keyType;
            posX = keyCenterPosX;
            posY = keyType === Black ? .18 : .13;
            posZ = -.2;
            geometry = new THREE.Geometry;
            for (i = _i = 0, _ref2 = this.count; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
                particle = new THREE.Vector3(posX, posY, posZ);
                particle.velocity = new THREE.Vector3((Math.random() - .5) * .04, (Math.random() - .3) * .01, (Math.random() - .5) * .04);
                geometry.vertices.push(particle)
            }
            material = this.materials[note];
            particleSystem = new THREE.PointCloud(geometry, material);
            particleSystem.age = 0;
            particleSystem.transparent = true;
            particleSystem.opacity = .8;
            return this.model.add(particleSystem)
        };
        return NoteParticles
    }();
    this.NoteParticles = NoteParticles
}).call(this);
(function() {
    var Scene, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    Scene = function() {
        function Scene(container) {
            this.animate = __bind(this.animate, this);
            this.onresize = __bind(this.onresize, this);
            var $container, ambientLight, auxLight, camera, controls, height, mainLight, renderer, scene, width;
            $container = $(container);
            width = $container.width();
            height = $container.height();
            scene = new THREE.Scene;
            camera = new THREE.PerspectiveCamera(60, width / height, .001, 1e5);
            camera.lookAt(new THREE.Vector3);
            scene.add(camera);
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setSize(width, height);
            renderer.setClearColor(0, 1);
            renderer.autoClear = false;
            $container.append(renderer.domElement);
            ambientLight = new THREE.AmbientLight(2236962);
            scene.add(ambientLight);
            mainLight = new THREE.DirectionalLight(16777215, .8);
            mainLight.position.set(1, 2, 4).normalize();
            scene.add(mainLight);
            auxLight = new THREE.DirectionalLight(16777215, .3);
            auxLight.position.set(-4, -1, -2).normalize();
            scene.add(auxLight);
            controls = new THREE.OrbitControls(camera);
            controls.center.set(8.73, 1, 0);
            controls.autoRotateSpeed = 1;
            controls.autoRotate = false;
            camera.position.copy(controls.center).add(new THREE.Vector3(0, 1, 9));
            $(window).resize(this.onresize);
            this.$container = $container;
            this.camera = camera;
            this.scene = scene;
            this.renderer = renderer;
            this.controls = controls
        }
        Scene.prototype.onresize = function() {
            var height, width, _ref;
            _ref = [this.$container.width(), this.$container.height()], width = _ref[0], height = _ref[1];
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            return this.renderer.setSize(width, height)
        };
        Scene.prototype.add = function(object) {
            return this.scene.add(object)
        };
        Scene.prototype.remove = function(object) {
            return this.scene.remove(object)
        };
        Scene.prototype.animate = function(callback) {
            var _this = this;
            requestAnimationFrame(function() {
                return _this.animate(callback)
            });
            if (typeof callback === "function") {
                callback()
            }
            this.controls.update();
            this.renderer.clear();
            return this.renderer.render(this.scene, this.camera)
        };
        return Scene
    }();
    this.Scene = Scene
}).call(this);
(function() {
    var LoaderWidget, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    LoaderWidget = function() {
        LoaderWidget.prototype.opts = {
            color: "#aaaaaa",
            width: 4
        };

        function LoaderWidget() {
            this.stop = __bind(this.stop, this);
            this.start = __bind(this.start, this);
            this.message = __bind(this.message, this);
            this.onresize = __bind(this.onresize, this);
            this.window = $(window);
            this.overlay = $("<div>").width(this.window.width()).height(this.window.height()).hide().css({
                position: "absolute",
                top: 0,
                left: 0,
                "z-index": 1e4,
                background: "rgba(0, 0, 0, 0.7)",
                "text-align": "center"
            }).appendTo(document.body).on("selectstart", function() {
                return false
            });
            this.box = $("<div>").width(300).height(200).appendTo(this.overlay);
            this.canvas = $("<div>").height(100).appendTo(this.box);
            this.text = $("<div>").css({
                color: "#ddd",
                "font-size": "12px",
                cursor: "default"
            }).appendTo(this.box);
            this.onresize();
            this.window.resize(this.onresize)
        }
        LoaderWidget.prototype.onresize = function() {
            var height, width, _ref;
            _ref = [this.window.width(), this.window.height()], width = _ref[0], height = _ref[1];
            this.box.css({
                position: "absolute",
                top: (height - 200) / 2,
                left: (width - 300) / 2
            });
            return this.overlay.width(width).height(height)
        };
        LoaderWidget.prototype.message = function(msg, callback) {
            if (msg != null) {
                this.text.html(msg)
            }
            if (this.isActive) {
                return typeof callback === "function" ? callback() : void 0
            } else {
                return this.start(callback)
            }
        };
        LoaderWidget.prototype.start = function(callback) {
            var _this = this;
            this.overlay.fadeIn(function() {
                return typeof callback === "function" ? callback() : void 0
            });
            if (this.spin) {
                this.spin.spin(this.canvas[0])
            } else {
                this.spin = new Spinner(this.opts);
                this.spin.spin(this.canvas[0])
            }
            return this.isActive = true
        };
        LoaderWidget.prototype.stop = function(callback) {
            var _this = this;
            return this.overlay.fadeOut("slow", function() {
                var _ref;
                if ((_ref = _this.spin) != null) {
                    _ref.stop()
                }
                _this.isActive = false;
                return typeof callback === "function" ? callback() : void 0
            })
        };
        return LoaderWidget
    }();
    this.LoaderWidget = LoaderWidget
}).call(this);
(function() {
    var PlayerWidget, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    PlayerWidget = function() {
        function PlayerWidget(container) {
            this.displayProgress = __bind(this.displayProgress, this);
            this.getRandomTrack = __bind(this.getRandomTrack, this);
            this.setTrackFromHash = __bind(this.setTrackFromHash, this);
            this.setTrack = __bind(this.setTrack, this);
            this.ontrackchange = __bind(this.ontrackchange, this);
            this.onnext = __bind(this.onnext, this);
            this.onprev = __bind(this.onprev, this);
            this.onstop = __bind(this.onstop, this);
            this.onresume = __bind(this.onresume, this);
            this.onpause = __bind(this.onpause, this);
            this.onplay = __bind(this.onplay, this);
            this.hide = __bind(this.hide, this);
            this.show = __bind(this.show, this);
            this.updateSize = __bind(this.updateSize, this);
            this.autoHide = __bind(this.autoHide, this);
            var _this = this;
            this.$container = $(container);
            this.$controlsContainer = $(".player-controls", this.$container);
            this.$playlistContainer = $(".player-playlist-container", this.$container);
            this.$progressContainer = $(".player-progress-container", this.$container);
            this.$progressBar = $(".player-progress-bar", this.$container);
            this.$progressText = $(".player-progress-text", this.$container);
            this.$playlist = $(".player-playlist", this.$container);
            this.$prevBtn = $(".player-prev", this.$container);
            this.$nextBtn = $(".player-next", this.$container);
            this.$playBtn = $(".player-play", this.$container);
            this.$stopBtn = $(".player-stop", this.$container);
            this.$pauseBtn = $(".player-pause", this.$container);
            this.$prevBtn.click(function() {
                return _this.onprev()
            });
            this.$nextBtn.click(function() {
                return _this.onnext()
            });
            this.$stopBtn.click(function() {
                return _this.stop()
            });
            this.$pauseBtn.click(function() {
                return _this.pause()
            });
            this.$playBtn.click(function() {
                if (_this.current === "paused") {
                    return _this.resume()
                } else {
                    return _this.play()
                }
            });
            this.$progressContainer.click(function(event) {
                var progress;
                progress = (event.clientX - _this.$progressContainer.offset().left) / _this.$progressContainer.width();
                return typeof _this.progressCallback === "function" ? _this.progressCallback(progress) : void 0
            });
            this.$playlist.click(function(event) {
                var $list, $target;
                $target = $(event.target);
                if ($target.is("li")) {
                    $list = $("li", _this.$playlist);
                    return _this.setTrack($list.index($target))
                }
            });
            this.$container.on("mousewheel", function(event) {
                return event.stopPropagation()
            });
            this.updateSize();
            $(window).resize(this.updateSize);
            $(window).on("hashchange", this.setTrackFromHash)
        }
        PlayerWidget.prototype.autoHide = function() {
            var onmousemove, _this = this;
            onmousemove = function(event) {
                if (event.pageX < 400) {
                    return _this.show()
                } else {
                    return _this.hide()
                }
            };
            return $(document).on("mousemove", onmousemove).on("mousedown", function() {
                return $(this).off("mousemove", onmousemove)
            }).on("mouseup", function() {
                return $(this).on("mousemove", onmousemove)
            })
        };
        PlayerWidget.prototype.updateSize = function() {
            return this.$playlistContainer.height(this.$container.innerHeight() - this.$controlsContainer.outerHeight(true) - this.$progressContainer.outerHeight(true) - 15).nanoScroller()
        };
        PlayerWidget.prototype.show = function(callback) {
            var _this = this;
            if (this.visible || this.animating) {
                return
            }
            this.visible = true;
            this.animating = true;
            return this.$container.animate({
                left: "0px"
            }, {
                duration: 500,
                easing: "easeInOutCubic",
                complete: function() {
                    _this.animating = false;
                    return typeof callback === "function" ? callback() : void 0
                }
            })
        };
        PlayerWidget.prototype.hide = function(callback) {
            var _this = this;
            if (!this.visible || this.animating) {
                return
            }
            this.visible = false;
            this.animating = true;
            return this.$container.animate({
                left: "" + -this.$container.width() + "px"
            }, {
                duration: 500,
                easing: "easeInOutCubic",
                complete: function() {
                    _this.animating = false;
                    return typeof callback === "function" ? callback() : void 0
                }
            })
        };
        PlayerWidget.prototype.setPlaylist = function(playlist) {
            var trackName, _i, _len;
            this.playlist = playlist;
            this.$playlist.html("");
            for (_i = 0, _len = playlist.length; _i < _len; _i++) {
                trackName = playlist[_i];
                this.$playlist.append($("<li>").text(trackName))
            }
            return this.$playlistContainer.nanoScroller()
        };
        PlayerWidget.prototype.on = function(eventName, callback) {
            return this["" + eventName + "Callback"] = callback
        };
        PlayerWidget.prototype.onplay = function() {
            this.$playBtn.hide();
            this.$pauseBtn.show();
            return typeof this.playCallback === "function" ? this.playCallback() : void 0
        };
        PlayerWidget.prototype.onpause = function() {
            this.$pauseBtn.hide();
            this.$playBtn.show();
            return typeof this.pauseCallback === "function" ? this.pauseCallback() : void 0
        };
        PlayerWidget.prototype.onresume = function() {
            this.$playBtn.hide();
            this.$pauseBtn.show();
            return typeof this.resumeCallback === "function" ? this.resumeCallback() : void 0
        };
        PlayerWidget.prototype.onstop = function() {
            this.$pauseBtn.hide();
            this.$playBtn.show();
            return typeof this.stopCallback === "function" ? this.stopCallback() : void 0
        };
        PlayerWidget.prototype.onprev = function() {
            if (!(this.currentTrackId > 0)) {
                return
            }
            this.currentTrackId -= 1;
            return this.setTrack(this.currentTrackId)
        };
        PlayerWidget.prototype.onnext = function() {
            if (!(this.currentTrackId < this.playlist.length - 1)) {
                return
            }
            this.currentTrackId += 1;
            return this.setTrack(this.currentTrackId)
        };
        PlayerWidget.prototype.ontrackchange = function(trackId) {
            var _ref;
            if (!(0 <= trackId && trackId < this.playlist.length)) {
                return
            }
            this.stop();
            if ((_ref = this.$currentTrack) != null) {
                _ref.removeClass("player-current-track")
            }
            this.$currentTrack = this.$playlist.find("li").eq(trackId).addClass("player-current-track");
            if (typeof this.trackchangeCallback === "function") {
                this.trackchangeCallback(trackId)
            }
            return this.currentTrackId = trackId
        };
        PlayerWidget.prototype.setTrack = function(trackId) {
            return window.location.hash = trackId + 1
        };
        PlayerWidget.prototype.setTrackFromHash = function() {
            var hash;
            hash = window.location.hash.slice(1);
            if (hash) {
                return this.ontrackchange(parseInt(hash, 10) - 1)
            }
        };
        PlayerWidget.prototype.getRandomTrack = function() {
            return this.playlist[Math.floor(Math.random() * this.playlist.length)]
        };
        PlayerWidget.prototype.displayProgress = function(event) {
            var curTime, current, progress, totTime, total;
            current = event.current, total = event.total;
            current = Math.min(current, total);
            progress = current / total;
            this.$progressBar.width(this.$progressContainer.width() * progress);
            curTime = this._formatTime(current);
            totTime = this._formatTime(total);
            return this.$progressText.text("" + curTime + " / " + totTime)
        };
        PlayerWidget.prototype._formatTime = function(time) {
            var minutes, seconds;
            minutes = time / 60 >> 0;
            seconds = String(time - minutes * 60 >> 0);
            if (seconds.length === 1) {
                seconds = "0" + seconds
            }
            return "" + minutes + ":" + seconds
        };
        return PlayerWidget
    }();
    StateMachine.create({
        target: PlayerWidget.prototype,
        events: [{
            name: "init",
            from: "none",
            to: "ready"
        }, {
            name: "play",
            from: "ready",
            to: "playing"
        }, {
            name: "pause",
            from: "playing",
            to: "paused"
        }, {
            name: "resume",
            from: "paused",
            to: "playing"
        }, {
            name: "stop",
            from: "*",
            to: "ready"
        }]
    });
    this.PlayerWidget = PlayerWidget
}).call(this);
(function() {
    var Euphony, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments)
        }
    };
    Euphony = function() {
        function Euphony() {
            this.setProgress = __bind(this.setProgress, this);
            this.setCurrentTime = __bind(this.setCurrentTime, this);
            this.getEndTime = __bind(this.getEndTime, this);
            this.pause = __bind(this.pause, this);
            this.stop = __bind(this.stop, this);
            this.resume = __bind(this.resume, this);
            this.start = __bind(this.start, this);
            var _this = this;
            this.design = new PianoKeyboardDesign;
            this.keyboard = new PianoKeyboard(this.design);
            this.rain = new NoteRain(this.design);
            this.particles = new NoteParticles(this.design);
            this.player = MIDI.Player;
            this.player.addListener(function(data) {
                var NOTE_OFF, NOTE_ON, message, note;
                NOTE_OFF = 128;
                NOTE_ON = 144;
                note = data.note, message = data.message;
                if (message === NOTE_ON) {
                    _this.keyboard.press(note);
                    return _this.particles.createParticles(note)
                } else if (message === NOTE_OFF) {
                    return _this.keyboard.release(note)
                }
            });
            this.player.setAnimation({
                delay: 20,
                callback: function(data) {
                    var end, now;
                    now = data.now, end = data.end;
                    if (typeof _this.onprogress === "function") {
                        _this.onprogress({
                            current: now,
                            total: end
                        })
                    }
                    return _this.rain.update(now * 1e3)
                }
            })
        }
        Euphony.prototype.initScene = function() {
            var _this = this;
            this.scene = new Scene("#canvas");
            this.scene.add(this.keyboard.model);
            this.scene.add(this.rain.model);
            this.scene.add(this.particles.model);
            return this.scene.animate(function() {
                _this.keyboard.update();
                return _this.particles.update()
            })
        };
        Euphony.prototype.initMidi = function(callback) {
            return MIDI.loadPlugin(function() {
                MIDI.channels[9].mute = true;
                return typeof callback === "function" ? callback() : void 0
            })
        };
        Euphony.prototype.loadBuiltinPlaylist = function(callback) {
            var _this = this;
            if (this.playlist) {
                return callback(this.playlist)
            }
            return $.getJSON("tracks/index.json", function(playlist) {
                _this.playlist = playlist;
                return callback(_this.playlist)
            })
        };
        Euphony.prototype.loadBuiltinMidi = function(id, callback) {
            var _this = this;
            if (!(0 <= id && id < this.playlist.length)) {
                return
            }
            if (typeof localStorage !== "undefined" && localStorage !== null ? localStorage[id] : void 0) {
                return this.loadMidiFile(localStorage[id], callback)
            }
            return $.ajax({
                url: "tracks/" + this.playlist[id],
                dataType: "text",
                success: function(data) {
                    var e;
                    _this.loadMidiFile(data, callback);
                    try {
                        return typeof localStorage !== "undefined" && localStorage !== null ? localStorage[id] = data : void 0
                    } catch (_error) {
                        e = _error;
                        return typeof console !== "undefined" && console !== null ? console.error("localStorage quota limit reached") : void 0
                    }
                }
            })
        };
        Euphony.prototype.loadMidiFile = function(midiFile, callback) {
            var _this = this;
            return this.player.loadFile(midiFile, function() {
                return _this.rain.setMidiData(_this.player.data, callback)
            })
        };
        Euphony.prototype.start = function() {
            this.player.start();
            return this.playing = true
        };
        Euphony.prototype.resume = function() {
            this.player.currentTime += 1e-6;
            this.player.resume();
            return this.playing = true
        };
        Euphony.prototype.stop = function() {
            this.player.stop();
            return this.playing = false
        };
        Euphony.prototype.pause = function() {
            this.player.pause();
            return this.playing = false
        };
        Euphony.prototype.getEndTime = function() {
            return this.player.endTime
        };
        Euphony.prototype.setCurrentTime = function(currentTime) {
            this.player.pause();
            this.player.currentTime = currentTime;
            if (this.playing) {
                return this.player.resume()
            }
        };
        Euphony.prototype.setProgress = function(progress) {
            var currentTime;
            currentTime = this.player.endTime * progress;
            return this.setCurrentTime(currentTime)
        };
        Euphony.prototype.on = function(eventName, callback) {
            return this["on" + eventName] = callback
        };
        return Euphony
    }();
    this.Euphony = Euphony
}).call(this);
(function() {
    $(document).on("selectstart", function() {
        return false
    }).on("mousewheel", function() {
        return false
    }).on("dragover", function() {
        return false
    }).on("dragenter", function() {
        return false
    }).on("ready", function() {
        window.loader = new LoaderWidget;
        loader.message("Downloading");
        window.app = new Euphony;
        return app.initMidi(function() {
            app.initScene();
            return app.loadBuiltinPlaylist(function(playlist) {
                window.player = new PlayerWidget("#player");
                player.setPlaylist(playlist);
                player.on("pause", app.pause);
                player.on("resume", app.resume);
                player.on("stop", app.stop);
                player.on("play", app.start);
                player.on("progress", app.setProgress);
                player.on("trackchange", function(trackId) {
                    return loader.message("Loading MIDI", function() {
                        return app.loadBuiltinMidi(trackId, function() {
                            return loader.stop(function() {
                                return player.play()
                            })
                        })
                    })
                });
                player.on("filedrop", function(midiFile) {
                    player.stop();
                    return loader.message("Loading MIDI", function() {
                        return app.loadMidiFile(midiFile, function() {
                            return loader.stop(function() {
                                return player.play()
                            })
                        })
                    })
                });
                app.on("progress", player.displayProgress);
                player.show(function() {
                    var candidates, id;
                    if (window.location.hash) {
                        return player.setTrackFromHash()
                    } else {
                        candidates = [3, 5, 6, 7, 10, 11, 12, 13, 14, 16, 19, 30];
                        id = Math.floor(Math.random() * candidates.length);
                        return player.setTrack(candidates[id])
                    }
                });
                setTimeout(function() {
                    player.hide();
                    return player.autoHide()
                }, 5e3);
                return $(document).on("drop", function(event) {
                    var file, files, reader;
                    event || (event = window.event);
                    event.preventDefault();
                    event.stopPropagation();
                    event = event.originalEvent || event;
                    files = event.files || event.dataTransfer.files;
                    file = files[0];
                    reader = new FileReader;
                    reader.onload = function(e) {
                        var midiFile;
                        midiFile = e.target.result;
                        player.stop();
                        return loader.message("Loading MIDI", function() {
                            return app.loadMidiFile(midiFile, function() {
                                return loader.stop(function() {
                                    return player.play()
                                })
                            })
                        })
                    };
                    return reader.readAsDataURL(file)
                })
            })
        })
    })
}).call(this);