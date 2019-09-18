'use strict'

const opentracing = require('opentracing')

class SpanContext extends opentracing.SpanContext {
  // `context` can either be a string or a Span or Transaction object from the
  // elastic-apm-module
  constructor (context) {
    super()
    this._context = context
  }

  toString () {
    return typeof this._context === 'string'
      ? this._context
      : this._context.traceparent // TODO: This is a breaking change as not all versions of the agent has this property
  }
}

module.exports = SpanContext
