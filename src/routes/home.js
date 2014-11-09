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
