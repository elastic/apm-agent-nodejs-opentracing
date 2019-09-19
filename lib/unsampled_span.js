'use strict'

const opentracing = require('opentracing')
const SpanContext = require('./span_context')

class UnsampledSpan extends opentracing.Span {
  constructor (elasticTransaction) {
    super()
    this.__context = null
    this._elasticTransaction = elasticTransaction
    this._isTransaction = false
  }

  _context () {
    return this.__context
      ? this.__context
      : (this.__context = new SpanContext(this._elasticTransaction))
  }
}

module.exports = UnsampledSpan
