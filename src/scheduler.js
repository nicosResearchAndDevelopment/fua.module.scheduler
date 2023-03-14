const
    scheduler = exports,
    util = require('./util.js'),
    model = require('./model.js');

scheduler.Schedule = model.Schedule;
scheduler.Scheduler = model.Scheduler;

scheduler.isCronString = util.isCronString;
scheduler.parseCronExpression = util.parseCronExpression;

util.sealModule(scheduler);
