import type { Command, Context, WrapperContext, SequenceInput } from '../main.ts'
import PallasMemory from '../memory.ts'

import YtMusic from '../libs/yt-music.ts'
import { YTNodes } from 'https://deno.land/x/youtubei@v4.3.0-deno/deno.ts'

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
                for ( let i = 0; i < 6; i++ ) {
                    const data = res[i]
                    message += `- *${i+1}.* ${data.title.text}\n\n`
                }
                
                await _W.editReplyUser(ctx, message, Number(fMsg.chat.id), Number(fMsg.message_id))
            }
        }

        await tasks[_seq.task]()
    }
}