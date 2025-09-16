import requests
import random


def get_name(username, password):
    session = requests.Session()
    response = session.post("https://iaaa.pku.edu.cn/iaaa/oauthlogin.do", data={
        'appid': "portal2017",
        'userName': username,
        'password': password,
        'randCode': '',
        'smsCode': '',
        'otpCode': '',
        'redirUrl': 'https://portal.pku.edu.cn/portal2017/ssoLogin.do'
    })
    if response.json()["success"]:
        token = response.json()["token"]
        rand = str(random.random())
        response = session.get("https://portal.pku.edu.cn/portal2017/ssoLogin.do", params={
            '_rand': rand,
            'token': token
        })
        response = session.post("https://portal.pku.edu.cn/portal2017/isUserLogged.do")
        return response.json()


    return {"success": False}
