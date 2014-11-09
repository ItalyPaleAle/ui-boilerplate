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
