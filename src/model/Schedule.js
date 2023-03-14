const
    model = require('../model.js'),
    util = require('../util.js'),
    is = require('@nrd/fua.core.is'),
    assert = require('@nrd/fua.core.assert'),
    ts = require('@nrd/fua.core.ts'),
    EventEmitter = require('events');

class Schedule {

    #id = '';
    #emitter = new EventEmitter();
    #triggered = false;
    #destroyed = false;
    #lastTime = 0;
    #nextTime = 0;

    /** @type {Date | null} */ #date = null;
    /** @type {model.CronExpression | null} */ #interval = null;
    /** @type {boolean} */ #manual = false;


    #updateNextTime() {
        if (this.#interval) {
            this.#interval.reset(this.#lastTime || ts());
            this.#nextTime = this.#interval.next().getTime();
        } else if (this.#date && !this.#nextTime) {
            this.#nextTime = this.#date.getTime();
            assert.number(this.#nextTime, 0, Number.MAX_VALUE);
        }
    }

    /**
     * @param {model.IdentifierString} id
     * @param {model.ScheduleOption} schedule
     */
    constructor(id, schedule) {
        assert.string.identifier(id);
        this.#id = id;
        if (is.null(schedule)) {
            this.#manual = true;
        } else if (util.isCronString(schedule)) {
            this.#interval = util.parseCronExpression(schedule);
        } else {
            this.#date = ts.parse(schedule);
            assert(is.date.valid(this.#date), 'invalid schedule');
        }
        this.#updateNextTime();
    }

    /**
     * The 'id' of the schedule represents the event that will be triggered for the scheduler.
     * @returns {model.IdentifierString}
     */
    get id() {
        return this.#id;
    }

    /**
     * A getter to the time this schedule will trigger next in epoch milliseconds.
     * @returns {model.DateValue}
     */
    get nextTime() {
        return this.#nextTime;
    }

    /**
     * A getter to the time this schedule has triggered last in epoch milliseconds.
     * @returns {model.DateValue}
     */
    get lastTime() {
        return this.#lastTime;
    }

    /**
     * An indicator whether the schedule has been destroyed or not. A destroyed schedule cannot be recovered.
     * @returns {boolean}
     */
    get destroyed() {
        return this.#destroyed;
    }

    /**
     * The trigger method is usually called by the scheduler but can be called manually.
     * @returns {this}
     */
    trigger() {
        assert(!this.#destroyed, 'already destroyed');
        this.#triggered = true;
        this.#lastTime = ts();
        if (this.#manual) {
            this.#emitter.emit('trigger');
        } else {
            this.#updateNextTime();
            this.#emitter.emit('trigger');
            if (this.#lastTime > this.#nextTime) this.destroy();
            else if (this.#triggered) this.#emitter.emit('update');
        }
        return this;
    }

    /**
     * The 'trigger' event occurs when the trigger function is called.
     * @param {Function} callback
     * @returns {this}
     */
    onTrigger(callback) {
        return this.on('trigger', callback);
    }

    /**
     * The update method can change an existing schedule.
     * @param {model.ScheduleOption} schedule
     * @returns {this}
     */
    update(schedule) {
        assert(!this.#destroyed, 'already destroyed');
        let manual = false, date = null, interval = null;
        if (is.null(schedule)) {
            manual = true;
        } else if (util.isCronString(schedule)) {
            interval = util.parseCronExpression(schedule);
        } else {
            date = ts.parse(schedule);
            assert(is.date.valid(date), 'invalid schedule');
        }
        this.#triggered = false;
        this.#manual = manual;
        this.#date = date;
        this.#interval = interval;
        this.#nextTime = 0;
        this.#updateNextTime();
        this.#emitter.emit('update');
    }

    /**
     * The 'update' event occurs after a trigger event or schedule update to reinsert the schedule into the timeline.
     * @param {Function} callback
     * @returns {this}
     */
    onUpdate(callback) {
        return this.on('update', callback);
    }

    /**
     * The destroy method is usually called by the scheduler but can be called manually.
     * @returns {void}
     */
    destroy() {
        assert(!this.#destroyed, 'already destroyed');
        this.#emitter.emit('destroy');
        this.#emitter.removeAllListeners();
        this.#nextTime = 0;
        this.#destroyed = true;
    }

    /**
     * The 'destroy' event occurs when the schedule is removed or after a final trigger.
     * @param {Function} callback
     * @returns {this}
     */
    onDestroy(callback) {
        return this.on('destroy', callback);
    }

    /**
     * @param {'trigger' | 'update' | 'destroy'} event
     * @param {function} callback
     * @returns {this}
     */
    on(event, callback) {
        if (this.#destroyed) throw new Error('already destroyed');
        this.#emitter.on(event, callback);
        return this;
    }

    /**
     * @param {'trigger' | 'update' | 'destroy'} event
     * @param {Function} callback
     * @returns {this}
     */
    once(event, callback) {
        if (this.#destroyed) throw new Error('already destroyed');
        this.#emitter.once(event, callback);
        return this;
    }

    /**
     * @param {'trigger' | 'update' | 'destroy'} event
     * @param {Function} callback
     * @returns {this}
     */
    off(event, callback) {
        if (this.#destroyed) throw new Error('already destroyed');
        this.#emitter.off(event, callback);
        return this;
    }

    /**
     * A generic json representation for the current schedule state.
     * @returns {{
     *     id: model.IdentifierString,
     *     manual?: true,
     *     onetime?: true,
     *     recurring?: true,
     *     lastTime?: model.DateValue,
     *     nextTime?: model.DateValue,
     *     destroyed?: true
     * }}
     */
    toJSON() {
        const result = {id: this.#id};
        if (this.#manual) {
            result.manual = true;
            if (this.#lastTime > 0) result.lastTime = this.#lastTime;
        } else if (this.#date) {
            result.onetime = true;
            if (this.#lastTime > this.#nextTime) result.lastTime = this.#lastTime;
            else result.nextTime = this.#nextTime;
        } else if (this.#interval) {
            result.recurring = true;
            if (this.#lastTime > 0) result.lastTime = this.#lastTime;
            result.nextTime = this.#nextTime;
        }
        if (this.#destroyed) result.destroyed = true;
        return result;
    }

}

module.exports = Schedule;
