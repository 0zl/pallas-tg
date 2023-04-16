import * as Muse from 'https://deno.land/x/muse@0.0.20/mod.ts'

async function searchMusic(query: string) {
    return await Muse.search(query, {
        limit: 5
    })
}

async function getData(videoId: string) {
    return await Muse.get_song(videoId)
}

export default {
    searchMusic,
    getData
}