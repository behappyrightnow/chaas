/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    // /** // Don't need these at the moment...
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist_js: {
        src: [
            'src/execJS/*.js',
            'src/app/**/*.js',
        ],
        dest: 'dist/<%= pkg.name %>.js'
      },
      dist_html: {
        src: ['src/app/index.html'],
        dest: 'dist/<%= pkg.name %>.html',
        options: { // FIXME: Turn off banners for HTML files...
        }
      },
      dist_css: {
        src: ['src/css/*.css'],
        dest: 'dist/<%= pkg.name%>.css'
      },
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    // **/
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    testem: {
      lib_tests: {
        src: [
          "bower_components/angular/angular.js",
          "bower_components/angular-route/angular-route.js",
          "bower_components/angular-mocks/angular-mocks.js",
          "bower_components/underscore/underscore.js",
          "src/app/app.js",
          "src/app/services/CONFIG.js",
          "tests/unit/CONFIGSpec.js"
        ]
      }
    },
    typescript: {
      options: {
        noResolve: true,
        ignoreError: true, // FIXME: Don't just ignore me!
      },
      lib: {
        src: ['src/**/*.ts'],
      },
      lib_tests: {
        src: ['tests/**/*.ts'],
      },
      examples: {
        src: ['examples/**/*.ts'],
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test']
      },
      lib: {
        files: ['src/**/*.ts'],
        tasks: ['typescript:lib', 'concat:lib'],
      },
      examples: {
        files: ['examples/**/*.*'],
        tasks: ['typescript:examples'],
        options: {
          livereload: true
        }
      }
    },
    connect: {
      examples: {
        /** defaults
        host: '0.0.0.0', // alias to localhost
        port: 8000
        */
        options: {
          base: [ 'src/', 'bower_components/', 'examples/' ],
        }
      },
      dist: {
        options: {
          base: [ 'dist/', 'bower_components/' ]
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  // /** // Unused at the moment...
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // **/
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-testem');
  grunt.loadNpmTasks('grunt-typescript');

  // Default task.
  grunt.registerTask('default', ['jshint', /*'concat', 'uglify' */]);

  grunt.registerTask('serve', ['connect:examples', 'watch']);

  grunt.registerTask('test', ['typescript', 'testem:run:lib_tests']);

};
