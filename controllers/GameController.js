//const { validationResult } = require('express-validator');
const express = require("express");
const app = express();

exports.gameStart = (req, res) => {
    //let authError = req.query.authError == 1 ? 'Invalid register data' : null;
    //res.render('auth/login', { layout: 'auth', authError: authError });
    res.render('game/basta');
  }

//   app.get("/", (req, res) => {
//     const stream = fs.createReadStream(__dirname + "../views/game/basta");
//     stream.pipe(res);
// });