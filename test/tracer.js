'use strict'

const opentracing = require('opentracing')
const test = require('tape')

const { setup, getAgent } = require('./utils')
const Tracer = require('..')
const SpanContext = require('../lib/span_context')
const UnsampledSpan = require('../lib/unsampled_span')

test('should throw if not given an agent', setup(function (t) {
  t.throws(function () {
    new Tracer() // eslint-disable-line no-new
  })
  t.end()
}))

test('should use Agent instance given as argument', setup(function (t) {
  const agent = getAgent()
  const tracer = new Tracer(agent)

  t.equal(tracer._agent, agent)
  t.end()
}))

test('#startSpan()', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan()

  t.ok(span1, 'should return span')
  t.ok(span1._span, 'should hold reference to span/transaction')
  t.equal(span1._span.name, 'unnamed', 'should fall back to default name')
  t.equal(span1._span.type, 'custom', 'should fall back to default type')
  t.equal(span1._span.sampled, true)

  const span2 = tracer.startSpan()

  t.equal(span1._isTransaction, true, 'first span should be a transaction')
  t.equal(span2._isTransaction, false, 'second span should not be a transaction')

  t.end()
}))

test('#startSpan(name)', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo')

  t.equal(span._span.name, 'foo', 'should use given name')
  t.equal(span._span.type, 'custom', 'should fall back to default type')
  t.end()
}))

test('#startSpan(name, {tags: {}})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo', { tags: {} })

  t.equal(span._span.name, 'foo', 'should use given name')
  t.equal(span._span.type, 'custom', 'should fall back to default type')
  t.end()
}))

test('#startSpan(name, {tags: {type}})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo', { tags: { type: 'bar' } })

  t.equal(span._span.name, 'foo', 'should use given name')
  t.equal(span._span.type, 'bar', 'should use given type')
  t.end()
}))

test('#startSpan(name, {tags: {...}})', setup(function (t) {
  const opts = { tags: {
    type: 'bar',
    a: '1',
    'a.b': '2',
    'a"b': '3',
    'a*b': '4'
  } }

  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo', opts)

  t.equal(span._span.name, 'foo', 'should use given name')
  t.equal(span._span.type, 'bar', 'should use given type')

  t.deepEqual(span._span._tags, {
    a: '1',
    a_b: '4'
  }, 'should set expected tags')

  t.deepEqual(opts, { tags: {
    type: 'bar',
    a: '1',
    'a.b': '2',
    'a"b': '3',
    'a*b': '4'
  } }, 'should not mutate input')

  t.end()
}))

test('#startSpan(name, {startTime})', setup(function (t) {
  const startTime = Date.now() - 1000

  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo', { startTime })

  t.equal(span._span.timestamp, startTime * 1000)
  t.end()
}))

test('#startSpan() - implicit children', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan('foo')
  const span2 = tracer.startSpan('bar') // implicit child of span1, because span1 is a transaction
  const span3 = tracer.startSpan('baz') // implicit child of span1, because span1 is a transaction

  t.equal(span1._isTransaction, true)
  t.equal(span2._isTransaction, false)
  t.equal(span3._isTransaction, false)

  const span1Context = span1.context()._context
  const span2Context = span2.context()._context
  const span3Context = span3.context()._context

  t.equal(span1Context.version, '00')
  t.ok(typeof span1Context.traceId, 'string')
  t.ok(typeof span1Context.id, 'string')
  t.equal(span1Context.flags, '01')

  // span1 should be the root
  t.equal(span1Context.parentId, undefined)

  // span2 should be a child of span1
  t.equal(span2Context.version, span1Context.version)
  t.equal(span2Context.traceId, span1Context.traceId)
  t.notEqual(span2Context.id, span1Context.id)
  t.equal(span2Context.parentId, span1Context.id)
  t.equal(span2Context.flags, span1Context.flags)

  // span3 should be a child of span1
  t.equal(span3Context.version, span1Context.version)
  t.equal(span3Context.traceId, span1Context.traceId)
  t.notEqual(span3Context.id, span1Context.id)
  t.equal(span3Context.parentId, span1Context.id)
  t.equal(span3Context.flags, span1Context.flags)

  t.end()
}))

test('#startSpan(name, {childOf})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan('foo')
  const span2 = tracer.startSpan('bar') // implicit child of span1, because span1 is a transaction
  const span3 = tracer.startSpan('baz', { childOf: span2.context() })

  t.equal(span1._isTransaction, true)
  t.equal(span2._isTransaction, false)
  t.equal(span3._isTransaction, false)

  const span1Context = span1.context()._context
  const span2Context = span2.context()._context
  const span3Context = span3.context()._context

  t.equal(span1Context.version, '00')
  t.ok(typeof span1Context.traceId, 'string')
  t.ok(typeof span1Context.id, 'string')
  t.equal(span1Context.flags, '01')

  // span1 should be the root
  t.equal(span1Context.parentId, undefined)

  // span2 should be a child of span1
  t.equal(span2Context.version, span1Context.version)
  t.equal(span2Context.traceId, span1Context.traceId)
  t.notEqual(span2Context.id, span1Context.id)
  t.equal(span2Context.parentId, span1Context.id)
  t.equal(span2Context.flags, span1Context.flags)

  // span3 should be a child of span2
  t.equal(span3Context.version, span2Context.version)
  t.equal(span3Context.traceId, span2Context.traceId)
  t.notEqual(span3Context.id, span2Context.id)
  t.equal(span3Context.parentId, span2Context.id)
  t.equal(span3Context.flags, span2Context.flags)

  t.end()
}))

test('#startSpan(name, {references: [childOf]})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan('foo')
  const span2 = tracer.startSpan('bar') // implicit child of span1, because span1 is a transaction
  const references = [
    new opentracing.Reference(opentracing.REFERENCE_CHILD_OF, span2.context())
  ]
  const span3 = tracer.startSpan('baz', { references })

  t.equal(span1._isTransaction, true)
  t.equal(span2._isTransaction, false)
  t.equal(span3._isTransaction, false)

  const span1Context = span1.context()._context
  const span2Context = span2.context()._context
  const span3Context = span3.context()._context

  t.equal(span1Context.version, '00')
  t.ok(typeof span1Context.traceId, 'string')
  t.ok(typeof span1Context.id, 'string')
  t.equal(span1Context.flags, '01')

  // span1 should be the root
  t.equal(span1Context.parentId, undefined)

  // span2 should be a child of span1
  t.equal(span2Context.version, span1Context.version)
  t.equal(span2Context.traceId, span1Context.traceId)
  t.notEqual(span2Context.id, span1Context.id)
  t.equal(span2Context.parentId, span1Context.id)
  t.equal(span2Context.flags, span1Context.flags)

  // span3 should be a child of span2
  t.equal(span3Context.version, span2Context.version)
  t.equal(span3Context.traceId, span2Context.traceId)
  t.notEqual(span3Context.id, span2Context.id)
  t.equal(span3Context.parentId, span2Context.id)
  t.equal(span3Context.flags, span2Context.flags)

  t.end()
}))

// This currently doesn't behave in a logical way as when the followsFrom
// reference is being ignored, the agent will simply automatically associate
// span2 with span1, because span1 is a transaction
test.skip('#startSpan(name, {references: [followsFrom]})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan('foo')
  const references = [
    new opentracing.Reference(opentracing.REFERENCE_FOLLOWS_FROM, span1.context())
  ]
  const span2 = tracer.startSpan('bar', { references })

  const span1Context = span1.context()._context
  const span2Context = span2.context()._context

  t.notEqual(span1Context.traceId, span1Context.traceId)
  t.notEqual(span1Context.id, span1Context.id)
  t.equal(span2Context.parentId, undefined)
  t.equal(span1Context.parentId, undefined)
  t.end()
}))

test('#startSpan(name, {references: [followsFrom, childOf, childOf]})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span1 = tracer.startSpan('foo')
  const span2 = tracer.startSpan('bar') // implicit child of span1, because span1 is a transaction
  const references = [
    new opentracing.Reference(opentracing.REFERENCE_FOLLOWS_FROM, span1.context()),
    new opentracing.Reference(opentracing.REFERENCE_CHILD_OF, span2.context()),
    new opentracing.Reference(opentracing.REFERENCE_CHILD_OF, span1.context())
  ]
  const span3 = tracer.startSpan('baz', { references })

  t.equal(span1._isTransaction, true)
  t.equal(span2._isTransaction, false)
  t.equal(span3._isTransaction, false)

  const span1Context = span1.context()._context
  const span2Context = span2.context()._context
  const span3Context = span3.context()._context

  t.equal(span1Context.version, '00')
  t.ok(typeof span1Context.traceId, 'string')
  t.ok(typeof span1Context.id, 'string')
  t.equal(span1Context.flags, '01')

  // span1 should be the root
  t.equal(span1Context.parentId, undefined)

  // span2 should be a child of span1
  t.equal(span2Context.version, span1Context.version)
  t.equal(span2Context.traceId, span1Context.traceId)
  t.notEqual(span2Context.id, span1Context.id)
  t.equal(span2Context.parentId, span1Context.id)
  t.equal(span2Context.flags, span1Context.flags)

  // span3 should be a child of span2
  t.equal(span3Context.version, span2Context.version)
  t.equal(span3Context.traceId, span2Context.traceId)
  t.notEqual(span3Context.id, span2Context.id)
  t.equal(span3Context.parentId, span2Context.id)
  t.equal(span3Context.flags, span2Context.flags)

  t.end()
}))

test('#startSpan() - ended transaction', setup(function (t) {
  const tracer = new Tracer(getAgent())

  const span1 = tracer.startSpan('foo')
  span1.finish()

  const span2 = tracer.startSpan('bar')

  t.equal(span1._isTransaction, true)
  t.equal(span2._isTransaction, true)
  t.equal(span1.context()._context.parentId, undefined)
  t.equal(span2.context()._context.parentId, undefined)
  t.end()
}))

test('#startSpan() - not sampled', setup(function (t) {
  const agent = getAgent()
  agent._conf.transactionSampleRate = 0

  const tracer = new Tracer(agent)
  const span1 = tracer.startSpan()

  t.ok(span1, 'should return span')
  t.ok(span1._span, 'should hold reference to span/transaction')
  t.equal(span1._isTransaction, true, 'first span should be a transaction')
  t.equal(span1._span.sampled, false)

  const span2 = tracer.startSpan()

  t.ok(span2 instanceof UnsampledSpan)

  agent._conf.transactionSampleRate = 1

  t.end()
}))

test('#inject(span, http, undefined)', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo')
  // TODO: Is this expected?
  t.throws(function () {
    tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS)
  })
  t.end()
}))

test('#inject(span, http, {})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo')
  const carrier = {}
  tracer.inject(span, opentracing.FORMAT_HTTP_HEADERS, carrier)
  t.equal(carrier['elastic-apm-traceparent'], span.context().toString())
  t.end()
}))

test('#inject(context, http, {})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const span = tracer.startSpan('foo')
  const carrier = {}
  tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, carrier)
  t.equal(carrier['elastic-apm-traceparent'], span.context().toString())
  t.end()
}))

test('#inject(noop, http, {})', setup(function (t) {
  const agent = getAgent()
  agent._conf.transactionSampleRate = 0

  const tracer = new Tracer(agent)

  const span1 = tracer.startSpan('foo')
  t.equal(span1._isTransaction, true)
  t.equal(span1._span.sampled, false)

  const span2 = tracer.startSpan('foo')
  t.ok(span2 instanceof UnsampledSpan)

  const carrier = {}

  tracer.inject(span2, opentracing.FORMAT_HTTP_HEADERS, carrier)

  t.equal(carrier['elastic-apm-traceparent'], span1.context().toString())

  agent._conf.transactionSampleRate = 1

  t.end()
}))

test('#extract(http, undefined)', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const context = tracer.extract(opentracing.FORMAT_HTTP_HEADERS)
  t.equal(context, null)
  t.end()
}))

test('#extract(http, {})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const context = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, {})
  t.equal(context, null)
  t.end()
}))

test('#extract(http, {elastic-apm-traceparent: null})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const context = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, {
    'elastic-apm-traceparent': null
  })
  t.equal(context, null)
  t.end()
}))

// TODO: Currently the header string isn't validated. This might not be an issue though
test.skip('#extract(http, {elastic-apm-traceparent: invalid})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const context = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, {
    'elastic-apm-traceparent': 'invalid'
  })
  t.equal(context, null)
  t.end()
}))

test('#extract(http, {elastic-apm-traceparent: valid})', setup(function (t) {
  const tracer = new Tracer(getAgent())
  const context = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, {
    'elastic-apm-traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01'
  })
  t.ok(context instanceof SpanContext)
  t.equal(context.toString(), '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01')
  t.end()
}))
