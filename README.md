# Node Big Rig

Node Big Rig comes in two flavors:

1. A module for doing trace analysis inline to other tasks.
2. A CLI tool.

![Big Rig CLI](https://cloud.githubusercontent.com/assets/617438/10942590/a23ce7da-8308-11e5-86d0-3f0a2569534b.png)

Both the module and CLI perform the same analysis as [the web app](https://github.com/GoogleChrome/big-rig), just headlessly. This makes it a good fit for use in CI environments, or as part of bigger workflows.

## Installation

### CLI

```bash
npm install -g bigrig
```

### Module

```bash
npm install bigrig
```

## Usage

### CLI

To use the CLI you call `bigrig` and pass it the path to a trace file:

```bash
bigrig -file /path/to/trace.json
```

This will, by default, simply return a JSON string that you can parse or manipulate as you see fit.

If you wish to see a pretty printed version, add the `--pretty-print` flag:

```bash
bigrig -file =/path/to/trace.json --pretty-print
```

You should then see a pretty printed output of the time breakdown for the trace.

### Module

You can also use Big Rig's module as part of a wider workflow.

```node
var bigrig = require('bigrig');
var fs = require('fs');

// Read trace file contents.
fs.readFile('/path/to/trace.json', 'utf8', function(err, data) {
  if (err)
    throw err;

  results = bigrig.analyze(data);

  // Now do something with the results, like
  // post to a dashboard.
});

```

## Getting a trace

You can get a trace from:

* **[WebPagetest](http://webpagetest.org)**. Run your test with Chrome, and check "Capture Dev Tools Timeline" under the Chrome options. Download the timeline file (which is a trace file) and pass it to Big Rig.
* **[Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/timeline-tool?hl=en)**. Take a timeline recording, and then right click on the timeline, save the file, and pass it to Big Rig.
* **[Big Rig's Test Runner](https://github.com/GoogleChrome/big-rig/tree/master/test-runner)**. This uses Chrome Driver under the hood, and will allow you to run an automated test (including for Android) and get back a trace file.

## License

See /LICENSE

## Thanks

The tracing code is a manipulated version of [Chrome's Trace Viewer](https://github.com/catapult-project/catapult/tree/master/tracing). A huge thanks to the Chromium engineers for making it possible to analyze traces.

Please note: this is not an official Google product.
