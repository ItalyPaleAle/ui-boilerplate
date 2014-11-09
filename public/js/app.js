(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.Rosso=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var isArray = _dereq_('isarray');

/**
 * Expose `pathtoRegexp`.
 */
module.exports = pathtoRegexp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match already escaped characters that would otherwise incorrectly appear
  // in future matches. This allows the user to escape special characters that
  // shouldn't be transformed.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
  // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
  '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
  // Match regexp special characters that should always be escaped.
  '([.+*?=^!:${}()[\\]|\\/])'
].join('|'), 'g');

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1');
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;

  return re;
};

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array should be passed in, which will contain the placeholder key
 * names. For example `/user/:id` will then contain `["id"]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 keys
 * @param  {Object}                options
 * @return {RegExp}
 */
function pathtoRegexp (path, keys, options) {
  if (!isArray(keys)) {
    options = keys;
    keys = null;
  }

  keys = keys || [];
  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var flags = options.sensitive ? '' : 'i';
  var index = 0;

  if (path instanceof RegExp) {
    // Match all capturing groups of a regexp.
    var groups = path.source.match(/\((?!\?)/g);

    // Map all the matches to their numeric indexes and push into the keys.
    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name:      i,
          delimiter: null,
          optional:  false,
          repeat:    false
        });
      }
    }

    // Return the source back to the user.
    return attachKeys(path, keys);
  }

  // Map array parts into regexps and return their source. We also pass
  // the same keys and options instance into every generation to get
  // consistent matching groups before we join the sources together.
  if (isArray(path)) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathtoRegexp(path[i], keys, options).source);
    }
    // Generate a new regexp instance by joining all the parts together.
    return attachKeys(new RegExp('(?:' + parts.join('|') + ')', flags), keys);
  }

  // Alter the path string into a usable regexp.
  path = path.replace(PATH_REGEXP, function (match, escaped, prefix, key, capture, group, suffix, escape) {
    // Avoiding re-escaping escaped characters.
    if (escaped) {
      return escaped;
    }

    // Escape regexp special characters.
    if (escape) {
      return '\\' + escape;
    }

    var repeat   = suffix === '+' || suffix === '*';
    var optional = suffix === '?' || suffix === '*';

    keys.push({
      name:      key || index++,
      delimiter: prefix || '/',
      optional:  optional,
      repeat:    repeat
    });

    // Escape the prefix character.
    prefix = prefix ? '\\' + prefix : '';

    // Match using the custom capturing group, or fallback to capturing
    // everything up to the next slash (or next period if the param was
    // prefixed with a period).
    capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

    // Allow parameters to be repeated more than once.
    if (repeat) {
      capture = capture + '(?:' + prefix + capture + ')*';
    }

    // Allow a parameter to be optional.
    if (optional) {
      return '(?:' + prefix + '(' + capture + '))?';
    }

    // Basic parameter support.
    return prefix + '(' + capture + ')';
  });

  // Check whether the path ends in a slash as it alters some match behaviour.
  var endsWithSlash = path[path.length - 1] === '/';

  // In non-strict mode we allow an optional trailing slash in the match. If
  // the path to match already ended with a slash, we need to remove it for
  // consistency. The slash is only valid at the very end of a path match, not
  // anywhere in the middle. This is important for non-ending mode, otherwise
  // "/test/" will match "/test//route".
  if (!strict) {
    path = (endsWithSlash ? path.slice(0, -2) : path) + '(?:\\/(?=$))?';
  }

  // In non-ending mode, we need prompt the capturing groups to match as much
  // as possible by using a positive lookahead for the end or next path segment.
  if (!end) {
    path += strict && endsWithSlash ? '' : '(?=\\/|$)';
  }

  return attachKeys(new RegExp('^' + path + (end ? '$' : ''), flags), keys);
};

},{"isarray":2}],2:[function(_dereq_,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],3:[function(_dereq_,module,exports){
/*!
 Rosso.js - minimal client-side JS framework
 (C) 2014 Alessandro Segala
 Based on page.js, (C) 2012 TJ Holowaychuk <tj@vision-media.ca>.
 License: MIT
*/

'use strict';

/**
 * Initialize a new `Context`
 * with the given `path`.
 *
 * @param {String} path
 */

function Context(path) {
	var i = path.indexOf('?')
	
	this.path = path
	this.querystring = (i !== -1)
		? path.slice(i + 1)
		: ''
	this.pathname = (i !== -1)
		? path.slice(0, i)
		: path
	
	this.params = []
	
	this.querystringParams = {}
	if(this.querystring) {
		var allKV = this.querystring.split('&')
		for(var e in allKV) {
			var parts = allKV[e].split('=').map(decodeURIComponent)
			this.querystringParams[parts[0]] = parts[1]
		}
	}
}

/**
 * Expose Context
 */

if(module) module.exports = Context

},{}],4:[function(_dereq_,module,exports){
/*!
 Rosso.js - minimal client-side JS framework
 (C) 2014 Alessandro Segala
 Based on page.js, (C) 2012 TJ Holowaychuk <tj@vision-media.ca>.
 License: MIT
*/

'use strict';

/**
 * Require dependencies with browserify.
 */
var Route = _dereq_('./Route.js')
var Context = _dereq_('./Context.js')

/**
 * Running flag.
 */
var running = false

/**
 * Default options for Rosso.js.
 */
var options = {
	container: ''
}

/**
 * Hold the Route object for the current page.
 */
var currentPage = false

/**
 * Register `path` with `args`,
 * or show page `path`, or `Rosso.init([options])`.
 *
 *		  Rosso('/user/:id', args)
 *		  Rosso('/list/')
 *		  Rosso()
 *		  Rosso(options)
 *		  Rosso('*', args)
 *
 * @param {String|Object} path
 * @param {Object} args...
 * @api public
 */

function Rosso(path, args) {
	// route <path> to <args>
	if(typeof args == 'object') {
		var newRoute = new Route(path, args)
		Rosso.routes.push(newRoute)
	}
	// show <path>
	else if(typeof path == 'string') {
		Rosso.show(path)
	}
	// init with [options]
	else {
		Rosso.init(path)
	}
}

/**
 * Contain all routes and middlewares.
 */

Rosso.routes = []
Rosso.middlewares = {}

/**
 * Register a middleware.
 *
 * @param {String} name
 * @param {Object} args
 * @api public
 */

Rosso.middleware = function(name, args) {
	Rosso.middlewares[name] = args
}

/**
 * Set `value` for option `name`.
 *
 * @param {String} name
 * @param {String} value
 * @api public
 */
 
Rosso.setOption = function(name, value) {
	options[name] = value
}

/**
 * Return the value for option `name`.
 *
 * @param {String} name
 * @return {String}
 * @api public
 */

Rosso.getOption = function(name) {
	return options[name]
}

/**
 * Initialize Rosso.js listener with `opts`.
 *
 * Options:
 *
 *		  - `container` id of the container object where to display views, or empty to disable ['']
 *
 * @param {Object} opts
 * @api public
 */

Rosso.init = function(opts) {
	for(var name in opts) {
		this.setOption(name, opts[name])
	}
	
	if(!running) {
		running = true
		window.addEventListener('hashchange', locationHashChanged, false)
		// Force the callback when first init (normally at page load)
		locationHashChanged()
	}
}

/**
 * Unbind hashchange event handler.
 *
 * @api public
 */

Rosso.deinit = function() {
	running = false
	window.removeEventListener('hashchange', locationHashChanged, false)
}

/**
 * Push a new `path` into the history stack.
 *
 * @param {String} path
 * @api public
 */

Rosso.push = function(path) {
	// Remove starting # if present
	if(path.substr(0, 1) == '#') path = path.substr(1)
	
	window.location.hash = '#'+path
}

/**
 * Pop the history stack.
 *
 * @api public
 */

Rosso.pop = function() {
	window.history.back()
}

/**
 * Replaces the current page with `path` without modifying the history stack.
 *
 * @param {String} path
 * @api public
 */

Rosso.replace = function(path) {
	// Remove starting # if present
	if(path.substr(0, 1) == '#') path = path.substr(1)
	
	// For browsers supporting HTML5 History API, this code is preferred. The other code does not work on Chrome on iOS and other browsers
	if(window.history && history.replaceState) {
		history.replaceState(undefined, undefined, '#'+path)
		// Force an update (necessary when not using location.replace)
		locationHashChanged()
	}
	else {
		location.replace('#'+path)
	}
}

/**
 * Show `path`.
 *
 * @param {String} path
 * @return {Context}
 * @api private
 */

Rosso.show = function(path) {
	// Remove starting # if present
	if(path.substr(0, 1) == '#') path = path.substr(1)
	
	if(currentPage) {
		Rosso.unloadPage(currentPage)
		currentPage = false
	}
	
	if(!path) path = ''
	
	var ctx = new Context(path)
	for(var i = 0; i < Rosso.routes.length; i++) {
		var route = Rosso.routes[i]
		if(route.match(ctx.path, ctx.params)) {
			Rosso.loadPage(route.args, ctx, function(success) {
				currentPage = route
			})
			break
		}
	}
	
	return ctx
}

/**
 * Get current path.
 *
 * @return {String}
 * @api private
 */

Rosso.getPath = function() {
	if(window.location.href.indexOf('#') > -1) {
		var parts = window.location.href.split('#')
		return parts[parts.length - 1]
	}
	return ''
}

/**
 * Load a page: initialize it and show the view.
 *
 * @param {Object} args
 * @param {Context} ctx
 * @param {Function} endCallback(success)
 * @api private
 */

Rosso.loadPage = function(args, ctx, endCallback) {
	// Using slice to copy the array without referencing it
	var callbacks = args.middlewares ? args.middlewares.slice() : []
	
	var initPage = function(ctx, next) {
		if(args.view && options.container) {
			var destinationEl = document.getElementById(options.container)
			
			// View is a string with the id of an element
			if(typeof args.view == 'string' && args.view[0] == '#') {
				var sourceEl = document.getElementById(args.view.substr(1))
				if(sourceEl && destinationEl) {
					var contents = sourceEl.innerHTML
					destinationEl.innerHTML = contents
				}
			}
			else if(typeof args.view == 'function') {
				var contents = args.view(ctx)
				if(destinationEl) {
					destinationEl.innerHTML = contents
				}
			}
		}
		
		if(args.init) {
			args.init(ctx, next)
		}
	}
	callbacks.push(initPage)
		
	var errorCb = function(ctx, next) {
		next(true)
	}
	
	// next(error): the callback to continue with the following middleware. Pass any value that casts to true to interrput the cycle
	var next = function(error) {
		if(error) {
			return endCallback(false)
		}
		
		var cb = callbacks.shift()
		if(cb) {
			// Load middleware with name 'cb'
			if(typeof cb == 'string') {
				cb = Rosso.middlewares[cb] ? Rosso.middlewares[cb].init : false
				if(!cb) {
					cb = errorCb
				}
			}
			cb(ctx, next)
		}
		else {
			endCallback(true)
		}
	}
	next()
	
	return true
}

/**
 * Unload a page.
 *
 * @param {Route} page
 * @api private
 */

Rosso.unloadPage = function(page) {
	if(page.args.destroy) {
		page.args.destroy()
	}
}

/**
 * Handle hashchange events.
 */

function locationHashChanged() {
	Rosso.show(Rosso.getPath())
}


/**
 * Expose Rosso
 */
if(module) module.exports = Rosso
window.Rosso = Rosso

},{"./Context.js":3,"./Route.js":5}],5:[function(_dereq_,module,exports){
/*!
 Rosso.js - minimal client-side JS framework
 (C) 2014 Alessandro Segala
 Based on page.js, (C) 2012 TJ Holowaychuk <tj@vision-media.ca>.
 License: MIT
*/

'use strict';

/**
* Module dependencies.
*/

var pathToRegexp = _dereq_('path-to-regexp')

/**
 * Initialize `Route` with the given HTTP `path`
 * and `options`.
 *
 * Options (see also https://github.com/pillarjs/path-to-regexp#usage ):
 *
 *		  - `sensitive`		enable case-sensitive routes [false]
 *		  - `strict`		enable strict matching for trailing slashes [false]
 *
 * @param {String} path
 * @param {Object} args
 * @param {Object} options
 */

function Route(path, args, options) {
	options = options || {}
	this.path = (path === '*') ? '(.*)' : path
	this.regexp = pathToRegexp(this.path,
		this.keys = [],
		options.sensitive,
		options.strict)
	this.args = args
}

/**
 * Return args for the current route.
 *
 * @return {Object}
 */

Route.prototype.getArgs = function() {
	return this.args ? this.args : {}
}

/**
 * Set args for the current route.
 *
 * @param {Object} args
 */
 
 Route.prototype.setArgs = function(args) {
	this.args = args
}

/**
 * Check if this route matches `path`, if so
 * populate `params`.
 *
 * @param {String} path
 * @param {Array} params
 * @return {Boolean}
 */

Route.prototype.match = function(path, params) {
	var keys = this.keys
	var qsIndex = path.indexOf('?')
	var pathname = (qsIndex !== -1)
		? path.slice(0, qsIndex)
		: path
	var m = this.regexp.exec(decodeURIComponent(pathname))
	
	if(!m) return false
	
	for(var i = 1, len = m.length; i < len; ++i) {
		var key = keys[i - 1]
		
		var val = (typeof m[i] == 'string')
			? decodeURIComponent(m[i])
			: m[i]
		
		if(key) {
			params[key.name] = undefined !== params[key.name]
				? params[key.name]
				: val
		}
		else {
			params.push(val)
		}
	}
	
	return true
}

/**
 * Expose Route
 */

module.exports = Route

},{"path-to-regexp":1}]},{},[4])(4)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
/* LDApp.js
This file is the only one included by index.html. It defines all the dependencies that are then compiled using browserify with grunt.
*/

;(function(){
	'use strict';
	
	/*
	Require dependencies
	*/
	
	/*
	Modules that expose globals
	These modules expose a global property (even though they may support modules.export and are included here to be available everywhere
	*/
	// Let's not require jQuery, so it can be loaded from an external CDN
	//require('jquery/dist/jquery.js')
	require("./../bower_components/rosso/Rosso.js")
	// LDRequest, LDSession and LDUI must export a global object to avoid reciprocal inclusion problems
	require('lib/LDRequest.js')
	require('lib/LDSession.js')
	require('lib/LDUI.js')
	
	/*
	Rosso.js middlewares
	*/
	require('middlewares/requireAuth.js') // require-auth
	
	/*
	Rosso.js routes
	*/
	require('routes/home.js')
	require('routes/login.js')
	require('routes/logout.js')
	require('routes/404.js') // Always include last!
	
	/*
	Initialization code
	*/
	LDSession.init()
	LDUI.init()
	Rosso({container: 'main'})
})();

},{"./../bower_components/rosso/Rosso.js":1,"lib/LDRequest.js":4,"lib/LDSession.js":5,"lib/LDUI.js":6,"middlewares/requireAuth.js":8,"routes/404.js":9,"routes/home.js":10,"routes/login.js":11,"routes/logout.js":12}],3:[function(require,module,exports){
/* appConfig.js
Configuration file for the app
*/

;(function(){
	'use strict';
	
	var appConfig = {
		// URL for the API backend server
		apiUrl: 'http://localhost:3000/',
		
		// Configuration for the session module
		session: {
			// The header returned by the server
			headerName: 'X-Session-Token',
			// For HTML5 session storage
			storageKey: 'app-session-token',
			// Interval for refreshing the session
			refreshInterval: 1200*1000 // 20 minutes
		}
	}
	
	module.exports = appConfig
})();

},{}],4:[function(require,module,exports){
;(function(){
	'use strict';
	
	var appConfig = require('appConfig.js')
	
	/*
	 Create a request to the API server.
	 LDRequest(type, method, data, success[, error])
	 LDRequest(type, method, success[, error])
	 LDRequest(obj)
	 Parameters:
	 - type = request type (string: 'GET', 'POST', etc)
	 - method = API method to call (string or array)
	 - data = array of POST parameters (optional)
	 - success = success callback
	 - error = error callback (optional)
	*/
	function LDRequest(type, method, data, success, error) {
		// LDRequest(obj)
		if(typeof type == 'object') {
			var obj = type
			// Extract all values from the object
			type	= obj.type || false
			method	= obj.method || false
			data	= obj.data || false
			success	= obj.success || false
			error	= obj.error || false
		}
		// LDRequest(type, method, success[, error])
		else if(typeof data == 'function') {
			// Shift all parameters (error is optional)
			if(success) {
				error = success
			}
			success = data
			data = false
		}
		
		var url = LDRequest.makeUrl(method)
		var sessionHeader = LDSession.sessionHeader()
		
		// Setup the request
		var opts = {
			type: type.toUpperCase(),
			url: url,
			success: function(data, textStatus, jqXHR) {
				// Update the session token if found
				LDSession.updateSessionToken(jqXHR)
				
				// User callback
				if(success) success(data, textStatus, jqXHR)
			},
			error: function(jqXHR, textStatus, errorThrown) {
				// Update the session token if found
				LDSession.updateSessionToken(jqXHR)
				
				// User callback
				if(error) error(jqXHR, textStatus, errorThrown)
			}
		}
		if(data) {
			opts.data = data
		}
		if(sessionHeader) {
			opts.headers = sessionHeader
		}
		
		// Fire the request
		$.ajax(opts)
	}
	
	/*
	 Return the URL for a request to the API server
	 LDRequest.makeUrl(str1...)
	 LDRequest.makeUrl(array)
	*/
	LDRequest.makeUrl = function(args) {
		var parts
		if(arguments.length == 1 && typeof arguments[0] == 'array') {
			parts = arguments[0]
		}
		else {
			parts = Array.prototype.slice.call(arguments)
		}
		
		var method = parts.join('/')
		// Trim slashes
		if(method.substr(0, 1) == '/') method = method.substr(1)
		if(method.slice(-1) == '/') method = method.substr(0, method.length - 1) // substr() with negative index doesn't work on IE reliably
		
		return appConfig.apiUrl + method
	}
	
	// Export LDRequest as a global object as LDSession is using it too
	window.LDRequest = LDRequest
})();

},{"appConfig.js":3}],5:[function(require,module,exports){
;(function(){
	'use strict';
		
	var appConfig = require('appConfig.js')
	
	var timer = false
	
	// Uses HTML5 Web Storage (session) to store token across pages/tabs
	var LDSession = {
		init: function() {
			timer = false
			
			if(sessionStorage.getItem(appConfig.session.storageKey)) {
				// Set a timer for refresh in case the browser is kept open but no new requests are made
				setTimeout(LDSession.refreshSession, appConfig.session.refreshInterval)
			}
		},
		
		// Getter function
		sessionToken: function() {
			return sessionStorage.getItem(appConfig.session.storageKey)
		},
		
		// Quick check
		isAuthenticated: function() {
			return !!sessionStorage.getItem(appConfig.session.storageKey)
		},
		
		// Get the header with the session token
		sessionHeader: function() {
			var token = sessionStorage.getItem(appConfig.session.storageKey)
			if(!token) return {}
			
			var obj = {}
			obj[appConfig.session.headerName] = token
			return obj
		},
		
		// Called after every request, checks if the response contains a new session token
		// xhr is a jQuery request object
		updateSessionToken: function(xhr) {
			// Check if the request failed with an Unauthorized status and remove the existing session
			if(xhr.status == 401 || xhr.status == 403) {
				sessionStorage.removeItem(sessionKey)
			}
			else {
				var token = xhr.getResponseHeader(appConfig.session.headerName)
				if(!token || token == '') {
					sessionStorage.removeItem(appConfig.session.storageKey)
				}
				else {
					sessionStorage.setItem(appConfig.session.storageKey, token)
					
					// Set a timer for refresh in case the browser is kept open but no new requests are made
					if(timer) clearTimeout(timer)
					setTimeout(LDSession.refreshSession, appConfig.session.refreshInterval)
				}
			}
		},
		
		// Makes a dummy request just to refresh the session token before it expires
		refreshSession: function() {
			LDRequest('GET', '/auth/refresh')
		}
	}
	
	// Export LDSession as a global object as LDRequest is using it too
	window.LDSession = LDSession
})();

},{"appConfig.js":3}],6:[function(require,module,exports){
;(function(){
	'use strict';
	
	var LDUI = {
		init: function() {
			// The burger button for small devices
			$('#menuLink').click(function() {
				$('#layout, #menu, #menuLink').toggleClass('active')
				return false
			})
		},
		fullPage: function(enabled) {
			if(enabled === 'toggle') {
				$('body').toggleClass('fullpage')
			}
			else if(enabled) {
				$('body').addClass('fullpage')
			}
			else {
				$('body').removeClass('fullpage')
			}
		}
	}
	
	// Export LDUI globally
	window.LDUI = LDUI
})();

},{}],7:[function(require,module,exports){
;(function(){
	'use strict';
	
	var LDUtils = {
		// Return true if str is contained in the test array or matches a regexp from the test array
		testString: function(str, tests) {
			if(!str || str == '') return true
			
			for(var i = 0; i < tests.length; i++) {
				if(typeof tests[i] == 'string' && tests[i] == str) return true
				else if(tests[i] instanceof RegExp && str.match(tests[i])) return true
			}
			
			return false
		},
		
		// Invalid values for ?next= redirects; to be used with testString
		invalidNexts: ['/', /^(\/login|\/logout)+(\/|\/.*)*$/i]
	}
	
	// Export LDUtils
	module.exports = LDUtils
})();

},{}],8:[function(require,module,exports){
;(function(){
	'use strict';
	
	var LDUtils = require('lib/LDUtils.js')
	
	// To be used on all routes except /login
	Rosso.middleware('require-auth', {
		init: function(ctx, next) {
			console.log('Init auth middleware')
			
			if(!LDSession.isAuthenticated()) {
				// Redirect to /login
				var returnUrl = (LDUtils.testString(ctx.pathname, LDUtils.invalidNexts))
					? ''
					: '?next='+encodeURIComponent(ctx.path)
				return Rosso.replace('/login'+returnUrl)
			}
			
			next()
		}
	})
})();

},{"lib/LDUtils.js":7}],9:[function(require,module,exports){
;(function(){
	'use strict';
		
	// Catch-all to be loaded after all the others
	Rosso('*', {
		view: '#view/404',
		init: function(ctx, next) {
			// Manipulate DOM, setup actions, register callbacks, etc
			console.log('Init 404')
			LDUI.fullPage(true)
			next()
		},
		destroy: function() {
			// Unregister all callbacks, etc
			console.log('Deinit 404')
			LDUI.fullPage(false)
		}
	})
})();

},{}],10:[function(require,module,exports){
;(function(){
	'use strict';
	
	Rosso('/', {
		view: '#view/home',
		middlewares: ['require-auth'],
		init: function(ctx, next) {
			// Manipulate DOM, setup actions, register callbacks, etc
			console.log('Init /')
			next()
		},
		destroy: function() {
			// Unregister all callbacks, etc
			console.log('Deinit /')
		}
	})
})();

},{}],11:[function(require,module,exports){
;(function(){
	'use strict';
	
	var LDUtils = require('lib/LDUtils.js')
		
	Rosso('/login', {
		view: '#view/login',
		init: function(ctx, next) {
			// Manipulate DOM, setup actions, register callbacks, etc
			LDUI.fullPage(true)
			
			var redirectSuccessful = function() {
				if(
					ctx.querystringParams
					&& ctx.querystringParams.next 
					&& !LDUtils.testString(ctx.querystringParams.next, LDUtils.invalidNexts)
				) {
					Rosso.replace(ctx.querystringParams.next)
				}
				else {
					Rosso.replace('/')
				}
			}
			
			if(LDSession.isAuthenticated()) {
				// Disable form submit
				$("#login-form").submit(function() { return false })
				// Quick and dirty way
				setTimeout(redirectSuccessful, 100)
				return next()
			}
			
			$("#login-form").submit(function() {
				var form = $("#login-form")
				var post = {
					email: $("input[name='email']", form).val(),
					password: $("input[name='password']", form).val()
				}
				/*if(!post.email || !post.password) {
					return false
				}*/
				
				LDRequest('POST', 'auth', post,
					function(data, textStatus) {
						// Success
						console.log(data)
						
						// Should reply with 'success: 1'
						if(!data.success) {
							// TODO: handle
						}
						
						redirectSuccessful()
					},
					function(jqXHR, textStatus, errorThrown) {
						// Error
						console.log(textStatus, errorThrown)
					}
				)
				
				// Prevent form submission
				return false
			})
			
			next()
		},
		destroy: function() {
			// Unregister all callbacks, etc
			LDUI.fullPage(false)
			console.log('Destroy /login')
		}
	})
})();

},{"lib/LDUtils.js":7}],12:[function(require,module,exports){
;(function(){
	'use strict';
		
	Rosso('/logout', {
		view: false,
		middlewares: ['require-auth'],
		init: function(ctx, next) {
			LDRequest('GET', 'auth/destroy',
				function(data, textStatus) {
					// Success
					// Should reply with 'success: 1'
					if(!data.success) {
						// TODO: handle
					}
					
					Rosso.replace('/login')
				},
				function(jqXHR, textStatus, errorThrown) {
					// Error
					console.log(textStatus, errorThrown)
				}
			)
			
			next()
		}
	})
})();

},{}]},{},[2]);
