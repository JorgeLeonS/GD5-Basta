const express = require('express');
const router = require('express').Router();
const app = express();

const homepageController = require('../controllers/HomepageController');
const gameController = require('../controllers/GameController')

router.get('/', homepageController.index);

router.get('/game/basta', gameController.gameStart);

/*
router.get('/auth/login', authController.login);
router.get('/auth/register', authController.register);
router.post('/auth/register', authValidator.store, authController.store);
router.post('/auth/login', passport.authenticate('local', { failureRedirect: '/auth/login?authError=1', successRedirect: '/' }));
router.get('/auth/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});


router.get('/protected', authMiddleware.isAuth, (req, res) => {
  res.send('Protected route, user correctly authenticated');
})
*/

module.exports = router;
