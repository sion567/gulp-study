[TOC]

## 1、环境搭建



使用Express创建一个helloworld项目模板：

```powershell
npx express-generator -v ejs --git gulp-study-project

cd gulp-study-project

npm install
```

项目结构如下：

```sh
.
├── app.js
├── bin
│   └── www
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   ├── index.js
│   └── users.js
└── views
    ├── error.ejs
    ├── index.ejs
```



插入gulp

```powershell
npm install --save-dev gulp
```



## 2、First task



> All Gulp configuration goes in a file called gulpfile.js located at the root of the project. The pattern for writing tasks is that you first load a plugin you’re about to use and then define a task that is based on that plugin.
>
> Gulp is very plugin driven; if you want to accomplish something, you need to know which plugin to use. Usually, a single plugin has a single purpose, and all the plugins are just regular JavaScript.



在根目录新建gulpfile.js，并引入gulp

```js
const { src, dest } = require("gulp");
```



>- **src**: reads files and directories and creates a stream of data for further processing. [Src](https://gulpjs.com/docs/en/api/src) function  supports globbing and filters to better select files.
>- **dest**: takes a **directory** and writes the contents of the incoming stream as files. [Dest](https://gulpjs.com/docs/en/api/dest) by efault **overwrites** existing     files.



添加第一个task的代码

```js
function hello(callback) {
    console.log("hello world..")
    // TODO:task body
    callback();
 }
 
 exports.hello = hello;
```

运行结果：

```powershell
C:\Users\xxm\Desktop\gulp-study\gulp-study-project>gulp hello
[12:00:28] Using gulpfile ~\Desktop\gulp-study\gulp-study-project\gulpfile.js
[12:00:28] Starting 'hello'...
hello world..
[12:00:28] Finished 'hello' after 5.68 ms
```

做一个复制文件的任务

```js
function copy(callback) {
    src('routes/*.js')
        .pipe(dest('copies'));
    callback();
}

exports.copy = copy;
```

>- src reads JavaScript files from routes/ and passes its contents into the pipeline,
>- pipe will take output of the previous command as pipe it as an input for the next,
>- dest writes the output of previous commands to the copies/ directory.



执行命令 gulp copy，routes下面的所有js就会拷贝到copies文件夹下

老版本使用的task代码如下

```js
gulp.task('name', function() {
	//implementation of the task
});
```

>
>
>This syntax works but Gulp devs [recommend](https://gulpjs.com/docs/en/getting-started/creating-tasks) using the newer syntax I showed earlier.



## 3、First plugin



新建sass文件夹和style.scss文件  sass/style.scss

```scss
$violet-color: #9B2583;

body {
  color: $violet-color;
}
```

需要新加plugin

```scss
npm install --save-dev gulp-sass
```

gulpfile.js也要引入

```js
const sass = require('gulp-sass');
```

继续添加个task

```js
function generateCSS(callback) {
  src('./sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('public/stylesheets'));
  callback();
}
 
exports.css = generateCSS;
```



## 4、ejs templates と gulp-ejs plugin

加入plugin

```powershell
npm install --save-dev gulp-ejs gulp-rename
```

加入task

```js
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");

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
```

具体做了啥呢？

>- Read *.ejs files from views/.
>- Pipe them into gulp-ejs replacing variables for the values we supply to get pure HTML.
>- Pipe the files into [gulp-rename](https://www.npmjs.com/package/gulp-rename) to change the file extension.
>- Pipe everything into the public/ directory.



## 5、eslint plugin

加入plugin

```powershell
npm install --save-dev gulp-eslint
```

加入task

```js
const eslint = require("gulp-eslint");

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
```

>Notice that Gulp streams emit events that we can capture with the .on keyword.

Eslint需要的文件.eslintrc.json

```json
{
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    "rules": {
        "semi": "error"
    }
}
```

执行gulp lint，提示Missing semicolon，因为之前的console.log("hello world..")没有分号。



## 6、Test

加入plugin

```powershell
npm install --save-dev gulp-mocha gulp-data mocha supertest
```

>Mocha is a popular test framework that runs on Node and on browsers. We can run our tests as part of the Gulp pipeline.
>
>We’ll use the *.test.js pattern to identify test files;

新建一个app.test.js，代码如下

```js
const app = require('./app');
const request = require('supertest');

describe('test', function() {

    let server = null;

    beforeEach(function(done) {
        server = app.listen(0, function(err) {
            if(err) { return done(err); }
            done();
        });
    });

    afterEach(function() {
        server.close();
    });

    it('Status code should be 200', function(done) {
        request(app)
            .get('/')
            .expect(200, done);
    });

    it('Test /users response', function(done) {
        request(app)
            .get('/users')
            .expect(200)
            .expect('respond with a resource', done);
    });

});
```

加入task

```js
const mocha = require("gulp-mocha");

function runTests(callback) {
    return src(['**/*.test.js'])
        .pipe(mocha())
        .on('error', function() {
            callback(new Error('Test failed'));
        })
        .on('end', function() {
            callback();
        });
}

exports.test = runTests;
```



## 7、Watching for File Changes

修改task

```js
const { src, dest, watch, parallel } = require("gulp");
```

添加task

```js
function watchFiles(callback) {
    watch('views/**.ejs', generateHTML);
    watch('sass/**.scss', generateCSS);
    watch([ '**/*.js', '!node_modules/**'], parallel(runLinter, runTests));
}

exports.watch = watchFiles;
```

>
>
>- **Templates**: every time a file in views/ with ejs extension is changed, generateHTML is called.
>- **Sass**: the same thing happens with scss files in the sass/ directory.
>- **Tests**: triggers every time a JavaScript file outside node_modules/ is modified. We’re using the parallel() function we imported at the beginning to start both functions concurrently. Gulp also provides a series() function to call functions one after the other.



开启watch，一直监控代码修改，改完后马上执行对应的task。我们修改下scss的$violet-color: #610055

```powershell
C:\Users\xxm\Desktop\gulp-study\gulp-study-project>gulp watch
[12:33:47] Using gulpfile ~\Desktop\gulp-study\gulp-study-project\gulpfile.js
[12:33:47] Starting 'watch'...
[12:34:10] Starting 'generateCSS'...
[12:34:10] Finished 'generateCSS' after 20 ms
```



## 8、Creating Server for Live Reload

加入plugin

```powershell
npm install --save-dev browser-sync
```

加入task

```js
const sync = require("browser-sync").create();

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
```

这个task为public文件夹提供一个本地服务，并监控view\sass等



## 9、Default Task

修改task

```js
const { src, dest, watch, parallel, series } = require("gulp");
```

加入task

```js
exports.default = series(runLinter,parallel(generateCSS,generateHTML),runTests);
```

```powershell
C:\Users\xxm\Desktop\gulp-study\gulp-study-project>gulp --tasks
[12:49:11] Tasks for ~\Desktop\gulp-study\gulp-study-project\gulpfile.js
[12:49:11] ├── hello
[12:49:11] ├── copy
[12:49:11] ├── css
[12:49:11] ├── html
[12:49:11] ├── lint
[12:49:11] ├── test
[12:49:11] ├── watch
[12:49:11] ├── sync
[12:49:11] └─┬ default
[12:49:11]   └─┬ <series>
[12:49:11]     ├── runLinter
[12:49:11]     ├─┬ <parallel>
[12:49:11]     │ ├── generateCSS
[12:49:11]     │ └── generateHTML
[12:49:11]     └── runTests
```

