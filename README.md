# Elastic APM Node.js OpenTracing Bridge

An [OpenTracing](https://opentracing.io/) bridge for the [Elastic APM Node.js Agent](https://github.com/elastic/apm-agent-nodejs).

[![npm](https://img.shields.io/npm/v/elastic-apm-node-opentracing.svg)](https://www.npmjs.com/package/elastic-apm-node-opentracing)
[![Test status](https://github.com/elastic/apm-agent-nodejs-opentracing/workflows/Test/badge.svg)](https://github.com/elastic/apm-agent-nodejs-opentracingactions)
[![Build Status](https://apm-ci.elastic.co/job/apm-agent-nodejs/job/apm-agent-nodejs-opentracing-mbp/job/main/badge/icon)](https://apm-ci.elastic.co/job/apm-agent-nodejs/job/apm-agent-nodejs-opentracing-mbp/job/main/)

## Prerequisites

This module have [`elastic-apm-node`](https://www.npmjs.com/package/elastic-apm-node) as a peer dependency.

Version 2.10.0 or higher of the Elastic APM Agent is required in order to use this module.

## Installation

```
npm install elastic-apm-node-opentracing --save
```

## Usage

```js
// Start the Elastic APM agent at the VERY top of the first file loaded
// in your app
const agent = require('elastic-apm-node').start()
const Tracer = require('elastic-apm-node-opentracing')

// Pass the Elastic APM agent as an argument to the OpenTracing tracer
const tracer = new Tracer(agent)

const span = tracer.startSpan('my-first-span')
// ... do some work ...
span.finish()
```

## API

### `tracer = new Tracer(agent)`

This module exposes a `Tracer` class which is OpenTracing compatible.

When instantiating the `Tracer` object,
an instance of the Elastic APM Node.js Agent must be provided as its only argument.

For details about the `tracer` API,
see the [`opentracing-javascript` API docs](https://opentracing-javascript.surge.sh/).

## License

[Apache-2.0](LICENSE)
