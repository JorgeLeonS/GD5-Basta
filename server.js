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

class Game {
  constructor() {
      this.players = [];
      this.otherPlayers = [];
      this.randomLetter = null;
      this.gameover = false;
  }

  //Agregar jugadores
  addPlayer(player) {
    //Si no hay dos jugaores activos, se manda el jugador a la lista de activos
    if (this.players.length < 2) {
      this.players.push(player);
      //Si tenemos dos jugadores activos se indica cual es su oponente
      if(this.players.length == 2) {
        this.players[0].opponent = this.players[1];
        this.players[1].opponent = this.players[0];
        console.log("Opponent of player " + this.players[0].id + " is " + this.players[0].opponent.id);
        console.log("Opponent of player " + this.players[1].id + " is " + this.players[1].opponent.id);
      }
    }
    //Si ya hay dos jugadores activos se envía al jugador a la lista de espera
    else
    {
      this.otherPlayers.push(player);
    }
    
  }

  //Terminar el juego
  finishGame() {
    //Sacamos a los jugadores activos de la lista
    for(var i = 1; i >= 0; i--) {
      this.players[i].opponent = 'unmatched';
      this.players[i].points = 0;
      this.players[i].status = 'undefined';
      this.players.pop();
    }

    //Indicamos que el juego ya termino
    this.gameover = false;
    //Checamos la lista de espera
    this.checkOtherPlayers();
  }

  //Checamos la lista de espera
  checkOtherPlayers() {
    var limit = this.otherPlayers.length;
    for(var i = 0; i < limit; i++) {
      //Si no hay dos jugadores activos, se manda al primer jugador de la lista de espera a la lista de jugadores activos
      if (this.players.length < 2) {
        this.addPlayer(this.otherPlayers[0]);
        this.otherPlayers.splice(0, 1);
        console.log("New active player: " + this.players.length);
        console.log("Updated waitlist: " + this.otherPlayers.length);
      }
    }
  }

  //Eliminamos a un jugador a partir de su id de una lista
  deletePlayer(id) {
    for(var i = 0; i < this.players.length; i++) {
      if(this.players[i].id == id) {
        this.players.splice(i, 1);
        console.log("Active player deleted " + this.players.length);
        this.checkOtherPlayers();
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
    var nombrePoints = 0;
    var colorPoints = 0;
    var frutoPoints = 0;
    var totalPoints;

    if (nombre.charAt(0) == letter) {
      nombrePoints = 1;
    }

    if (color.charAt(0) == letter) {
      colorPoints = 1;
    }

    if (fruto.charAt(0) == letter) {
      frutoPoints = 1;
    }
    totalPoints = nombrePoints + colorPoints + frutoPoints;
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

//Clase del jugador
class Player {

  constructor(socket) {
      this.socket = socket;
      this.id = socket.id;
      this.opponent = 'unmatched';
      this.points = 0;
      this.status = 'undefined';
  }

  defineOpponent(player) {
    this.opponent = player;
  }

}

//Conexión de jugadores
let game = new Game();
var cont = 0;
var playNum = 0;
var letters = 'ABCDEFGHIJKLMNOPQRSTUVWYXZ';

io.on('connection', (socket) => {

  console.log("Client connected: " + socket.id);
  playNum ++;
  player = new Player(socket);

  game.addPlayer(player);  

  socket.emit('playerConn', {message: `Bienvenido al juego, jugador ${playNum}.`});

  //Desconexión de un jugador
  socket.on("disconnect", () => {
    playNum--;
    console.log("Client disconnected: ", socket.id);
    socket.broadcast.emit("clientdisconnect", socket.id);
  });

  //Informar al oponente del jugador activo que se desconecto
  socket.on("disconnect", function() { 
    if(game.players.length == 2){
      if(game.players[0].socket == socket && game.players[0].opponent != null) {
        game.players[0].opponent.socket.emit("opponent.left");
        console.log("El oponente de 1 se ha ido");
      }
      else if(game.players[1].socket == socket && game.players[1].opponent != null) {
        game.players[1].opponent.socket.emit("opponnent.left");
        console.log("El oponente de 0 se ha ido");
      }
    }

    //Eliminamos al jugador de las listas
    game.deletePlayer(socket.id);

  });

  //Si hay dos jugadores el juego puede comenzar
  if (game.players.length == 2) {
    //Random from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
    var letter = letters.charAt(Math.floor(Math.random() * letters.length)); //Definimos con que letra se va a jugar
    console.log(letter);
    this.randomLetter = letter;
    console.log(this.randomLetter);
    
    //Le decimos a los jugadores que letra toco

    game.players[0].socket.emit("iniciarJuego", {
      letter: letter,
      number: 0
    });

    game.players[1].socket.emit("iniciarJuego", {
      letter: letter,
      number: 1
    });
  }

  //Un jugador envió sus palabras
  socket.on("wordsSent", function() {
    game.players[0].socket.emit("count");
    game.players[1].socket.emit("count");
  });

  //Recibir respuestas del cliente
  socket.on('answers-to-server', (data) => {
    console.log('answertoserv'+this.randomLetter);
    console.log('Respuestas del jugador: ' + data.jugador + ' son: ', data);
    //Se manda this.randomLetter, porque por alguna razon no lo lee directamente en evalAnswers
    game.evalAnswers(data.nombre, data.color, data.fruto, data.jugador, this.randomLetter);
    cont++;

    //Si todos los jugadores mandaron sus respuestas y fueron evaluadas
    //se busca al ganador
    if (cont == 2) {
      game.findWinner();

      //Mandarle los resultados al jugador
      if (game.gameover == true) {
        console.log("GAME OVER");
        for(i = 0; i < game.players.length; i++){
          game.players[i].socket.emit("showResults", {
            status: game.players[i].status,
            puntaje: game.players[i].points,
            oponente: game.players[i].opponent.points
          });
        }

        //Terminar el juego
        game.finishGame();
        cont = 0;

        //Iniciar un nuevo juego en caso de que hubiera gente esperando
        if (game.players.length == 2) {
          //Random from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
          var letter = letters.charAt(Math.floor(Math.random() * letters.length)); //Definimos con que letra se va a jugar
          console.log(letter);
          this.randomLetter = letter;
          console.log(this.randomLetter);

          game.players[0].socket.emit("iniciarJuego", {
            letter: letter,
            number: 0
          });

          game.players[1].socket.emit("iniciarJuego", {
            letter: letter,
            number: 1
          });
        }
      } 
    }

  });
})