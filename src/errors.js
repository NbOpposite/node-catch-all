const nonErrError = `
Uncaught non-error thrown somewhere. Default error
handling in Node would have given more information
about the error, but since the catch-all module overrides
that with no way of passing it over, even if it can't
handle the location error, no more information can be provided.
I'm sorry. Here's an inspect output for the value thrown:
`;
function doNonCatchAllError(err) {
	if(process.listenerCount('uncaughtException') === 1) {
		/* eslint-disable no-inline-comments,max-len */
		if(err instanceof Error) throw err; // DON'T LOOK AT THIS LINE, LOOK AT STACKTRACE!
		throw new TypeError(`\n${nonErrError}\n${require('util').inspect(err)}\n`); // SORRY! This is not the line you want to look at
		/* eslint-enable no-inline-comments,max-len */
	}
}

const nonErrRejection = `
Uncaught non-error thrown somewhere. Default error
handling in Node would have given more information
about the error, but since the catch-all module overrides
that with no way of passing it over, even if it can't
handle the location error, no more information can be provided.
I'm sorry. Here's an inspect output for the value thrown:
`;
const rejectionWarning =
	'Unhandled promise rejection. This error originated either by throwing' +
	' inside of an async function without a catch block,' +
	' or by rejecting a promise which was not handled with .catch().';
const deprecationWarning = 'Unhandled promise rejections are deprecated.' +
	' In the future, promise rejections that are not handled will terminate the Node.js' +
	' process with a non-zero exit code.';
function doNonCatchAllRejection(err) {
	if(process.listenerCount('unhandledRejection') === 1) {
		if(!(err instanceof Error)) {
			err = new TypeError(`\n${nonErrRejection}\n${require('util').inspect(err)}\n`);
		}
		process.emitWarning(err.stack, 'UnhandledPromiseRejectionWarning');
		process.emitWarning(rejectionWarning, 'UnhandledPromiseRejectionWarning');
		process.emitWarning(deprecationWarning, {
			type: 'DeprecationWarning',
			code: 'DEP0018'
		});
	}
}

module.exports = {
	doNonCatchAllError,
	doNonCatchAllRejection
};
