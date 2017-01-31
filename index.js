var recursive = require('recursive-readdir');
var tinify = require('tinify');

tinify.key = '';

recursive('/Users/jmarquez/workspace/mp/cellphonerecharge/Pod/Resources/MPCellphoneRecharge.xcassets', function (err, files) {
  files.forEach(function(file) {
    tinify.fromFile(file).toFile(file);
  });
});
