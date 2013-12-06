/* File for the queue worker. */
var http = require('http');

var config = require('../config');
var commonUtil = require('../util');

function Worker(phantom) {
  /* Worker for the queue. */
  this.phantom = phantom;
}

Worker.prototype.work = function(params, next) {
  /* Do work. */

  var self = this;

  // TODO: Make sure to use an object instead of this garbage
  var callback = params[1];
  params = params[0];

  // The page to work on
  var page = params[0];

  // The method to use
  var method = params[1];

  // Other arguments
  var args = params.slice(2);

  // Properly stringify all arguments to be eval'd on the other side
  args.forEach(function(arg, i) {
    if (typeof arg === 'string') {
      args[i] = '"' + arg + '"';
    }
    else if (typeof arg === 'object') {
      args[i] = JSON.stringify(arg);
    }
    else {
      args[i] = arg.toString();
    }
  });

  // JSON to send to bridge
  var json = JSON.stringify({
    page: page,
    method: method,
    args: args
  });

  // Options for http polling
  var httpOptions = {
    hostname: '127.0.0.1',
    port: config.port,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json)
    }
  };

  // Send request to bridge
  var req = http.request(httpOptions, commonUtil.useData(function(err, data) {
    var cbErr = null;
    var cbData = data;

    try {
      data = JSON.parse(data);
    }
    catch (e) {
      callback(e);
      return;
    }

    if (!data) {
      // Don't send data to callback on error
      cbErr = 'No response data: ' + method + '()';
      cbData = null;
    }
    else if (err) {
      // Don't send data to callback on error
      cbErr = data;
      cbData = null;
    }
    else if (method === 'createPage') {
      // Creating the page is special
      var page = self.phantom._makeNewPage(data.pageId);
      cbData = page;
    }

    next();
    callback(cbErr, cbData);
  }));

  console.log('JSON writing:', json);
  // Send JSON
  req.write(json);

  // Some error while sending to bridge
  req.on('error', function(err) {
    console.warn('Error evaluating %s() call: %s', method, err);
    next();
  });

  // End request
  req.end();
}

module.exports = Worker;