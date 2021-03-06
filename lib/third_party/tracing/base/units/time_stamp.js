/**
Copyright (c) 2015 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./scalar.js");
require("./time_display_mode.js");

'use strict';

global.tr.exportTo('tr.b.u', function() {
  /**
   * Float wrapper, representing a time stamp, capable of pretty-printing.
   */
  function TimeStamp(timestamp) {
    tr.b.u.Scalar.call(this, timestamp, tr.b.u.Units.timeStampInMs);
  };

  TimeStamp.prototype = {
    __proto__: tr.b.u.Scalar.prototype,

    get timestamp() {
      return this.value;
    }
  };

  TimeStamp.format = function(timestamp) {
    return tr.b.u.Units.timeStampInMs.format(timestamp);
  };

  return {
    TimeStamp: TimeStamp
  };
});
