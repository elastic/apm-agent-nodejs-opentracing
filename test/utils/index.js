'use strict'

const agent = require('elastic-apm-node').start({ captureExceptions: false })

exports.setup = setup
exports.getAgent = getAgent

function getAgent (conf = {}) {
  return agent
}

function setup (runTest) {
  return function (t) {
    t.on('end', clean)
    runTest(t)
  }
}

function clean () {
  agent._instrumentation.currentTransaction = null
}
