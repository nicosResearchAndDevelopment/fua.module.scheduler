const
    util = exports,
    is = require('@fua/core.is');

util.sealModule = function (target) {
    Object.freeze(target);
    for (const child of Object.values(target)) {
        if (child instanceof Object) util.sealModule(child);
    }
};

// const cronStringPattern = /^[0-9a-z*,\-/?#@ ]+$/i;
const cronStringPattern = /^(?:@\w+|(?:[\w*,\-/?#]+(?= |$) ?){5,6})$/i;
/**
 * @param {unknown} value
 * @returns {value is import('./model.js').CronString}
 */
util.isCronString = (value) => is.string(value) && cronStringPattern.test(value);

/**
 * @param {import('./model.js').CronString} value
 * @returns {import('./model.js').CronExpression}
 */
util.parseCronExpression = require('cron-parser').parseExpression;

Object.freeze(util);
module.exports = util;
