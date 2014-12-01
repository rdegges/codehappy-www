'use strict';

/**
 * Our build processes which make managing this static site simpler =)
 */

var awspublish = require('gulp-awspublish');
var bower = require('gulp-bower');
var connect = require('connect');
var del = require('del');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var jade = require('gulp-jade');
var liveReload = require('gulp-livereload');
var serveStatic = require('serve-static');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');

var DEBUG = process.env.DEBUG ? true : false;
var DIST_PATH = './dist';

/**
 * Compile all of our Stylus CSS templates into proper CSS files.
 *
 * If this app is in development mode, CSS will be pretty-printed -- otherwise,
 * CSS will be compressed.
 */
gulp.task('css', function() {
  gulp.src('./assets/css/*.styl')
    .pipe(stylus({ compress: !DEBUG }))
    .pipe(gulp.dest(DIST_PATH + '/assets/css/'));
});

/**
 * Compile all of our Jade templates into proper HTML files.
 *
 * If this app is in development mode, HTML will be pretty-printed -- otherwise,
 * HTML will be compressed.
 */
gulp.task('views', function() {
  gulp.src(['./views/**.jade', '!./views/includes/*'])
    .pipe(jade({
      pretty: DEBUG,
    }))
    .pipe(gulp.dest(DIST_PATH + '/'));
});

/**
 * Copy all of our images into the proper place.
 *
 * If this app is in development mode, images will be copied over -- otherwise,
 * images will be optimized.
 */
gulp.task('images', function() {
  var images = [
    './assets/images/*.ico',
    './assets/images/*.png',
    './assets/images/*.jpg',
    './assets/images/*.jpeg',
    './assets/images/*.gif',
    './assets/images/*.svg',
  ];

  if (DEBUG) {
    gulp.src(images)
      .pipe(gulp.dest(DIST_PATH + '/assets/images/'));
  } else {
    gulp.src(images)
      .pipe(imagemin({
        optimizationLevel: 7,
      }))
      .pipe(gulp.dest(DIST_PATH + '/assets/images/'));
  }
});

/**
 * Copy all of our JS code into the proper place.
 *
 * If this app is in development mode, JS will be left alone -- otherwise, JS
 * will be compressed.
 */
gulp.task('js', function() {
  if (DEBUG) {
    gulp.src('./assets/js/*.js')
      .pipe(gulp.dest(DIST_PATH + '/assets/js/'));
  } else {
    gulp.src('./assets/js/*.js')
      .pipe(uglify())
      .pipe(gulp.dest(DIST_PATH + '/assets/js/'));
  }
});

/**
 * Copy all bower components into our asset path.
 */
gulp.task('bower', function() {
  bower()
    .pipe(gulp.dest(DIST_PATH + '/assets/bower'));
});

/**
 * Run a local web server to serve our site.
 */
gulp.task('server', function(next) {
  var server = connect();
  server.use(serveStatic(DIST_PATH)).listen(3000, next);
});

/**
 * Clean all dist files.
 */
gulp.task('clean', function() {
  del.sync([ DIST_PATH ], { force: true });
});

/**
 * Run our local development server, and watch for changes.
 */
gulp.task('run', ['clean', 'bower', 'css', 'js', 'images', 'views', 'server'], function() {
  liveReload.listen();

  // If any new Bower components are installed -- copy them over into assets.
  gulp.watch('./bower_components/**', ['bower']).on('change', liveReload.changed);

  // If any stylus files are changed, recompile the CSS.
  gulp.watch('./assets/css/*.styl', ['css']).on('change', liveReload.changed);

  // If any images are changed, reload the live server.
  gulp.watch('./assets/images/**', ['images']).on('change', liveReload.changed);

  // If any Jade templates change, reload the live server.
  gulp.watch(['./views/*.jade', './views/includes/*.jade'], ['views']).on('change', liveReload.changed);

  // If any JS code changes, reload the live server.
  gulp.watch('./assets/js/*.js', ['js']).on('change', liveReload.changed);
});

/**
 * Deploy the public facing site to S3.
 */
gulp.task('deploy', ['clean', 'bower', 'css', 'js', 'images', 'views'], function() {
  // Always disable debug mode when publishing.
  DEBUG = false;

  var aws = JSON.parse(fs.readFileSync('./aws.json'));
  var publisher = awspublish.create({
    key: aws.key,
    secret: aws.secret,
    bucket: 'www.codehappy.io',
  });

  gulp.src('./dist/**')
    .pipe(publisher.publish({
      'Cache-Control': 'max-age=2592000, public',
    }))
    .pipe(publisher.sync())
    .pipe(awspublish.reporter());
});

/**
 * Default task.
 */
gulp.task('default', ['run']);
