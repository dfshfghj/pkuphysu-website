import requests

from pkuphysu_website.config import settings

respones = requests.post(
    "http://127.0.0.1:8080/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {settings.models.API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "model": "doubao",
        "messages": [{"role": "user", "content": "你好，请介绍一下你自己"}],
        "stream": False,
    },
)

print(respones.json())
