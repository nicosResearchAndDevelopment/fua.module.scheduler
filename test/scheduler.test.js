const
    expect = require('expect'),
    {describe, test} = require('mocha'),
    scheduler = require('../src/scheduler.js');

describe('fua.module.scheduler', function () {

    test('develop', function () {
        expect(typeof scheduler.Schedule).toBe('function');
        expect(typeof scheduler.Scheduler).toBe('function');
        console.log(scheduler);
    });

});
