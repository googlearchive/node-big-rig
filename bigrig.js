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

var argv = require('yargs')
    .usage('Usage: bigrig -file <input> [<option>]')
    .demand('file')
    .alias('file', 'f')
    .describe('file', 'The trace file to be parsed')
    .option('pretty-print', {
      alias: 'pp',
      demand: false,
      default: false,
      describe: 'Pretty print the results'
    })
    .argv;

var clc = require('cli-color');
var fs = require('fs');
var processor = require('./lib/processor');
var path = '';


// Find which file needs parsing.
if (typeof argv.file !== 'string') {
  console.error(
      'Trace file path needs to be passed, --trace=/path/to/trace.json');
  process.exit(1);
}

path = argv.file;

// Check the file exists.
try {
  fs.statSync(path);
} catch (e) {
  console.error('Trace file could not be found.');
  process.exit(1);
}

function prettyPrint (result, indent, frames) {

  indent = indent || 0;
  frames = frames || 1;

  var paddingDistance = 40;
  var labelPadding = padOut('', indent);
  var keys = Object.keys(result);
  var key;
  var colorFn = clc.cyan;
  var label;
  var value;
  var suffix;
  var perFrameValue;

  function padOut(str, len) {

    while(str.length < len)
      str += ' ';

    return str;
  }

  // For empty objects write out something, otherwise
  // it looks like a big ol' error.
  if (keys.length === 0)
    console.log(labelPadding + '{}');

  for (var k = 0; k < keys.length; k++) {

    perFrameValue = undefined;
    suffix = '';
    key = keys[k];
    value = result[keys[k]];

    // Skip the title and type values, because
    // they will be incorporated by the top level.
    if (key === 'title' || key === 'type')
      continue;

    // If we have a numeric key, this is a top level item.
    if (!isNaN(parseInt(key))) {

      // Color it magenta and incorporate the keys
      // we skipped just a moment ago.
      colorFn = clc.magentaBright;
      key = value.title + ' [' + value.type + ']';

      // Get values per frame if this is an animation.
      if (value.type === processor.ANIMATION &&
          typeof value.frames !== 'undefined') {
        frames = value.frames;
      }
    }

    label = colorFn(padOut(key + ':', paddingDistance - indent));

    // If the number is numeric, but not the fps
    // tidy it up and add a suffix.
    if (typeof value === 'number') {

      if (key !== 'fps') {

        perFrameValue = (value / frames).toFixed(2) + 'ms';

        value = value.toFixed(2);
        suffix = 'ms';
      }

      value = value + suffix;

      if (perFrameValue && frames !== 1) {
        value = padOut(value, 12) + ' (' + perFrameValue + ' per frame)';
      }
    }

    if (typeof value === 'object') {
      console.log(labelPadding + label);
      prettyPrint(value, indent + 2, frames);
    } else {
      var msg = labelPadding + label + value;
      console.log(msg);
    }
  }
}

// Read the file, analyze, and print.
var contents = fs.readFileSync(path, 'utf8');
var results = processor.analyzeTrace(contents);

if (argv['pretty-print'])
  prettyPrint(results);
else
  console.log(JSON.stringify(results));
