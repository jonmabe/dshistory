// dsHistory, v1.0
// Copyright (c) 2007 Andrew Mattie (http://www.akmattie.net)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

var dsHistory = function() {
	// we need a good browser detection library. these detections were kindly borrowed from the Prototype library
	var browser = {
		IE: !!(window.attachEvent && !window.opera),
		IE6: this.IE && window.navigator.userAgent.indexOf("MSIE 6") != -1,
		IE7: this.IE && window.navigator.userAgent.indexOf("MSIE 7") != -1,
		Opera: !!window.opera,
		WebKit: navigator.userAgent.indexOf('AppleWebKit/') > -1,
		Gecko: navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
		GeckoMac: this.Gecko && navigator.userAgent.indexOf("Mac OS X")!=-1,
		MobileSafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/)
	};
	var supportsDataProtocol = browser.Opera || browser.WebKit || browser.Gecko;
	var lastFrameIteration = 0;
	var lastHash = '';
	var dirtyHash = window.location.hash;
	var initialHash = window.location.hash;
	var hashCache = []; // holds all previous hashes
	var forwardHashCache = []; // hashes that are removed from hashCache as the user goes back are concat'd here
	var eventCache = []; // holds all events
	var forwardEventCache = []; // events that are removed from eventCache as the user goes back are concat'd here
	var isInHistory = false; // if we're somewhere in the middle of the history stack, this will be set to true
	var options; // holds the options literal passed into the init function
	var frameWindow, frameDocument; // since we're going to be looking at the internals of the frame so often, we will cache a reference to it and just unload it when the page unloads
	var watcherInterval; // save the handle returned by setInterval so we can unregister it on unload
	var isGoingBackward, isGoingForward; // assists us in knowing whether we're going back through the history or forward
	
	// internal function to make sure we don't leave any memory leaks when the visitor leaves
	function unload() {
		window.clearInterval(watcherInterval);
		delete frameWindow;
		delete eventCache;
	}
	// internal function to load and split our query vars into our QueryElements object
	function loadQueryVars() {
		// flush out the object each time this is called
		this.QueryElements = {};
		
		if (window.location.hash == '' || window.location.hash == '#') return;
		
		var hashItems = window.location.hash.substring(1).split('&');
		for (i = 0; i < hashItems.length; i++) {
			if (hashItems[i].indexOf('=') != -1)
				// the encoding and decoding of the hash is taken care of by the browser
				this.QueryElements[hashItems[i].split('=')[0]] = hashItems[i].split('=')[1];
			else
				this.QueryElements[hashItems[i]] = '';
		}
		
		lastHash = window.location.hash;
	}
	// internal function to be called when we want to actually add something to the browser's history
	function updateFrameIteration(comingFromQueryBind) {
		var currentIteration = parseInt(frameWindow.document.body.textContent);
		var lastEvent, newEvent, lastHash;
		
		// it seems that gecko has a sweet bug / feature / something that prevents the history from changing with a frame iteration after a hash has changed the history
		// therefore, we have to mess with the hash enough to get it to add to the browser's history and then change it back so we don't screw up any values in the hash
		if (hashCache.length > 0 && !browser.IE) {
			// splice the event off the stack so we can add it on later
			lastEvent = eventCache.splice(eventCache.length - 1, 1)[0];
			lastHash = lastHash;
			
			if (lastHash == '') lastHash = '#';
			
			// use the dirty hash here since it's encoded and window.location.hash isn't encoded. otherwise, the history could be updated inadvertently
			window.location.hash = lastHash + String(hashCache.length); // this can be anything, as long as the hash changes
			hashCache.push(window.location.hash);
			
			window.location.hash = lastHash;
			hashCache.push(window.location.hash);
			
			// since we popped off the last event on the history stack, we're going to add it back on _after_ we add on a function to get back to our unadultered hash
			eventCache.push(function(direction) {
				if (direction == 'back') {
					isGoingBackward = true;
					window.history.back();
				} else {
					isGoingForward = true;
					window.history.forward();
				}
			});
			eventCache.push(lastEvent);
			
			return;
		}
		
		// there's no reason to change the frame source if we're only adding the first event to the history
		if (
			currentIteration == 0
			&& ( (hashCache.length == (comingFromQueryBind ? 1 : 0) && !browser.IE) || (hashCache.length == 2 && browser.IE) ) // extra hash for ie
			&& eventCache.length <= 1
			) {
			frameWindow.document.body.textContent = '1';
		} else {
			if (supportsDataProtocol)
				document.getElementById('dsHistoryFrame').src = 'data:,' + String(currentIteration + 1);
			//else
				//document.getElementById('dsHistoryFrame').src = 'javascript:document.open();document.write(\'' + String(currentIteration + 1) + '\');document.close()';
			//document.getElementById('dsHistoryFrame').src = 'about:' + String(currentIteration + 1);
			//document.write('<iframe id="dsHistoryFrame" name="dsHistoryFrame" style="display:none" src="javascript:document.open();document.write(\'0\');document.close();"></iframe>');
			//frameWindow.document.open();
			//frameWindow.document.write(String(currentIteration + 1));
			//frameWindow.document.close();
		}
	}
	// internal function that is called every 10 ms to check to see if we've gone back in time
	function frameWatcher() {
		if (!frameWindow.document) return; // don't worry about watching the frame until this is initialized
		
		var frameIteration = parseInt(frameWindow.document.body.textContent);
		var windowHash = window.location.hash;
		
		if (isInHistory && hashCache.length > 1 && window.location.hash == hashCache[0] && dirtyHash != initialHash)
			dirtyHash = initialHash;
		
		// if the frame iteration is different or the window hash is different, we'll start a sequence of events to go back in time
		if (
			!isGoingForward
			&& (
				frameIteration < lastFrameIteration
				|| (lastHash != windowHash && hashCache[hashCache.length - 2] == windowHash && !browser.IE)
				)
			) {
			
			// this will be the pre-qual for our people hitting the forward button
			isInHistory = true;
			isGoingBackward = false;
			
			// if the hash has changed, or if we're using IE (in which case we change the hash with every event), make sure we
			// keep the hashCache and related items up-to-date
			if ((lastHash != windowHash && hashCache[hashCache.length - 2] == windowHash) || browser.IE) {
				forwardHashCache = forwardHashCache.concat(hashCache.splice(hashCache.length - 1, 1));
				
				// IE doesn't change the window hash when the user goes back, so we have to do it manually from our hashCache
				if (browser.IE)
					window.location.hash = hashCache[hashCache.length - 1];
				
				// we need to set this here so that if history.back() is one of the functions on the eventCache,
				// it will know we're on a different hash
				lastHash = window.location.hash;
				dirtyHash = window.location.hash;
			}
			
			// subtract 2 from eventCache.length since we're gonna end up calling the second function from the end when someone clicks the
			// back button. we can assume that another function was pushed onto the stack since the time the function we are going to call was
			// added. essentially, the last function in the array is the function we are on now, so we need to ignore it in here.
			
			// all functions that are pushed onto the history stack should consume the 'true' parameter that indicates that the call
			// came from here. this is done to prevent the object from pushing itself back onto the history stack a second time.
			
			if (eventCache.length > 1) {
				eventCache[eventCache.length - 2]('back');
				forwardEventCache = forwardEventCache.concat(eventCache.splice(eventCache.length - 1, 1));
			}
		}
		
		// handle the forward button. we determine whether we're moving forward if 1) the user hit the back button and we haven't added a
		// function or bound the query vars since, 2) we haven't hit our built-in history.back function to work around gecko's
		// updating-frame-doesnt-update-history-after-hash-has-been-added bug, and 3) the secondary conditions that allow us to know
		// whether we're going back in our history are inversed
		
		else if (
			isInHistory
			&& !isGoingBackward
			&& (
				frameIteration > lastFrameIteration
				|| (lastHash != windowHash && forwardHashCache[forwardHashCache.length - 1] == windowHash && !browser.IE)
				)
			) {
			isGoingForward = false;
			
			// the internals of this are nearly the same as the way we handle the visitor going back, except we use different caches
			// for reading the events and hashes we spliced off as we went back
			if ((lastHash != windowHash && forwardHashCache[forwardHashCache.length - 1] == windowHash) || browser.IE) {
				if (browser.IE)
					window.location.hash = forwardHashCache[forwardHashCache.length - 1];
				lastHash = window.location.hash;
				dirtyHash = window.location.hash;
				hashCache = hashCache.concat(forwardHashCache.splice(forwardHashCache.length - 1, 1));
			}
			
			forwardEventCache[forwardEventCache.length - 1]('forward');
			eventCache = eventCache.concat(forwardEventCache.splice(forwardEventCache.length - 1, 1));
		}
		
		// so we always have something to compare to the next time this is called
		lastFrameIteration = frameIteration;
	}
	
	return {
		QueryElements: {}, // name/value collection to hold the values in the window hash
		initialize: function(initOptions) {
			// we use a frame to track history all the time in IE since window.location.hash doesn't update the history.
			// in Gecko, we only use a frame to track history when we're not also trying to update the window hash
			
			if (supportsDataProtocol)
				document.write('<iframe id="dsHistoryFrame" name="dsHistoryFrame" style="display:none" src="data:,0"></iframe>');
			else
				document.write('<iframe id="dsHistoryFrame" name="dsHistoryFrame" style="display:none" src="javascript:document.open();document.write(\'0\');document.close();"></iframe>');
			//document.write('<iframe id="dsHistoryFrame" name="dsHistoryFrame" style="display:none" src="about:0"></iframe>');
			
			frameWindow = window.frames['dsHistoryFrame'];
			
			if (browser.IE)
				hashCache.push(window.location.hash);
			watcherInterval = window.setInterval(frameWatcher, 15);
			
			// initialize the QueryElements object
			loadQueryVars.call(this);
			
			if (typeof initOptions == 'object') {
				options = initOptions;
				if (typeof initOptions.dispatchFunction == 'function') options.dispatchFnc();
			}
			if (typeof initOptions == 'function') initOptions(); // kept for backwards compatibility
			
			// make sure we don't leave any memory leaks when the visitor leaves
			if (window.addEventListener)
				window.addEventListener('unload', unload, false);
			else if (window.attachEvent)
				window.attachEvent('onunload', unload);
		},
		addFunction: function(fnc) {
			// flush out anything that would have been used for the forward action if the user had used the back action
			isInHistory = false;
			forwardEventCache = [];
			forwardHashCache = [];
			
			// if the first event on the stack was put on when we changed the window hash and the visitor has gone back, we're going to 
			// go forward once to keep the implementation the same across the board. see my blog post for more info
			if (
				!browser.IE
				&& hashCache.length == 1
				&& eventCache.length == 1
				&& (window.location.hash == '' || window.location.hash == '#')
				)
				window.history.forward();
			
			// with IE, we want to make sure they're a hash entry put into the cache every time we change the frame
			// since moving back won't change the location hash. we'll use the hash cache to manually change the cache then.
			if (browser.IE)
				hashCache.push(window.location.hash);
			
			eventCache.push(fnc);
			updateFrameIteration();
		},
		// this will conditionally add or update the name / value that was passed in. it will also add / update the QueryElements object
		setQueryVar: function(key, value) {
			// these used to be encoded with encodeURIComponent, but it turns out that encodings are performed automatically.
			var encodedKey = String(key);
			var encodedValue = String(typeof value == 'undefined' ? '' : value);
			
			if (dirtyHash.indexOf('#') == -1 || dirtyHash.indexOf('#_serial') == 0) {
				if (encodedValue != '')
					dirtyHash = '#' + encodedKey + '=' + encodedValue;
				else
					dirtyHash = '#' + encodedKey;
			} else {
				if (typeof this.QueryElements[encodedKey] != 'undefined' && encodedValue != '') {
					dirtyHash = dirtyHash.substr(0, dirtyHash.indexOf(encodedKey) + encodedKey.length + 1) + encodedValue + dirtyHash.substr(dirtyHash.indexOf(encodedKey) + encodedKey.length + 1 + String(this.QueryElements[encodedKey]).length);
				} else if (typeof this.QueryElements[encodedKey] == 'undefined') {
					if (encodedValue == '')
						dirtyHash += '&' + encodedKey;
					else
						dirtyHash += '&' + encodedKey + '=' + encodedValue;
				}
			}
			
			this.QueryElements[key] = encodedValue;
			
			if (hashCache > 1 && hashCache[hashCache.length - 2] == dirtyHash)
				dirtyHash += '_serial=' + hashCache.length;
			else if (dirtyHash.indexOf('_serial') != -1)
				removeQueryVar('_serial');
		},
		// this will remove the property of the QueryElements object and remove the name and value of the object in the dirtyHash
		removeQueryVar: function(key) {
			if (!this.QueryElements[key] && key != '_serial') return;
			
			var dataToStrip, indexOfData, removeAmpersand;
			
			if (this.QueryElements[key] == '')
				dataToStrip = key;
			else
				dataToStrip = key + '=' + this.QueryElements[key];
			
			indexOfData = dirtyHash.indexOf(dataToStrip);
			removeAmpersand = dirtyHash[indexOfData + dataToStrip.length] == '&';
			dirtyHash = dirtyHash.substr(0, indexOfData) + dirtyHash.substr(indexOfData + dataToStrip.length + (removeAmpersand ? 1 : 0));
			if (dirtyHash.substr(dirtyHash.length - 1) == '&')
				dirtyHash = dirtyHash.substr(0, dirtyHash.length - 1);
			
			// no need to have the actual ''query' part start with an ampersand if the very first element was removed
			if (dirtyHash.indexOf('#&') == 0) dirtyHash = '#' + dirtyHash.substr(2);
			
			delete this.QueryElements[key];
			
			// if the hash is empty, a serial number is appended to it so we can keep track of whether we're going forward or backward in the
			// frame watcher. this is needed specifically when a value is added, removed, and added again.
			if (dirtyHash == '#') dirtyHash = '#_serial=' + hashCache.length;
		},
		// we don't want to update the window has until this function is called since, otherwise, the history will change all
		// the time in Gecko browsers.
		bindQueryVars: function(fnc, continueProcessing) {
			if (window.location.hash == dirtyHash) return;
			
			// if the option to defer processing has been set and 
			if (options.deferProcessing && !continueProcessing) {
			    window.setTimeout(function() { arguments.callee.name(fnc, true); }, 1);
			    return;
			}
			
			// flush out anything that would have been used for the forward action if the user had used the back action
			isInHistory = false;
			forwardEventCache = [];
			forwardHashCache = [];
			
			if (
				!browser.IE
				&& hashCache.length == 1
				&& eventCache.length == 1
				&& (window.location.hash == '' || window.location.hash == '#')
				)
				window.history.forward();
			
			// so we have an empty hash to go back to on our first time around (but only if we're not using IE since otherwise we're adding
			// to the hashCache every single time anyway
			if (hashCache.length == 0 && eventCache.length > 0 && !browser.IE)
				hashCache.push(window.location.hash);
				
			window.location.hash = dirtyHash;
			lastHash = window.location.hash;
			
			hashCache.push(lastHash);
			eventCache.push(fnc);
			
			if (browser.IE)
				updateFrameIteration(true);
			
			loadQueryVars.call(this);
		},
		setFirstEvent: function(fnc) {
			if (eventCache.length > 0)
				eventCache[0] = fnc;
		}
	}
}();