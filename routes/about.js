var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.show_turometer = false;
  res.render('about', { title: 'About', user: req.app.locals.user });
});

module.exports = router;
