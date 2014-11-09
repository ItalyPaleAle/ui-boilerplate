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
