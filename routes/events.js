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
  db.all("select * from events order by date", [], function(err, rows) {
    if(err) {
      console.log("error retrieving events " + err.message);
      res.render('error', {message: "error getting events", error: err})
    }
    else {
      req.session.events = rows;
      var user = req.app.locals.user;
      if(user) {
        db.all('select * from followed_events where user_id = ?', [user.user_id], function(err, rows) {
          if(err) {
            res.render('error');
          }
          else {
            var followed_events = rows;
            for(var i = 0; i < followed_events.length; i++) {
              var event_id = followed_events[i].event_id;
              for(var j = 0; j < req.session.events.length; j++) {
                if(req.session.events[j].event_id === event_id) {
                  // console.log(followed_events[i].event_id);
                  req.session.events[j].isFollowed = true;
                }

              }
            }
            res.render('events', { title: 'Events', events: req.session.events, user:req.app.locals.user, followed: followed_events, csrf: req.csrfToken() });
          }
        });
      }
      else {
        res.render('events', { title: 'Events', events: req.session.events, user:req.app.locals.user, followed: null, csrf: req.csrfToken() });
      }
    }
  });
});

router.get('/create', function(req, res, next) {
  req.app.locals.show_turometer = false;
  res.render('events_create', {title: 'New Event', user: req.app.locals.user, errors: req.session.event_errors, success: req.session.event_success, csrf: req.csrfToken()});
});

router.post('/create', function(req, res, next) {
  var event_data = req.body;
  var user = req.app.locals.user;
  req.check('title', 'Please insert a title').isLength({min: 4});
  req.check('date', 'Invalid Date or Time').isAfter();
  //
  var errors = req.validationErrors();

  if(errors) {
    req.session.event_success = false;
    req.session.event_errors = errors;
    res.redirect('/events/create');
    console.log("there are errors" + errors[0].msg);
  }
  else {
    req.session.event_success = true;
    req.session.event_errors = [];
    console.log("no errors");
    console.log(event_data.title);
    var event = [];
    event.push(event_data.title);
    event.push(event_data.date);
    event.push(event_data.description);
    event.push(user.user_id);
    db.run("insert into events(title, date, description, user_id) values(?, ?, ?, ?)", event, function(err) {
      if(err) {
        return console.log("error inserting event " + err);
      }
    });

    res.redirect('/events');
  }

});

router.post('/:id/delete', function(req, res, next) {
  console.log("delete event #" + req.params.id);
  var event_id = req.params.id;
  db.run("delete from events where event_id = ?", event_id, function(err) {
    if(err) {
      return console.error(err.message);
    }
  });
  res.redirect('/events');
});

router.post('/:id/follow', function(req, res, next) {
  var user = req.app.locals.user;
  var event_id = req.params.id;
  db.run('insert into followed_events(user_id, event_id) values(?, ?)', [user.user_id, event_id], function(err, row) {
    if(err) {
      res.render('error');
    }
    else {
      res.redirect('/events');
    }
  });
})

router.post('/:id/unfollow', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var user = req.app.locals.user;
  var event_id = req.params.id;
  db.run('delete from followed_events where user_id = ? and event_id = ?', [user.user_id, event_id], function(err, row) {
    if(err) {
      res.render('error');
    }
    else {
      res.redirect('/events');
    }
  });
})

router.get('/:id/edit', function(req, res, next) {
  req.app.locals.show_turometer = false;
  db.get('select * from events where event_id = ?', [req.params.id], function(err, row) {
    if(err) {
      res.render('error');
    }
    else {
      res.render('event_edit', {title: 'Edit event', event: row, csrf: req.csrfToken() });
    }
  });
});

router.post('/:id/edit', function(req, res, next) {
  req.app.locals.show_turometer = false;
  var form_data = req.body;
  db.run('update events set title = ?, date = ?, description = ? where event_id = ?', [form_data.title, form_data.date, form_data.description, req.params.id], function(err, row) {
    if(err) {
      res.render('error');
    }
    else {
      res.redirect('/events');
    }
  })
});

//db.close();
module.exports = router;
