import requests
from bs4 import BeautifulSoup


def get_proxy():
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}

        res = requests.get("https://www.proxyscan.io/api/proxy?format=json&type=socks4&country=kr", headers=headers)

        json = res.json()

        ip = json[0]["Ip"]

        if ip in overlap_check:
            print("똑같은 아이피가 나와 새로운 아이피를 다시 구합니다.\n계속 알림이 뜬다면 프록시를 다 사용한거니 프로그램을 종료해주세요")
            return get_proxy()
        else:
            overlap_check.append(ip)

        return {
            "ip": ip,
            "port": json[0]["Port"]
        }
    except Exception as e:
        print(f"오류로 인해 프록시를 구하지 못했습니다. 오류: {e}")


def get_token():
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0"}

        res = requests.get(url, headers=headers)
        soup = BeautifulSoup(res.text, "html.parser")

        token = res.cookies["ci_c"]
        gallId = soup.select_one("#id").attrs["value"]
        no = soup.select_one("#no").attrs["value"]

        return {
            "token": token,
            "gallId": gallId,
            "no": no
        }
    except Exception as e:
        print(f"오류로 인해 토큰을 구하지 못했습니다. 오류: {e}")


def fabrication_star():
    try:
        token = get_token()
        proxy_info = get_proxy()

        data = {"ci_t": token["token"], "id": token["gallId"], "no": token["no"], "mode": vote_mode,
                "code_recommend": "undefined"}

        headers = {
            "Host": "gall.dcinside.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0",
            "Accept": "*/*",
            "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": url,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://gall.dcinside.com",
            "Connection": "keep-alive"
        }

        proxies = {
            "https": f"socks4://{proxy_info['ip']}:{proxy_info['port']}",
        }

        cookies = {f"{token['gallId']}{token['no']}_Firstcheck{'_down' if vote_mode == 'D' else ''}": "Y",
                   "ci_c": token['token']}

        res = requests.post("https://gall.dcinside.com/board/recommend/vote", headers=headers, cookies=cookies,
                            proxies=proxies, data=data)

        split_text = res.text.split('||')

        if split_text[0] in "true":
            print(f"{'비' if vote_mode == 'D' else ''}추천 성공 수: {split_text[1]}")
        else:
            print(f"{'비' if vote_mode == 'D' else ''}추천 실패 사유: {split_text[1]}")
    except Exception as e:
        print(f"오류로 인해 {'비' if vote_mode == 'D' else ''}추천을 하지 못했습니다. 오류: {e}")


overlap_check = []
loop = input("몇번 반복하겠습니까: ")
vote_mode = input("게시글을 추천하시겠습니까? (U = 추천, D = 비추천): ")
url = input("게시글 주소를 입력해주세요: ")

if not loop.isdigit() or vote_mode != "U" and vote_mode != "D" or not url:
    print("올바르지 못한 입력")
    exit()

for i in range(int(loop)):
    print(f"{i + 1}번째 {'비' if vote_mode == 'D' else ''}추천 중...")
    fabrication_star()
