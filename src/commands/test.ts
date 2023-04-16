import type { Command, Context, WrapperContext } from '../main.ts'
import PallasMemory from "../memory.ts"
import { InlineKeyboard } from 'https://deno.land/x/grammy@v1.15.3/mod.ts'

export default class TestCommand implements Command {
    name = 'test'
    description = 'Test Command.'
    details = 'This is a test command.'
    usage = 'test'
    limits = {
        private: true,
        group: true,
        channel: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        if ( !ctx.from?.id ) return
        
        await _W.createSeqInput(ctx, ctx.from?.id, 'test', [
            'What is your name?',
            'What is your age?'
        ])
    }

    task = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}