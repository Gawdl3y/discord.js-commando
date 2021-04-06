const util = require('util');
const discord = require('discord.js');
const { makeCallback, escapeRegex } = require('../../util');
const Command = require('../base');

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

module.exports = class EvalCommand extends Command {
	constructor(client, props = {}) {
		super(client, {
			name: 'eval',
			group: 'util',
			memberName: 'eval',
			description: makeCallback(locale => locale.commands.util.eval.constructor.description),
			details: makeCallback(locale => locale.commands.util.eval.constructor.details),
			ownerOnly: true,

			args: [
				{
					key: 'script',
					prompt: makeCallback(locale => locale.commands.util.eval.constructor.args.script.prompt),
					type: 'string'
				}
			]
		}, props);

		this.lastResult = null;
		Object.defineProperty(this, '_sensitivePattern', { value: null, configurable: true });
	}

	run(msg, args) {
		// Make a bunch of helpers
		/* eslint-disable no-unused-vars */
		const message = msg;
		const client = msg.client;
		const lastResult = this.lastResult;
		const doReply = val => {
			if(val instanceof Error) {
				msg.reply(msg.locale.commands.util.eval.run.errorCallback({ val }));
			} else {
				const result = this.makeResultMessages(msg, val, process.hrtime(this.hrStart));
				if(Array.isArray(result)) {
					for(const item of result) msg.reply(item);
				} else {
					msg.reply(result);
				}
			}
		};
		/* eslint-enable no-unused-vars */

		// Remove any surrounding code blocks before evaluation
		if(args.script.startsWith('```') && args.script.endsWith('```')) {
			args.script = args.script.replace(/(^.*?\s)|(\n.*$)/g, '');
		}

		// Run the code and measure its execution time
		let hrDiff;
		try {
			const hrStart = process.hrtime();
			this.lastResult = eval(args.script);
			hrDiff = process.hrtime(hrStart);
		} catch(err) {
			return msg.reply(msg.locale.commands.util.eval.run.error({ err: `${err}\nStacktrace:\n${err.stack}` }));
		}

		// Prepare for callback time and respond
		this.hrStart = process.hrtime();
		const result = this.makeResultMessages(msg, this.lastResult, hrDiff, args.script);
		if(Array.isArray(result)) {
			return result.map(item => msg.reply(item));
		} else {
			return msg.reply(result);
		}
	}

	makeResultMessages(msg, result, hrDiff, input = null) {
		const inspected = util.inspect(result, { depth: 0 })
			.replace(nlPattern, '\n')
			.replace(this.sensitivePattern, '--snip--');
		const split = inspected.split('\n');
		const last = inspected.length - 1;
		const prependPart = inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'" ? split[0] : inspected[0];
		const appendPart = inspected[last] !== '}' && inspected[last] !== ']' && inspected[last] !== "'" ?
			split[split.length - 1] :
			inspected[last];
		const prepend = `\`\`\`javascript\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
		if(input) {
			return discord.splitMessage(msg.locale.commands.util.eval.run.success({
				sec: hrDiff[0] > 0 ? `${hrDiff[0]}${msg.locale.commands.util.eval.run.second}` : '',
				ms: hrDiff[1] / 1000000,
				inspected
			}), { maxLength: 1900, prepend, append });
		} else {
			return discord.splitMessage(msg.locale.commands.util.eval.run.successCallback({
				sec: hrDiff[0] > 0 ? `${hrDiff[0]}${msg.locale.commands.util.eval.run.second}` : '',
				ms: hrDiff[1] / 1000000,
				inspected
			}), { maxLength: 1900, prepend, append });
		}
	}

	get sensitivePattern() {
		if(!this._sensitivePattern) {
			const client = this.client;
			let pattern = '';
			if(client.token) pattern += escapeRegex(client.token);
			Object.defineProperty(this, '_sensitivePattern', { value: new RegExp(pattern, 'gi'), configurable: false });
		}
		return this._sensitivePattern;
	}
};
