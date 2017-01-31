var recursive = require('recursive-readdir');
var tinify = require('tinify');
var path = require('path');
var program = require('commander');

program
  .version('0.0.1')
  .option('-k, --key', 'Tinify API Key')
  .option('-p, --path', 'Images root directory')
  .parse(process.argv);

if (program.key) {
  tinify.key = program.args[0];
} else {
  console.log('Tinify API Key is required');
  process.exit(1);
}

var rootPath = '';
if (program.path) {
  rootPath = program.args[1];
} else {
  console.log('Images root directory required');
  process.exit(1);
}

var imageExtensions = ['.png', '.jpg', '.jpeg'];

recursive(rootPath, function (err, files) {
  files.forEach(function(file) {
    var fileExtension = path.extname(file);
    if (imageExtensions.indexOf(fileExtension) > -1) {
      tinify.fromFile(file).toFile(file);
    }
  });
});
