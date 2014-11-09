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
