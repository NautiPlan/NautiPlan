import json
import requests
from auth_util import gen_sign_headers

# 请注意替换APP_ID、APP_KEY
APP_ID = '2025795358'
APP_KEY = 'ZFiNLwhFLHHIcAVh'
URI = '/query_rewrite_base'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'POST'


def query_rewrite():
    params = {}
    post_data = {
        "prompts": [
            [
                "",
                "",
                "",
                "",
                "战狼2是谁主演的",
                "《战狼2》是由吴京执导并主演的一部军事战争题材电影。影片中，吴京饰演了主角冷锋，他是一名退役的特种部队军人，在非洲执行任务时遭遇了一连串危机和战斗。因此，《战狼2》的主演是吴京。"
            ],
            [
                "第一部里有他吗"
            ]
        ]
    }
    data = json.dumps(post_data)
    headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)

    url = 'http://{}{}'.format(DOMAIN, URI)
    response = requests.post(url, data=data, headers=headers)
    if response.status_code == 200:
        print(response.json())
    else:
        print(response.status_code, response.text)


if __name__ == '__main__':
    query_rewrite()
