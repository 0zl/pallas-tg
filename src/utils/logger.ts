// https://github.com/0zl

enum ColorMap {
    reset = "\x1b[0m",
    error = "\x1b[31m",
    success = "\x1b[32m",
    warn = "\x1b[33m",
    info = "\x1b[34m",
    bold = "\x1b[1m",
    prefix = '[Pallas Telegram]'
}

type Logger = (
    type: 'info' | 'warn' | 'error' | 'success',
    message: unknown
) => void

const logger: Logger = (type, message) => {
    console.log(
        `${ColorMap.bold}${ColorMap[type]}${ColorMap.prefix}${ColorMap.reset}`, message
    )
}

export default logger