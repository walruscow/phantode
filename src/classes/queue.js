function Queue(worker) {
  /*
   * A queue to process tasks in asynchronous sequence.  Worker should
   * take in (task, callback), where callback is node-style.
   */
  this._queue = [];
  this.worker = worker;
  this._processing = false;
}

Queue.prototype.push = function(task) {
  /* Push a task to the queue. */

  console.log('Pushing ', task);
  // Push a function to the queue
  this._queue.push(task);

  // Try to process the queue immediately
  this.process();
};

Queue.prototype.process = function() {
  /* Process the queue. */
  var self = this;

  // Make sure not to process multiple times
  if (this._processing || !this._queue.length) return;

  this._processing = true;

  // Number of workers completed and finished
  var done = 0;
  var todo = this._queue.length;

  function cb() {
    done += 1;
    if (done === todo) self._processing = false;
    console.log('Process callback',done, todo);
  }

  // Process each element
  for (var i = 0; i < todo; ++i) {
    this.worker.work(this._queue.shift(), cb);
  }
};

module.exports = Queue;
