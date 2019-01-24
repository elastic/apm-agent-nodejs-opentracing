'use strict'

const opentracing = require('opentracing')

class SpanContext extends opentracing.SpanContext {
  // `context` can either be a string or a TraceContext object from the
  // elastic-apm-module
  constructor (context) {
    super()
    this._context = context
  }

  toString () {
    return this._context.toString()
  }
}

module.exports = SpanContext
