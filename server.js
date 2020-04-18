// código basado de la clase y de: https://medium.com/@antoniomignano/node-js-socket-io-express-tic-tac-toe-10cff9108f7
// Imports
const express = require('express');
const webRoutes = require('./routes/web');

// Session imports
let cookieParser = require('cookie-parser');
let session = require('express-session');
let flash = require('express-flash');

// Express app creation
const app = express();

// Socket.io
const server = require('http').Server(app);
const io  =require('socket.io')(server);

// Configurations
const appConfig = require('./configs/app');

// View engine configs
const exphbs = require('express-handlebars');
const hbshelpers = require("handlebars-helpers");
const multihelpers = hbshelpers();
const extNameHbs = 'hbs';
const hbs = exphbs.create({
  extname: extNameHbs,
  helpers: multihelpers
});
app.engine(extNameHbs, hbs.engine);
app.set('view engine', extNameHbs);

// Session configurations
let sessionStore = new session.MemoryStore;
app.use(cookieParser());
app.use(session({
  cookie: { maxAge: 60000 },
  store: sessionStore,
  saveUninitialized: true,
  resave: 'true',
  secret: appConfig.secret
}));
app.use(flash());

// Receive parameters from the Form requests
app.use(express.urlencoded({ extended: true }))

app.use('/', express.static(__dirname + '/public'));

// Routes
app.use('/', webRoutes);

// App init
server.listen(appConfig.expressPort, () => {
  console.log(`Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`);
});

// var players = [];
// var sockets = [];
// randLetter = '';
// gameover = false;

class Game {
  constructor() {
      this.players = [];
      this.otherPlayers = [];
      this.randLetter = null;
      this.gameover = false;
  }




  newPlayer(player) {
    if (this.players.length < 2) {
      this.players.push(player);
      if(this.players.length == 2) {
        this.players[0].opponent = this.players[1];
        this.players[1].opponent = this.players[0];
      }
    }
    else
    {
      this.otherPlayers.push(player);
    }
    
  }

  endGame() {
      this.players[0].opponent = 'unmatched';
      this.players[0].points = 0;
      this.players[0].status = 'undefined';
      this.players[1].opponent = 'unmatched';
      this.players[1].points = 0;
      this.players[1].status = 'undefined';
      this.players.pop();

    this.gameover = false;
    //Jugador nuevo
    for(var i = 0; i < this.otherPlayers.length; i++) {
      if (this.players.length < 2) {
        this.newPlayer(this.otherPlayers[0]);
        this.otherPlayers.splice(0, 1);
        console.log("New active player: " + this.players.length);
        console.log("Updated waitlist: " + this.otherPlayers.length);
      }
    }
  }

  deletePlayer(id) {
    for(var i = 0; i < this.players.length; i++) {
      if(this.players[i].id == id) {
        this.players.splice(i, 1);
        console.log("Active player deleted " + this.players.length);
        var limit = this.otherPlayers.length;
        //Jugador nuevo
    for(var i = 0; i < limit; i++) {
      if (this.players.length < 2) {
        this.newPlayer(this.otherPlayers[0]);
        this.otherPlayers.splice(0, 1);
        console.log("New active player: " + this.players.length);
        console.log("Updated waitlist: " + this.otherPlayers.length);
      }
    }
        return;
      }
    }

    for(var i = 0; i < this.otherPlayers.length; i++) {
      if(this.otherPlayers[i].id == id) {
        this.otherPlayers.splice(i, 1);
        console.log("Wait list player deleted " + this.otherPlayers.length);
        return;
      }
    }
  }

  evalAnswers(nombre, color, fruto, numPlayer, letter){
    var namePoints = 0;
    var colorPoints = 0;
    var fruitPoints = 0;
    var totalPoints;

    if (nombre.charAt(0) == letter) {
      namePoints = 1;
    }
    if (color.charAt(0) == letter) {
      colorPoints = 1;
    }
    if (fruto.charAt(0) == letter) {
      fruitPoints = 1;
    }
    totalPoints = namePoints + colorPoints + fruitPoints;
    this.players[numPlayer].points = totalPoints;
    console.log(this.players[numPlayer].points);
    
  }

  findWinner(){
    if(this.players[0].points > this.players[1].points){
      this.players[0].status = "Ganaste!";
      this.players[1].status = "Perdiste ):";
    }
    
    if(this.players[0].points < this.players[1].points){
      this.players[1].status = "Ganaste!";
      this.players[0].status = "Perdiste ):";
    }
    
    if (this.players[0].points == this.players[1].points) {
      this.players[0].status = "Empate!";
      this.players[1].status = "Empate!";    
    }

    this.gameover = true;

  }
}

class Player {

  constructor(socket) {
      this.socket = socket;
      this.id = socket.id;
      this.opponent = 'unmatched';
      this.points = 0;
      this.status = 'undefined';
  }

  setOpponent(player) {
    this.opponent = player;
  }

}

let game = new Game();
var cont = 0;
var playNum = 0;
var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

io.on('connection', (socket) => {

//   if (opponentOf(socket)) { // If the current player has an opponent the game can begin
//     socket.emit("game.begin", { // Send the game.begin event to the player
//         symbol: players[socket.id].symbol
//     });

//     opponentOf(socket).emit("game.begin", { // Send the game.begin event to the opponent
//         symbol: players[opponentOf(socket).id].symbol 
//     });
// }

  console.log("Client connected: " + socket.id);
  playNum ++;
  player = new Player(socket);

  game.newPlayer(player);  

  socket.emit('playerConn', {message: `Bienvenido al juego, jugador ${playNum}.`});

  socket.on("disconnect", () => {
    // var playerDis = this.players[i];
    // this.players.splice(i,1);
    playNum--;
    console.log("Client disconnected. ID: ", socket.id);
    // delete clients[socket.id];
    socket.broadcast.emit("clientdisconnect", socket.id);
  });

  socket.on("disconnect", function() { 
      if(game.players[0].socket == socket && game.players[0].opponent != null) {
        game.players[0].opponent.socket.emit("opponent.left");
      }
      else if(game.players[1].socket == socket && game.players[1].opponent != null) {
        game.players[1].opponent.socket.emit("opponnent.left");
      }
    game.deletePlayer(socket.id);

  });

  if (game.players.length == 2) {
    var genLetter = letters[Math.floor((Math.random() * 26))];
    // console.log(letter);
    this.randLetter = genLetter;
    // console.log(this.randLetter);
    
    game.players[0].socket.emit("sendParameters", {
      letter: genLetter,
      number: 0
    });

    game.players[1].socket.emit("sendParameters", {
      letter: genLetter,
      number: 1
    });
  }

  socket.on("wordsSent", function() {
    game.players[0].socket.emit("count");
    game.players[1].socket.emit("count");
  });

  socket.on('make.move', (data) => {
    console.log('Respuestas del jugador: ' + data.jugador + ' son: ', data);
    //Se manda this.randLetter, porque por alguna razon no lo lee directamente en evalAnswers
    game.evalAnswers(data.nombre, data.color, data.fruto, data.jugador, this.randLetter);
    cont++;

    //Si todos los jugadores mandaron sus respuestas y fueron evaluadas
    //se busca al ganador
    if (cont == 2) {
      game.findWinner();

      //Mandarle los resultados al jugador
      if (game.gameover == true) {
        game.players[0].socket.emit("showResults", {
          status: game.players[0].status,
          puntaje: game.players[0].points,
          oponente: game.players[0].opponent.points
        });
        game.players[1].socket.emit("showResults", {
          status: game.players[1].status,
          puntaje: game.players[1].points,
          oponente: game.players[1].opponent.points
        });

        //Terminar el juego
        game.endGame();
        cont = 0;

        //Iniciar un nuevo juego en caso de que hubiera gente esperando
        if (game.players.length == 2) {
          var genLetter = [Math.floor((Math.random() * 26))]; 
          // console.log(letter);
          this.randLetter = genLetter;
          // console.log(this.randLetter);

          game.players[0].socket.emit("sendParameters", {
            letter: genLetter,
            number: 0
          });

          game.players[1].socket.emit("sendParameters", {
            letter: genLetter,
            number: 1
          });
        }
      } 
    }

  });
})