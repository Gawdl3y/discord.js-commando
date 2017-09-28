const ArgumentType = require('./base');

class StringArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'string');
	}

	validate(value, msg, arg) {
		if(!value) return false;
		if(arg.min !== null && typeof arg.min !== 'undefined' && value.length <= arg.min) {
			return `Please keep the ${arg.label} above ${arg.min} characters.`;
		}
		if(arg.max !== null && typeof arg.max !== 'undefined' && value.length >= arg.max) {
			return `Please keep the ${arg.label} below ${arg.max} characters.`;
		}
		return true;
	}

	parse(value) {
		return value;
	}
}

module.exports = StringArgumentType;
