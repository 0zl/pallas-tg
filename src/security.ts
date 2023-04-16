import log from "./utils/logger.ts"
import PallasMemory from "./memory.ts"

import { Context } from "./main.ts"
import { EventEmitter } from 'https://deno.land/x/event@2.0.1/mod.ts'

type PallasSecurityEvents = {
    messageSpam: [ctx: Context]
}

export default class PallasSecurity extends EventEmitter<PallasSecurityEvents> {
    PMemory: PallasMemory

    private MAX_SPAM_COUNTER = 3
    private MAX_SPAM_BAN_COUNTER = 3
    private RESET_SPAM_COUNTER = 2_000
    private RESET_SPAM_BAN_COUNTER = 15_000

    constructor(PallasMemory: PallasMemory) {
        super()
        this.PMemory = PallasMemory
        log('success', 'Pallas Security initialized.')
    }

    checkMessageSpam(ctx: Context): boolean {
        const uid = ctx.from?.id
        const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup'

        if ( !uid || !isGroup ) return false
        
        const user = this.PMemory.getUser(uid)
        const { spam } = user.security

        if ( spam.count < this.MAX_SPAM_COUNTER ) {
            spam.count++

            if ( this.PMemory.checkTimeout(uid, 'spmcx') )
                this.PMemory.clearTimeout(uid, 'spmcx')
            
            this.PMemory.setTimeout(uid, 'spmcx', () => {
                spam.count = 0
            }, this.RESET_SPAM_COUNTER)
        } else {
            spam.count = Math.max(0, Math.floor(spam.count / 2))
            spam.banCount++

            if ( this.PMemory.checkTimeout(uid, 'spmbcx') )
                this.PMemory.clearTimeout(uid, 'spmbcx')
            
            this.PMemory.setTimeout(uid, 'spmbcx', () => {
                spam.banCount = 0
            }, this.RESET_SPAM_BAN_COUNTER)

            if ( spam.banCount >= this.MAX_SPAM_BAN_COUNTER ) {
                spam.count = 0
                spam.banCount = 0

                this.PMemory.clearTimeout(uid, 'spmcx')
                this.PMemory.clearTimeout(uid, 'spmbcx')

                this.emit('messageSpam', ctx)
                return true
            }
        }

        return false
    }
}