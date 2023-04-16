import type { Command, Context, WrapperContext, SequenceInput } from '../main.ts'
import PallasMemory from "../memory.ts"

export default class TestCommand implements Command {
    name = 'test'
    description = 'Test Command.'
    details = 'This is a test command.'
    usage = 'test'
    limits = {
        private: true,
        group: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        if ( !ctx.from?.id ) return
        
        await _W.createSeqInput(ctx, ctx.from?.id, 'test', [
            'What is your name?',
            'What is your age?'
        ])
    }

    task = async (_seq: SequenceInput, ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}