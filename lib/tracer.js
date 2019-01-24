'use strict'

const opentracing = require('opentracing')
const Noop = require('opentracing/lib/noop')
const Span = require('./span')
const SpanContext = require('./span_context')

class Tracer extends opentracing.Tracer {
  constructor (agent) {
    super()
    if (!agent) throw new Error('Missing required argument: agent')
    this._agent = agent
  }

  _startSpan (name, opts) {
    let context = null

    if (Array.isArray(opts.references)) {
      if (opts.references.length > 1) {
        this._agent.logger.debug('Elastic APM OpenTracing: Unsupported number of references to _startSpan:', opts.references.length)
      }

      for (const i in opts.references) {
        const ref = opts.references[i]
        const refType = ref.type()
        // TODO: Log warning if type is REFERENCE_FOLLOWS_FROM?
        if (refType === opentracing.REFERENCE_CHILD_OF) {
          context = ref.referencedContext()._context
          break
        }
      }
    }

    let tags, type

    if (opts.tags) {
      // We might delete tags leter on, so clone in order not to mutate
      tags = Object.assign({}, opts.tags)
      type = tags.type
      if (type) delete tags.type
    }

    let span = this._agent.currentTransaction === null || this._agent.currentTransaction.ended
      ? this._agent.startTransaction(name, type, { childOf: context, startTime: opts.startTime })
      : this._agent.startSpan(name, type, { childOf: context, startTime: opts.startTime })

    span = span ? new Span(this, span) : Noop.span // TODO: What happens when a user tries to use the context of a Noop span? Maybe the Noop span context should be the context of the transaction?

    if (tags && Object.keys(tags).length !== 0) span._addTags(tags)

    return span
  }

  _inject (spanContext, format, carrier) {
    switch (format) {
      case opentracing.FORMAT_TEXT_MAP:
      case opentracing.FORMAT_HTTP_HEADERS:
        carrier['elastic-apm-traceparent'] = spanContext.toString()
        break
    }
  }

  _extract (format, carrier) {
    if (typeof carrier !== 'object') return null
    let ctx

    switch (format) {
      case opentracing.FORMAT_TEXT_MAP:
      case opentracing.FORMAT_HTTP_HEADERS:
        ctx = carrier['elastic-apm-traceparent']
        break
    }

    return ctx ? new SpanContext(ctx) : null
  }
}

module.exports = Tracer
