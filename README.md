# @nrd/fua.module.scheduler

## Interface

```ts
type IdentifierString = string
type DateValue = number
type DateString = string
type CronString = string

type DateOption = DateValue | DateString | Date
type ScheduleOption = CronString | DateOption | null

type CronDate = Date | {
    addYear(): void,
    addMonth(): void,
    addDay(): void,
    addHour(): void,
    addMinute(): void,
    addSecond(): void,
    subtractYear(): void,
    subtractMonth(): void,
    subtractDay(): void,
    subtractHour(): void,
    subtractMinute(): void,
    subtractSecond(): void,
    toDate(): Date,
    isLastDayOfMonth(): boolean,
    isLastWeekdayOfMonth(): boolean
}

type CronExpression = {
    next(): CronDate,
    prev(): CronDate,
    hasNext(): boolean,
    hasPrev(): boolean,
    iterate(steps: number, callback?: Function): Array<CronDate>,
    reset(newDate?: number | string | Date): void,
    stringify(includeSeconds?: boolean): string
}

declare class Schedule {
    constructor(id: IdentifierString, schedule: ScheduleOption): this

    /** The 'id' of the schedule represents the event that will be triggered for the scheduler. */
    id: IdentifierString

    /** A getter to the time this schedule will trigger next in epoch milliseconds. */
    nextTime: DateValue

    /** A getter to the time this schedule has triggered last in epoch milliseconds. */
    lastTime: DateValue

    /** An indicator whether the schedule has been destroyed or not. A destroyed schedule cannot be recovered. */
    destroyed: boolean

    /** The trigger method is usually called by the scheduler but can be called manually. */
    trigger(): this

    /** The 'trigger' event occurs when the trigger function is called. */
    onTrigger(callback: Function): this

    on(event: 'trigger' | 'update' | 'destroy', callback: Function): this
    once(event: 'trigger' | 'update' | 'destroy', callback: Function): this
    off(event: 'trigger' | 'update' | 'destroy', callback: Function): this

    /** A generic json representation for the current schedule state. */
    toJSON(): { id: IdentifierString, manual?: boolean, onetime?: boolean, recurring?: boolean, lastTime?: DateValue, nextTime?: DateValue, destroyed?: boolean }
}

declare class Scheduler {
    constructor(schedules?: { [key: IdentifierString]: ScheduleOption }): this

    /** A method to check whether a specific 'id' is already scheduled. */
    isScheduled(scheduleId: IdentifierString): boolean

    /** A method to check whether an object is a schedule from this scheduler. */
    isSchedule(schedule: Schedule): boolean

    /** A method to retrieve an existing schedule. */
    getSchedule(scheduleId: IdentifierString): Schedule | null

    /** A method to create a new schedule. Depending on the input argument the schedule is recurring or triggered once. */
    createSchedule(scheduleId: IdentifierString, scheduleTime: ScheduleOption): Schedule

    /** A method to append a schedule that has been created outside the scheduler. */
    appendSchedule(schedule: Schedule): Schedule

    /** A method to remove a recurring schedule or a one time schedule that has not been triggered yet. */
    removeSchedule(scheduleId: IdentifierString): this

    on(event: IdentifierString, callback: (schedule: Schedule) => any): this
    once(event: IdentifierString, callback: (schedule: Schedule) => any): this
    off(event: IdentifierString, callback: (schedule: Schedule) => any): this
}

declare function isCronString(value: unknown): value is CronString

declare function parseCronExpression(value: CronString): CronExpression
```
