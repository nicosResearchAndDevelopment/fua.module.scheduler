const
    model = require('../model.js'),
    is = require('@nrd/fua.core.is'),
    assert = require('@nrd/fua.core.assert'),
    ts = require('@nrd/fua.core.ts'),
    tty = require('@nrd/fua.core.tty'),
    EventEmitter = require('events'),
    timers = require('timers');

class Scheduler {

    #emitter = new EventEmitter();
    /** @type {Map<IdentifierString, Schedule>} */ #schedules = new Map();
    /** @type {Array<Schedule>} */ #timeline = [];
    /** @type {Timeout | null} */ #currentTimeout = null;

    #startTimeout() {
        const
            schedule = this.#timeline[0],
            maxDiffMS = 2147483647,
            timeDiffMS = Math.max(0, schedule.nextTime - ts());
        if (timeDiffMS > maxDiffMS) {
            this.#currentTimeout = timers.setTimeout(() => {
                this.#currentTimeout = null;
                this.#startTimeout();
            }, maxDiffMS);
        } else {
            this.#currentTimeout = timers.setTimeout(() => {
                this.#currentTimeout = null;
                try {
                    schedule.trigger();
                } catch (err) {
                    tty.error(err);
                    schedule.destroy();
                }
            }, timeDiffMS);
        }
        this.#currentTimeout.unref();
    }

    #stopTimeout() {
        if (this.#currentTimeout) {
            timers.clearTimeout(this.#currentTimeout);
            this.#currentTimeout = null;
        }
    }

    /**
     * @param {Schedule} schedule
     */
    #queueSchedule(schedule) {
        if (!schedule.nextTime) return;
        assert(schedule.nextTime > ts(), 'unable to insert schedule with bygone nextTime');
        if (this.#timeline.length === 0) {
            this.#timeline.push(schedule);
            this.#startTimeout();
        } else {
            const index = this.#timeline.findIndex((otherSchedule) => schedule.nextTime < otherSchedule.nextTime);
            if (index === 0) {
                this.#stopTimeout();
                this.#timeline.unshift(schedule);
                this.#startTimeout();
            } else if (index > 0) {
                this.#timeline.splice(index, 0, schedule);
            } else {
                this.#timeline.push(schedule);
            }
        }
    }

    /**
     * @param {Schedule} schedule
     */
    #dequeueSchedule(schedule) {
        const index = this.#timeline.indexOf(schedule);
        if (index === 0) {
            this.#stopTimeout();
            this.#timeline.shift();
            if (this.#timeline.length > 0) this.#startTimeout();
        } else if (index > 0) {
            this.#timeline.splice(index, 1);
        }
    }

    /**
     * @param {{[key: IdentifierString]: ScheduleOption}} [schedules]
     */
    constructor(schedules) {
        if (is.object(schedules)) {
            for (let [scheduleId, scheduleTime] of Object.entries(schedules)) {
                this.createSchedule(scheduleId, scheduleTime);
            }
        }
    }

    /**
     * A method to check whether a specific 'id' is already scheduled.
     * @param {IdentifierString} scheduleId
     * @returns {boolean}
     */
    isScheduled(scheduleId) {
        return this.#schedules.has(scheduleId);
    }

    /**
     * A method to check whether an object is a schedule from this scheduler.
     * @param {Schedule} schedule
     * @returns {boolean}
     */
    isSchedule(schedule) {
        return (schedule instanceof model.Schedule) && (schedule === this.#schedules.get(schedule.id));
    }

    /**
     * A method to retrieve an existing schedule.
     * @param {IdentifierString} scheduleId
     * @returns {Schedule | null}
     */
    getSchedule(scheduleId) {
        return this.#schedules.get(scheduleId) || null;
    }

    /**
     * A method to create a new schedule. Depending on the input argument the schedule is recurring or triggered once.
     * @param {IdentifierString} scheduleId
     * @param {ScheduleOption} scheduleTime
     * @returns {Schedule}
     */
    createSchedule(scheduleId, scheduleTime) {
        assert.string.identifier(scheduleId);
        assert(!this.#schedules.has(scheduleId), 'schedule ' + scheduleId + ' already exists');
        const schedule = new model.Schedule(scheduleId, scheduleTime);
        return this.appendSchedule(schedule);
    }

    /**
     * A method to append a schedule that has been created outside the scheduler.
     * @param {Schedule} schedule
     * @returns {Schedule}
     */
    appendSchedule(schedule) {
        assert.instance(schedule, model.Schedule);
        const existing = this.#schedules.get(schedule.id);
        if (schedule === existing) return schedule;
        assert(!existing, 'schedule ' + schedule.id + ' already exists');
        assert(!schedule.destroyed, 'schedule is already destroyed');
        this.#schedules.set(schedule.id, schedule);
        schedule.on('trigger', () => {
            this.#emitter.emit(schedule.id, schedule);
        }).on('update', () => {
            this.#dequeueSchedule(schedule);
            this.#queueSchedule(schedule);
        }).once('destroy', () => {
            this.#dequeueSchedule(schedule);
            this.#schedules.delete(schedule.id);
        });
        this.#queueSchedule(schedule);
        return schedule;
    }

    /**
     * A method to remove a recurring schedule or a one time schedule that has not been triggered yet.
     * @param {IdentifierString} scheduleId
     * @returns {this}
     */
    removeSchedule(scheduleId) {
        assert.string.identifier(scheduleId);
        const schedule = this.#schedules.get(scheduleId);
        if (schedule) {
            this.#dequeueSchedule(schedule);
            this.#schedules.delete(schedule.id);
        }
        return this;
    }

    /**
     * @param {IdentifierString} event
     * @param {(Schedule) => any} callback
     * @returns {Scheduler}
     */
    on(event, callback) {
        this.#emitter.on(event, callback);
        return this;
    }

    /**
     * @param {IdentifierString} event
     * @param {(Schedule) => any} callback
     * @returns {Scheduler}
     */
    once(event, callback) {
        this.#emitter.once(event, callback);
        return this;
    }

    /**
     * @param {IdentifierString} event
     * @param {function} callback
     * @returns {Scheduler}
     */
    off(event, callback) {
        this.#emitter.off(event, callback);
        return this;
    }

}

module.exports = Scheduler;
