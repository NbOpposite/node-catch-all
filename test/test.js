const MAX_TIME = 2000;

class TimeoutError extends Error {
	constructor(maxTime) {
		super(`Test took too longer than ${maxTime}ms to perform`);
		this.name = this.constructor.name;
	}
}

class UncaughtException extends Error {
	constructor(exception) {
		super('An exception was thrown, but never caught');
		this.exception = exception;
	}

	toString() {
		return `${this.constructor.name}: ${this.exception}`;
	}
}

class UnhandledRejection extends Error {
	constructor(exception) {
		super('A promise was rejecter, but never caught');
		this.exception = exception;
	}

	toString() {
		return `${this.constructor.name}: ${this.exception}`;
	}
}

class Test {
	constructor(name) {
		testSuite.add(this);
		this.name = name;
		this.func = null;
		this.shouldSkip = false;
		this.skipReason = null;
		this.setupFunc = null;
	}
	async doSetup() {
		if(this.setupFunc) await this.setup();
	}
	async doTest() {
		if(this.func) await this.func();
	}

	run(func) {
		this.func = func;
	}

	skip(reason) {
		this.shouldSkip = true;
		this.skipReason = reason;
		return this;
	}
}

class xTest extends Test {
	constructor(name, func) {
		super(name, func);
		this.skip();
	}
}

class TestSuite {
	constructor() {
		this.tests = [];
	}
	skip(test) {
		console.log(`${test.name} - SKIPPED ${test.skipReason ? `(${test.skipReason})` : ''}`);
	}
	pass(test) {
		console.log(`${test.name} - PASSED`);
	}
	fail(test, err) {
		let errStr = '';
		if(err instanceof TimeoutError) errStr = err.message;
		if(err instanceof UncaughtException) errStr = err.toString();
		if(err instanceof UnhandledRejection) errStr = err.toString();
		console.log(`${test.name} - FAILED ${errStr}`);
	}
	add(test) {
		this.tests.push(test);
	}

	/* eslint-disable no-await-in-loop */
	async run() {
		for(let test of this.tests) {
			let exceptListener;
			const uncaughtException = new Promise((resolve, reject) => {
				exceptListener = err => {
					if(!err || !err.caught) {
						reject(new UncaughtException(err));
					}
				};
				process.on('uncaughtException', exceptListener);
			});
			let rejectListener;
			const unhandledRejection = new Promise((resolve, reject) => {
				rejectListener = err => {
					if(!err || !err.caught) {
						reject(new UnhandledRejection(err));
					}
				};
				process.on('unhandledRejection', rejectListener);
			});
			if(test.shouldSkip) {
				this.skip(test);
				process.off('uncaughtException', exceptListener);
				continue;
			}
			await test.doSetup();
			if(test.shouldSkip) {
				this.skip(test);
				process.off('uncaughtException', exceptListener);
				continue;
			}
			try {
				await Promise.race([
					test.doTest(),
					new Promise((resolve, reject) => setTimeout(reject, MAX_TIME, new TimeoutError(MAX_TIME))),
					uncaughtException,
					unhandledRejection
				]);
				this.pass(test);
			} catch(err) {
				this.fail(test, err);
				process.off('uncaughtException', exceptListener);
				break;
			}
			process.off('uncaughtException', exceptListener);
		}
	}
	/* eslint-enable no-await-in-loop */
}

const testSuite = new TestSuite();
setImmediate(() => testSuite.run());
module.exports = {
	Test,
	xTest,
	testSuite
};
