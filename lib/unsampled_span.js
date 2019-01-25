'use strict'

const opentracing = require('opentracing')
const SpanContext = require('./span_context')

class UnsampledSpan extends opentracing.Span {
  constructor (elasticTraceContext) {
    super()
    this.__context = null
    this._elasticTraceContext = elasticTraceContext
    this._isTransaction = false
  }

  _context () {
    return this.__context
      ? this.__context
      : (this.__context = new SpanContext(this._elasticTraceContext))
  }
}

module.exports = UnsampledSpan
