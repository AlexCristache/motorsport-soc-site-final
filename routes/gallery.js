var express = require('express');
var router = express.Router();
var path_package = require('path');
var fs = require('fs');
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
  db.all('select * from images', [], function(err, rows) {
    if(err) {
      console.log("error retrieving images from db " + err.message);
    }
    else {
      req.session.images = rows;
      //var date = new Date(Date.now()).toLocaleDateString("en-US");
      //console.log(date);
      res.render('gallery', { title: 'Gallery', images: req.session.images, user: req.app.locals.user, csrf: req.csrfToken() });
    }
  });
});

router.post('/upload', function(req, res, next) {
  if(!req.file) {
    console.log("no file received");
  }
  else {
    var change=1;
    while(change==1){
      var str = req.file.path;
      var tmp_path = str.replace("\\","/");
      if(str == tmp_path)
        change=0;
      req.file.path = tmp_path;
    }

    var path = ('/' + req.file.path.split('/')[1] + '/' + req.file.path.split('/')[2]);
    console.log("file received path = " + req.file.path);
    //console.log(Date.now);
    var date = new Date(Date.now()).toLocaleDateString("en-US");
    db.run('insert into images(path, date) values(?, ?)', [path, date], function(err) {
      if(err) {
        return console.log("error inserting img into db " + err.message);
      }
      else {
        console.log("image uploaded successfully");
      }
    });
  }
  res.redirect('/gallery');
});

router.post('/:id/delete', function(req, res, next) {
  var image_id = req.params.id;
  db.get('select * from images where id = ?', [image_id], function(err, row) {
    if(err) {
      throw err;
    }
    fs.unlink('./public' + row.path, function(err) {
      if(err) {
        throw err;
      }
      else {
        console.log('image deleted successfully');
      }
    });
  });
  db.run("delete from images where id = ?", image_id, function(err) {
    if(err) {
      return console.error(err.message);
    }
  });
  res.redirect('/gallery');
})

module.exports = router;
