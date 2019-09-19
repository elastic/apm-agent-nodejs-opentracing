'use strict'

const opentracing = require('opentracing')
const SpanContext = require('./span_context')

const illigalChars = /[.*"]/g

class Span extends opentracing.Span {
  constructor (tracer, span) {
    super()
    this.__tracer = tracer
    this.__context = null
    this._span = span
    this._isTransaction = !!span.setUserContext
  }

  _context () {
    return this.__context
      ? this.__context
      : (this.__context = new SpanContext(this._span))
  }

  _tracer () {
    return this.__tracer
  }

  _setOperationName (name) {
    this._span.name = name
  }

  // Override the addTags function in order to be able to call _addTags
  // elsewhere without triggering the clone of `tags`
  addTags (tags) {
    // We might delete tags in _addTags, so clone in order not to mutate
    this._addTags(Object.assign({}, tags))
    return this
  }

  _addTags (tags) {
    if (this._isTransaction) {
      if ('error' in tags) {
        this._span.result = tags.error ? 'error' : 'success'
        delete tags.error
      } else if (tags.result) {
        this._span.result = tags.result
        delete tags.result
      } else if (tags['http.status_code']) {
        this._span.result = `HTTP ${String(tags['http.status_code'])[0]}xx`
        delete tags['http.status_code'] // TODO: Should this be allowed to be stored?
      }

      const id = tags['user.id']
      const username = tags['user.username']
      const email = tags['user.email']
      if (id || username || email) {
        this._span.setUserContext({ id, username, email })
        delete tags['user.id']
        delete tags['user.username']
        delete tags['user.email']
      }
    }

    if (tags.type) {
      this._span.type = tags.type
      delete tags.type
    }

    const keys = Object.keys(tags)

    if (keys.length === 0) return

    // While the Node.js agent will sanitize the keys for us, it will also log
    // a warning each time. As periods are the norm in OpenTracing, we don't
    // want to log a warning each time a period is found, so we'll sanitize the
    // keys before forwarding the tags to the agent
    const sanitizedTags = {}
    for (const key of keys) {
      const sanitizedKey = key.replace(illigalChars, '_')
      sanitizedTags[sanitizedKey] = tags[key]
    }

    this._span.addLabels(sanitizedTags)
  }

  _log (logs, timestamp) {
    if (logs.event === 'error') {
      if (logs['error.object']) {
        this.__tracer._agent.captureError(logs['error.object'], { timestamp, message: logs.message })
      } else if (logs.message) {
        this.__tracer._agent.captureError(logs.message, { timestamp })
      }
    }
  }

  _finish (finishTime) {
    if (this._isTransaction) {
      this._span.end(null, finishTime)
    } else {
      this._span.end(finishTime)
    }
  }
}

module.exports = Span
