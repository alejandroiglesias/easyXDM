/*
 Copyright (c) <2009> <�yvind Sean Kinsey, oyvind@kinsey.no>
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */
var EasyXSS = {
    onReadyCallbacks: { //     
        /// <summary>
        /// Hashtable for storing callbacks when using hashTransport
        /// </summary>
    },
    registerOnReady: function(channel, callback){
        /// <summary>
        /// Register a callback that can be called when hash.html is fully loaded.
        /// </summary>
        /// <param name="channeL" type="string">The name of the channel</param>
        /// <param name="callback" type="function">The function to call</param>
        this.onReadyCallbacks[channel] = callback;
    },
    onReady: function(channel){
        /// <summary>
        /// Call the onReady method associated with the channel
        /// </summary>
        /// <param name="channel" type="string">The name of the channel</param>
        var fn = this.onReadyCallbacks[channel];
        if (fn) {
            fn();
            delete this.onReadyCallbacks[channel];
        }
    },
    converters: {
        json2Converter: {//
            /// <summary>
            /// A converter that uses the JSON library for
            /// converting between JSON strings and objects.
            /// </summary>
            /// <remark>
            /// Requires an available JSON object, native or using JSON2
            /// http://json.org/json2.js
            /// </remark>
            convertToString: function(data){
                return JSON.stringify(data);
            },
            convertFromString: function(message){
                return JSON.parse(message);
            }
        },
        hashTableConverter: {//
            /// <summary>
            /// A converter that can convert to and from hashtables
            /// string values, or values having valid string representation.
            /// </summary>
            convertToString: function(data){
                var message = "";
                for (key in data) {
                    message += key + "=" + escape(data[key]) + "&";
                }
                return message.substring(0, message.length - 1);
            },
            convertFromString: function(message){
                var data = {};
                var d = message.split("&");
                var pair, key, value;
                for (var i = 0, len = d.length; i < len; i++) {
                    pair = d[i];
                    key = pair.substring(0, pair.indexOf("="));
                    value = pair.substring(key.length + 1);
                    data[key] = unescape(value);
                }
                return data;
            }
        }
    },
    Query: function(){
        /// <summary>
        /// Returns a hashtable containing the query parameteres
        /// </summary>
        /// <returns type="object">A hashtable</returns>
        var pair, key, value, hash = {}, search = location.search.substring(1).split("&");
        for (var i = 0, len = search.length; i < len; i++) {
            pair = search[i];
            key = pair.substring(0, pair.indexOf("="));
            value = pair.substring(key.length + 1);
            hash[key] = value;
        }
        return hash;
    },
    getDomainName: function(url){
        /// <summary>
        /// </summary>
        /// <param name="url" type="string">The url to extract the domain from</param>
        /// <returns type="string">The domain part of the url</returns>
        var domain = url.substring(url.indexOf("//") + 2);
        domain = domain.substring(0, domain.indexOf("/"));
        var _indexOf = domain.indexOf(":");
        if (_indexOf != -1) {
            domain = domain.substring(0, _indexOf);
        }
        return domain;
    },
    getLocation: function(uri){
        /// <summary>
        /// Returns a string containing the schema, domain and if present the port
        /// </summary
        /// <param name="url" type="string">The url to extract the location from</param>
        /// <returns type="string">The location part of the url</returns>
        var indexOf = uri.indexOf("//");
        var loc = uri.substring(indexOf + 2);
        loc = loc.substring(0, loc.indexOf("/"));
        return uri.substring(0, indexOf + 2) + loc;
    },
    createFrame: function(url, name, onLoad){
        /// <summary>
        /// Creates a frame and appends it to the DOM. 
        /// </summary
        /// <param name="url" type="string">The url the frame should be set to</param>
        /// <param name="name" type="string">The id/name the frame should get</param>
        /// <param name="onLoad" type="function">
        /// A method that should be called with the frames contentWindow as argument
        /// when the frame is fully loaded.
        /// </param>
        /// <returns type="DOMElement">The frames DOMElement</returns>
        var frame;
        if (name && window.attachEvent) {
            // Internet Explorer does not support setting the 
            // name om DOMElements created in Javascript.
            // A workaround is to insert HTML and have the browser parse
            // and instantiate the element.
            var span = document.createElement("span");
            document.body.appendChild(span);
            span.innerHTML = '<iframe src="' + url + '" id="' + name + '" name="' + name + '"></iframe>';
            frame = document.getElementById(name);
            if (onLoad) {
                this.addEventListener(frame, "load", function(){
                    onLoad(frame.contentWindow);
                })
            }
        }
        else {
            // When name is not needed, or in other browsers, 
            // we use regular createElement.
            frame = document.createElement("IFRAME");
            frame.style.position = "absolute";
            frame.style.left = "-2000px";
            frame.name = name;
            frame.id = name;
            frame.src = url;
            if (onLoad) {
                this.addEventListener(frame, "load", function(){
                    onLoad(frame.contentWindow);
                })
            }
            document.body.appendChild(frame);
        }
        return frame;
    },
    addEventListener: function(element, event, handler){
        /// <summary>
        /// Gives a consistent interface for adding eventhandlers
        /// </summary
        /// <param name="element" type="DOMElement">The DOMElement to attach the handler to</param>
        /// <param name="event" type="string">The eventname</param>
        /// <param name="handler" type="function">The handler to attach</param>
        if (window.addEventListener) {
            element.addEventListener(event, handler, false);
        }
        else {
            element.attachEvent("on" + event, handler);
        }
    },
    removeEventListener: function(element, event, handler){
        /// <summary>
        /// Gives a consistent interface for removing eventhandlers
        /// </summary
        /// <param name="element" type="DOMElement">The DOMElement to remote the handler from</param>
        /// <param name="event" type="string">The eventname</param>
        /// <param name="handler" type="function">The handler to remove</param>
        if (window.removeEventListener) {
            element.removeEventListener(event, handler, false);
        }
        else {
            element.detachEvent("on" + event, handler);
        }
    },
    createTransport: function(config){
        /// <summary>
        /// Creates a transport channel using the available parameters.
        /// Parameters are collected both from the supplied config,
        /// but also from the querystring if not present in the config.
        /// </summary
        /// <param name="config" type="object"></param>
        /// <returns type="object">An object able to send and receive messages</returns>
        if (!config.local) {
            // We assume that this is the remote part of the channel
            var query = this.Query();
            config.channel = query["channel"];
            config.remote = query["endpoint"];
        }
        if (window.postMessage) {
            // We need to check here if it 'really' supports postMessage
            // Safari is unable to post messages to an iframe
            return this.createPostMessageTransport(config);
        }
        else {
            return this.createHashTransport(config);
        }
    },
    createChannel: function(config){
        /// <summary>
        /// Creates wrapper around the available transport mechanism that 
        /// also enables you to insert a converter for the messages transmitted.
        /// </summary
        /// <param name="config" type="object"></param>
        /// <returns type="object">An object able to send and receive arbitrary data</returns>
        /// <remark>The supported data types depends on the converter used</remark>
        // If a converter is present then we wrap the callback in a call to this
        config.onMessage = (config.converter) ? (function(message, origin){
            this.onData(this.converter.convertFromString(message), origin);
        }) : config.onData;
        var transport = this.createTransport(config);
        return {
            transport: transport,
            // If a converter is present then we wrap postMessage in a call to this
            sendData: (config.converter) ? (function(data){
                this.transport.postMessage(config.converter.convertToString(data));
            }) : transport.sendMessage,
            start: transport.start,
            stop: transport.stop
        };
    },
    createPostMessageTransport: function(config){
        /// <summary>
        /// Sets up the infrastructure for sending and receiving 
        /// messages using the window.postMessage interface.
        /// http://msdn.microsoft.com/en-us/library/ms644944(VS.85).aspx
        /// https://developer.mozilla.org/en/DOM/window.postMessage
        /// </summary
        /// <param name="config" type="object"></param>
        /// <returns type="object">An object able to send and receive strings</returns>
        var xss = this;
        var _targetOrigin = xss.getLocation(config.remote);
        var _windowPostMessage;
        var _isStarted, _isReady;
        
        function _getOrigin(event){
            /// <summary>
            /// The origin property should be valid, but some clients
            /// still uses the uri or domain property.
            /// </summary
            /// <param name="event" type="MessageEvent">The eventobject from the browser</param>
            /// <returns type="string">The origin of the event</returns>
            if (event.origin) {
                return event.origin;
            }
            if (event.uri) {
                return xss.getLocation(event.uri);
            }
            if (event.domain) {
                // This will fail if the origin is not using the same
                // schema as we are
                return location.protocol + "//" + event.domain;
            }
            throw "Unable to retrieve the origin of the event"
        }
        
        function _window_onMessage(event){
            /// <summary>
            /// The handler for the "message" event.
            /// If the origin is allowed then we relay the message to the receiver
            /// </summary
            /// <param name="event" type="MessageEvent">The eventobject from the browser</param>
            var origin = _getOrigin(event);
            if (origin == _targetOrigin) {
                config.onMessage(event.data, origin);
            }
        }
        function _onReady(){
            /// <summary>
            /// Calls the supplied onReady method
            /// </summary
            /// <remark>
            /// We delay this so that the the call to createChannel or 
            /// createTransport will have completed  
            /// </remark>
            if (config.onReady) {
                window.setTimeout(config.onReady, 10);
            }
        }
        
        if (config.local) {
            _listeningWindow = xss.createFrame(config.remote + "?endpoint=" + config.local + "&channel=" + config.channel, "", function(win){
                _windowPostMessage = win.postMessage;
                _onReady();
            });
        }
        else {
            _windowPostMessage = window.parent.postMessage;
            _onReady();
        }
        xss.addEventListener(window, "message", _window_onMessage);
        return {
            postMessage: function(message){
                /// <summary>
                /// Sends the message using the bound window object
                /// </summary
                _windowPostMessage(message, _targetOrigin);
            },
            start: function(){
                //No-op
            },
            stop: function(){
                //No-op
            }
        };
    },
    createHashTransport: function(config){
        /// <summary>
        /// Sets up the infrastructure for sending and receiving 
        /// messages using the the IFrame URI Technique.
        /// </summary
        /// <param name="config" type="object"></param>
        /// <returns type="object">An object able to send and receive strings</returns>
        var xss = this;
        var _timer = null;
        var _lastMsg = "#" + config.channel, _msgNr = 0;
        var _listenerWindow = (!config.local) ? window : null, _callerWindow;
        var _remoteUrl = config.remote + ((config.local) ? "?endpoint=" + config.local + "&channel=" + config.channel : "#" + config.channel);
        var _remoteOrigin = this.getLocation(config.remote);
        var _pollInterval = (config.interval) ? config.interval : 300;
        
        function _checkForMessage(){
            /// <summary>
            /// Checks location.hash for a new message and relays this to the receiver.
            /// </summary
            /// <remark>
            /// We have no way of knowing if messages have passed in between the checks.
            /// We could possibly device a way of reporting back the message number read
            /// so that the sender can concatenate multiple messages if previous message
            /// are unread. 
            /// </remark>
            if (!_listenerWindow) {
                // If _listenerWindow is not already set (to window) then we try to attach the 
                // frame located on [remote]. 
                // We need to include the hash part of the url to avoid reloading the frame.
                _listenerWindow = window.open(config.local + "#" + config.channel, "xss_" + config.channel);
            }
            if (_listenerWindow.location.hash && _listenerWindow.location.hash != _lastMsg) {
                _lastMsg = _listenerWindow.location.hash
                config.onMessage(decodeURIComponent(_lastMsg.substring(_lastMsg.indexOf("_") + 1)), _remoteOrigin);
            }
        }
        
        function _postMessage(message){
            /// <summary>
            /// Sends a message by encoding and placing it in the hash part of _callerWindows url. 
            /// </summary
            /// <param name="message" type="string">The message to send</param>
            /// <remark>
            /// We include a message number so that identical messages will be read as separate messages.
            /// </remark>
            _callerWindow.src = _remoteUrl + "#" + (_msgNr++) + "_" + encodeURIComponent(message);
        }
        
        _callerWindow = xss.createFrame(_remoteUrl, ((config.local) ? "" : "xss_" + config.channel), function(){
            if (config.onReady) {
                if (config.local) {
                    // Register onReady callback in the library so that
                    // it can be called when hash.html has loaded.
                    xss.registerOnReady(config.channel, config.onReady);
                }
                else {
                    config.onReady();
                }
            }
        });
        
        return {
            postMessage: _postMessage,
            start: function(){
                _timer = window.setInterval(function(){
                    _checkForMessage();
                }, _pollInterval);
            },
            stop: function(){
                window.clearInterval(_timer);
                _listenerWindow = null;
                _callerWindow.parentNode.removeChild(_callerWindow);
            }
        };
    }
}
