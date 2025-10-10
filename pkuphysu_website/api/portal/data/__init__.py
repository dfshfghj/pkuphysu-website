import json
from os.path import dirname, join
from datetime import datetime
import pandas
import re

__all__ = ["NEWS_DATA", "ACTIVITY_DATA", "MENU_DATA", "POSTS_DATA"]

with open(join(dirname(__file__), "news.json"), encoding="utf-8") as file:
    NEWS_DATA = json.load(file)

with open(join(dirname(__file__), "activity.json"), encoding="utf-8") as file:
    ACTIVITY_DATA = json.load(file)
    for activity in ACTIVITY_DATA:
        activity["start_time"] = datetime.strptime(activity["start"], "%Y-%m-%d")
        activity["end_time"] = datetime.strptime(activity["end"], "%Y-%m-%d")

with open(join(dirname(__file__), "menu.json"), encoding="utf-8") as file:
    MENU_DATA = json.load(file)

posts = pandas.read_csv(join(dirname(__file__), "物院学生会.csv"))[['标题', '时间', '摘要', '链接']]
posts = posts.fillna('').to_dict(orient='records')
POSTS_DATA = []
for post in posts:
    matches = re.match('【(.*)】', post['标题'])
    tag = matches.group(1) if matches else '其它'
    try:
        item = {
            'title': re.sub('【.*】', '', post['标题']).strip(),
            'time': post['时间'],
            'tag': tag,
            'abstract': post['摘要'].split('/n')[0],
            'href': post['链接']
        }
    except Exception as e:
        print(post, Exception)
    POSTS_DATA.append(item)
