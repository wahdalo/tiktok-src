import puppeteer from 'puppeteer'
import moment from 'moment'
import delay from 'delay'
import fs from 'fs-extra'
import path from 'path'

/**
 * Browser options
 */
const browserHide = false
const browserPageOpt = { waitUntil: 'networkidle0' }
const browserOptions = {
  // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: browserHide,
  args: [
    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"'
  ]
}

//kumpulan selector
const uploadButtonSelector = `//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div[1]/div/div/div`
const nextButtonSelector = `//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div/div/div`
const nextButtonSelector2 = `//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div[2]/div[1]/div`
const textAreaSelector =  `//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div/div/div[1]/div[1]/div[1]`
const publishButtonSelector = `//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div[2]/div[1]`

//fungsi cek sesi valid
function checkSession() {
    return new Promise(async (resolve, reject) => {
      try {
        const fullPath = path.resolve("./cookies.json");
        const cookies = JSON.parse(await fs.readFile(fullPath))
        if (cookies.length !== 0) {
          resolve(true)
        } else {
          resolve(false)
        }
      } catch (err) {
        resolve(false)
      }
    })
  }

/**
 * Generate console log with timestamp
 */
function printLog(str) {
    const date = moment().format('HH:mm:ss')
    console.log(`[${date}] ${str}`)
}

/**
 * Upload video to reels via browser
 */
export const ReelsUpload = (namafile, caption) => new Promise(async (resolve) => {
  const browser = await puppeteer.launch(browserOptions)
  const page = await browser.newPage()
  const resCheckSession = await checkSession()
  if (resCheckSession) {
    printLog('INFO: Session ditemukan, mencoba akses Facebook...')
    const fullPath = path.resolve("./cookies.json");
    await page.setCookie(...JSON.parse(await fs.readFile(fullPath)))
    try {
      await page.goto('https://www.facebook.com/reels/create', browserPageOpt)
      printLog("Berhasil membuka fb")
      const uploadElement = await page.$x(uploadButtonSelector);
      const [filechooser] = await Promise.all([
      page.waitForFileChooser(),
      await uploadElement[0].click()
      ])
      await delay(2000)
      const fullPath = path.resolve(`./download/${namafile}.mp4`);
      filechooser.accept([fullPath])
      printLog(`sukses Upload video ${namafile}.mp4`)
      await delay(5000)
      const nextElement = await page.$x(nextButtonSelector);
      await nextElement[0].click()
      await delay(2000)
      const nextElement2 = await page.$x(nextButtonSelector2);
      await nextElement2[0].click()
      await delay(2000)
      const usernameElement = await page.$x(textAreaSelector);
      await usernameElement[0].click();
      await usernameElement[0].type(`${caption}`);
      printLog("Menginput Caption...")
      const PostButton = await page.$x(publishButtonSelector);
      await PostButton[0].click()
      printLog("Post ke Reels", 'yellow')
      await page.waitForNavigation()
      await browser.close()
      printLog("Berhasil")
      return resolve({
        status: "success",
        message: "Video Berhasil di publish!"
      })
    } catch (err) {
        printLog(err)
        await browser.close()
        return resolve({
          status: "error",
          message: "Video Gagal di publish!"
      })
    }
  } else {
    await browser.close()
    const err = 'INFO: Session tidak ditemukan...'
    printLog(err)
    return resolve({
      status: "error",
      message: err
  })
  }
})
