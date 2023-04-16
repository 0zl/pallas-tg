import type { Command, Context, WrapperContext } from '../main.ts'
import PallasMemory from '../memory.ts'

export default class TestCommand implements Command {
    name = 'cancel'
    description = 'Cancel your current task.'
    details = 'This is for canceling your current or previous task.'
    usage = 'cancel'
    limits = {
        private: true,
        group: true
    }
    
    run = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        _M.clearSeqInput(Number(ctx.from?.id))
        await _W.replyUser(ctx, 'your current task has been canceled.')
    }

    task = async (ctx: Context, _W: WrapperContext, _M: PallasMemory) => {
        await ctx.reply('nya~')
    }
}