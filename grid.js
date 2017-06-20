

// Modules
global.express = require('express');
global.app = express();
global.request = require('request');
global.http = require('http').Server(app);
global.io = require('socket.io')(http);
global.fs = require('fs');
global.path = require('path');
global.concat = require('concat-files');


// Set headers
app.use(function (req, res, next) {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	res.header('Expires', '-1');
	res.header('Pragma', 'no-cache');

	next();
});


console.log('localhost');


// set app routing for beta server
/*app.use("/grid/css", express.static(__dirname + "/css"));
app.use("/grid/img", express.static(__dirname + "/img"));
app.use("/grid/fonts", express.static(__dirname + "/fonts"));
app.use("/grid/js/libs", express.static(__dirname + "/js/libs"));
app.use("/grid/js/app.js", express.static(__dirname + "/js/app.js"));
app.use("/grid/js/app.min.js", express.static(__dirname + "/js/app.min.js"));
app.use("/grid/node_modules", express.static(__dirname + "/node_modules"));
app.use("/grid/views", express.static(__dirname + "/views"));

app.get('/grid', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});*/



// Set app routing
app.use("/css", express.static(__dirname + "/css"));
app.use("/img", express.static(__dirname + "/img"));
app.use("/fonts", express.static(__dirname + "/fonts"));
app.use("/js/libs", express.static(__dirname + "/js/libs"));
app.use("/js/app.js", express.static(__dirname + "/js/app.js"));
app.use("/js/app.min.js", express.static(__dirname + "/js/app.min.js"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));
app.use("/views", express.static(__dirname + "/views"));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});


global.server = {

	// active games
	games: {
		
		/*
		// example game
		game123: {
			grid: [
				[
					{}, {}, {}
				],

				[
					{}, {}, {}
				],

				[
					{}, {}, {}
				]
			],
			players: []
		}
		*/
	},

	// Initlize the node application
	initialize: function () {
		this.parent = this;

		//this.setArrayContains(); // FIXME: remove dependency of this function in sqlBackend.js

		io.sockets.on('connection', this.connection.bind(this));

		// concat js files into one file
		concat([
			path.dirname(require.main.filename) + '/node_modules/socket.io-client/dist/socket.io.min.js',
			path.dirname(require.main.filename) + '/js/app.js'
		], path.dirname(require.main.filename) + '/js/app.min.js', function (error) {
			if (error) {
				throw error;
			} else {
				console.log('JavaScript files packed successfully');
			}	
		});

		// start the server
		http.listen(7700, function () {
			console.log('listening on *:7700');
		});
	},

	// On socket connection
	connection: function (socket) {
		// socket listeners
		socket.on('joinRoom', this.joinRoom.bind(this, socket));
		socket.on('leaveRoom', this.leaveRoom.bind(this, socket));
		socket.on('disconnect', this.disconnect.bind(this, socket));
		socket.on('broadcast', this.broadcast.bind(this, socket));

		socket.on('setGame', this.setGame.bind(this, socket));
		socket.on('getGame', this.getGame.bind(this, socket));
	},

	// Join a socket room
	joinRoom: function (socket, data, callback) {
		socket.join(data.room);
	},

	// Leave a socket room
	// Data properties required: room, uniId, firstname, lastname (optional: type, ticketId, reviewRoomId, & projectId)
	leaveRoom: function (socket, data, callback) {	
		socket.leave(data.room);
	},

	// On socket disconnect
	disconnect: function (socket) {	
		
	},

	// Broadcast to a socket room
	// Data properties required: room (optional: backToSender)
	broadcast: function (socket, data, backToSender) {
		if (backToSender === true) {
			// To specfici room including sender
			io.to(data.room).emit('broadcastUpdateProject', data);
		} else {
			// To specific room without sender
			socket.broadcast.to(data.room).emit('broadcastUpdateProject', data);
		}
	},

	setGame: function (socket, data, callback) {
		var gameId = new Date().getTime(),
			game,
			gridSize = 20;
		
		if (game) {
			console.log('exist allready');
		} else {
			//console.log('game doesnt exist create it');
			game = {
				id: gameId,
				room: this.getRoom(),
				players: [],
				grid: []
			};

			for (var x = 0; x < gridSize; x++) {
				game.grid[x] = [];

				for (var y = 0; y < gridSize; y++) {
					game.grid[x].push({x: x, y: y});
				}
			}

			this.games['game' + gameId] = game;

			if (callback) {
				callback(game);
			}
			
		}

	},
	getRoom: function (counter) {
		var room = this.getRoomName()
		
		// TODO: Expand to being able to check infinite
		if (this.checkRoomName(room) === true) {
			return room;
		} else {
			return this.getRoomName();
		}
	},
	getRoomName: function () {
		return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5).toUpperCase();
	},
	checkRoomName: function (room) {
		var exist = false;

		for (var name in this.games) {
			if (this.games[name].room === room) {
				exist = true;
			}
		}

		// make sure room name doesnt exist allready
		if (exist === true) {
			return false;
		} else {
			return true;
		}
	},
	getGame: function (socket, data, callback) {
		for (var name in this.games) {
			if (this.games[name].room === data.room) {
				data.gameFound = true;

				if (callback) {
					callback(this.games[name]);
				}

				break;
			}
		}

		data.gameFound = false;

		if (callback) {
			callback(this.games[name]);
		}
	}
};

server.initialize();
