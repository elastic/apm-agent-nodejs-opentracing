'use strict'

const Filters = require('elastic-apm-node/lib/filters')
const symbols = require('elastic-apm-node/lib/symbols')
const agent = require('elastic-apm-node')

exports.setup = setup
exports.getAgent = getAgent

let uncaughtExceptionListeners = process._events.uncaughtException

function getAgent (conf = {}) {
  if (!conf.captureExceptions) conf.captureExceptions = false
  return agent.start(conf)
}

function setup (runTest) {
  return function (t) {
    uncaughtExceptionListeners = process._events.uncaughtException
    process.removeAllListeners('uncaughtException')

    t.on('end', clean)

    runTest(t)
  }
}

function clean () {
  global[symbols.agentInitialized] = null
  process._events.uncaughtException = uncaughtExceptionListeners
  if (agent) {
    agent._errorFilters = new Filters()
    agent._transactionFilters = new Filters()
    agent._spanFilters = new Filters()
    if (agent._instrumentation && agent._instrumentation._hook) {
      agent._instrumentation._hook.unhook()
    }
  }
}
