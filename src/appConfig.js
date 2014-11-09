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
