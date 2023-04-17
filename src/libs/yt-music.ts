import log from '../utils/logger.ts'

import { Innertube, YTNodes, Player } from "https://deno.land/x/youtubei@v4.3.0-deno/deno.ts"
import { InputFile } from "https://deno.land/x/grammy@v1.15.3/types.deno.ts"
import { Thumbnail } from 'https://deno.land/x/youtubei@v4.3.0-deno/deno/src/parser/misc.ts'

async function search(query: string) {
    const res = await (await Innertube.create()).search(query, {
        type: 'video'
    })

    return (res.results?.getAll(YTNodes.Video) as YTNodes.Video[]).map((v) => ({
        id: v.id,
        title: v.title,
        duration: v.duration,
        thumbnail: v.thumbnails[0].url,
        url: `https://www.youtube.com/watch?v=${v.id}`
    }))
}

async function download(id: string) {
    const res = await (await Innertube.create()).getInfo(id, 'TV_EMBEDDED')

    const player = await Player.create(undefined)
    const audioInfo = res.streaming_data?.adaptive_formats
        ?.filter(f => f.itag === 140)
        ?.filter(f => f.content_length < 50 * 1024 * 1024) // Max 50 MB
        ?.sort((a, b) => b.bitrate - a.bitrate)[0]

    if ( !audioInfo ) return null
    const audioData = await (await fetch(audioInfo.decipher(player))).arrayBuffer()

    const thumb = (res.basic_info?.thumbnail as Thumbnail[]).find(f => f.width === 320)?.url
    const thumbData = thumb ? await (await fetch(thumb)).arrayBuffer() : null
    log('info', `yt-music: requested for ${res.primary_info?.title}.`)

    return {
        file: new InputFile(new Uint8Array(audioData), `${res.primary_info?.title}.m4a`),
        title: res.primary_info?.title,
        thumb: thumbData ? new InputFile(new Uint8Array(thumbData), `thumb.jpg`) : undefined,
        duration: res.basic_info?.duration,
        author: res.basic_info?.author
    }
}

export default {
    search,
    download
}