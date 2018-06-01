var express = require('express');
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
  res.render('contact', { title: 'Contact', user: req.app.locals.user, csrf: req.csrfToken() });
});

router.post('/', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var form_data = req.body;
  var full_name = form_data.firstname + ' ' + form_data.lastname;
  var email = form_data.email;
  var country = form_data.country;
  var subject = form_data.subject;
  var year = new Date().getFullYear().toString();
  var month = new Date().getMonth().toString();
  var day = new Date().getDate().toString();
  var date = new Date(year + "-" + month + "-" + day).toLocaleDateString("en-US");;
  db.run('insert into contact_requests(full_name, email, country, subject, date) values(?, ?, ?, ?, ?)', [full_name, email, country, subject, date], function(err) {
    if(err) {
      console.log(err);
    }
    else {
      res.redirect('/home');
    }
  })
});

router.get('/messages', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  if(user && user.is_admin) {
    db.all('select * from contact_requests order by date', [], function(err, rows) {
      if(err) {
        console.log(err);
      }
      else {
        res.render('contact_messages', {title: 'Messages', messages: rows, csrf: req.csrfToken() });
      }
    });
  }
  else {
    res.redirect('/home');
  }
})

module.exports = router;
