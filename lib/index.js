var recursive = require('recursive-readdir');
var tinify = require('tinify');
var path = require('path');
var Promise = require('bluebird');
var nodegit = require('nodegit');
var fs = require('fs');
var filesize = require('filesize');
var ProgressBar = require('progress');
var Table = require('easy-table')
var logger = require('loglevel');

function run (key, rootPath, force, verbose) {
  tinify.key = key;

  logger.setDefaultLevel(logger.levels.INFO);

  if (verbose) {
    logger.setLevel(logger.levels.DEBUG);
  }

  if (!fs.existsSync(rootPath)) {
    logger.info("Root directory doesn't exists");
    process.exit(1);
  }

  // Do the magic!
  recursive(rootPath, function (err, files) {

    // If there are no files to convert, we exit
    if (!files || files.length === 0) {
      logger.info('\nNo files to convert');
      process.exit(0);
    }

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
          logger.info('\nNo files to convert');
          process.exit(0);
        }

        // Get the current files size
        var filesSizeBeforeTinifying = getFilesSize(files);

        // Start tinifying the files
        logger.info('');
        var bar = new ProgressBar('Replacing... [:bar] :percent :etas', {
          complete: '=', incomplete: ' ', width: 60, total: files.length
        });
        var imagesProcessed = 0;
        var filesWithError = [];
        files.forEach(function (file) {
          tinify.fromFile(file).toFile(file, function(err) {
            if (err) {
              if (err instanceof tinify.AccountError) {
                logger.error('You have reached the Tinify API limit, please request a new key');
                logResults(filesSizeBeforeTinifying, files, filesWithError);
                process.exit(1);
              } else {
                logger.debug('Error on ' + file + ': ' + err.message);
                filesWithError.push(file);
              }
            }
            imagesProcessed++;
            bar.tick();
            if (imagesProcessed === files.length) {
              logResults(filesSizeBeforeTinifying, files, filesWithError);
            }
          });
        });
      });
  });

  // Shows the results of the processing
  var logResults = function(filesSizeBeforeTinifying, files, filesWithError) {

    var table = new Table();

    var filesSizeAfterTinifying = getFilesSize(files);
    var difference = filesSizeBeforeTinifying - filesSizeAfterTinifying;

    if (difference === 0) {
      return;
    }

    table.cell('Size', filesize(filesSizeBeforeTinifying));
    table.cell('Description', 'Before');
    table.newRow();

    table.cell('Size', filesize(filesSizeAfterTinifying));
    table.cell('Description', 'After');
    table.newRow();

    table.cell('Size', filesize(difference));
    table.cell('Description', 'Difference');
    table.newRow();

    logger.info('');
    logger.info(table.toString());

    if (filesWithError.length > 0) {
      logger.info("\n" + filesWithError.length + " files couldn't be replaced");
      logger.debug('\n' + filesWithError.join('\n'));
    }
  };

  // Returns the total size of an array of files
  var getFilesSize = function(files) {
    var size =  files.map(function (file) { return fs.statSync(file).size; })
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
            if (index > -1) {
              logger.debug("Filtering " + imageFile + " because isn't staged");
            }
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
