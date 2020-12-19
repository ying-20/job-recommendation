(function () {
    var user_id = '1111';
    var user_fullname = 'John';
    var lng = -122.08;
    var lat = 37.38;

    function init() {
        document.querySelector('#login-form-btn').addEventListener('click', onSessionInvalid);
        document.querySelector('#register-form-btn').addEventListener('click', showRegisterForm);
        document.querySelector('#register-btn').addEventListener('click', register);
        document.querySelector('#login-btn').addEventListener('click', login);

        validateSession();
    }

    function validateSession() {
        onSessionInvalid();
        var url = './login';
        var req = JSON.stringify({});

        // make AJAX call
        ajax('GET', url, req,
            // session is still valid
            function(res) {
                var result = JSON.parse(res);

                if (result.status === 'OK') {
                    onSessionValid(result);
                }
            }, function(){
                console.log('login error');
            });
    }

    /**
     * When the session is invalid - before we login
     * we should only show the login form
     */
    function onSessionInvalid() {
        var loginForm = document.querySelector('#login-form');
        var registerForm = document.querySelector('#register-form');
        var itemNav = document.querySelector('#item-nav');
        var itemList = document.querySelector('#item-list');
        var avatar = document.querySelector('#avatar');
        var welcomeMsg = document.querySelector('#welcome-msg');
        var logoutBtn = document.querySelector('#logout-link');

        hideElement(itemNav);
        hideElement(itemList);
        hideElement(avatar);
        hideElement(logoutBtn);
        hideElement(welcomeMsg);
        hideElement(registerForm);

        clearLoginError();
        showElement(loginForm);
    }

    function clearLoginError() {
        document.querySelector('#login-error').innerHTML = '';
    }

    function hideElement(element) {
        element.style.display = 'none';
    }

    function showElement(element, style) {
        var displayStyle = style ? style : 'block';
        element.style.display = displayStyle;
    }

    function showRegisterForm() {
        var loginForm = document.querySelector('#login-form');
        var registerForm = document.querySelector('#register-form');
        var itemNav = document.querySelector('#item-nav');
        var itemList = document.querySelector('#item-list');
        var avatar = document.querySelector('#avatar');
        var welcomeMsg = document.querySelector('#welcome-msg');
        var logoutBtn = document.querySelector('#logout-link');

        hideElement(itemNav);
        hideElement(itemList);
        hideElement(avatar);
        hideElement(logoutBtn);
        hideElement(welcomeMsg);
        hideElement(loginForm);

        clearRegisterResult();
        showElement(registerForm);
    }
    function clearRegisterResult() {
        document.querySelector('#register-result').innerHTML = '';
    }
    function register() {
        var username = document.querySelector('#register-username').value;
        var password = document.querySelector('#register-password').value;
        var firstName = document.querySelector('#register-first-name').value;
        var lastName = document.querySelector('#register-last-name').value;

        if (username === "" || password == "" || firstName === "" || lastName === "") {
            showRegisterResult('Please fill in all fields');
            return
        }

        if (username.match(/^[a-z0-9_]+$/) === null) {
            showRegisterResult('Invalid username');
            return
        }

        password = md5(username + md5(password));

        // The request parameters
        var url = './register';
        var req = JSON.stringify({
            user_id : username,
            password : password,
            first_name: firstName,
            last_name: lastName,
        });

        ajax('POST', url, req,
            // successful callback
            function(res) {
                var result = JSON.parse(res);

                // successfully logged in
                if (result.status === 'OK') {
                    showRegisterResult('Succesfully registered');
                } else {
                    showRegisterResult('User already existed');
                }
            },

            // error
            function() {
                showRegisterResult('Failed to register');
            });
    }
    function showRegisterResult(registerMessage) {
        document.querySelector('#register-result').innerHTML = registerMessage;
    }
    function ajax(method, url, data, successCallback, errorCallback) {
        var xhr = new XMLHttpRequest();

        xhr.open(method, url, true);

        xhr.onload = function() {
            if (xhr.status === 200) {
                successCallback(xhr.responseText);
            } else {
                errorCallback();
            }
        };

        xhr.onerror = function() {
            console.error("The request couldn't be completed.");
            errorCallback();
        };

        if (data === null) {
            xhr.send();
        } else {
            xhr.setRequestHeader("Content-Type",
                "application/json;charset=utf-8");
            xhr.send(data);
        }
    }
    function login() {
        var username = document.querySelector('#username').value;
        var password = document.querySelector('#password').value;
        password = md5(username + md5(password));

        // The request parameters
        var url = './login';
        var req = JSON.stringify({
            user_id : username,
            password : password,
        });

        ajax('POST', url, req,
            // successful callback
            function(res) {
                var result = JSON.parse(res);

                // successfully logged in
                if (result.status === 'OK') {
                    onSessionValid(result);
                }
            },

            // error
            function() {
                showLoginError();
            });
    }

    function showLoginError() {
        document.querySelector('#login-error').innerHTML = 'Invalid username or password';
    }
    function onSessionValid(result) {
        user_id = result.user_id;
        user_fullname = result.name;

        var loginForm = document.querySelector('#login-form');
        var registerForm = document.querySelector('#register-form');
        var itemNav = document.querySelector('#item-nav');
        var itemList = document.querySelector('#item-list');
        var avatar = document.querySelector('#avatar');
        var welcomeMsg = document.querySelector('#welcome-msg');
        var logoutBtn = document.querySelector('#logout-link');

        welcomeMsg.innerHTML = 'Welcome, ' + user_fullname;

        showElement(itemNav);
        showElement(itemList);
        showElement(avatar);
        showElement(welcomeMsg);
        showElement(logoutBtn, 'inline-block');
        hideElement(loginForm);
        hideElement(registerForm);

        initGeoLocation();
    }
    function showLoadingMessage(msg) {
        var itemList = document.querySelector('#item-list');
        itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> ' +
            msg + '</p>';
    }
    function initGeoLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                onPositionUpdated,
                onLoadPositionFailed, {
                    maximumAge: 60000
                });
            showLoadingMessage('Retrieving your location...');
        } else {
            onLoadPositionFailed();
        }
    }

    function onPositionUpdated(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        loadNearbyItems();
    }

    function onLoadPositionFailed() {
        console.warn('navigator.geolocation is not available');
        getLocationFromIP();
    }

    function getLocationFromIP() {
        // get location from http://ipinfo.io/json
        var url = 'http://ipinfo.io/json'
        var data = null;

        ajax('GET', url, data, function(res) {
            var result = JSON.parse(res);
            if ('loc' in result) {
                var loc = result.loc.split(',');
                lat = loc[0];
                lng = loc[1];
            } else {
                console.warn('Getting location by IP failed.');
            }

            loadNearbyItems();
        });
    }
    /**
     * API #1 Load the nearby items API end point: [GET]
     * /search?user_id=1111&lat=37.38&lon=-122.08
     */
    function loadNearbyItems() {
        console.log('loadNearbyItems');
        activeBtn('nearby-btn');

        // The request parameters
        var url = './search';
        var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;
        var data = null;

        // display loading message
        showLoadingMessage('Loading nearby items...');

        // make AJAX call
        ajax('GET', url + '?' + params, data,
            // successful callback
            function(res) {
                var items = JSON.parse(res);
                if (!items || items.length === 0) {
                    showWarningMessage('No nearby item.');
                } else {
                    listItems(items);
                }
            },
            // failed callback
            function() {
                showErrorMessage('Cannot load nearby items.');
            }
        );
    }

    /**
     * A helper function that makes a navigation button active
     *
     * @param btnId - The id of the navigation button
     */
    function activeBtn(btnId) {
        var btns = document.querySelectorAll('.main-nav-btn');

        // deactivate all navigation buttons
        for (var i = 0; i < btns.length; i++) {
            btns[i].className = btns[i].className.replace(/\bactive\b/, '');
        }

        // active the one that has id = btnId
        var btn = document.querySelector('#' + btnId);
        btn.className += ' active';
    }

    function showWarningMessage(msg) {
        var itemList = document.querySelector('#item-list');
        itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> ' +
            msg + '</p>';
    }

    function showErrorMessage(msg) {
        var itemList = document.querySelector('#item-list');
        itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> ' +
            msg + '</p>';
    }

    /**
     * List recommendation items base on the data received
     *
     * @param items - An array of item JSON objects
     */
    function listItems(items) {
        var itemList = document.querySelector('#item-list');
        itemList.innerHTML = ''; // clear current results

        for (var i = 0; i < items.length; i++) {
            addItem(itemList, items[i]);
        }
    }

    /**
     * Add a single item to the list
     *
     * @param itemList - The <ul id="item-list"> tag (DOM container)
     * @param item - The item data (JSON object)
     *
     */
    function addItem(itemList, item) {
        var item_id = item.id;

        // create the <li> tag and specify the id and class attributes
        var li = $create('li', {
            id : 'item-' + item_id,
            className : 'item'
        });

        // set the data attribute ex. <li data-item_id="G5vYZ4kxGQVCR"
        // data-favorite="true">
        li.dataset.item_id = item_id;
        li.dataset.favorite = item.favorite;

        // item image
        if (item.company_logo) {
            li.appendChild($create('img', {
                src : item.company_logo
            }));
        } else {
            li.appendChild($create('img', {
                src : 'https://via.placeholder.com/100'
            }));
        }
        // section
        var section = $create('div');

        // title
        var title = $create('a', {
            className : 'item-name',
            href : item.url,
            target : '_blank'
        });
        title.innerHTML = item.title;
        section.appendChild(title);

        // keyword
        var keyword = $create('p', {
            className : 'item-keyword'
        });
        keyword.innerHTML = 'Keyword: ' + item.keywords.join(', ');
        section.appendChild(keyword);

        li.appendChild(section);

        // address
        var address = $create('p', {
            className : 'item-address'
        });

        // ',' => '<br/>', '\"' => ''
        address.innerHTML = item.location.replace(/,/g, '<br/>').replace(/\"/g,
            '');
        li.appendChild(address);

        itemList.appendChild(li);
    }

    /**
     * A helper function that creates a DOM element <tag options...>
     * @param tag
     * @param options
     * @returns {Element}
     */
    function $create(tag, options) {
        var element = document.createElement(tag);
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                element[key] = options[key];
            }
        }
        return element;
    }

    init();
})();

