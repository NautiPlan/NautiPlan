import base64
import uuid
import time
import requests
from auth_util import gen_sign_headers

APP_ID = '2025795358'
APP_KEY = 'ZFiNLwhFLHHIcAVh'
URI = '/vivogpt/completions'
DOMAIN = 'api-ai.vivo.com.cn'
METHOD = 'POST'
PIC_FILE = 'test.jpg'


def stream_vivogpt():
    params = {
        'requestId': str(uuid.uuid4())
    }
    print('requestId:', params['requestId'])
    picture = PIC_FILE
    with open(picture, "rb") as f:
        b_image = f.read()
    image = base64.b64encode(b_image).decode('utf-8')
    data = {
        'prompt': '你好',
        'sessionId': str(uuid.uuid4()),
        'requestId': params['requestId'],
        'model': 'vivo-BlueLM-V-2.0',
        "messages": [
            {
                "role": "user",
                "content": "data:image/JPEG;base64," + image,
                "contentType": "image"
            },
            {
                "role": "user",
                "content": "描述图片的内容",
                "contentType": "text"
            }
        ],
    }
    headers = gen_sign_headers(APP_ID, APP_KEY, METHOD, URI, params)
    headers['Content-Type'] = 'application/json'

    start_time = time.time()
    url = 'http://{}{}'.format(DOMAIN, URI)
    response = requests.post(url, json=data, headers=headers, params=params)

    if response.status_code == 200:
        print(response.json())
    else:
        print(response.status_code, response.text)
    end_time = time.time()
    timecost = end_time - start_time
    print("请求耗时: %.2f秒" % timecost)


if __name__ == "__main__":
    stream_vivogpt()
