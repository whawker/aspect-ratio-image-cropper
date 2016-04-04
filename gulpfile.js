'use strict';

var gulp         = require('gulp'),
    gutil        = require('gulp-util'),
    browserify   = require('browserify'),
    babelify     = require('babelify'),
    buffer       = require('vinyl-buffer'),
    source       = require('vinyl-source-stream');

// Compile Scripts
gulp.task('scripts', function(){
    browserify({entries: 'src/Cropper.js'})
        .add(require.resolve('babel-polyfill'))
        .transform(babelify)
        .bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('aspect-ratio-image-cropper.js'))
        .pipe(buffer())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts']);