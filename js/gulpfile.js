const gulp = require("gulp");

// Gulp dependencies go here:
const eol = require("gulp-eol");
const babel = require("gulp-babel");
const eslint = require("gulp-eslint");
const webpack = require("gulp-webpack");
const sequence = require("run-sequence");


gulp.task("eol", () => {
    // Normalize EOL to Linux style (LF)
    return gulp.src("public/es6/*.js")
        .pipe(eol("\n"))
        .pipe(gulp.dest("public/es6/"));
});
gulp.task("eol_bs", () => {
    // Normalize EOL to Linux style (LF)
    return gulp.src("public/es6/bs/*.js")
        .pipe(eol("\n"))
        .pipe(gulp.dest("public/es6/bs/"));
});
gulp.task("eol_ol", () => {
    // Normalize EOL to Linux style (LF)
    return gulp.src("public/es6/ol/*.js")
        .pipe(eol("\n"))
        .pipe(gulp.dest("public/es6/ol/"));
});

gulp.task("eslint", () => {
    // Run ESLint
    return gulp.src(["public/es6/**/*.js", "public/es6/**/*.js"])
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task("babel", () => {
    // Convert to ES5
    return gulp.src("public/es6/**/*.js")
        .pipe(babel())
        .pipe(gulp.dest("public/es5"));
});

gulp.task("webpack", () => {
    // Bundle
    return gulp.src("public/es5/**/*.js")
        .pipe(webpack({
            entry: "./public/es5/app.js",
            output:{
                filename: "smartmap.bundle.js"
            },
        }))
        .pipe(gulp.dest("public/dist"));
});

gulp.task("default", () => {
    sequence("eol", "eol_bs","eol_ol", "eslint", "babel", "webpack");
});
