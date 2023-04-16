import log from './utils/logger.ts'
import { ts } from './utils/time.ts'
import { merge } from "https://raw.githubusercontent.com/lodash/lodash/4.17.21-es/lodash.js"
import type { Message } from 'https://deno.land/x/grammy_types@v3.0.3/message.ts'

type SequenceInput = {
    command: string | null
    task: string
    question: string[]
    answer: Message[]
}

type User = {
    sequenceInput: SequenceInput
    security: {
        spam: {
            count: number
            banCount: number
        }
    },
    timeouts: Record<string, ReturnType<typeof setTimeout>>,
    session: number
}

type Group = null // TODO: implement group memory

export default class PallasMemory {
    Users: Record<number, User> = {}
    Groups: Record<string, Group> = {}

    private SESSION_EXPIRE = 1 // hours

    constructor() {
        log('success', 'Pallas Memory initialized.')
    }

    private factoryUser(): User {
        return {
            sequenceInput: {
                command: null,
                task: 'default',
                question: [],
                answer: []
            },
            security: {
                spam: {
                    count: 0,
                    banCount: 0
                }
            },
            timeouts: {},
            session: ts().addHours(this.SESSION_EXPIRE)
        }
    }

    private factoryGroup(): Group {
        return null // TODO: implement group memory
    }

    checkUser(id: number): User {
        if ( !this.Users[id] ) {
            this.Users[id] = this.factoryUser()
            log('info', `user <${id}> created in memory.`)
        }

        return this.Users[id]
    }

    checkGroup(id: string): Group {
        if ( !this.Groups[id] ) this.Groups[id] = this.factoryGroup()
        return this.Groups[id]
    }

    getUser(id: number): User {
        return this.Users?.[id]
    }

    getGroup(id: string): Group {
        return this.Groups?.[id]
    }

    updateUser(id: number, data: Partial<User>): User {
        data.session = ts().addHours(this.SESSION_EXPIRE)
        return merge(this.Users[id], data)
    }

    updateGroup(id: string, data: Partial<Group>): Group {
        return merge(this.Groups[id], data)
    }

    clearSession() {
        for ( const [id, user] of Object.entries(this.Users) ) {
            if ( user.session < Date.now() ) {
                this.clearAllTimeouts(Number(id))
                delete this.Users[Number(id)]
                log('warn', `user <${id}> memory session expired.`)
            }
        }

        // TODO: implement group memory
    }

    setTimeout(id: number, name: string, callback: () => void, delay: number) {
        this.Users[id].timeouts[name] = setTimeout(callback, delay)
    }

    checkTimeout(id: number, name: string): boolean {
        return Boolean(this.Users[id].timeouts[name])
    }

    clearTimeout(id: number, name: string) {
        clearTimeout(this.Users[id].timeouts[name])
        delete this.Users[id].timeouts[name]
    }

    clearAllTimeouts(id: number) {
        for ( const [name, timeout] of Object.entries(this.Users[id].timeouts) ) {
            clearTimeout(timeout)
            delete this.Users[id].timeouts[name]
        }
    }

    setSeqInput(id: number, command: string, task: string, ...question: string[]) {
        this.checkUser(id)
        this.Users[id].sequenceInput.command = command
        this.Users[id].sequenceInput.task = task
        this.Users[id].sequenceInput.question.push(...question)
    }

    addSeqAnswer(id: number, answer: Message) {
        this.Users[id].sequenceInput.answer.push(answer)
    }

    getSeqInput(id: number): { command: string | null; task: string, question: string[]; answer: Message[] } {
        return this.Users[id].sequenceInput
    }

    isSeqInputRequired(id: number): boolean {
        return this.Users[id].sequenceInput.command !== null && 
            this.Users[id].sequenceInput.question.length > 0 &&
            this.Users[id].sequenceInput.answer.length < this.Users[id].sequenceInput.question.length
    }

    isSeqComplete(id: number): boolean {
        const seqcmd = this.Users[id].sequenceInput.command
        const qlen = this.Users[id].sequenceInput.question.length
        const alen = this.Users[id].sequenceInput.answer.length
        return seqcmd !== null && qlen === alen
    }

    clearSeqInput(id: number) {
        this.Users[id].sequenceInput.command = null
        this.Users[id].sequenceInput.task = 'default'
        this.Users[id].sequenceInput.question = []
        this.Users[id].sequenceInput.answer = []
    }
}

export type { SequenceInput }