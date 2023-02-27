const
    util = exports,
    is = require('@nrd/fua.core.is');

util.sealModule = function (target) {
    Object.freeze(target);
    for (const child of Object.values(target)) {
        if (child instanceof Object) util.sealModule(child);
    }
};

// const cronStringPattern = /^[0-9a-z*,\-/?#@ ]+$/i;
const cronStringPattern = /^(?:@\w+|(?:[\w*,\-/?#]+(?= |$) ?){5,6})$/i;
util.isCronString = (value) => is.string(value) && cronStringPattern.test(value);

/** @type {(CronString) => CronExpression} */
util.parseCronExpression = require('cron-parser').parseExpression;

Object.freeze(util);
module.exports = util;
