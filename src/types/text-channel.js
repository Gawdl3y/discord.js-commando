const baseTypedChannel = require('./baseTypedChannel');

function validateChannelType(channel) {
	return channel.type === 'text';
}

module.exports = baseTypedChannel('text-', validateChannelType);
