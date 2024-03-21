const functions = require("firebase-functions");
const puppeteer = require("puppeteer");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const scrapeData = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'] // Added for running in serverless environments
    });

    const page = await browser.newPage();
    await page.goto("https://en.wikipedia.org/wiki/Main_Page", {
        waitUntil: "domcontentloaded"
    });

    const body = await page.evaluate(() => {
        const imgReference = document.querySelector('#mp-otd #mp-otd-img img');
        const listReference = document.querySelectorAll("#mp-otd > ul li");
        let imgSource = imgReference.getAttribute('src');
        imgSource = imgSource.replace('thumb/', '');
        let fileExIndex = Math.max(imgSource.indexOf('.jpg/'), imgSource.indexOf('.png/'), imgSource.indexOf('.JPG/'), imgSource.indexOf('.PNG/'));
        imgSource = imgSource.substring(0, fileExIndex + 4);

        let list = Array.from(listReference).map((item) => {
            const itemLink = item.querySelector('b a').getAttribute('href');
            return {
                link: itemLink ? `https://en.wikipedia.org/${itemLink}` : undefined,
                text: item.innerText
            }
        })

        return { imgSource, list };
    });

    await browser.close();

    return body;
}

exports.pubsub = functions.region('us-central1').runWith({ memory: '2GB' }).pubsub.schedule("0 0 * * *").timeZone("America/Los_Angeles").onRun(
    async () => {
        try {
            const scrapeDataResult = await scrapeData();
            await db.collection('day').doc(getToday()).set(scrapeDataResult);
        } catch (error) {
            throw new Error(error);
        }
    }
);

const getToday = () => {
    const today = new Date();
    return `${today.getDate()}${today.getMonth() + 1}${today.getFullYear()}`
}
