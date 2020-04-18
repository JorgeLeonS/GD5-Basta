// código basado de la clase y de: https://medium.com/@antoniomignano/node-js-socket-io-express-tic-tac-toe-10cff9108f7
//Conexión socket.io
window.socket = null;
let server = window.location.protocol + "//" + window.location.host;
window.socket = io.connect(server);

var players;

function showPlayer(message) {
    //console.log('El mensaje es: ' ,msg);
    $.playerConn({
        text: message,
        position: 'top-right'
    })
}

function bastaSent(){
    //document.getElementById('btn').hidden = true;
    window.socket.emit('wordsSent');
}

//IdPlayer sent
window.socket.on('playerConn', function(data){
    //showPlayer(data.message);
    document.getElementById('player').innerHTML = data.message;
});

window.socket.on('iniciarJuego', function(data) {
    letter = data.letter;
    players = data.number;
    document.getElementById('waiting').innerHTML = "La letra es: " + letter;
    document.getElementById('btn').hidden = false;
});

window.socket.on('count', function() {
    document.getElementById('msg').hidden = false;
    document.getElementById('seg').hidden = false;
    document.getElementById('btn').hidden = true;
    var i = 10;
    var time = setInterval(function() {
        //showPlayer(i);
        document.getElementById('seg').innerHTML = "Aún tienes "+i+" segundos para escribir!";
        i--;
        if(i < 0){
            clearInterval(time);
            document.getElementById('msg').hidden = true;
            document.getElementById('seg').hidden = true;
            document.getElementById('waiting').innerHTML = "Basta!";
            obtenerPalabras();
        }
    }, 1000); 
});

function obtenerPalabras(){
    name = document.getElementById('name').value.toUpperCase();
    color = document.getElementById('color').value.toUpperCase();
    fruit = document.getElementById('fruit').value.toUpperCase();

    window.socket.emit('answers-to-server', {
        nombre: name, 
        color: color,
        fruto: fruit,
        jugador: players
    });
}

window.socket.on('showResults', function(data) {
    status = data.status;
    puntaje = data.puntaje;
    oponente = data.oponente;
    
    document.getElementById('waiting').innerHTML = status + " Respondiste: " + puntaje + " palabras y tu oponente repondió " + oponente + ".";
});

window.socket.on('opponent.left', function() {
    document.getElementById('waiting').innerHTML = "El otro jugador se desconectó ):";
});
