import type { Command, Context, WrapperContext, SequenceInput, InlineKeyboardData } from '../main.ts'
import PallasMemory from '../memory.ts'

import YtMusic from '../libs/yt-music.ts'
import { InlineKeyboard, InputFile } from 'https://deno.land/x/grammy@v1.15.3/mod.ts'
import { type InputMediaAudio } from 'https://deno.land/x/grammy@v1.15.3/types.deno.ts'

export default class TestCommand implements Command {
    name = 'yta'
    description = 'Search and download music from YouTube.'
    details = 'Search and download music from YouTube.'
    usage = 'yta'
    limits = {
        private: true,
        group: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await _W.createSeqInput(ctx, Number(ctx.from?.id), 'yta', [
            'What song do you want to search?'
        ], 'search')
    }

    task = async (_seq: SequenceInput, ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        // deno-lint-ignore ban-types
        const tasks: Record<string, Function> = {
            search: async () => {
                const query = String(_seq.answer[0].text)

                const fMsg = await _W.replyUser(ctx, 'please wait..')
                const res = await YtMusic.search(query)
                
                let message = '*Search Result:*\n\n'
                const ik = new InlineKeyboard()

                for ( let i = 0; i < 6; i++ ) {
                    const data = res[i]
                    message += `- *${i+1}.* ${data.title.text}\n\n`
                    ik.text(`${i+1}`, `yta|get-audio|${data.id}`)

                    if ( i === 5 ) ik.row()
                }
                
                ik.text('Search Again', 'yta|search|')
                ik.text('Cancel', 'cancel|cancel|')

                await _W.editReplyUser(ctx, message, Number(fMsg.chat.id), Number(fMsg.message_id), ik)
            }
        }

        await tasks[_seq.task]()
    }

    inlineKeyboard = async (data: InlineKeyboardData, ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        // deno-lint-ignore ban-types
        const tasks: Record<string, Function> = {
            'get-audio': async () => {
                const fMsg = (await _W.sendLoadingAudio(ctx))[0]
                const res = await YtMusic.download(data.data[0] as string)

                const media: InputMediaAudio = {
                    type: 'audio',
                    media: res?.file as InputFile,
                    title: String(res?.title),
                    caption: `@${ctx.from?.username}, it's done!`,
                    duration: res?.duration,
                    thumbnail: res?.thumb as InputFile,
                    performer: res?.author
                }

                await ctx.api.deleteMessage(Number(fMsg.chat.id), Number(fMsg.message_id))

                const sMsg = (await ctx.api.sendMediaGroup(Number(ctx.chat?.id), [ media ], {
                    message_thread_id: 
                        ctx.message?.reply_to_message?.message_thread_id ||
                        ctx.update.callback_query?.message?.reply_to_message?.message_thread_id
                }))[0]

                //await ctx.api.forwardMessage(Number(ctx.senderChat?.id), Number(sMsg.chat.id), Number(sMsg.message_id))
            },

            search: async () => {
                await _W.createSeqInput(ctx, Number(ctx.from?.id), 'yta', [
                    'What song do you want to search?'
                ], 'search')
            }
        }

        await tasks[data.task]()
    }
}