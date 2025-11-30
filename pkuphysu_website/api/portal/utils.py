import json
import random
import re
from datetime import datetime
from logging import getLogger
from os.path import dirname, join

import html2text
import requests

from pkuphysu_website.wechat.utils import load_posts

logger = getLogger(__name__)


class DataManager:
    def __init__(self):
        self._activity_data = None
        self._menu_data = None
        self._news_data = None
        self._news_expire = 3600

        self.load_activity_data()
        self.load_menu_data()
        self.load_news_data()

    def load_activity_data(self):
        with open(
            join(dirname(__file__), "data", "activity.json"), encoding="utf-8"
        ) as file:
            data = json.load(file)
            for activity in data:
                activity["start_time"] = datetime.strptime(
                    activity["start"], "%Y-%m-%d"
                )
                activity["end_time"] = datetime.strptime(activity["end"], "%Y-%m-%d")

        self._activity_data = {"data": data, "timestamp": datetime.now().timestamp()}

    def load_menu_data(self):
        with open(
            join(dirname(__file__), "data", "menu.json"), encoding="utf-8"
        ) as file:
            data = json.load(file)

        self._menu_data = {"data": data, "timestamp": datetime.now().timestamp()}

    def load_news_data(self):
        with open(
            join(dirname(__file__), "data", "news.json"), encoding="utf-8"
        ) as file:
            data = json.load(file)
        with open(
            join(dirname(__file__), "data", "extra_news.json"), encoding="utf-8"
        ) as file:
            data += json.load(file)

        self._news_data = {"data": data, "timestamp": datetime.now().timestamp()}

    def get_activity_data(self):
        return self._activity_data["data"]

    def get_menu_data(self):
        return self._menu_data["data"]

    def get_news_data(self):
        self.load_news_data()
        return self._news_data["data"]

    def fetch_news_data(self):
        logger.info("Start fetching news data")
        news_data = []
        posts = load_posts(offset=0, limit=20)["data"]
        for post in posts:
            if "壹周物语" in post["title"]:
                news_report_url = post["url"]
                break

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            )
        }
        html = requests.get(news_report_url, headers=headers).text
        handler = html2text.HTML2Text()
        handler.ignore_images = True
        handler.ignore_emphasis = True
        text = handler.handle(html)
        lines = [line.strip() for line in text.split("\n")]
        lines = [line for line in lines if line]
        for i in range(len(lines)):
            match = re.match(r"传送门(.*?)\(\s*(.*?)\)", lines[i])
            if match:
                title = re.sub(r"\d+\.", "", lines[i - 1])
                href = match.group(2)
                news_data.append(
                    {
                        "title": title,
                        "img": f"default_{random.randint(0, 6)}.webp",
                        "href": href,
                    }
                )
        with open(
            join(dirname(__file__), "data", "news.json"), mode="w", encoding="utf-8"
        ) as file:
            json.dump(news_data, file, ensure_ascii=False, indent=4)


data_manager = DataManager()


def activity_data():
    return data_manager.get_activity_data()


def menu_data():
    return data_manager.get_menu_data()


def news_data():
    return data_manager.get_news_data()
