'use strict';
// Drop-in replacement for buffer-equal-constant-time@1.0.1.
// The original touches require('buffer').SlowBuffer.prototype at load time;
// SlowBuffer was removed in Node 25, which crashes the whole process on import.
var Buffer = require('buffer').Buffer;
var SlowBuffer = require('buffer').SlowBuffer; // undefined on Node >= 25
var timingSafeEqual = require('crypto').timingSafeEqual;

module.exports = bufferEq;

function bufferEq(a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

var origBufEqual = Buffer.prototype.equal;
var origSlowBufEqual = SlowBuffer ? SlowBuffer.prototype.equal : undefined;

bufferEq.install = function () {
  var eq = function equal(that) {
    return bufferEq(this, that);
  };
  Buffer.prototype.equal = eq;
  if (SlowBuffer) {
    SlowBuffer.prototype.equal = eq;
  }
};

bufferEq.restore = function () {
  Buffer.prototype.equal = origBufEqual;
  if (SlowBuffer) {
    SlowBuffer.prototype.equal = origSlowBufEqual;
  }
};
