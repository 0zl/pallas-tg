import { Innertube, YTNodes } from "https://deno.land/x/youtubei@v4.3.0-deno/deno.ts"

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

export default {
    search
}