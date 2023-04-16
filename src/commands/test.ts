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
        console.log('owo?')
        await ctx.reply('nya!', {
            reply_markup: new InlineKeyboard()
                .text('meong', 'owo').row()
                .text('nyaa', 'owo').row()
                .text('1', 'owo')
                .text('2', 'owo')
                .text('3', 'owo')
                .text('4', 'owo')
                .text('5', 'owo')
                .text('6', 'owo')
                .text('7', 'owo')
                .text('8', 'owo')
        })
    }
}