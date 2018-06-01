var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var expressValidator = require('express-validator');
var logger = require('morgan');
var csrf = require('csurf');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');
var multer = require('multer');
var limiter = new rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0 // no delay until the max limit is reached
});

//middlewares
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var signupRouter = require('./routes/signup');
var aboutRouter = require('./routes/about');
var forumRouter = require('./routes/forum');
var galleryRouter = require('./routes/gallery');
var contactRouter = require('./routes/contact');
var eventsRouter = require('./routes/events');
var logoutRouter = require('./routes/logout');
var userRouter = require('./routes/user');

var app = express();
app.locals.show_turometer = true;
app.locals.user = null;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static('public'));
app.use(expressSession({
  secret: 'max',
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: true
}}));
app.use(function(req, res, next) {
  //res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  // console.log(Object.keys(res));
  // console.log(res.header())
  res.setHeader('Cache-Control', 'no-cache, no-store');
  next();
});
app.disable('x-powered-by');
app.use(helmet({
  frameguard: { action: 'deny' },
  noCache: true
}));
app.use(limiter);
var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, './public/uploads/')
  },
  filename: function(req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now() + '.' + file.mimetype.split('/')[1])
    //console.log("boom " + file.mimetype)
  }
});
var upload = multer({
  storage: storage,
  limits: {fileSize: 10000000, files:1}
})
app.use(upload.single('image'));
app.use(csrf({cookie: true}));


//url addresses
app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/signup', signupRouter);
app.use('/about', aboutRouter);
app.use('/forum', forumRouter);
app.use('/gallery', galleryRouter);
app.use('/contact', contactRouter);
app.use('/events', eventsRouter);
app.use('/logout', logoutRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
