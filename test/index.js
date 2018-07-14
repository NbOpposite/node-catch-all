/* eslint-env node */
const catchAll = require('../src');
const EventEmitter = require('events');
const { Test, xTest } = require('./test');
const assert = require('assert').strict;

const testEmitter = new EventEmitter();

const weak = require('weak');

new Test('Catch timeout sync')
.run(async() => {
	const err = new Error('TEST ERROR');
	const retErr = await new Promise(resolve => {
		catchAll(() => setTimeout(() => { throw err; }, 10), null, err2 => resolve(err2));
	});
	assert.equal(err, retErr);
});

new Test('Catch timeout async')
.run(async() => {
	const err = new Error('TEST ERROR');
	const retErr = await new Promise(resolve => {
		catchAll(() => setTimeout(async() => { throw err; }, 10), null, err2 => resolve(err2));
	});
	assert.equal(err, retErr);
});

new xTest('Catch emitted sync')
.run(async() => {
	const err = new Error('TEST ERROR');
	setTimeout(() => testEmitter.emit(1), 10, 1);
	const retErr = await new Promise(resolve => {
		catchAll(() => testEmitter.on('1', () => { throw err; }), null, err2 => resolve(err2));
	});
	//assert.equal(err, 5);
	throw new Error('34');
});

new Test('Catch emitted async')
.run(async() => {
	const err = new Error('TEST ERROR');
	setTimeout(() => testEmitter.emit(1), 10, 1);
	const retErr = await new Promise(resolve => {
		catchAll(() => testEmitter.on('1', async() => { throw err; }), null, err2 => resolve(err2));
	});
	//assert.equal(err, 5);
	throw new Error('34');
});