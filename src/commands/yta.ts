import type { Command, Context, WrapperContext } from '../main.ts'
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
        await ctx.reply('pong!')
    }

    task = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}