const { src, dest, watch, parallel, series } = require("gulp");
const sass = require('gulp-sass');
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");
const eslint = require("gulp-eslint");
const mocha = require("gulp-mocha");
const sync = require("browser-sync").create();


function hello(callback) {
    console.log("hello world..")
    // task body
    callback();
 }
 
 exports.hello = hello;


function copy(callback) {
    src('routes/*.js')
        .pipe(dest('copies'));
    callback();
}

exports.copy = copy;

function generateCSS(callback) {
    src('./sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(dest('public/stylesheets'));
    callback();
  }
   
exports.css = generateCSS;

  function generateHTML(callback) {
    src("./views/index.ejs")
        .pipe(ejs({
            title: "Hello World!",
        }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(dest("public"));
    callback();
}

exports.html = generateHTML;


function runLinter(callback) {
    return src(['**/*.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format()) 
        .pipe(eslint.failAfterError())
        .on('end', function() {
            callback();
        });
}

exports.lint = runLinter;


function runTests(callback) {
    return src(['**/*.test.js'])
        .pipe(mocha())
        .on('error', function() {
            cb(new Error('Test failed'));
        })
        .on('end', function() {
            callback();
        });
}

exports.test = runTests;


function watchFiles(callback) {
    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch([ '**/*.js', '!node_modules/**'], parallel(runLinter, runTests));
}

exports.watch = watchFiles;


function browserSync(callback) {
    sync.init({
        server: {
            baseDir: "./public"
        }
    });
    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch("./public/**.html").on('change', sync.reload);
}

exports.sync = browserSync;


exports.default = series(runLinter,parallel(generateCSS,generateHTML),runTests);