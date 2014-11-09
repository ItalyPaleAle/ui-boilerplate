module.exports = function(grunt) {
	grunt.initConfig({
		less: {
			development: {
				options: {
					compress: true,
					yuicompress: true,
					optimization: 2
				},
				files: {
					// target.css file: source.less file
					"public/css/layout.css": "less/layout.less",
					"public/css/side-menu.css": "less/side-menu.less",
					"public/css/login.css": "less/login.less"
				}
			}
		},
		browserify: {
			dist: {
				files: {
					'public/js/app.js': ['src/main.js']
				},
				options: {
					transform: ['debowerify'],
					browserifyOptions: {
						paths: ['src/']
					}
				}
			}
		},
		uglify: {
			dist: {
				options: {
					'banner': "/*!\n Add banner here\n */\n"
				},
				files: {
					'public/js/app.min.js': ['public/js/app.js']
				}
			}
		},
		watch: {
			styles: {
				files: ['less/*.less'], // Watch all .less files inside less/
				tasks: ['less'],
				options: {
					nospawn: true
				}
			},
			scripts: {
				files: ['src/**/*.js'], // Watch all .js files inside src/ and subfolders
				tasks: ['browserify'],
				options: {
					nospawn: true
				}
			}
		}
	})
	
	grunt.loadNpmTasks('grunt-browserify')
	grunt.loadNpmTasks('grunt-contrib-uglify')
	grunt.loadNpmTasks('grunt-contrib-less')
	grunt.loadNpmTasks('grunt-contrib-watch')
	
	grunt.registerTask('default', ['less', 'browserify', 'watch'])
	
	// UglifyJS2: --screw-ie8 ?
}
