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
	require('rosso')
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
