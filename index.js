import puppeteer from 'puppeteer';
import moment from 'moment';
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

async function postTweet(status, mediaUrl) {
    try {
        const mediaId = await rwClient.v1.uploadMedia(mediaUrl);
        const tweet = await rwClient.v1.tweet(status, { media_ids: mediaId });
        console.log('트윗 성공:', tweet);
    } catch (error) {
        console.error('트윗 실패:', error);
    }
}

function createInstagramLink(postId) {
    return `https://www.instagram.com/p/${postId}/`;
}

function createCustomCaption(caption, timestamp, postId) {
    const adjustedCaption = caption.replace(/@/g, '@/');
    const date = moment(timestamp).format('YYMMDD');
    const postLink = createInstagramLink(postId);

    return `${date} #카즈하 인스타\n\n${adjustedCaption}\n\n🔗${postLink}`;
}

async function scrapeAndTweet() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.instagram.com/zuhazana/');

        const posts = await page.evaluate(() => {
            const postElements = Array.from(document.querySelectorAll('article div img'));
            return postElements.map(img => ({
                url: img.src,
                time: new Date().toISOString(),
                caption: "Auto-generated caption",  // 캡션을 가져오는 로직 추가 가능
                id: img.src.split('/').pop(),  // 게시물 ID 추출
                type: 'image'
            }));
        });

        for (const post of posts) {
            if (post.type === 'image') {
                const caption = createCustomCaption(post.caption, post.time, post.id);
                await postTweet(caption, post.url);
            }
        }

        await browser.close();
    } catch (error) {
        console.error('스크래핑 또는 트윗 실패:', error);
    }
}

scrapeAndTweet();