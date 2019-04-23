const expect = require("chai").expect;
describe("test mkdir", function() {
    const {mkdir, mkdirAsync} = require("../../../module/file/mkdir.js");
    it('should make a dir', function (done) {
        mkdir("/tmp/testfilexxx", done);
    });

    it('should make a dir', function (done) {
        mkdirAsync("/tmp/fifesfesf").then(done);
    });

    after(function(){
        const fs = require("fs");
        fs.rmdirSync("/tmp/testfilexxx");
        fs.rmdirSync("/tmp/fifesfesf");
    })
});