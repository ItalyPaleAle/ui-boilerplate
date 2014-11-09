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
