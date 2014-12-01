'use strict';

/**
 * Our build processes which make managing this static site simpler =)
 */

var bower = require('gulp-bower');
var del = require('del');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var liveReload = require('gulp-livereload');
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
 * Copy all of our images into the proper place.
 *
 * If this app is in development mode, images will be copied over -- otherwise,
 * images will be optimized.
 */
gulp.task('images', function() {
  var images = [
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
 * Wipe out all old Bower files.
 */
gulp.task('cleanBower', function() {
  del.sync([DIST_PATH + '/assets/bower'], { force: true });
});

/**
 * Copy all bower components into our asset path.
 */
gulp.task('bower', ['cleanBower'], function() {
  bower()
    .pipe(gulp.dest(DIST_PATH + '/assets/bower'));
});

/**
 * Run our local development server, and watch for changes.
 */
gulp.task('run', ['bower', 'css', 'js', 'images'], function() {
  liveReload.listen();

  // If any new Bower components are installed -- copy them over into assets.
  gulp.watch('./bower_components/**', ['bower']);

  // If any Bower packages change, reload the live server.
  gulp.watch(DIST_PATH + '/assets/bower/**').on('change', liveReload.changed);

  // If any stylus files are changed, recompile the CSS.
  gulp.watch('./assets/css/*.styl', ['css']).on('change', liveReload.changed);

  // If any images are changed, reload the live server.
  gulp.watch('./assets/images/*', ['images']).on('change', liveReload.changed);

  // If any Jade templates change, reload the live server.
  gulp.watch('./views/*.jade').on('change', liveReload.changed);

  // If any JS code changes, reload the live server.
  gulp.watch('./assets/js/*.js', ['js']).on('change', liveReload.changed);
});

/**
 * Default task.
 */
gulp.task('default', ['run']);
