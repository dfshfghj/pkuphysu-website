import json
import os
import random
import re
from datetime import datetime, timedelta, timezone
from http.cookiejar import Cookie
from logging import getLogger

import requests

from .models import Post

current_dir = os.path.dirname(os.path.abspath(__file__))
state_dir = os.path.join(current_dir, "data")
cookie_path = os.path.join(state_dir, "cookies.json")
logger = getLogger(__name__)


def save_cookies(session):
    cookies_list = []
    for cookie in session.cookies:
        cookie_dict = {
            'name': cookie.name,
            'value': cookie.value,
            'domain': cookie.domain,
            'path': cookie.path,
            'expires': cookie.expires if cookie.expires else None,
            'secure': cookie.secure,
            'rest': {'HttpOnly': cookie.has_nonstandard_attr('HttpOnly')}
        }
        cookies_list.append(cookie_dict)

    with open(cookie_path, 'w') as f:
        json.dump(cookies_list, f, indent=4)


def load_cookies(session):
    try:
        with open(cookie_path) as f:
            cookies_list = json.load(f)
        session.cookies.clear()
        for cookie_dict in cookies_list:
            cookie = Cookie(
                version=0,
                name=cookie_dict['name'],
                value=cookie_dict['value'],
                port=None,
                port_specified=False,
                domain=cookie_dict['domain'],
                domain_specified=bool(cookie_dict['domain']),
                domain_initial_dot=cookie_dict['domain'].startswith('.'),
                path=cookie_dict['path'],
                path_specified=bool(cookie_dict['path']),
                secure=cookie_dict['secure'],
                expires=cookie_dict['expires'],
                discard=False,
                comment=None,
                comment_url=None,
                rest=cookie_dict['rest']
            )
            session.cookies.set_cookie(cookie)

    except Exception as e:
        print(e)


session = requests.Session()
load_cookies(session)
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    "origin": "https://mp.weixin.qq.com",
    "referer": "https://mp.weixin.qq.com/",
}


def get_qrcode(fingerprint):
    session.get("https://mp.weixin.qq.com")
    session.post("https://mp.weixin.qq.com/cgi-bin/bizlogin",
                 data={
                     "action": "prelogin",
                     "fingerprint": fingerprint,
                     "token": None,
                     "lang": "zh_CN",
                     "f": "json",
                     "ajax": 1,
                 },
                 headers=headers)
    session.post("https://mp.weixin.qq.com/cgi-bin/bizlogin?action=startlogin",
                 data={
                     "userlang": "zh_CN",
                     "redirect_url": None,
                     "login_type": 3,
                     "sessionid": f"{int(datetime.now().timestamp() * 1000)}{int(random.randint(10, 99) * 100)}",
                     "fingerprint": fingerprint,
                     "token": None,
                     "lang": "zh_CN",
                     "f": "json",
                     "ajax": 1,
                 },
                 headers=headers)
    getqrcode = session.get(f"https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=getqrcode&random={int(datetime.now().timestamp() * 1000)}&login_appid=",
                            headers=headers)

    return getqrcode


def ask_qrcode(fingerprint):
    askqrcode = session.get(
        f"https://mp.weixin.qq.com/cgi-bin/scanloginqrcode?action=ask&fingerprint={fingerprint}&token=&lang=zh_CN&f=json&ajax=1", headers=headers)
    return askqrcode.json()


def login(fingerprint):
    login = session.post("https://mp.weixin.qq.com/cgi-bin/bizlogin?action=login",
                         data={
                             "userlang": "zh_CN",
                             "redirect_url": '',
                             "cookie_forbidden": '0',
                             "cookie_cleaned": '1',
                             "plugin_used": '0',
                             "login_type": '3',
                             "fingerprint": fingerprint,
                             "token": None,
                             "lang": "zh_CN",
                             "f": "json",
                             "ajax": 1,
                         }, headers=headers)
    return login.json()


def get_state():
    if os.path.exists(cookie_path):
        with open(cookie_path, encoding="utf-8") as file:
            state = json.load(file)

        return state
    else:
        return None


def get_token():
    response = session.get(
        "https://mp.weixin.qq.com", headers=headers, allow_redirects=True
    )
    url = response.url
    token = None
    if "home" in url and "token=" in url:
        match = re.search(r"token=([^&]+)", url)
        if match:
            token = match.group(1)
        save_cookies(session)
    return token


def load_posts(offset=0, limit=10, mp_name="物院学生会"):
    posts = (
        Post.query.filter_by(mp_name=mp_name)
        .order_by(Post.publish_time.desc(), Post.id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    count = Post.query.filter_by(mp_name=mp_name).count()
    data = [
        {
            "id": post.id,
            "title": post.title,
            "description": post.description,
            "mp_name": post.mp_name,
            "url": post.url,
            "publish_time": post.publish_time,
        }
        for post in posts
    ]
    for item in data:
        matches = re.match("【(.*)】", item["title"])
        item["tag"] = matches.group(1) if matches else "其它"
        item["title"] = re.sub("【.*】", "", item["title"]).strip()
        item["description"] = item["description"].split("\n")[0]
        item["publish_time"] = datetime.fromtimestamp(
            item["publish_time"], tz=timezone(timedelta(hours=8))
        ).strftime("%Y-%m-%d %H:%M:%S")

    return {"data": data, "count": count}


def update_posts(begin, count):
    token = get_token()
    if not token:
        return
    api_url = f"https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&begin={begin}&count={count}&token={token}&lang=zh_CN&f=json"
    response = session.get(api_url, headers=headers)
    if response.ok:
        data = response.json()
        posts = []
        data = json.loads(data["publish_page"])["publish_list"]
        for item in data:
            item["publish_info"] = json.loads(item["publish_info"])
            for sub_item in item["publish_info"]["appmsg_info"]:
                post = {
                    "title": sub_item["title"],
                    "description": sub_item["digest"],
                    "mp_name": "物院学生会",
                    "url": sub_item["content_url"],
                    "publish_time": sub_item["line_info"]["send_time"],
                }
                posts.append(post)
        Post.merge_posts(posts)
        return posts
