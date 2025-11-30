import fcntl
import json
import os
import re
import threading
from datetime import datetime, timedelta, timezone
from functools import wraps
from logging import getLogger

import requests

from .models import Post

current_dir = os.path.dirname(os.path.abspath(__file__))
state_dir = os.path.join(current_dir, "data")
qr_path = os.path.join(state_dir, "qrcode.png")
state_path = os.path.join(state_dir, "login_state.json")
lock_path = os.path.join(state_dir, ".wxrunner.lock")
logger = getLogger(__name__)


def with_lock(func):
    """
    by fcntl : only on linux
    """

    @wraps(func)
    def wrapper(self, *args, **kwargs):
        lock_file = open(lock_path, "w")
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            logger.info(f"{os.getpid()} Acquired lock, task started")
        except BlockingIOError:
            logger.exception(f"{os.getpid()} Acquire lock failed")
            lock_file.close()
            return None

        try:
            return func(self, *args, **kwargs)
        except Exception:
            logger.exception(f"{os.getpid()} error occured")
            raise
        finally:
            try:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
                lock_file.close()
            except Exception:
                logger.exception(f"{os.getpid()} failed to release lock")
            logger.info(f"{os.getpid()} Released lock")

    return wrapper


class WxRunner:
    def __init__(self):
        self._lock = threading.Lock()
        self.token = None
        self.running = False
        self.thread = None

    def _on_response(self, response):
        url = response.url
        if "cgi-bin/scanloginqrcode?action=getqrcode" in url:
            try:
                body = response.body()
                with open(qr_path, "wb") as f:
                    f.write(body)
                logger.info(f"Saved QR code to {qr_path}")
            except Exception:
                logger.exception("Failed to save QR code")

    def _poll_for_token(self, page):
        max_retry = 1000
        retry = 0
        while self.running:
            try:
                retry += 1
                if retry > max_retry:
                    logger.warning("Timeout for token")
                    try:
                        os.remove(qr_path)
                    except FileNotFoundError:
                        pass
                    return

                url = page.url
                if "home" in url and "token=" in url:
                    match = re.search(r"token=([^&]+)", url)
                    if match:
                        self.token = match.group(1)
                        try:
                            os.remove(qr_path)
                        except FileNotFoundError:
                            pass
                        logger.info(f"Got token: {self.token}")
                        return
            except Exception:
                logger.exception("Failed to poll for token")
            page.wait_for_timeout(200)

    @with_lock
    def run(self):
        if self.running:
            return
        self.running = True

        logger.info("Starting automation for Wechat")
        browser = None
        context = None
        page = None

        try:
            from playwright.sync_api import sync_playwright

            with sync_playwright() as p:
                os.makedirs(state_dir, exist_ok=True)

                browser = p.chromium.launch(
                    headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
                )
                if os.path.exists(state_path):
                    logger.info("Use existing login state")
                    context = browser.new_context(
                        storage_state=state_path,
                        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    )
                else:
                    context = browser.new_context(
                        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    )
                context.add_init_script(
                    """
                        Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    """
                )
                page = context.new_page()

                page.on("response", self._on_response)

                page.goto("https://mp.weixin.qq.com/")

                self._poll_for_token(page)

                if self.token:
                    context.storage_state(path=state_path)
                    logger.info("Successfully logged in")
                else:
                    logger.error("Failed to login")

        except Exception:
            logger.exception("Failed to run automation")
        finally:
            if context:
                context = None
            if browser:
                browser = None
            self.running = False
            logger.info("Stopped automation")

    def start_thread(self):
        with self._lock:
            if not self.thread or not self.thread.is_alive():
                self.thread = threading.Thread(target=self.run, daemon=True)
                self.thread.start()
                logger.info("Starting thread for Wechat")


wx = WxRunner()

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


def get_state():
    if os.path.exists(os.path.join(state_dir, "login_state.json")):
        with open(
            os.path.join(state_dir, "login_state.json"), encoding="utf-8"
        ) as file:
            state = json.load(file)

        return state
    else:
        return None


def get_token():
    state = get_state()
    if not state:
        return None
    session = requests.Session()
    for cookie in state.get("cookies", []):
        session.cookies.set(
            name=cookie["name"],
            value=cookie["value"],
            domain=cookie["domain"],
            path=cookie["path"],
        )
    response = session.get(
        "https://mp.weixin.qq.com", headers=headers, allow_redirects=True
    )
    url = response.url
    token = None
    if "home" in url and "token=" in url:
        match = re.search(r"token=([^&]+)", url)
        if match:
            token = match.group(1)
    return token, session


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
        item["description"] = item["description"].split("/n")[0]
        item["publish_time"] = datetime.fromtimestamp(
            item["publish_time"], tz=timezone(timedelta(hours=8))
        ).strftime("%Y-%m-%d %H:%M:%S")

    return {"data": data, "count": count}


def update_posts(begin, count):
    token, session = get_token()
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
