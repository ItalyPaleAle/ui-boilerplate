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
