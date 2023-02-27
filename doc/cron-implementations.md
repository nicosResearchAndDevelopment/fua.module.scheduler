# Analysis of npm-js cron implementations

- [npm - cron](https://www.npmjs.com/search?ranking=popularity&q=cron)
- [Wikipedia - cron](https://en.wikipedia.org/wiki/Cron)

## [cron](https://www.npmjs.com/package/cron)

- **Version:** `2.0.0`
- **Published:** 3. May 2022
- **Downloads:** ~ 1.5M per week
- **Dependencies:**
  [`luxon`](https://www.npmjs.com/package/luxon)

This implementation has 2 uses for tasks: scheduling a function or executing a command with child_process.
In case of the command a wrapper function is build and used like the regular function argument.

For scheduling a task there are two classes: A [`CronJob`](https://github.com/kelektiv/node-cron/blob/master/lib/job.js)
that is responsible for the function call and starting/closing of the task and the
[`CronTime`](https://github.com/kelektiv/node-cron/blob/master/lib/time.js) that is responsible for resolving the cron
expression and generating future execution dates.

The `CronTime` parses the general syntax of the cron expression and saves all times of that field type
that matches the expression field. Some logic also tries to fix issues regarding out of range day of months.
Then the algorithm tries to find next dates by adding time units to the current date until it is found in the
previously generated lookup objects. A safety feature also cancels calculation after 5 seconds of processing.
It is also possible to use a specific date instead of a cron expression to schedule a one-time execution.

The `CronJob` uses the `CronTime` to calculate the next date of execution and creates a timeout to call the callbacks
for the jobs which can be more than one. It also handles timeouts larger than the max timeout and unref`s the timer
to prevent blocking of exiting node process.

```ts
declare function job(cronTime: string | Date, onTick: Function, onComplete?: Function, startNow?: boolean, timeZone?: string, context?: any, runOnInit?: boolean, utcOffset?: number, unrefTimeout?: boolean): CronJob;

declare function time(cronTime: string | Date, timeZone?: string): CronTime;

declare function sendAt(cronTime: string): Date;

declare function timeout(cronTime: string): number;

declare interface CronJob {
    constructor(cronTime: string | Date, onTick: Function, onComplete?: Function, startNow?: boolean, timeZone?: string, context?: any, runOnInit?: boolean, utcOffset?: number, unrefTimeout?: boolean): CronJob;
    addCallback(callback: Function): void;
    setTime(time: CronTime): void;
    lastDate(): Date;
    nextDate(): Date;
    fireOnTick(): void;
    start(): void;
    stop(): void;
}

declare interface CronTime {
    constructor(source: string | Date, zone?: string, utcOffset?: number): CronTime;
    sendAt(i?: number): Date | Array<Date>;
    getTimeout(): number;
    toString(): string;
    toJSON(): Array<string>;
}
```

## [node-cron](https://www.npmjs.com/package/node-cron)

- **Version:** `3.0.0`
- **Published:** 16. March 2021
- **Downloads:** ~ 350K per week
- **Dependencies:**
  [`moment-timezone`](https://www.npmjs.com/package/moment-timezone)

This implementation has 2 uses for tasks: scheduling a function
([`ScheduledTask`](https://github.com/node-cron/node-cron/blob/master/src/scheduled-task.js))
or scheduling a predefined task from a file
([`BackgroundScheduledTask`](https://github.com/node-cron/node-cron/blob/master/src/background-scheduled-task/index.js))
.

For each `ScheduledTask` a [`Task`](https://github.com/node-cron/node-cron/blob/master/src/task.js)
and a [`Scheduler`](https://github.com/node-cron/node-cron/blob/master/src/scheduler.js) is created.
The `Task` holds a reference to the method and captures the execution.
The `Scheduler` parses the cron expression and emits an event that the `ScheduledTask` can listen.
In order to find a time to emit this event, the `Scheduler` creates a
[`TimeMatcher`](https://github.com/node-cron/node-cron/blob/master/src/time-matcher.js) which can compare a given date
with the cron expression and tells if the pattern matches. The `Scheduler` also creates a Timeout-Loop to check every
second the current date against the cron expression and emits the event when the pattern matches.

The `Scheduler` uses process.hrtime and does some optimisations to reduce any errors or missed calls that might occur
with a naive Timeout-Loop. It is questionable though which impact a Timeout for each `ScheduledTask` will have on the
overall performance or memory consumption.

To reduce the risc of a bad implementation, the impact by massive amounts of Timeouts on the js engine
should be evaluated.

```ts
declare function schedule(expression: string, func: Function | string, options?: CronScheduleOptions): ScheduledTask;

declare function validate(expression: string): boolean;

declare function getTasks(): Array<ScheduledTask>;

interface CronScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
    recoverMissedExecutions?: boolean;
    name?: string;
    runOnInit?: boolean;
}

interface ScheduledTask extends EventEmitter {
    constructor(cronExpression: string, func: Function | string, options?: CronScheduleOptions): ScheduledTask;
    now(now?: 'manual' | Date): void;
    start(): void;
    stop(): void;
}

interface Task<T> extends EventEmitter {
    constructor(execution: (now: string | Date) => T): Task;
    execute(now: string | Date): T;
}

interface Scheduler {
    constructor(pattern: string, timezone?: string, autorecover?: boolean): Scheduler;
    start(): void;
    stop(): void;
}

interface TimeMatcher {
    constructor(pattern: string, timezone?: string): TimeMatcher;
    match(date: Date): boolean;
    apply(date: Date): Date;
}
```

## [node-schedule](https://www.npmjs.com/package/node-schedule)

- **Version:** `2.1.0`
- **Published:** 28. November 2021
- **Downloads:** ~ 700K per week
- **Dependencies:**
  [`cron-parser`](https://www.npmjs.com/package/cron-parser)
  [`long-timeout`](https://www.npmjs.com/package/long-timeout)
  [`sorted-array-functions`](https://www.npmjs.com/package/sorted-array-functions)

```ts
declare function cancelJob(job: Job): boolean;

declare function rescheduleJob(job: Job, spec: number | string | RecurrenceRule | object): Job;

declare type scheduledJobs = { [name: string]: Job };

declare function scheduleJob(name: string, spec: number | string | RecurrenceRule | object, method: Function, callback?: Function): Job;

declare function gracefulShutdown(): Promise<void>;

declare interface Job<T> extends EventEmitter {
    constructor(name: string, job: (fireDate: Date) => T, callback?: Function): Job;
    trackInvocation(invocation): boolean;
    stopTrackingInvocation(invocation): boolean;
    triggeredJobs(): number;
    setTriggeredJobs(triggeredJob: number): void;
    deleteFromSchedule(): void;
    cancel(reschedule?: boolean): boolean;
    cancelNext(reschedule?: boolean): boolean;
    reschedule(spec: number | string | RecurrenceRule | object): boolean;
    nextInvocation(): Date | null;
    invoke(fireDate: Date): T;
    runOnDate(date: Date): boolean;
    schedule(spec: number | string | RecurrenceRule | object): boolean;
}

declare interface Invocation {
    job: Job;
    fireDate: Date;
    recurrenceRule: RecurrenceRule;
    endDate: Date;
}

declare interface Range {
    start: number;
    end: step;
    step: number;

    contains(val: number): boolean;
}

declare interface RecurrenceRule {
    recurs: boolean;
    year: number | Range | Array<number | Range>;
    month: number | Range | Array<number | Range>;
    date: number | Range | Array<number | Range>;
    dayOfWeek: number | Range | Array<number | Range>;
    hour: number | Range | Array<number | Range>;
    minute: number | Range | Array<number | Range>;
    second: number | Range | Array<number | Range>;

    isValid(): boolean;
    nextInvocationDate(base?: Date): Date;
}
```

## [cron-parser](https://www.npmjs.com/package/cron-parser)

- **Version:** `4.4.0`
- **Published:** 1. May 2022
- **Downloads:** ~ 1.5M per week
- **Dependencies:**
  [`luxon`](https://www.npmjs.com/package/luxon)

```ts
declare function parseExpression(expression: string, options?: Object): CronExpression;

interface CronExpression {
    constructor(fields: Object, options?: Object): CronExpression;
    next(): CronDate | { value: CronDate, done: boolean };
    prev(): CronDate | { value: CronDate, done: boolean };
    hasNext(): boolean;
    hasPrev(): boolean;
    iterate(steps: number, callback?: Function): Array<CronDate>;
    reset(newDate?: number | string | Date): void;
    stringify(includeSeconds?: boolean): string;
}

interface CronDate extends Date {
    constructor(timestamp: number | string | Date, tz?: string): CronDate;

    addYear(): void;
    addMonth(): void;
    addDay(): void;
    addHour(): void;
    addMinute(): void;
    addSecond(): void;

    subtractYear(): void;
    subtractMonth(): void;
    subtractDay(): void;
    subtractHour(): void;
    subtractMinute(): void;
    subtractSecond(): void;

    toDate(): Date;
    isLastDayOfMonth(): boolean;
    isLastWeekdayOfMonth(): boolean;
}
```
