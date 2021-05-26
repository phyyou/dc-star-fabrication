const axios = require('axios');
const cheerio = require('cheerio');
const SocksProxyAgent = require('socks-proxy-agent');

(async () => {
    if (process.argv.length < 4)
        return console.log(`사용법: node index.js (반복) (U | D) "(url)"`);

    process.title = '디시인사이드 념글 주작기 Made By green1052';

    const loop = parseInt(process.argv[2]);
    const voteMode = process.argv[3].toUpperCase();
    const url = new URL(process.argv[4]);

    if (!loop || !url || voteMode !== 'U' && voteMode !== 'D')
        return console.log(`사용법: node index.js (반복) (U | D) "(url)"`);

    const voteStr = voteMode === 'U' ? '추천' : '비추천';
    const overlapCheck = [];

    async function GetProxy() {
        try {
            const response = await axios.get('https://www.proxyscan.io/api/proxy?format=json&type=socks4&country=kr', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0'
                }
            });

            if (overlapCheck.includes(response.data[0]['Ip'])) {
                console.log('똑같은 아이피가 나와 새로운 아이피를 다시 구합니다.\n계속 알림이 뜬다면 프록시를 다 사용한거니 프로그램을 종료해주세요');
                return await GetProxy();
            } else
                overlapCheck.push(response.data[0]['Ip']);

            return {
                'ip': response.data[0]['Ip'],
                'port': response.data[0]['Port']
            };
        } catch (e) {
            throw e;
        }
    }

    function GetCookie(cookies, name) {
        for (const cookie of cookies) {
            if (cookie.includes(name))
                return cookie.split(';')[0].slice(name.length + 1);
        }

        throw `${name} 쿠키를 찾지 못했습니다.`;
    }

    async function GetToken() {
        try {
            const response = await axios.get(url.href, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
                }
            });

            const $ = cheerio.load(response.data);

            const token = GetCookie(response.headers['set-cookie'], 'ci_c');

            const gall_id = $('#id').val();
            const no = $('#no').val();
            const gall_type = $("#_GALLTYPE_").val();

            return {
                'token': token,
                'gall_id': gall_id,
                'no': no,
                'gall_type': gall_type
            };
        } catch (e) {
            console.log(`${voteStr}을 하던 중 오류가 발생했습니다. 오류: ${e}`);
            process.exit();
        }
    }

    async function FabricationStar(token) {
        try {
            const proxy = await GetProxy();

            const response = await axios.post('https://gall.dcinside.com/board/recommend/vote', `ci_t=${token.token}&id=${token.gall_id}&no=${token.no}&mode=${voteMode}&_GALLTYPE_=${token.gall_type}&code_recommend=undefined`, {
                headers: {
                    'Host': 'gall.dcinside.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
                    'Accept': '*/*',
                    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': url.href,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': 'https://gall.dcinside.com',
                    'Connection': 'keep-alive',
                    'Cookie': `${token.gall_id}${token.no}_Firstcheck${voteMode === 'D' ? '_down' : ''}=Y; ci_c=${token.token};`
                },
                httpsAgent: new SocksProxyAgent(`socks4://${proxy.ip}:${proxy.port}`)
            });

            const split = response.data.split('||');

            if (split[0].includes('true'))
                console.log(`${voteStr} 성공 ${voteStr} 수: ${split[1]}`);
            else
                console.log(`${voteStr} 실패 사유: ${split[1]}`);
        } catch (e) {
            console.log(`${voteStr}을 하던 중 오류가 발생했습니다. 오류: ${e}`);
        }
    }

    const token = await GetToken();

    for (let i = 0; i < loop; i++) {
        console.log(`${i + 1}번째 ${voteStr} 중...`);
        await FabricationStar(token);
    }
})();
