import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from wechat.utils import update_posts, wx

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

scheduler = BackgroundScheduler(timezone="Asia/Shanghai")

scheduler.add_job(
    func=wx.start_thread,
    trigger=CronTrigger(hour="6,14,22", minute=0, timezone="Asia/Shanghai"),
    id="0",
    name="refresh login",
)

scheduler.add_job(
    func=lambda: update_posts(0, 10),
    trigger=IntervalTrigger(hours=2),
    id="1",
    name="update posts",
)

scheduler.start()
