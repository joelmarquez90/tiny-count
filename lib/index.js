var recursive = require('recursive-readdir');
var tinify = require('tinify');
var path = require('path');
var Promise = require('bluebird');
var nodegit = require('nodegit');
var fs = require('fs');
var filesize = require('filesize');
var ProgressBar = require('progress');

function run (key, rootPath, force) {
  tinify.key = key;

  if (!fs.existsSync(rootPath)) {
    console.log("Root directory doesn't exists");
    process.exit(1);
  }

  // Do the magic!
  recursive(rootPath, function (err, files) {

    var imageExtensions = ['.png', '.jpg', '.jpeg'];

    // We filter the files by type
    var imageFiles = files.filter(function (file) { return imageExtensions.indexOf(path.extname(file)) > -1; });
    var imageFilesPromise;

    // If force option is passed, we use the original list
    if (force) {
      imageFilesPromise = new Promise(function(resolve, reject) { resolve(imageFiles); });
    } else {
      imageFilesPromise = filterNonStagedImages(imageFiles, rootPath);
    }

    imageFilesPromise
      .then(function(files) {

        // If there are no files to convert, we exit
        if (files.length === 0) {
          console.log('\nNo files to convert');
          process.exit(0);
        }

        // Get the current files size
        var filesSizeBeforeTinifying = getFilesSize(files);

        // Start tinifying the files
        console.log('');
        var bar = new ProgressBar('Replacing... [:bar] :percent :etas', {
          complete: '=', incomplete: ' ', width: 60, total: files.length
        });
        var imagesProcessed = 0;
        files.forEach(function (file) {
          tinify.fromFile(file).toFile(file, function(err) {
            imagesProcessed++;
            bar.tick();
            if (imagesProcessed === files.length) {
              console.log('\nSize\n------------------');
              console.log('' + filesize(filesSizeBeforeTinifying) + '\tBefore\n------------------');

              // After all, get the size after tinifying
              var filesSizeAfterTinifying = getFilesSize(files);
              console.log('' + filesize(filesSizeAfterTinifying) + '\tAfter\n------------------');

              var difference = filesSizeBeforeTinifying - filesSizeAfterTinifying;
              console.log('' + filesize(difference) + '\tDifference\n------------------');
            }
          });
        });
      });
  });

  // Returns the total size of an array of files
  var getFilesSize = function(files) {
    var size =  files.map(function (file) { return fs.statSync(file).size / 1000; })
                     .reduce(function (size, total) { return size + total; }, 0);
    return Math.floor(size);
  };

  // Filters the files that aren't staged with git
  var filterNonStagedImages = function(imageFiles, rootPath) {
    var gitFolder = findGitFolder(rootPath);
    if (!gitFolder) {
      // If there is no .git folder, we return the original list
      return new Promise(function(resolve, reject) { resolve(imageFiles); });
    }

    return nodegit.Repository.open(gitFolder)
      .then(function(repo) {
        return repo.getStatus().then(function(statusFiles) {
          // statusFiles is an array of files that aren't staged
          var projectFolder = gitFolder.substring(0, gitFolder.lastIndexOf(path.sep));

          // Convert them to a full path file
          var statusFilesPaths = statusFiles.map(function(statusFile) {
            return path.join(projectFolder, statusFile.path());
          });

          // And then filter those imageFiles which aren't staged
          return imageFiles.filter(function(imageFile) {
            var index = statusFilesPaths.indexOf(imageFile);
            return index === -1;
          });
        });
      });
  };

  // Iterates recursively backwards through the folders
  var findGitFolder = function(currentPath) {
    var files = fs.readdirSync(currentPath);
    for (var i = 0; i < files.length; i++) {

      // For each file in the directory, we search those which are folders
      var filename = path.join(currentPath, files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {

        // The .git folder path
        if (filename.indexOf('.git') > -1) {
          return filename;
        } else {
          var lastIndexOfSep = currentPath.lastIndexOf(path.sep);
          if (lastIndexOfSep > -1) {
            if (lastIndexOfSep === currentPath.length - 1) {
              // The case where the path has the separator at the end
              currentPath = currentPath.substring(0, currentPath.length - 1);
              lastIndexOfSep = currentPath.lastIndexOf(path.sep);
            }
            // Finds the parent folder and calls it again
            var parentPath = currentPath.substring(0, lastIndexOfSep);
            return findGitFolder(parentPath);
          } else {
            // We didn't find the git folder
            return null;
          }
        }
      }
    };
  };
};

module.exports = {
  run: run
};
