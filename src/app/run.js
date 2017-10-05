(function () {
    //define the path to the configuration JSON file
    var configURL = "jpl/config/config.json?_key=" + Math.random();
    //setup the dojo config object before loading the framework
    var config = {
        //base path to all of our packages
        baseUrl: './',
        //packages we want to use in the application
        packages: [
            'dojo',
            'dijit',
            'dojox',
            'dgrid',
            'put-selector',
            'xstyle',
            'app',
            'esri',
            'jpl',
            'bootstrap',
            'cesium',
            'jquery',
            {name: 'bootstrap-tour', location: 'bootstrap-tour', main: 'Tour'},
            {name: 'use', location: 'use', main: 'use' },
            {name: 'jquery.easing', location: 'jquery', main: 'jquery.easing'},
            {name: 'supersized', location: 'jquery/plugins/supersized/js', main: 'supersized'},
            {name: 'supersized.shutter', location: 'jquery/plugins/supersized/js', main: 'supersized.shutter'},
            {name: 'html2canvas', location: 'html2canvas', main: 'html2canvas'}


        ],
        deps: ['xstyle/main'],
        //we dont need to parse html on load, widgets take care of this
        parseOnLoad: false,
        //we load everything asynchronously for performance
        async: true,
        //for non-AMD modules, this allows a workaround
        use: {
            "bootstrap-tour/Tour": {
                deps: ["bootstrap-tour"],
                attach: function(tour) {
                    return tour;
                }
            },

            "jquery/jquery.easing": {
                deps: ["jquery/jquery.easing"],
                attach: function (j) {
                    //dont need to return anything since it is a jquery plugin
                    return '';
                }
            },

            "jquery/plugins/supersized/js/supersized": {
                deps: ["jquery/plugins/supersized/js/supersized"],
                attach: function (j) {
                    //dont need to return anything since it is a jquery plugin
                    return '';
                }
            },

            "jquery/plugins/supersized/js/supersized.shutter": {
                deps: ["jquery/plugins/supersized/js/supersized.shutter"],
                attach: function (j) {
                    //dont need to return anything since it is a jquery plugin
                    return '';
                }
            }

            // ,"html2canvas/html2canvas": {
            //     deps: ["html2canvas/html2canvas"],
            //     attach: function (j) {
            //         //return the global var because the loader
            //         //thinks this is not a valid module
            //
            //         return window.html2canvas;
            //     }
            // }
        },
        //append the version number to each request in case the user has cached an old version
        cacheBust: "v=@@VERSION",
        //after 10 seconds assume there is an error
        waitSeconds: 10
    };

    require(config, ["dojo/request/xhr", "jpl/config/Controls"], function (xhr, Controls) {
        //get the configuration file to determine the widgets we should be including
        xhr(configURL, {
            handleAs: "json",
            sync: false
        }).then(function (data) {
            //create a controls instance with the controls configuration
            var ctrl = new Controls(data.controls);
            //set the has conditions. This verifies all properties exist even if not included in JSON config.
            config.has = ctrl.hasConfig;
            //for debugging
            console.info('========dojo configured, starting app load');
            //start the loading process in the application
            require(config, ['jquery/jquery','app']);
        }, function (err) {
           throw("Error loading configuration file: " + err)
        });
    });

})();
