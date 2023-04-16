function ts(ts: number = Date.now()) {
    return {
        addSeconds: (seconds: number) => ts + seconds * 1000,
        addMinutes: (minutes: number) => ts + minutes * 60 * 1000,
        addHours: (hours: number) => ts + hours * 60 * 60 * 1000
    }
}

export { ts }