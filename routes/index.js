var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.show_turometer = true;
  res.render('intro-page', { title: 'Intro Page' });
  //req.app.locals.show_turometer = false;
});

router.get('/home', function(req, res, next) {
  console.log(req.app.locals.show_turometer);
  var show_turometer = req.app.locals.show_turometer;
  res.render('index', { title: 'Home Page', show_turometer: req.app.locals.show_turometer, user: req.app.locals.user });
  req.app.locals.show_turometer = false;
});

module.exports = router;
