declare module "span" {
    export = Span;
    class Span {
        constructor(tracer: any, span: any);
        __tracer: any;
        __context: SpanContext;
        _span: any;
        _isTransaction: boolean;
        _context(): SpanContext;
        _tracer(): any;
        _setOperationName(name: any): void;
        addTags(tags: any): Span;
        _addTags(tags: any): void;
        _log(logs: any, timestamp: any): void;
        _finish(finishTime: any): void;
    }
    import SpanContext = require("span_context");
}
declare module "span_context" {
    export = SpanContext;
    class SpanContext {
        constructor(context: any);
        _context: any;
        toString(): any;
    }
}
declare module "tracer" {
    export = Tracer;
    class Tracer {
        constructor(agent: any);
        _agent: any;
        _startSpan(name: any, opts: any): any;
        _inject(spanContext: any, format: any, carrier: any): void;
        _extract(format: any, carrier: any): SpanContext;
    }
    import SpanContext = require("span_context");
}
declare module "unsampled_span" {
    export = UnsampledSpan;
    class UnsampledSpan {
        constructor(elasticTransaction: any);
        __context: SpanContext;
        _elasticTransaction: any;
        _isTransaction: boolean;
        _context(): SpanContext;
    }
    import SpanContext = require("span_context");
}
