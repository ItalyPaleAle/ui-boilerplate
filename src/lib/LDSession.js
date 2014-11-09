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
