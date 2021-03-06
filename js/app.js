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
	} else if (this.hash.length === 7) {
		this.path('controller?room=' + this.hash.substr(2));
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

	console.log('onRouteChange');

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
		console.log('her?', this.location);
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

	console.log('opening ', this.location);

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
	this.parameters = App.Config.getParameters();

	this.goUp = document.getElementById('goUp');
	this.goDown = document.getElementById('goDown');
	this.goLeft = document.getElementById('goLeft');
	this.goRight = document.getElementById('goRight');

	console.log('controller init');	

	if (this.parameters.room) {
		this.joinGame(this.parameters.room);
	}
};

App.Controller.joinGame = function (room) {
	socket.emit('joinGame', {room: room}, this.setUser.bind(this));
};

App.Controller.setUser = function (response) {

};

App.Controller.getUrlVars = function () {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}



// Game
App.Game.initialize = function () {
	this.parameters = App.Config.getParameters();

	console.log('game init');

	if (this.parameters.room && !this.data) {
		this.getGame();
	} else {
		this.renderGrid();
	}
};

App.Game.getGame = function () {
	console.log('get game info with room:', this.parameters.room);
	
	socket.emit('getGame', {room: this.parameters.room}, this.setGame.bind(this));
};

App.Game.setGame = function (response) {
	this.data = response.game;

	console.log('setGame', response);

	this.renderGrid();

	console.log('setGame', this.data);
};

App.Game.renderGrid = function () {
	this.gridContainer = document.getElementById('gridContainer');
	this.gridContainer.innerHTML = '';
	console.log(this.gridContainer);


	for (var i = this.data.grid.length-1; i >= 0; i--) {
		this.row = document.createElement('div');
		this.row.setAttribute('id', 'y'+i);
		this.row.classList.add('gridRow');
		for (var j = 0; j < this.data.grid[i].length; j++) {
			this.cell = document.createElement('div');
			this.cell.setAttribute('id', 'x' + j + 'y' + i);
			this.cell.classList.add('gridCell');

			this.row.appendChild(this.cell);
		}

		this.gridContainer.appendChild(this.row);
	}

	this.initGame();
};

App.Game.initGame = function (event) {
	this.gameRoom = document.getElementById('gameRoom');

	this.gameRoom.innerHTML = this.data.room;
};



// Menu
App.Menu.initialize = function () {
	this.parameters = App.Config.getParameters();

	this.startGame = document.getElementById('startGame');
	this.joinGame = document.getElementById('joinGame');

	this.startGame.addEventListener('click', this.setupGame.bind(this), false);
	this.joinGame.addEventListener('click', this.insertCode.bind(this), false);

	if (this.parameters.section) {
		this.showSection(this.parameters.section);
	} else {
		this.showSection('menuStart');
	}
	
};

App.Menu.showSection = function (section) {	
	var sections = document.getElementById('menu').getElementsByTagName('section');

	for (var s = 0; s < sections.length; s++) {
		
		if (sections[s].id === section) {
			sections[s].classList.add('show');
		} else {
			sections[s].classList.remove('show');
		}
	}
};

App.Menu.insertCode = function () {
	App.Config.path('menu?section=menuJoin');
};

App.Menu.setupGame = function (event) {	
	socket.emit('setGame', {}, this.setTheGame.bind(this));
};

App.Menu.setTheGame = function (response) {
	if (response.game.room && response.game.grid.length > 0) {
		App.Game.data = response.game;

		App.Config.path('game?room=' + App.Game.data.room);
	} else {
		alert('something went wrong creating the game. please try again a bit later');
	}	
};

App.Menu.doSomething = function (event) {
	//special function for doSomething
};



App.Config.initialize();

console.log('App', App);
