/*
 * Class to represent a single PhantomJS page.
 */

var config = require('./config');


function Page(id, requestQueue, pollFunction) {
  /* Page class constructor. */
  this.id = id;
  this.requestQueue = requestQueue;
  this.pollFunction = pollFunction;
}

Page.prototype.setFn = function(name, fn, cb) {
  var args = [this.id, 'setFunction', name, fn.toString()];
  this.requestQueue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Page.prototype.get = function(name, cb) {
  var args = [this.id, 'getProperty', name];
  this.requestQueue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Page.prototype.set = function(name, val, cb) {
  var args = [this.id, 'setProperty', name, val];
  this.requestQueue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Page.prototype.evaluate = function(fn, cb) {
  var args = [id, 'evaluate', fn.toString()];
  if (arguments.length > 2) {
    args.concat(Array.prototype.slice.call(arguments, 2));
  }
  this.requestQueue.push([args, makeSafeCallback(cb, this.pollFunction)]);
};

Page.prototype.waitForSelector = function(selector, cb, timeout) {
  /*
   * Wait for an element matching the selector to appear. Wait a maximum
   * (approximately) of timeout milliseconds.
   */

  // Default timeout of 10 seconds
  timeout = timeout || 10000;

  // We need to not wait more than this long
  var startTime = Date.now();

  // Time between selector checks
  var timeoutInterval = 150;

  function testForSelector() {
    // How long it has been since we started this function
    var elapsedTime = Date.now() - startTime;

    // If true, we have timed out
    if (elapsedTime > timeout) {
      return cb('Timeout waiting for selector: ' + selector);
    }

    // TODO: wtf... why this... ?
    // Evaluate the selector
    this.evaluate(function(selector) {
      return document.querySelectorAll(selector).length;
    }, function(result) {
      // We found the selector
      if (result > 0) {
        cb();
      }
      else {
        // Retry the test
        setTimeout(testForSelector, timeoutInterval);
      }
    }, selector);
  }

  // Begin testing for the selector
  setTimeout(testForSelector, timeoutInterval);
};

// Build prototype with a bunch of identical functions
config.methods.forEach(function(method) {
  Page.prototype[method] = function() {
    var args = Array.prototype.slice.call(arguments);
    var callback;

    // Check if we were given a callback as the last argument
    if (args.length && typeof args[args.length - 1] === 'function') {
      cb = args.pop();
    }
    var params = [this.id, method].concat(args);
    this.requestQueue.push([params, makeSafeCallback(cb, this.pollFunction)]);
  };
});
