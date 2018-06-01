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

router.post('/submit', function(req, res, next) {
  /* check validity of data */
  var form_data = req.body;

  req.check('fullname', 'Invalid name').isLength({min: 5});
  req.check('username', 'Invalid username').isLength({min: 4});
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Invalid password').isLength({min: 8}).equals(form_data.r_password);

  var errors = req.validationErrors();
  if(errors) {
    req.session.signup_errors = errors;
    req.session.signup_success = false;
  }
  else {
    req.session.signup_success = true;
    req.session.signup_errors = null;

    var username = form_data.username;
    var full_name = form_data.fullname;
    var email = form_data.email;
    var password = form_data.password;
    var is_admin = false;

    var user = [];
    bcrypt.hash(password, 10, function(err, hash) {
      user.push(username);
      user.push(full_name);
      user.push(email);
      user.push(hash);
      user.push(is_admin);
      db.run("insert into users(username, full_name, email, password, is_admin) values(?, ?, ?, ?, ?)", user, function(err) {
        if(err) {
          return console.log("error insterting user1 into the table " + err);
        }
      });
    })
    console.log("created new user");
  }

  res.redirect('/home');
});


module.exports = router;
