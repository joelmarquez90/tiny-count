var recursive = require('recursive-readdir');
var tinify = require('tinify');
var path = require('path');
var fs = require('fs');
var filesize = require('filesize');

function run (key, rootPath) {
  tinify.key = key;

  // Do the magic!
  recursive(rootPath, function (err, files) {

    var imageExtensions = ['.png', '.jpg', '.jpeg'];

    // We filter the files by type
    var imageFiles = files.filter(function (file) { return imageExtensions.indexOf(path.extname(file)) > -1; });

    // Get the current files size
    var filesSizeBeforeTinifying = getFilesSize(imageFiles);
    console.log('Size before tinifying: ' + filesize(filesSizeBeforeTinifying));

    // Start tinifying the files
    var imagesProcessed = 0;
    imageFiles.forEach(function (file) {
      tinify.fromFile(file).toFile(file, function(err) {
        if (err) {
          console.log('Error on ' + file + ': ' + err);
        }
        imagesProcessed++;
        if (imagesProcessed === imageFiles.length) {
          // After all, get the size after tinifying
          var filesSizeAfterTinifying = getFilesSize(imageFiles);
          console.log('Size after tinifying: ' + filesize(filesSizeAfterTinifying));

          var difference = filesSizeBeforeTinifying - filesSizeAfterTinifying;
          console.log('Difference: ' + filesize(difference));
        }
      });
    });
  });

  // Returns the total size of an array of files
  var getFilesSize = function(files) {
    return files.map(function (file) { return fs.statSync(file).size / 1000; })
                .reduce(function (size, total) { return size + total; }, 0);
  };
};

module.exports = {
  run: run
};
