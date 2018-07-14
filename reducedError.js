/* eslint-disable */
const async_hooks = require('async_hooks');
const { sync } = require('./src/util');
let hookPromise;
async_hooks.createHook({
	init(asyncId, type, triggerAsyncId, resource) {
		if(resource && resource.promise) {
			sync.inspect(hookPromise = resource.promise);
		};
	}
}).enable();

process.prependListener('unhandledRejection', (err, p) => {
	console.log(p.constructor);
	console.log(hookPromise.constructor);
	console.log(p === hookPromise);
	console.log(p);
	console.log(hookPromise);
});

Promise.reject('REJECTED PROMISE');
