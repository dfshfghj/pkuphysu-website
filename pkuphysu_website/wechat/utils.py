import re
import os
import fcntl
import threading
from functools import wraps
from datetime import datetime, timezone, timedelta
from .models import Post

current_dir = os.path.dirname(os.path.abspath(__file__))
state_dir=os.path.join(current_dir, "data")
qr_path = os.path.join(state_dir, "qrcode.png")
state_path = os.path.join(state_dir, "login_state.json")
lock_path = os.path.join(state_dir, ".wxrunner.lock")

def with_lock(func):
    """
    装饰器：确保被装饰的方法在整个系统中（跨 worker）只运行一个实例
    使用 fcntl 文件锁实现
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        lock_file = open(lock_path, "w")
        try:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            print(f"✅ 进程 {os.getpid()} 获取锁成功，开始执行任务")
        except BlockingIOError:
            print(f"⚠️ 任务已在其他进程运行（PID未知），本次跳过")
            lock_file.close()
            return None

        try:
            return func(self, *args, **kwargs)
        except Exception as e:
            print(f"🚨 任务执行出错: {e}")
            raise
        finally:
            try:
                fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
                lock_file.close()
            except Exception as e:
                print(f"❌ 释放锁失败: {e}")
            print(f"👋 进程 {os.getpid()} 已释放锁")

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
                print(f"✅ 二维码已更新: {qr_path}")
            except Exception as e:
                print(f"❌ 保存二维码失败: {e}")

    def _poll_for_token(self, page):
        while self.running:
            try:
                url = page.url
                if "home" in url and "token=" in url:
                    match = re.search(r"token=([^&]+)", url)
                    if match:
                        self.token = match.group(1)
                        try:
                            os.remove(qr_path)
                        except:
                            pass
                        print(f"🔑 成功获取 token: {self.token}")
                        return
            except Exception as e:
                print(str(e))
            page.wait_for_timeout(200)

    @with_lock
    def run(self):
        if self.running:
            return
        self.running = True

        print("🔧 启动微信登录自动化...")
        browser = None
        context = None
        page = None

        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                os.makedirs(state_dir, exist_ok=True)

                browser = p.chromium.launch(headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
                if os.path.exists(state_path):
                    print("USE STATE")
                    context = browser.new_context(storage_state=state_path,
                                                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                                )
                else:
                    context = browser.new_context(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
                context.add_init_script("""
                        Object.defineProperty(navigator, 'webdriver', { get: () => false });
                    """)
                page = context.new_page()

                page.on("response", self._on_response)

                page.goto("https://mp.weixin.qq.com/")

                self._poll_for_token(page)

                if self.token:
                    context.storage_state(path=state_path)
                    print(f"💾 登录态已保存: {state_path}")
                else:
                    print("❌ 登录未完成")

        except Exception as e:
            print(f"🚨 自动化出错: {e}")
        finally:
            if context:
                context = None
            if browser:
                browser = None
            self.running = False
            print("👋 自动化流程结束")

    def start_thread(self):
        """启动独立线程运行自动化"""
        with self._lock:
            if not self.thread or not self.thread.is_alive():
                self.thread = threading.Thread(target=self.run, daemon=True)
                self.thread.start()
                print("🧵 自动化线程已启动")

wx = WxRunner()

def load_posts(offset=0, limit=10, mp_name="物院学生会"):
    posts = Post.query.filter_by(mp_name=mp_name).order_by(Post.publish_time.desc(), Post.id.asc()).offset(offset).limit(limit).all()
    count = Post.query.filter_by(mp_name=mp_name).count()
    data = [
        {
            'id': post.id,
            'title': post.title,
            'description': post.description,
            'mp_name': post.mp_name,
            'url': post.url,
            'publish_time': post.publish_time
        }
        for post in posts
    ]
    for item in data:
        matches = re.match('【(.*)】', item['title'])
        item["tag"] = matches.group(1) if matches else '其它'
        item["title"] = re.sub('【.*】', '', item['title']).strip()
        item["description"] = item['description'].split('/n')[0]
        item["publish_time"] = datetime.fromtimestamp(item["publish_time"], tz=timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M:%S")
    
    return {
            "data": data,
            "count": count
        }

def update_posts(new_posts):
    Post.merge_posts(new_posts)