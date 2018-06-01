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

/* GET users listing. */
router.get('/:id', function(req, res, next) {
  req.app.locals.show_turometer = false;
  res.render('user_profile', {title: 'My Profile', user: req.app.locals.user, csrf: req.csrfToken() });
});

router.get('/:id/posts', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  db.all('select * from forum_posts where user_id = ?', [user.user_id], function(err, rows) {
    if(err) {
      throw err;
    }
    else {
      var my_posts = rows;
      res.render('my_posts', {title: 'My posts', user: req.app.locals.user, posts: my_posts, csrf: req.csrfToken() });
    }
  });
});

router.get('/:id/events', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  if(!user) {
    res.redirect('/home');
    //next();
  }
  else {
    db.all('select * from followed_events where user_id = ?', [user.user_id], function(err, rows) {
      if(err) {
        throw err;
      }
      else {
        var followed = rows;
        db.all('select * from events', [], function(err, rows) {
          if(err) {
            console.log(err.message);
          }
          else {
            var events = rows;
            var my_events = [];
            for(var i = 0; i < followed.length; i++) {
              var event_id = followed[i].event_id;
              //console.log()
              for(var j = 0; j < events.length; j++) {
                if(events[j].event_id === event_id) {
                  my_events.push(events[j]);
                }
              }
            }
            my_events.sort(function(e1, e2) {
              var date1 = new Date(e1.date);
              var date2 = new Date(e2.date);
              // console.log('date ' + ((new Date(e1.date)) - (new Date(e2.date))) );
              return date1 - date2;
            });
            res.render('my_events', {title: 'My events', user: req.app.locals.user, events: my_events, csrf: req.csrfToken() });
          }
        });
      //console.log(my_events);
      }
    });
  }
});

router.post('/:user_id/events/:event_id/unfollow', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  var event_id = req.params.event_id;
  db.run('delete from followed_events where user_id = ? and event_id = ?', [user.user_id, event_id], function(err, row) {
    if(err) {
      res.render('error');
    }
    else {
      res.redirect('/user/' + user.user_id + '/events' );
    }
  });
});

router.get('/:user_id', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  if(user && user.user_id === req.params.user_id) {
    db.get('select *  from users where user_id = ?', [user.user_id], function(err, row) {
      if(err) {
        console.log(err);
      }
      else {
        req.app.locals.user = row;
        res.render('user_profile', {title: 'My Profile', user: req.app.locals.user, csrf: req.csrfToken() });
      }
    });
  }
  else {
    res.render('error');
  }
});

router.post('/:user_id', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  var form_data = req.body;

  if(user && user.user_id == req.params.user_id) {
    req.check('fullname', 'Invalid name').isLength({min: 5});
    req.check('username', 'Invalid username').isLength({min: 4});
    req.check('email', 'Invalid email address').isEmail();
    req.check('old_password', 'Invalid password').isLength({min: 8});
    req.check('new_password', 'Invalid password').isLength({min: 8}).equals(form_data.new_r_password);

    var errors = req.validationErrors();
    if(errors) {
      console.log('there are errors with the input');
      // res.render('error');
    }
    else {
      var full_name = form_data.fullname;
      var username = form_data.username;
      var email = form_data.email;
      var password = form_data.new_password;
      db.run('update users set full_name = ?, username = ?, email = ?, password = ? where user_id = ?', [full_name, username, email, password, user.user_id], function(err) {
        if(err) {
          console.log('error updating user');
          //res.render('error', {error: err});
        }
        else {
          res.redirect('/user/' + user.user_id);
        }
      })
    }
  }
  else {
    console.log('invalid user');
    //res.render('error');
  }
});

module.exports = router;
