import type { Command, Context, WrapperContext, SequenceInput } from '../main.ts'
import PallasMemory from '../memory.ts'

export default class TestCommand implements Command {
    name = 'ping'
    description = 'Ping Command.'
    details = 'This is a ping command.'
    usage = 'ping'
    limits = {
        private: false,
        group: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('pong!')
    }

    task = async (seq: SequenceInput, ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}