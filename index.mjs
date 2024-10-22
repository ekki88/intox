import instagramScraper from 'instagram-scraper';
import moment from 'moment';
import { TwitterApi } from 'twitter-api-v2';

// 트위터 API 클라이언트 설정
const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY,
    appSecret: process.env.TWITTER_APP_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = client.readWrite;

// 트윗을 작성하는 함수
async function postTweet(status, mediaUrl) {
    try {
        // 미디어를 업로드하는 과정 (이미지를 트위터에 업로드)
        const mediaId = await rwClient.v1.uploadMedia(mediaUrl);

        // 트윗 작성 요청
        const tweet = await rwClient.v1.tweet(status, { media_ids: mediaId });
        console.log('트윗 성공:', tweet);
    } catch (error) {
        console.error('트윗 실패:', error);
    }
}

// 인스타그램 게시물의 링크 생성 함수
function createInstagramLink(postId) {
    return `https://www.instagram.com/p/${postId}/`;
}

// 캡션을 조정하고 기본 텍스트 추가하는 함수
function createCustomCaption(caption, timestamp, postId) {
    // 인스타그램 캡션 내에서 @를 @/로 변환
    const adjustedCaption = caption.replace(/@/g, '@/');

    // 날짜 포맷 (업로드 당일 날짜, YYMMDD 형식)
    const date = moment(timestamp).format('YYMMDD');

    // 인스타그램 게시물 링크 추가
    const postLink = createInstagramLink(postId);

    // 기본 텍스트 추가
    const finalCaption = `${date} #카즈하 인스타\n\n${adjustedCaption}\n\n🔗${postLink}`;

    return finalCaption;
}

// 인스타그램에서 게시물을 스크래핑하고 트윗하는 함수
async function scrapeAndTweet() {
    try {
        const posts = await instagramScraper.getPosts('zuhazana'); // 허윤진 계정 이름을 사용
        posts.forEach(async (post) => {
            if (post.type === 'image') {
                const caption = createCustomCaption(post.caption, post.time, post.id);
                await postTweet(caption, post.url); // 인스타 사진을 트위터로 트윗
            }
        });
    } catch (error) {
        console.error('스크래핑 또는 트윗 실패:', error);
    }
}

scrapeAndTweet();
