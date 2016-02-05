/**
 * Inspired from https://gist.github.com/sixolet/6091321.
 */
Execute = {};

var Fiber = Npm.require('fibers'),
    Future = Npm.require('fibers/future'),
    Process = Npm.require('child_process');

Execute.spawn = function (command, args, options) {
  var out = "";
  var err = "";
  var ret = new Future;
  options = options || {};
  var proc = Process.spawn(command, args, options);
  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');
  if (options.captureOut) {
    proc.stdout.on('data', Meteor.bindEnvironment(function (data) {
      if (options.log)
        console.log(data);
      out += data;
      if (typeof options.captureOut === 'function') {
        options.captureOut(data);
      }
    }, function (err) {
      Log.warn(err);
    }));
  }
  if (options.captureErr) {
    proc.stderr.on('data', Meteor.bindEnvironment(function (data) {
      if (options.log)
        console.log(data);
      err += data;
      if (typeof options.captureErr === 'function') {
        options.captureErr(data);
      }
    }, function (err) {
      Log.warn(err);
    }));
  }
  proc.on('exit', function (code) {
    ret.return({
      stdout: out,
      stderr: err,
      code: code
    });
  });
  ret.proc = proc;
  return ret;
};