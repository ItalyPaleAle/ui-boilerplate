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
