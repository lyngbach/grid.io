var App = {
	Config: {},
	Render: {},
	Controller: {},
	Game: {},
	Menu: {}
};


if (document.location.hostname === 'localhost') {
	socket = io.connect();
} else {
	socket = io.connect('http://apps.takedesign.dk', {path: '/gridSocket/'});
}


// config
App.Config.initialize = function () {
	/*if (window.cordova) {
		document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
	} else {
		this.onDeviceReady();
	}*/

	this.setup();
};

App.Config.onDeviceReady = function () {
	this.setup();
};

App.Config.setup = function () {
	this.hash = window.location.hash;

	this.version = '1.0.0';

	if (this.hash === '') {
		this.path('menu');
	} else {
		this.onRouteChange();
	}

	window.onhashchange = this.onRouteChange.bind(this);
};

App.Config.goBack = function () {
	history.back();
};


App.Config.upgradeComponents = function () {
	window.requestAnimationFrame(function () {
		componentHandler.upgradeAllRegistered();
	});

	setTimeout(function() { componentHandler.upgradeAllRegistered(); }, 500);
};

App.Config.path = function (location) {
	window.location.hash = '/' + location;
};

App.Config.onRouteChange = function () {
	this.location = window.location.hash.substr(2);

	// skip rendering check if same page and only parameters have changed
	if (this.oldLocation) {
		if (this.oldLocation.indexOf('?') > -1) {
			this.oldLocation = this.oldLocation.slice(0, this.oldLocation.indexOf('?'));
		}
		if (this.location.indexOf('?') > -1) {
			this.location = this.location.slice(0, this.location.indexOf('?'));
		}

		if (this.oldLocation === this.location) {
			//console.log('param', this.location);
			App[this.capitalize(this.location)].initialize();
			//App.Config.upgradeComponents();
		} else {
			App.Render.initialize(this.location);
		}
	} else {
		App.Render.initialize(this.location);
	}

	this.oldLocation = this.location;
};

App.Config.request = function (type, path, data, callback) {
	this.apiRequest = new XMLHttpRequest();
	this.formData = new FormData();
	
	if (callback !== undefined) {
		this.apiRequest.onload = function () {
			callback(this);
		};	
	}

	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			this.formData.append(key, data[key]);
		}
	}
	
	this.apiRequest.open(type, path, true);
	this.apiRequest.send(this.formData);
};

App.Config.capitalize = function (string) {
	return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};


App.Config.getParameters = function () {
	var parameters = {},
		tempParameters;

	if (window.location.hash.indexOf('?') > -1) {
		tempParameters = window.location.hash.split('?');
		tempParameters = tempParameters[1].split('&');

		for (var p = 0; p < tempParameters.length; p++) {
			tempParameters[p] = tempParameters[p].split('=');
			
			parameters[tempParameters[p][0]] = tempParameters[p][1];
		}
		//console.log('paras:', parameters);
	}

	return parameters;
};

App.Config.showDialog = function () {
	document.getElementById('dialogOverlay').classList.add('show');
	document.getElementById('dialog').classList.add('show');
};

App.Config.hideDialog = function () {
	document.getElementById('dialogOverlay').classList.remove('show');
	document.getElementById('dialog').classList.remove('show');
};





// Render
App.Render.initialize = function (location) {
	if (location.indexOf('?') > -1) {
		this.location = location.slice(0, location.indexOf('?')).toLowerCase();
	} else {
		this.location = location.toLowerCase();
	}

	this.request = new XMLHttpRequest();
	this.request.onload = this.parseTemplate.bind(this);
	this.request.open('GET', 'views/' + this.location + '.html', true);
	this.request.setRequestHeader('Content-type','Application/x-www-form-urlencoded');
	this.request.send();
};

App.Render.parseTemplate = function () {
	document.getElementById('view').innerHTML = this.request.responseText;
	window.requestAnimationFrame(this.showTemplate.bind(this));
};

App.Render.showTemplate = function () {
	function initTemplate () {
		var constructor = App.Config.capitalize(this.location);

		document.getElementById(this.location).classList.add('show');
		
		App[constructor].initialize();
		
		//App.Config.upgradeComponents();
	}

	window.requestAnimationFrame(initTemplate.bind(this));
};



// Controller
App.Controller.initialize = function () {
	console.log('controller init');	
};

App.Controller.doSomething = function (event) {
	//special function for doSomething
};



// Game
App.Game.initialize = function () {
	console.log('game init');	
};

App.Game.doSomething = function (event) {
	//special function for doSomething
};



// Menu
App.Menu.initialize = function () {
	console.log('menu init');

	setTimeout(function () {
		console.log('navigate to game');
		App.Config.path('game');
	}, 2000);
	
};

App.Menu.doSomething = function (event) {
	//special function for doSomething
};



App.Config.initialize();

console.log('App', App);