import type { Command, Context, WrapperContext, SequenceInput } from '../main.ts'
import PallasMemory from '../memory.ts'

import YtMusic from '../libs/yt-music.ts'

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
        await _W.createSeqInput(ctx, Number(ctx.from?.id), 'test', [
            'What song do you want to search?'
        ])
    }

    task = async (seq: SequenceInput, ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}