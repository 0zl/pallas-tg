import log from './utils/logger.ts'
import PallasMemory from './memory.ts'
import PallasSecurity from './security.ts'

import type { SequenceInput } from './memory.ts'

import { expandGlobSync } from "https://deno.land/std@0.183.0/fs/mod.ts"
import { assert } from 'https://deno.land/std@0.183.0/_util/asserts.ts'
import { Bot as Grammy, Context, InputFile } from "https://deno.land/x/grammy@v1.15.3/mod.ts"
import { BotCommand, UserFromGetMe } from 'https://deno.land/x/grammy_types@v3.0.3/manage.ts'
import { Application as Oak } from "https://deno.land/x/oak@v12.1.0/mod.ts"
import { Message } from 'https://deno.land/x/grammy_types@v3.0.3/message.ts'
import { InlineKeyboardMarkup } from 'https://deno.land/x/grammy_types@v3.0.3/markup.ts'
import { type InputMediaAudio } from 'https://deno.land/x/grammy@v1.15.3/types.deno.ts'

type DeployMode = 'direct' | 'heroku'
type CommandLimits = {
    private: boolean
    group: boolean
}

type InlineKeyboardData = {
    command: string
    task: string
    data: unknown[]
}

interface WrapperContext {
    replyUser: (ctx: Context, text: string) => Promise<Message.TextMessage>
    editReplyUser: (ctx: Context, text: string, chatId: string | number, messageId: number, replyMarkup?: InlineKeyboardMarkup) => Promise<void>
    createSeqInput: (ctx: Context, id: number, command: string, questions: string[], task?: string) => Promise<void>
    sendLoadingAudio: (ctx: Context) => Promise<Array<
        | Message.AudioMessage
        | Message.DocumentMessage
        | Message.PhotoMessage
        | Message.VideoMessage
    >>
    editReplyUserAudio: (ctx: Context, media: InputMediaAudio, chatId: string | number, messageId: number) => Promise<void>
}

interface Command {
    name: string
    description: string
    details: string
    usage: string | string[]
    limits: CommandLimits
    run: (ctx: Context, W: WrapperContext, M: PallasMemory) => Promise<void>
    task: (seq: SequenceInput, ctx: Context, W: WrapperContext, M: PallasMemory) => Promise<void>
    inlineKeyboard?: (data: InlineKeyboardData, ctx: Context, W: WrapperContext, M: PallasMemory) => Promise<void>
}

class PallasClass extends Grammy {
    private Commands: Record<string, Command> = {}
    private bot: UserFromGetMe | null = null
    
    private Memory: PallasMemory
    private Security: PallasSecurity

    constructor(token: string, PallasMemory: PallasMemory, PallasSecurity: PallasSecurity) {
        super(token)
        this.Memory = PallasMemory
        this.Security = PallasSecurity
    }

    async loadCommands() {
        const files = expandGlobSync('src/commands/**/*.ts')
        for await ( const file of files ) {
            const command: Command = new (await import(`./commands/${file.name}`)).default()
            this.Commands[command.name] = command
        }

        log('info', `loaded ${Object.keys(this.Commands).length} commands.`)
    }

    async startPallas(deployMode: DeployMode) {
        // Grammy's start method.
        this.catch(err => log('error', err))
        this.start()

        this.bot = await this.api.getMe()
        log('info', `currently running as "${this.bot.first_name}" (${this.bot.username})`)

        await this.loadCommands()
        this.handleEvents()

        if ( deployMode === 'heroku' ) {
            // Heroku needs a http server to keep the bot alive as web dyno.
            this.httpServer()
            log('success', 'http server is running for heroku.')
        }

        log('success', 'Pallas Telegram is now running.')
    }

    async httpServer() {
        const app = new Oak()
        const port = Number(Deno.env.get('PORT')) || 3000

        app.use(ctx => ctx.response.body = 'Pallas Telegram. (https://github.com/0zl/pallas-tg)')
        await app.listen({ port })
    }

    handleEvents() {
        const reservedChars = ['.', '!', '-', '(', ')', '[', ']', '#', '|', '_', '<', '>']
        const removeChars = ['~']
        
        // simple wrapper for command handler.
        const W: WrapperContext = {
            replyUser: async (ctx: Context, text: string) => {
                for ( const char of reservedChars ) text = text.replaceAll(char, `\\${char}`)
                for ( const char of removeChars ) text = text.replaceAll(char, '')

                return await ctx.reply(`@${ctx.from?.username}, ${text}`, {
                    parse_mode: 'MarkdownV2',
                    message_thread_id: 
                        ctx.message?.reply_to_message?.message_thread_id ||
                        ctx.update.callback_query?.message?.reply_to_message?.message_thread_id
                })
            },

            editReplyUser: async (ctx: Context, text: string, chatId: string | number, messageId: number, replyMarkup?: InlineKeyboardMarkup) => {
                for ( const char of reservedChars ) text = text.replaceAll(char, `\\${char}`)
                for ( const char of removeChars ) text = text.replaceAll(char, '')
                
                await ctx.api.editMessageText(chatId, messageId, `@${ctx.from?.username}, ${text}`, {
                    parse_mode: 'MarkdownV2',
                    reply_markup: replyMarkup
                })
            },

            editReplyUserAudio: async (ctx: Context, media: InputMediaAudio, chatId: string | number, messageId: number) => {
                await ctx.api.editMessageMedia(chatId, messageId, media)
            },

            sendLoadingAudio: async (ctx: Context) => {
                const media: InputMediaAudio = {
                    type: 'audio',
                    media: new InputFile('assets/blank.mp3', 'Loading.mp3'),
                    caption: `@${ctx.from?.username}, please wait!...`,
                    title: 'Loading...',
                    performer: 'Pallas Telegram'
                }

                return await ctx.api.sendMediaGroup(Number(ctx.chat?.id), [ media ], {
                    message_thread_id: 
                        ctx.message?.reply_to_message?.message_thread_id ||
                        ctx.update.callback_query?.message?.reply_to_message?.message_thread_id
                })
            },

            createSeqInput: async (ctx: Context, id: number, command: string, questions: string[], task = 'default') => {
                this.Memory.setSeqInput(id, command, task, ...questions)

                let firstQuestion = questions[0]
                for ( const char of reservedChars ) firstQuestion = firstQuestion.replaceAll(char, `\\${char}`)
                for ( const char of removeChars ) firstQuestion = firstQuestion.replaceAll(char, '')

                await ctx.reply(`@${ctx.from?.username}, ${firstQuestion}`, {
                    parse_mode: 'MarkdownV2',
                    message_thread_id: 
                        ctx.message?.reply_to_message?.message_thread_id ||
                        ctx.update.callback_query?.message?.reply_to_message?.message_thread_id
                })
            }
        }

        for ( const cmd of Object.values(this.Commands) ) {
            this.command(cmd.name, async ctx => {
                if ( ctx.from?.is_bot ) return
                if ( !ctx.from?.id ) return

                this.Memory.checkUser(ctx.from?.id)

                // check sequence input.
                const bypassSeq = ['cancel']
                if ( this.Memory.isSeqInputRequired(ctx.from?.id) && !bypassSeq.includes(cmd.name) ) { 
                    await W.replyUser(ctx, `You're currently in a command task.\n\nUse */cancel* to cancel the previous task.`)
                    return
                }

                if ( !cmd.limits.private && ctx.chat?.type === 'private' ) {
                    await W.replyUser(ctx, 'This command is not allowed in private chat.')
                    return
                }

                if ( ['group', 'supergroup'].includes(ctx.chat?.type) && !cmd.limits.group ) {
                    await W.replyUser(ctx, 'This command is not allowed in group chat.')
                    return
                }

                try {
                    await cmd.run(ctx, W, this.Memory)
                    log('info', `command <${cmd.name}> executed by ${ctx.from?.first_name} (${ctx.from?.id})`)
                } catch (e) {
                    await W.replyUser(ctx, 'An error occurred while executing the command, please try again later.')
                    log('error', e)
                }
            })
        }

        this.on('message', async ctx => {
            if ( !ctx.from?.id ) return
            if ( ctx.from?.is_bot ) return

            const uid = ctx.from?.id

            this.Memory.checkUser(ctx.from?.id)
            if ( this.Security.checkMessageSpam(ctx) ) return

            // sequential input
            if ( this.Memory.isSeqInputRequired(uid) ) {
                this.Memory.addSeqAnswer(uid, ctx.message)
                const seq = this.Memory.getSeqInput(uid)

                if ( this.Memory.isSeqComplete(uid) ) {
                    try {
                        await this.Commands[seq?.command ?? -1]?.task(seq, ctx, W, this.Memory)
                        log('info', `command task <${seq?.command}> executed by ${ctx.from?.first_name} (${ctx.from?.id})`)
                        this.Memory.clearSeqInput(uid)
                    } catch (e) {
                        await W.replyUser(ctx, 'An error occurred while executing the command, please try again later.')
                        log('error', e)
                    }
                } else {
                    const nextQuestion = seq?.question[seq?.answer.length ?? 0]
                    if ( nextQuestion ) {
                        await W.replyUser(ctx, nextQuestion)
                    } else {
                        await W.replyUser(ctx, 'An error occurred while executing the command, please try again later.')
                    }
                }
            }
        })

        this.on('callback_query:data', async ctx => {
            if ( !ctx.from?.id ) return
            if ( ctx.from?.is_bot ) return

            const uid = ctx.from?.id
            this.Memory.checkUser(uid)

            if ( this.Memory.isSeqInputRequired(ctx.from?.id) ) { 
                await W.replyUser(ctx, `You're currently in a command task.\n\nUse */cancel* to cancel the previous task.`)
                return
            }

            const rawData = ctx.callbackQuery?.data.split('|')
            const data: InlineKeyboardData = {
                command: rawData[0],
                task: rawData[1],
                data: rawData.slice(2)
            }

            const cmd = this.Commands[data.command]
            if ( !cmd || !cmd.inlineKeyboard ) {
                await ctx.answerCallbackQuery()
                return log('warn', `inline keyboard command <${data.command}> does not exist.`)
            }

            try {
                await cmd.inlineKeyboard(data, ctx, W, this.Memory)
                log('info', `inline keyboard <${data.command}> executed by ${ctx.from?.first_name} (${ctx.from?.id})`)
            } catch (e) {
                await W.replyUser(ctx, 'An error occurred while executing the command, please try again later.')
                log('error', e)
            }

            try {
                await ctx.answerCallbackQuery()
            // deno-lint-ignore no-empty
            } catch {}
        })

        this.Security.on('messageSpam', async ctx => {
            const uid = ctx.from?.id
            if ( !uid || !ctx.chat?.id ) return

            try {
                await ctx.api.banChatMember(ctx.chat?.id, uid)
                await ctx.api.sendMessage(uid, 'You have been banned from group chat for spamming messages.')
                log('warn', `user ${ctx.from?.first_name} (@${ctx.from?.username}) has been banned from group for spamming messages.`)
            } catch (e) {
                log('error', e)
            }
        })

        // Set command lists through telegram api.
        const commandObj = Object.values(this.Commands).map(x => ({
            command: x.name,
            description: x.description
        })) as BotCommand[]

        this.api.setMyCommands(commandObj).then(_ => log('info', 'commands are set through telegram api.'))
    }
}

const getDeployMode = (): DeployMode => {
    let depm: DeployMode = 'direct'

    if ( Deno.args.length ) {
        const arg = Deno.args[0].substring(1)
        depm = arg as DeployMode || 'direct'
    }

    log('info', `deploy mode: ${depm}`)
    return depm
}

if ( import.meta.main ) {
    const TelegramToken = Deno.env.get('TELEGRAM_TOKEN') || null
    assert(TelegramToken, 'TELEGRAM_TOKEN environment variable is not set.')

    const PMemory = new PallasMemory()
    const PSecurity = new PallasSecurity(PMemory)

    const Pallas = new PallasClass(TelegramToken, PMemory, PSecurity)
    await Pallas.startPallas(getDeployMode())

    // intervals for scheduled tasks.
    setInterval(_ => {
        PMemory.clearSession()
    }, 10_000)
}

export { PallasClass }
export type { Command, Context, WrapperContext, SequenceInput, InlineKeyboardData }
