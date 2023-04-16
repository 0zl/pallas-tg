import type { Command, Context, WrapperContext } from '../main.ts'
import PallasMemory from '../memory.ts'

export default class TestCommand implements Command {
    name = 'ping'
    description = 'Ping Command.'
    details = 'This is a ping command.'
    usage = 'ping'
    limits = {
        private: true,
        group: false,
        channel: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('pong!')
    }

    task = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}