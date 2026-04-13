"use strict";

var gulp = require("gulp");
var pug = require("gulp-pug");
const { deleteAsync } = require("del");
var concat = require("gulp-concat");
var concatCss = require("gulp-concat-css");
var sourcemaps = require("gulp-sourcemaps");
var plumber = require("gulp-plumber");
var uglify = require("gulp-uglify");
var data = require("gulp-data");
var fs = require("fs");
var less = require("gulp-less");

// Очистка папки build
gulp.task("clean", function () {
  return deleteAsync("build");
});

// Компиляция Pug в HTML
gulp.task("pug", function () {
  return gulp
    .src(["src/*.pug", "!src/__*.pug"])
    .pipe(
      data(function () {
        return JSON.parse(fs.readFileSync("src/assets/data/data.json"));
      }),
    )
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest("build"));
});

// Компиляция Less в CSS
gulp.task("less", function () {
  return gulp
    .src("src/assets/less/app.less")
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("build/assets/css"));
});

// Вендорные CSS
var vendorsCssFiles = [
  "node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.css",
  "node_modules/swiper/swiper-bundle.min.css",
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "node_modules/butterpop/butterpop.css",
];

gulp.task("vendorsCss", function () {
  return gulp
    .src(vendorsCssFiles)
    .pipe(sourcemaps.init())
    .pipe(concatCss("vendors.css"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("build/assets/css"));
});

// Изображения
gulp.task("image", function () {
  return gulp
    .src("src/assets/img/**/*.*", { encoding: false }) // ← Добавьте это
    .pipe(gulp.dest("build/assets/img"));
});

// Вендорные JS
var vendorsJsFiles = [
  "node_modules/jquery/dist/jquery.min.js",
  "node_modules/@fancyapps/fancybox/dist/jquery.fancybox.min.js",
  "node_modules/swiper/swiper-bundle.min.js",
  "node_modules/jquery-mask-plugin/dist/jquery.mask.min.js",
  "node_modules/butterpop/butterpop.js",
  "node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js",
];

gulp.task("vendorsJs", function () {
  return gulp
    .src(vendorsJsFiles)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(concat("vendors.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("build/assets/js"));
});

// Собственные JS
var myjsfiles = [
  "src/assets/js/__var.js",
  "src/assets/js/__theme.js",
  // "src/assets/js/__sliders.js",
  "src/assets/js/__resize.js",
  "src/assets/js/__paralax.js",
  "src/assets/js/__svgmap.js",
  "src/assets/js/main.js",
];

gulp.task("myJs", function () {
  return gulp
    .src(myjsfiles)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(concat("app.js"))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("build/assets/js"));
});

// Шрифты
gulp.task("fonts", function () {
  return gulp.src("src/assets/fonts/**/*.*", { encoding: false }).pipe(gulp.dest("build/assets/fonts"));
});

// Иконки
gulp.task("icomoon", function () {
  return gulp.src("src/assets/icomoon/**/*.*", { encoding: false }).pipe(gulp.dest("build/assets/icomoon"));
});

// Сборка
gulp.task(
  "build",
  gulp.series("clean", gulp.parallel("less", "vendorsCss", "pug", "image", "vendorsJs", "myJs", "fonts", "icomoon")),
);

// Вотчер
gulp.task("watch", function () {
  gulp.watch("src/assets/less/**/*.less", gulp.series("less"));
  gulp.watch("src/assets/img/**/*.*", gulp.series("image"));
  gulp.watch("src/assets/js/*.js", gulp.series("myJs"));
  gulp.watch("src/**/*.pug", gulp.series("pug"));
  gulp.watch("src/assets/data/data.json", gulp.series("pug"));
});

// Режим разработки
gulp.task("dev", gulp.series("build", "watch"));

// Задача по умолчанию
gulp.task("default", gulp.series("build"));
