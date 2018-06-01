var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var sql = require('sqlite3').verbose();
var db = new sql.Database('data.db', (err) => {
  if(err) {
    return console.log(err.message);
  }
  db.run('pragma foreign_keys = on', function(err) {
    if(err) {
      console.log(err);
    }
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.show_turometer = false;
  res.render('login', { title: 'Login Form',
                        success: req.session.login_success,
                        errors: req.session.login_errors,
                        user: req.app.locals.user,
                        csrf: req.csrfToken() });
  req.session.login_errors = null;
});

router.post('/', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var login_data = req.body;
  //var success = false;

  req.check('username', 'Invalid username').isLength({min: 4});
  req.check('password', 'Invalid password').isLength({min: 8});
  var errors = req.validationErrors();
  if(errors) {
    req.session.login_errors = errors;
    req.session.login_success = false;
  }
  else {
    req.session.login_success = true;
    req.session.login_errors = null;
    console.log(req.session.success);
    db.get('SELECT * FROM users WHERE username = ?', [login_data.username], function(err, row) {
      if(err) {
        console.error(err.message);
      }
      if(row) {
        bcrypt.compare(login_data.password, row.password, function(err, result) {
          if(err) {
            console.log('comparison failed');
          }
          else {
            console.log(result);
            if(result) {
              console.log('login successful');
              req.session.user = row;
              req.app.locals.user = row;
              res.redirect('/home');
            }
            else {
              res.redirect('/login');
              console.log('login failed');
            }
          }
        });
      }
      else {
        res.redirect('/login');
        console.log('entry not found in db');
      }
    });
  }
});

module.exports = router;
