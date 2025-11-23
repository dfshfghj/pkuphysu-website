import smtplib
import imaplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

SMTP_SERVER = settings.emails.SMTP_SERVER
SMTP_PORT = settings.emails.SMTP_PORT
IMAP_SERVER = settings.emails.IMAP_SERVER
IMAP_PORT = settings.emails.IMAP_PORT
SENDER_EMAIL = settings.emails.SENDER_EMAIL
SENDER_PASSWORD = settings.emails.SENDER_PASSWORD

context = ssl.create_default_context()

server = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT, ssl_context=context)

def send_code(to, subject, body):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, to, text)
        server.quit()
        print("邮件发送成功！")
    except Exception as e:
        print(f"发送失败：{e}")
    
if __name__ == "__main__":
    send_code(SENDER_EMAIL, "[测试] 验证邮箱", "您的验证码是 114514")