#!/usr/bin/env node

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var yargs = require('yargs')
    .usage('Usage: bigrig <input> [<option>]')
    .option('file', {
      alias: 'f',
      demand: false,
      default: '',
      describe: 'The trace file to be parsed'
    })
    .option('pretty-print', {
      alias: 'pp',
      demand: false,
      default: false,
      describe: 'Pretty print the results'
    })
    .option('strict', {
      alias: 's',
      demand: false,
      default: false,
      describe: 'Throw if extensions are found'
    });

var argv = yargs.argv;

var clc = require('cli-color');
var fs = require('fs');
var processor = require('./lib/processor');
var path = argv.file;
var traceContents = '';

// If there's no --file arg and there's an unnamed arg passed, try
// setting the path to that.
if (path === '' && typeof argv._ !== 'undefined' && argv._.length > 0) {
  path = argv._[0];
}

// Check the file exists.
try {
  fs.statSync(path);
  traceContents = fs.readFileSync(path, 'utf8');
  processContents(traceContents);

} catch (e) {

  if (typeof e === 'string') {
    console.warn(clc.red('Unable to process trace: ') + clc.yellow(e));
    process.exit(1);
  }

  var checkedFirstChunk = false;

  // Assume reading from stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', function () {
    var chunk = process.stdin.read();

    // If the very first chunk is null, then
    // we weren't given any data, so exit.
    if (!checkedFirstChunk) {

      checkedFirstChunk = true;
      if (chunk === null) {
        console.log(yargs.help());
        process.exit(1);
      }
    }

    if (chunk !== null) {
      traceContents += chunk;
    }

  });

  process.stdin.on('end', function () {
    processContents(traceContents, {
      strict: argv.strict
    });
  });
}

function processContents (contents) {

  // Read the file, analyze, and print.
  var results = processor.analyzeTrace(contents, {
    strict: argv.strict
  });

  if (argv['pretty-print']) {
    prettyPrint(results);
  } else {
    console.log(JSON.stringify(results));
  }

}

function prettyPrint (result, indent, frameCount) {

  indent = indent || 0;
  frameCount = frameCount || 1;

  var paddingDistance = 40;
  var labelPadding = padOut('', indent);
  var keys = Object.keys(result);
  var key;
  var colorFn = clc.cyan;
  var label;
  var value;
  var suffix;
  var perFrameValue;

  function padOut (str, len) {

    while (str.length < len) {
      str += ' ';
    }

    return str;
  }

  // For empty objects write out something, otherwise
  // it looks like a big ol' error.
  if (keys.length === 0) {
    console.log(labelPadding + '{}');
  }

  for (var k = 0; k < keys.length; k++) {

    perFrameValue = undefined;
    suffix = '';
    key = keys[k];
    value = result[keys[k]];

    // Skip the title and type values, because
    // they will be incorporated by the top level.
    if (key === 'title' || key === 'type') {
      continue;
    }

    // If we have a numeric key, this is a top level item.
    if (!isNaN(parseInt(key))) {

      // Color it magenta and incorporate the keys
      // we skipped just a moment ago.
      colorFn = clc.magentaBright;
      key = value.title + ' [' + value.type + ']';

      // Get values per frame if this is an animation.
      if (value.type === processor.ANIMATION &&
          typeof value.frameCount !== 'undefined') {
        frameCount = value.frameCount;
      }
    }

    label = colorFn(padOut(key + ':', paddingDistance - indent));

    // If the number is numeric, but not the fps
    // tidy it up and add a suffix.
    if (typeof value === 'number') {

      if (key !== 'fps' &&
          key !== 'frameCount' &&
          key !== 'forcedRecalcs' &&
          key !== 'forcedLayouts') {

        perFrameValue = (value / frameCount).toFixed(2) + 'ms';

        value = value.toFixed(2);
        suffix = 'ms';
      }

      value = value + suffix;

      if (key !== 'start' &&
          key !== 'end' &&
          key !== 'duration' &&
          key !== 'domContentLoaded' &&
          key !== 'loadTime' &&
          key !== 'firstPaint' &&
          perFrameValue &&
          frameCount !== 1) {
        value = padOut(value, 12) + ' (' + perFrameValue + ' per frame)';
      }
    }

    if (typeof value === 'object') {
      console.log(labelPadding + label);
      prettyPrint(value, indent + 2, frameCount);
    } else {
      var msg = labelPadding + label + value;
      console.log(msg);
    }
  }
}
