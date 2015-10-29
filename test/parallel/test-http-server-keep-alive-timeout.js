'use strict';

const common = require('../common');
const assert = require('assert');
const http = require('http');
const net = require('net');

const tests = [];

function test(fn) {
  if (!tests.length) {
    process.nextTick(run);
  }
  tests.push(fn);
}

function run() {
  const fn = tests.shift();
  if (fn) fn(run);
}

test(function serverEndKeepAliveTimeoutWithPipeline(cb) {
  let socket;
  let destroyedSockets = 0;
  let timeoutCount = 0;
  let requestCount = 0;
  process.on('exit', function() {
    assert.equal(timeoutCount, 1);
    assert.equal(requestCount, 3);
    assert.equal(destroyedSockets, 1);
  });
  const server = http.createServer(function(req, res) {
    socket = req.socket;
    requestCount++;
    res.end();
  });
  server.setTimeout(100, function(socket) {
    timeoutCount++;
    socket.destroy();
  });
  server.keepAliveTimeout = 50;
  server.listen(common.PORT);
  const c = net.connect({ port: common.PORT, allowHalfOpen: true }, function() {
    c.write('GET /1 HTTP/1.1\r\nHost: localhost\r\n\r\n');
    c.write('GET /2 HTTP/1.1\r\nHost: localhost\r\n\r\n');
    c.write('GET /3 HTTP/1.1\r\nHost: localhost\r\n\r\n');
  });
  setTimeout(function() {
    server.close();
    if (socket.destroyed) destroyedSockets++;
    cb();
  }, 1000);
});

test(function serverNoEndKeepAliveTimeoutWithPipeline(cb) {
  let socket;
  let destroyedSockets = 0;
  let timeoutCount = 0;
  let requestCount = 0;
  process.on('exit', function() {
    assert.equal(timeoutCount, 1);
    assert.equal(requestCount, 3);
    assert.equal(destroyedSockets, 1);
  });
  const server = http.createServer(function(req, res) {
    socket = req.socket;
    requestCount++;
  });
  server.setTimeout(100, function(socket) {
    timeoutCount++;
    socket.destroy();
  });
  server.keepAliveTimeout = 50;
  server.listen(common.PORT);
  const c = net.connect({ port: common.PORT, allowHalfOpen: true }, function() {
    c.write('GET /1 HTTP/1.1\r\nHost: localhost\r\n\r\n');
    c.write('GET /2 HTTP/1.1\r\nHost: localhost\r\n\r\n');
    c.write('GET /3 HTTP/1.1\r\nHost: localhost\r\n\r\n');
  });
  setTimeout(function() {
    server.close();
    if (socket.destroyed) destroyedSockets++;
    cb();
  }, 1000);
});
