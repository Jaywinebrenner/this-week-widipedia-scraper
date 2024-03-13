const puppeteer = require('puppeteer');

const scrapeData = async () => {

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();
    await page.goto("https://en.wikipedia.org/wiki/Main_Page", {
        waitUntil: "domcontentloaded"
    });

    const body = await page.evaluate(()=> {
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

        return {imgSource, list};
        
    });

    browser.close();

    return body;

}

scrapeData();

exports.scrapeData = scrapeData;
