var webdriver = require('selenium-webdriver'),
    URL = 'http://localhost/~kldodge/mars-trek/src/',
    driver;

//extend the timeout because the app takes a few seconds to load
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

describe('3D Globe functionality', function () {
    //setup before tests run
    beforeAll(function(done) {
        //create the webdriver
        driver = new webdriver.Builder().withCapabilities({'browserName': 'firefox'}).build();

        //navigate to the site
        driver.get(URL);

        //wait until the content div is created, this happens once it is loaded
        driver.wait(webdriver.until.elementLocated({id: 'mainContentWrapper'}), 8000).then(function(res) {
            //call done to move on to the test cases
            done();
        }, function(err) {
            fail('App not loaded');
            done();
        });
    });

    it('upon load 3D container should exist but be hidden', function (done) {
        //get the 3d container element on the page
        var globeContainer = driver.findElement({id: '3dContainer'});

        globeContainer.then(function(container) {
            //when element is found, get the style attribute
            var styleAttr = container.getAttribute("style");

            styleAttr.then(function(style){
                //when style attribute is found check that the style is set to hidden and 0 opacity
                expect(style).toBe("visibility: hidden; opacity: 0;");

                //finish the test
                done();
            });
        });
    });

    it('upon clicking 3D button should show 3D container', function (done) {
        //get the 3D link button in the control bar
        var link3DButton = driver.findElement({css: '#view3DContainer a'});

        link3DButton.then(function(linkElement) {
            //when 3D button is found, click it
            linkElement.click().then(function(){
                //after click, find the 3D globe container element on the page
                var globeContainer = driver.findElement({id: '3dContainer'})

                globeContainer.then(function(container) {
                    //when container is found, get the style attribute
                    var styleAttr = container.getAttribute("style");

                    styleAttr.then(function (style) {
                        //when style attribute is found, check that the style changes to visible
                        expect(style).toBe("visibility: visible; opacity: 1;");

                        //finish the test
                        done();
                    });
                });
            });
        });
    });

    //teardown after all tests have run
    afterAll(function(done) {
        //close the browser session
        driver.quit();
        done();
    })
});