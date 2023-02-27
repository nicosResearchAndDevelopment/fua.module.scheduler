/** @typedef {string} IdentifierString */
/** @typedef {number} DateValue */
/** @typedef {string} DateString */
/** @typedef {string} CronString */
/** @typedef {DateValue | DateString | Date} DateOption */
/** @typedef {CronString | DateOption | null} ScheduleOption */
/**
 * @typedef {Date | {
 *     addYear(): void,
 *     addMonth(): void,
 *     addDay(): void,
 *     addHour(): void,
 *     addMinute(): void,
 *     addSecond(): void,
 *     subtractYear(): void,
 *     subtractMonth(): void,
 *     subtractDay(): void,
 *     subtractHour(): void,
 *     subtractMinute(): void,
 *     subtractSecond(): void,
 *     toDate(): Date,
 *     isLastDayOfMonth(): boolean,
 *     isLastWeekdayOfMonth(): boolean
 * }} CronDate
 */
/**
 * @typedef {{
 *     next(): CronDate,
 *     prev(): CronDate,
 *     hasNext(): boolean,
 *     hasPrev(): boolean,
 *     iterate(steps: number, callback?: Function): Array<CronDate>,
 *     reset(newDate?: number | string | Date): void,
 *     stringify(includeSeconds?: boolean): string
 * }} CronExpression
 */

exports.Schedule = require('./model/Schedule.js');
exports.Scheduler = require('./model/Scheduler.js');
