;(function(){
	'use strict';
	
	var LDUtils = {
		// Return true if str is contained in the test array or matches a regexp from the test array
		testString: function(str, tests) {
			if(!str || str == '') return true
			
			for(var i = 0; i < tests.length; i++) {
				if(typeof tests[i] == 'string' && tests[i] == str) return true
				else if(tests[i] instanceof RegExp && str.match(tests[i])) return true
			}
			
			return false
		},
		
		// Invalid values for ?next= redirects; to be used with testString
		invalidNexts: ['/', /^(\/login|\/logout)+(\/|\/.*)*$/i]
	}
	
	// Export LDUtils
	module.exports = LDUtils
})();
