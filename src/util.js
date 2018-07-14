const util = require('util');
const fs = require('fs');
const sync = {
	println(str) {
		fs.writeSync(1, `${str}\n`);
	},
	debug(...args) {
		sync.println(util.format(...args));
	},
	inspect(...args) {
		for(let arg of args) {
			sync.println(util.inspect(arg, { colors: true }));
		}
	}
};

module.exports = {
	sync
};
