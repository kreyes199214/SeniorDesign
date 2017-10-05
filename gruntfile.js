module.exports = function(grunt) {

    grunt.initConfig({
        //read in the package file to use the attributes
        pkg: grunt.file.readJSON("package.json"),

        clean: {
            prebuild: ["./dist", "./docs"],
            postbuild: ["./dist/**/*.js.consoleStripped.js", "./dist/**/*.js.uncompressed.js", "./dist/**/*.js.map"]
        },

        esri_slurp: {
      options: {
        version: '3.14'
      },
      dev: {
        options: {
          beautify: true
        },
        dest: 'src/esri'
      },
      travis: {
        dest: 'src/esri'
      }
    },
        copy: {
            mars: {
                files: [
                    {src: './src/trek/marstrek/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/marstrek/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/marstrek/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/marstrek/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/marstrek/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/marstrek/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/marstrek/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/marstrek/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/marstrek/HelpManager.js',dest: 'src/jpl/dijit/HelpManager.js'},
                    {src: './src/trek/marstrek/textContent.js',dest: 'src/jpl/dijit/nls/textContent.js'},
                    {src: './src/trek/marstrek/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/marstrek/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/marstrek/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/marstrek/textAbout.html',dest: 'src/jpl/config/textAbout.html'},
                    {src: './src/trek/marstrek/textCredits.html',dest: 'src/jpl/config/textCredits.html'},
                    {src: './src/trek/marstrek/textFAQ.html',dest: 'src/jpl/config/textFAQ.html'},
                    {src: './src/trek/marstrek/textRelatedLinks.html',dest: 'src/jpl/config/textRelatedLinks.html'},
                    {src: './src/trek/marstrek/textRelease.html',dest: 'src/jpl/config/textRelease.html'},
                    {src: './src/trek/marstrek/textRequirements.html',dest: 'src/jpl/config/textRequirements.html'},
                    {src: './src/trek/marstrek/aboutHelpContainer.html',dest: 'src/jpl/config/aboutHelpContainer.html'},
                    {src: './src/trek/marstrek/textContact.html',dest: 'src/jpl/config/textContact.html'},
                    {src: './src/trek/marstrek/autoLayers.json',dest: 'src/jpl/config/autoLayers.json'},
                    {src: './src/trek/marstrek/bookmarklayers.json',dest: 'src/jpl/config/bookmarklayers.json'},
                    {src: './src/trek/marstrek/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/marstrek/package.json',dest: 'package.json'}

                ]
            },
            mars_outreach: {
                files: [
                    {src: './src/trek/marstrekOutreach/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/marstrekOutreach/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/marstrekOutreach/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/marstrekOutreach/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/marstrekOutreach/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/marstrekOutreach/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/marstrekOutreach/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/marstrekOutreach/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/marstrekOutreach/textContent.js',dest: 'src/jpl/dijit/nls/textContent.js'},
                    {src: './src/trek/marstrekOutreach/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/marstrekOutreach/treeLayers.json',dest: 'src/jpl/config/treeLayers.json'},
                    {src: './src/trek/marstrekOutreach/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/marstrekOutreach/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/marstrekOutreach/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/marstrekOutreach/package.json',dest: 'package.json'}

                ]
            },
            mars_stand_alone: {
                files: [
                    {src: './src/trek/marstrekStandAlone/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/marstrekStandAlone/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/marstrekStandAlone/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/marstrekStandAlone/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/marstrekStandAlone/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/marstrekStandAlone/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/marstrekStandAlone/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/marstrekStandAlone/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/marstrekStandAlone/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/marstrekStandAlone/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/marstrekStandAlone/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/marstrekStandAlone/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/marstrekStandAlone/basemaps.json',dest: 'src/jpl/config/basemaps.json'}
                ]
            },

            phobos_stand_alone: {
                files: [
                    {src: './src/trek/phobostrekStandAlone/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/phobostrekStandAlone/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/phobostrekStandAlone/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/phobostrekStandAlone/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/phobostrekStandAlone/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/phobostrekStandAlone/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/phobostrekStandAlone/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/phobostrekStandAlone/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/phobostrekStandAlone/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/phobostrekStandAlone/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/phobostrekStandAlone/basemaps.json',dest: 'src/jpl/config/basemaps.json'},
                    {src: './src/trek/phobostrekStandAlone/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/phobostrekStandAlone/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/phobostrekStandAlone/package.json',dest: 'package.json'}
                ]
            },
            vesta_stand_alone: {
                files: [
                    {src: './src/trek/vestatrekStandAlone/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/vestatrekStandAlone/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/vestatrekStandAlone/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/vestatrekStandAlone/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/vestatrekStandAlone/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/vestatrekStandAlone/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/vestatrekStandAlone/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/vestatrekStandAlone/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/vestatrekStandAlone/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/vestatrekStandAlone/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/vestatrekStandAlone/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/vestatrekStandAlone/basemaps.json',dest: 'src/jpl/config/basemaps.json'}
                ]
            },
            moon: {
                files: [
                    {src: './src/trek/moontrek/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/moontrek/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/moontrek/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/moontrek/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/moontrek/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/moontrek/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/moontrek/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/moontrek/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/moontrek/HelpManager.js',dest: 'src/jpl/dijit/HelpManager.js'},
                    {src: './src/trek/moontrek/textContent.js',dest: 'src/jpl/dijit/nls/textContent.js'},
                    {src: './src/trek/moontrek/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/moontrek/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/moontrek/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/moontrek/textAbout.html',dest: 'src/jpl/config/textAbout.html'},
                    {src: './src/trek/moontrek/textCredits.html',dest: 'src/jpl/config/textCredits.html'},
                    {src: './src/trek/moontrek/textFAQ.html',dest: 'src/jpl/config/textFAQ.html'},
                    {src: './src/trek/moontrek/textRelatedLinks.html',dest: 'src/jpl/config/textRelatedLinks.html'},
                    {src: './src/trek/moontrek/textRelease.html',dest: 'src/jpl/config/textRelease.html'},
                    {src: './src/trek/moontrek/textRequirements.html',dest: 'src/jpl/config/textRequirements.html'},
                    {src: './src/trek/moontrek/textContact.html',dest: 'src/jpl/config/textContact.html'},
                    {src: './src/trek/moontrek/autoLayers.json',dest: 'src/jpl/config/autoLayers.json'},
                    {src: './src/trek/moontrek/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/moontrek/package.json',dest: 'package.json'}
    ]
            },
            moon_stand_alone: {
                files: [
                    {src: './src/trek/moontrekStandAlone/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/moontrekStandAlone/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/moontrekStandAlone/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/moontrekStandAlone/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/moontrekStandAlone/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/moontrekStandAlone/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/moontrekStandAlone/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/moontrekStandAlone/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/moontrekStandAlone/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/moontrekStandAlone/staticLayers.json',dest: 'src/jpl/config/staticLayers.json'},
                    {src: './src/trek/moontrekStandAlone/basemapList.json',dest: 'src/jpl/config/basemapList.json'},
                    {src: './src/trek/moontrekStandAlone/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/moontrekStandAlone/basemaps.json',dest: 'src/jpl/config/basemaps.json'},
                    {src: './src/trek/moontrekStandAlone/package.json',dest: 'package.json'}
                ]
            },
            earth_stand_alone: {
                files: [
                    {src: './src/trek/earthtrek/Cartesian3.js',dest: './src/cesium/Core/Cartesian3.js'},
                    {src: './src/trek/earthtrek/Ellipsoid.js',dest: './src/cesium/Core/Ellipsoid.js'},
                    {src: './src/trek/earthtrek/EllipsoidalOccluder.js',dest: './src/cesium/Core/EllipsoidalOccluder.js'},
                    {src: './src/trek/earthtrek/getWgs84EllipsoidEC.js',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.js'},
                    {src: './src/trek/earthtrek/getWgs84EllipsoidEC.glsl',dest: 'src/cesium/Shaders/Builtin/Functions/getWgs84EllipsoidEC.glsl'},
                    {src: './src/trek/earthtrek/SkyAtmosphereVS.js',dest: 'src/cesium/Shaders/SkyAtmosphereVS.js'},
                    {src: './src/trek/earthtrek/SkyAtmosphereVS.glsl',dest: 'src/cesium/Shaders/SkyAtmosphereVS.glsl'},
                    {src: './src/trek/earthtrek/Viewer.js',dest: 'src/cesium/Widgets/Viewer/Viewer.js'},
                    {src: './src/trek/earthtrek/config.json',dest: 'src/jpl/config/config.json'},
                    {src: './src/trek/earthtrek/theme.css',dest: 'src/app/themes/theme.css'},
                    {src: './src/trek/earthtrek/basemapList.json',dest: 'src/jpl/config/basemapList.json'}
                ]
            }
        },

        uglify: {
            cesium: {
                files: [
                    {expand: true, cwd: './src/cesium', src: ['*.js', '**/*.js'], dest: './dist/cesium', ext: '.js'},
                    {expand: true, cwd: './src/cesium', src: ['*.js', '**/*.js'], dest: './dist/cesium', ext: '.js'}
                ]
            }
        },
        
        htmlmin: {
            dist: {
                options: {
                    removeComments: false,
                    collapseWhitespace: false
                },
                files: {
                    'dist/index.html': 'src/index.html',
                    'dist/contact.html': 'src/facts.html'
                }
            }
        },

        //replaces text with the proper value during the build
        replace: {
            postbuild: {
                src: ['dist/*.html', 'dist/**/*.html', 'dist/**/*.js', 'dist/**/*.php'],
                overwrite: true,
                replacements: [{
                    from: '@@VERSION',
                    to: "<%= pkg.version %>"
                }, {
                    from: '@@TITLE',
                    to: "<%= pkg.title %>"
                }, {
                    from: '@@EMAIL',
                    to: "<%= pkg.email %>"
                }]
            },
            sourcemaps: {
                src: ["dist/**/*.js"],
                overwrite: true,
                replacements: [
                    {
                        from: ' sourceMappingURL=',
                        to: ""
                    }
                ]
            }
        },

        //initiates the Dojo build process
        dojo: {
            dist: {
                options: {
                    dojo: '../../dojo/dojo.js', // Path to dojo.js file in dojo source
                    load: 'build', // Optional: Utility to bootstrap (Default: 'build')
                    profile: '../../../profiles/build.profile.js', // Profile for build
                    require: '../../../src/app/run.js', // Optional: Module to require for the build (Default: nothing)
                    releaseDir: '../dist', // Directory to output build
                    cwd: 'src/util/buildscripts' // Directory to execute build within
                }
            }
        },

        //generates documentation
        jsdoc : {
            dist : {
                src: [
                    'src/jpl/**/*.js',
                    // You can add README.md file for index page at documentations.
                    'README.md'
                ],
                jsdoc: './node_modules/.bin/jsdoc',
                options: {
                    verbose: true,
                    destination: 'docs',
                    configure: 'profiles/jsdoc.conf.json',
                    template: './node_modules/jaguarjs-jsdoc-patched',
                    'private': false
                }
            }
        },

        //karma runner for jasmine unit tests
        karma: {
            unit: {
                configFile: 'test/karma.conf.js'
            }
        },

        //create a package for the build
        compress: {
            build: {
                options: {
                    archive: './<%= pkg.name %>-<%= pkg.version %>.tar.gz',
                    mode: 'tgz'
                },
                files: [
                    {src: 'dist/**'}
                ]
            }
        },

        jasmine_nodejs: {
            // task specific (default) options
            options: {
                specNameSuffix: "spec.js", // also accepts an array
                helperNameSuffix: "helper.js",
                useHelpers: false,
                stopOnFailure: false,
                // configure one or more built-in reporters
                reporters: {
                    console: {
                        colors: true,
                        cleanStack: 1,       // (0|false)|(1|true)|2|3
                        verbosity: 4,        // (0|false)|1|2|3|(4|true)
                        listStyle: "indent", // "flat"|"indent"
                        activity: false
                    }
                },
                // add custom Jasmine reporter(s)
                customReporters: []
            },
            integration: {
                // target specific options
                options: {
                    useHelpers: false
                },
                // spec files
                specs: [
                    "test/integration/spec/**"
                ],
                helpers: []
            }
        }
    });


    //load tasks
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-dojo');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-karma');
    //grunt.loadNpmTasks('grunt-jasmine-nodejs');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-esri-slurp');

    //register tasks
    grunt.registerTask('default', [
        'clean:prebuild',
        //'slurp',
        'dojo',
        'htmlmin',
        'replace:postbuild',
        'replace:sourcemaps',
        'uglify:cesium',
        'clean:postbuild',
        //'jsdoc',
        'compress'
    ]);

    grunt.registerTask('slurp', ['esri_slurp:dev']);
    grunt.registerTask('travis', ['esri_slurp:travis']);

    grunt.registerTask('prepMars', [
        'copy:mars'
    ]);

    grunt.registerTask('prepMarsOutreach', [
        'copy:mars_outreach'
    ]);

    grunt.registerTask('prepMarsStandAloneNR', [
        'copy:mars_stand_alone'
    ]);

    grunt.registerTask('prepVestaStandAloneNR', [
        'copy:vesta_stand_alone'
    ]);

    grunt.registerTask('prepPhobosStandAlone', [
        'copy:phobos_stand_alone'
    ]);

    grunt.registerTask('prepMoon', [
        'copy:moon'
    ]);

    grunt.registerTask('prepMoonStandAlone', [
        'copy:moon_stand_alone'
    ]);

    grunt.registerTask('prepEarthStandAloneNR', [
        'copy:earth_stand_alone'
    ]);

    grunt.registerTask('docs', [
       'jsdoc'
    ]);

    // grunt.registerTask('tests', [
    //     'karma:unit',
    //     'jasmine_nodejs:integration'
    // ]);
};
