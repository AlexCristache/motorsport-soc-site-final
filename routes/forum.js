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
  db.all('select * from forum_posts order by date', [], function(err, rows) {
    if(err) {
      return console.log('error retrieving forum posts');
    }
    else {
      var posts = rows;
      db.all('select * from users', [], function(err, rows) {
        if(err) {
          return console.log("error retrieving users for forum posts" + err.message);
        }
        else {
          var users = rows;
          for(var i = 0; i < posts.length; i++) {
            posts[i].user_name = users[posts[i].user_id - 1].full_name;
          }
          req.session.posts = posts
          res.render('forum', { title: 'Forum', posts: req.session.posts, user: req.app.locals.user, csrf: req.csrfToken() });
        }
      });
    }
  });
});

router.get('/write', function(req, res, next) {
  res.render('write_post', { title: 'New Post', user:req.app.locals.user, csrf: req.csrfToken() });
});

router.post('/write', function(req, res, next) {
  console.log('new post');
  var user_id = req.app.locals.user.user_id;
  var form_data = req.body;
  var date = new Date(Date.now()).toLocaleDateString("en-US");
  var content = form_data.content;
  var title = form_data.title;
  db.run('insert into forum_posts(user_id, title, content, date) values(?, ?, ?, ?)', [user_id, title, content, date], function(err) {
    if(err) {
      console.log("error saving post " + err.message);
    }
    else {
      res.redirect('/forum');
    }
  })
});

router.post('/:id/delete', function(req, res, next) {
  var post_id = req.params.id;
  db.run("delete from forum_posts where id = ?", post_id, function(err) {
    if(err) {
      return console.error(err.message);
    }
  });
  res.redirect('/forum');
});

router.get('/post/:id', function(req, res, next) {
  db.get('select * from forum_posts where id = ?', [req.params.id], function(err, row) {
    if(err) {
      console.log('error retrieving post' + err.message);
      res.render('error');
    }
    else {
      var post = row;
      db.all('select * from forum_post_replies where forum_post_id = ?', [post.id], function(err, rows){
        if(err) {
          console.log('error retrieving replies for post ' + err.message);
        }
        else {
          var replies = rows;
          db.all('select * from users', [], function(err, rows) {
            if(err) {
              console.log(err);
            }
            else {
              var users = rows;
              for(var i = 0; i < replies.length; i++) {
                for(var j = 0; j < users.length; j++) {
                  if(replies[i].user_id == users[j].user_id) {
                    replies[i].author = users[j].full_name;
                  }
                }
              }
              res.render('forum_post', {title: 'Forum' + req.params.id, post: post, replies: replies, user: req.app.locals.user, csrf: req.csrfToken()});
            }
          });
        }
      });
    }
  });
});

router.post('/post/:id/reply', function(req, res, next) {
  var content = req.body.content;
  var date = new Date(Date.now()).toLocaleDateString("en-US");
  var user_id = req.app.locals.user.user_id;
  var post_id = req.params.id;
  db.run('insert into forum_post_replies(user_id, forum_post_id, content, date) values(?, ?, ?, ?)', [user_id, post_id, content, date], function(err) {
    if(err) {
      return console.log('error inserting message into db ' + err.message);
    }
    else {
      res.redirect('/forum/post/' + req.params.id);
    }
  });
});

module.exports = router;
