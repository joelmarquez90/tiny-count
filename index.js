var recursive = require('recursive-readdir');
var tinify = require('tinify');
var path = require('path');
var fs = require('fs');
var program = require('commander');

// Arguments
program
  .version('0.0.1')
  .option('-k, --key', 'Tinify API Key')
  .option('-p, --path', 'Images root directory')
  .parse(process.argv);

// Checking for key
if (program.key) {
  tinify.key = program.args[0];
} else {
  console.log('Tinify API Key is required');
  process.exit(1);
}

// Checking for path
var rootPath = '';
if (program.path) {
  rootPath = program.args[1];
} else {
  console.log('Images root directory required');
  process.exit(1);
}

var imageExtensions = ['.png', '.jpg', '.jpeg'];

// Do the magic!
recursive(rootPath, function (err, files) {
  var imageFiles = files.filter(function (file) {
    var fileExtension = path.extname(file);
    return imageExtensions.indexOf(fileExtension) > -1;
  });

  var filesSize = imageFiles.map(function (file) { return fs.statSync(file).size / 1000; })
                            .reduce(function (size, total) { return size + total; }, 0);

  console.log('Files size before Tinify proccessing: ' + filesSize + ' KB');

  imageFiles.forEach(function (file) {
    tinify.fromFile(file).toFile(file);
  });
});
