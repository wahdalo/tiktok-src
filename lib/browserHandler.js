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
 * Run browser instance
 */
async function runBrowser() {
    const browser = await puppeteer.launch(browserOptions)
    const browserPage = await browser.newPage()
    //await browserPage.setViewport({ width: 1920, height: 1080 })
    const resCheckSession = await checkSession()
    if (resCheckSession) {
        printLog('INFO: Session ditemukan, mencoba akses Facebook...')
        const fullPath = path.resolve("./cookies.json");
        await browserPage.setCookie(...JSON.parse(await fs.readFile(fullPath)))
        return { browser, page: browserPage }
    } else {
        printLog('INFO: Session tidak ditemukan...')
    }
}

/**
 * Upload video to reels via browser
 */
export const ReelsUpload = async (namafile, caption) => {
  const { browser, page } = await runBrowser()
  try {
    await page.goto('https://www.facebook.com/reels/create', browserPageOpt)
    printLog("Berhasil membuka fb")
    try {
        const [filechooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click("div[id^=mount_0_0] div > div:nth-child(1) > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > form > div > div > div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.xeuugli.x2lah0s.x1t2pt76.x1xzczws.x1cvmir6.x1vjfegm.xwn1f64 > div > div.xb57i2i.x1q594ok.x5lxg6s.x78zum5.xdt5ytf.x6ikm8r.x1ja2u2z.x1pq812k.x1rohswg.xfk6m8.x1yqm8si.xjx87ck.x1l7klhg.x1iyjqo2.xs83m0k.x2lwn1j.xx8ngbg.xwo3gff.x1oyok0e.x1odjw0f.x1e4zzel.x1n2onr6.xq1qtft > div.x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6 > div.x1xmf6yo.x78zum5.xdt5ytf.x1iyjqo2 > div > div > div.x1u5z0ei > div > div > div > div > div > div:nth-child(1) > div"),
        ])
        await delay(2000)
        const fullPath = path.resolve(`./download/${namafile}.mp4`);
        filechooser.accept([fullPath])
        printLog(`sukses Upload video ${namafile}.mp4`)
        await delay(5000)
        await page.click("div[id^=mount_0_0] > div > div:nth-child(1) > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > form > div > div > div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.xeuugli.x2lah0s.x1t2pt76.x1xzczws.x1cvmir6.x1vjfegm.xwn1f64 > div > div.xnw9j1v.xyamay9.x4uap5.xx6bls6.xkhd6sd > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.x2lah0s.x1qughib.x1qjc9v5.xozqiw3.x1q0g3np.xn6708d.x1ye3gou.xyamay9.xcud41i.x139jcc6.x4vbgl9.x1rdy4ex > div > div")
        await delay(2000)
        await page.click("div[id^=mount_0_0] > div > div:nth-child(1) > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > form > div > div > div.x9f619.x1n2onr6.x78zum5.xdt5ytf.x193iq5w.xeuugli.x2lah0s.x1t2pt76.x1xzczws.x1cvmir6.x1vjfegm.xwn1f64 > div > div.xnw9j1v.xyamay9.x4uap5.xx6bls6.xkhd6sd > div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.x2lah0s.x1qughib.x1qjc9v5.xozqiw3.x1q0g3np.xn6708d.x1ye3gou.xyamay9.xcud41i.x139jcc6.x4vbgl9.x1rdy4ex > div:nth-child(2)")
        await delay(2000)
        const usernameElement = await page.$x(`//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div/div[1]/form/div/div/div[1]/div/div[2]/div[1]/div[2]/div/div/div/div/div[1]/div[1]/div[1]`);
        await usernameElement[0].click();
        const tanggalupload = moment().format('MMMM Do YYYY, HH:mm:ss')
        await usernameElement[0].type(`${caption}\n\nVideo Upload automate by nodejs\non ${tanggalupload}  `);
        printLog("Menginput Caption...")
        const PostButton = await page.$x(`//*[starts-with(@id, "mount")]/div/div[1]/div/div[3]/div/div/div/div[1]/form/div/div/div[1]/div/div[3]/div[2]/div[2]/div[1]/div`);
        await PostButton[0].click()
        printLog("Post ke Reels", 'yellow')
        await page.waitForNavigation()
        await browser.close()
        printLog("Berhasil")
    } catch (err) {
        console.log(err)
        await browser.close()
    }
  } catch (err) {
      printLog("gagal")
      console.log(err)
      await browser.close()
  }
}
