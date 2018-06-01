var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  if(req.app.locals.user) {
    req.app.locals.user = null;
  }
  res.redirect('/home');
});

module.exports = router;
