import axios from 'axios';
import fetch from 'node-fetch';
import asyncRetry from "async-retry";

const _tiktokapi = (Params) => `https://api22-normal-c-useast2a.tiktokv.com/aweme/v1/feed/?${Params}`

const fetchTiktokData = async (ID) => {
  let data2
  await asyncRetry(
    async () => {
      const res = await fetch(
        _tiktokapi(
          new URLSearchParams(
            withParams({
              aweme_id: ID
            })
          ).toString()
        ),
        {
          method: "GET",
          headers: {
            "User-Agent": "com.ss.android.ugc.trill/494+Mozilla/5.0+(Linux;+Android+12;+2112123G+Build/SKQ1.211006.001;+wv)+AppleWebKit/537.36+(KHTML,+like+Gecko)+Version/4.0+Chrome/107.0.5304.105+Mobile+Safari/537.36"
          }
        }
      )

      if (res.headers.get("content-length") !== "0") {
        const data = await res.json()
        if (data) {
          data2 = parseTiktokData(data)
          return
        }
      }

      throw new Error("Data is empty!")
    },
    { forever: true, minTimeout: 0, maxTimeout: 0 }
  )

  return data2
}

export const TiktokDL = (url) => new Promise(async (resolve) => {
    url = url.replace("https://vm", "https://vt")
    axios
      .head(url)
      .then(async ({ request }) => {
        const { responseUrl } = request.res
        let ID = responseUrl.match(/\d{17,21}/g)
        if (ID === null)
          return resolve({
            status: "error",
            message: "Failed to fetch tiktok url. Make sure your tiktok url is correct!"
          })
        ID = ID[0]
        let data2 = await fetchTiktokData(ID)
        if (!data2.content) {
          return resolve({
            status: "error",
            message: "Failed to fetch tiktok data. Make sure your tiktok url is correct!"
          })
        }

        const { content, author, music } = data2

        // Download Result
        if (content.image_post_info) {
          // Images or Slide Result
          resolve({
            status: "success",
            result: {
              type: "image",
              id: content.aweme_id,
              createTime: content.create_time,
              description: content.desc,
              hashtag: content.text_extra.filter((x) => x.hashtag_name !== undefined).map((v) => v.hashtag_name),
              author,
              images: content.image_post_info.images.map((v) => v.display_image.url_list[0]),
              music
            }
          })
        } else {
          // Video Result
          resolve({
            status: "success",
            result: {
              type: "video",
              id: content.aweme_id,
              createTime: content.create_time,
              description: content.desc,
              hashtag: content.text_extra.filter((x) => x.hashtag_name !== undefined).map((v) => v.hashtag_name),
              duration: toMinute(content.duration),
              author,
              video: content.video.play_addr.url_list,
              cover: content.video.cover.url_list,
              dynamicCover: content.video.dynamic_cover.url_list,
              originCover: content.video.origin_cover.url_list,
              music
            }
          })
        }
        })
      .catch((e) => resolve({ status: "error", message: e.message }))
  })

  const parseTiktokData = (data) => {
    let content = data?.aweme_list
    if (!content) return { content: null }
  
    content = content[0]
  
    // Author Result
    const author = {
      uid: content.author.uid,
      username: content.author.unique_id,
      nickname: content.author.nickname,
      signature: content.author.signature,
      region: content.author.region,
      avatarThumb: content.author.avatar_thumb.url_list,
      avatarMedium: content.author.avatar_medium.url_list,
      url: `https://tiktok.com/@${content.author.unique_id}`
    }
  
    // Music Result
    const music = {
      id: content.music.id,
      title: content.music.title,
      author: content.music.author,
      album: content.music.album,
      playUrl: content.music.play_url.url_list,
      coverLarge: content.music.cover_large.url_list,
      coverMedium: content.music.cover_medium.url_list,
      coverThumb: content.music.cover_thumb.url_list,
      duration: content.music.duration
    }
  
    return { content, author, music }
  }

  const withParams = (args) => {
    return {
      ...args,
      version_name: "1.1.9",
      version_code: "2018111632",
      build_number: "1.1.9",
      manifest_version_code: "2018111632",
      update_version_code: "2018111632",
      openudid: randomChar("0123456789abcdef", 16),
      uuid: randomChar("1234567890", 16),
      _rticket: Date.now() * 1000,
      ts: Date.now(),
      device_brand: "Google",
      device_type: "Pixel 4",
      device_platform: "android",
      resolution: "1080*1920",
      dpi: 420,
      os_version: "10",
      os_api: "29",
      carrier_region: "US",
      sys_region: "US",
      region: "US",
      app_name: "trill",
      app_language: "en",
      language: "en",
      timezone_name: "America/New_York",
      timezone_offset: "-14400",
      channel: "googleplay",
      ac: "wifi",
      mcc_mnc: "310260",
      is_my_cn: 0,
      aid: 1180,
      ssmix: "a",
      as: "a1qwert123",
      cp: "cbfhckdckkde1"
    }
  }
  
  const randomChar = (char, range) => {
    let chars = ""
  
    for (let i = 0; i < range; i++) {
      chars += char[Math.floor(Math.random() * char.length)]
    }
  
    return chars
  }

  const toMinute = (duration) => {
    const mins = ~~((duration % 3600) / 60)
    const secs = ~~duration % 60
  
    let ret = ""
  
    ret += "" + mins + ":" + (secs < 10 ? "0" : "")
    ret += "" + secs
  
    return ret
  }