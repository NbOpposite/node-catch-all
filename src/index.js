const asyncHooks = require('async_hooks');
const { doNonCatchAllError, doNonCatchAllRejection } = require('./errors');
const weak = require('weak');

const CONTEXT_ID = 0;
const DESTROYED = 1;
const PROMISE = 2;
const CALLBACK = 3;
const emptyArr = Object.freeze([]);
const asyncHook = asyncHooks.createHook({
	init(asyncId, type, triggerAsyncId, resource) {
		let [contextId] = asyncIds.get(triggerAsyncId) || emptyArr;
		if(contextId === undefined) return;
		contextId = contextId || triggerAsyncId;
		const contextSet = contexts.get(contextId);
		contextSet.set(asyncId, false);
		asyncIds.set(asyncId, [contextId, false]);
		if(resource && resource.promise) {
			asyncIds.get(contextId)[PROMISE].add(weak(resource.promise));
		}
	},
	destroy(asyncId) {
		let asyncData = asyncIds.get(asyncId);
		if(!asyncData) return;
		asyncData[DESTROYED] = true;

		const contextId = asyncData[CONTEXT_ID] || asyncId;
		const contextSet = contexts.get(contextId);
		if(asyncData[CONTEXT_ID]) {
			contextSet.set(asyncId, true);
			if(!asyncIds.get(asyncData[CONTEXT_ID])[DESTROYED]) return;
		}
		for(let destroyed of contextSet.values()) { if(!destroyed) return; }
		for(let id of contextSet.keys()) {
			asyncIds.delete(id);
		}
		asyncIds.delete(contextId);
		contexts.delete(contextId);
		if(!asyncIds.size) {
			unload();
		}
	}
});
asyncHook.isEnabled = false;

function handleError(err) {
	const asyncData = asyncIds.get(asyncHooks.executionAsyncId());
	if(!asyncData) return doNonCatchAllError(err);
	err.caught = true;
	return asyncIds.get(asyncData[CONTEXT_ID] || asyncHooks.executionAsyncId())[CALLBACK](err);
}

function handleRejection(err, promise) {
	for(let [, [,, promises, cb]] of asyncIds) {
		if(!promises) continue;
		for(let savedPromise of promises.values()) {
			savedPromise = savedPromise && weak.get(savedPromise);
			if(!savedPromise) continue;
			if(savedPromise === promise) {
				promise.caught = true;
				if(err instanceof Error) err.caught = true;
				return cb(err, promise);
			}
		}
	}
	return doNonCatchAllRejection(err);
}

function unload() {
	asyncHook.disable();
	asyncHook.isEnabled = false;
	process.removeListener('uncaughtException', handleError);
	process.removeListener('unhandledRejection', handleRejection);
}

function load() {
	asyncHook.enable();
	asyncHook.isEnabled = true;
	process.prependListener('uncaughtException', handleError);
	process.prependListener('unhandledRejection', handleRejection);
}

class CatchAllContext extends asyncHooks.AsyncResource {
	constructor() {
		super('NODE-CATCH-ALL');
	}
}
const asyncIds = new Map();
const contexts = new Map();

function catchAll(fn, _this = null, cb, ...args) {
	if(typeof cb !== 'function') throw new TypeError('Callback is not a function.');
	if(!asyncHook.isEnabled) {
		load();
	}
	const context = new CatchAllContext();
	asyncIds.set(context.asyncId(), [null, false, new Set(), cb]);
	contexts.set(context.asyncId(), new Map());
	let ret;
	context.runInAsyncScope(() => {
		ret = Reflect.apply(fn, _this, args);
	});
	return ret;
}

module.exports = catchAll;
