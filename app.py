from flask import Flask, request, jsonify
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import TextSendMessage
import requests
import uuid
import json
import time

app = Flask(__name__)

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN = "YOUR_CHANNEL_ACCESS_TOKEN"
LINE_CHANNEL_SECRET = "YOUR_CHANNEL_SECRET"

line_bot_api = LineBotApi(LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

# ฟังก์ชันล็อกอิน
def login(username, password):
    url = "http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/login"
    payload = {"username": username, "password": password}
    headers = {'Content-Type': 'application/json'}
    
    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        if data.get("success"):
            return data.get("obj")  # Return token
    return None

# ฟังก์ชันสร้างโค้ด
def create_code(token):
    client_id = str(uuid.uuid4())
    expiry_time = int(time.time() + 2 * 60 * 60) * 1000

    url = "http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/panel/api/inbounds/addClient"
    payload = {
        "id": 5,
        "settings": json.dumps({
            "clients": [{
                "id": client_id,
                "alterId": 0,
                "email": "New Client",
                "limitIp": 0,
                "totalGB": -1,
                "expiryTime": expiry_time,
                "enable": True,
                "tgId": "",
                "subId": ""
            }]
        })
    }

    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {token}"
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        response_data = response.json()
        if response_data.get("success"):
            return f"vless://{client_id}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#"
    return None

# Endpoint สำหรับ Webhook
@app.route("/callback", methods=["POST"])
def callback():
    signature = request.headers["X-Line-Signature"]
    body = request.get_data(as_text=True)

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        return jsonify({"status": "error", "message": "Invalid signature"}), 400

    return "OK"

# เมื่อได้รับข้อความจากผู้ใช้
@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_message = event.message.text

    if user_message.startswith("ล็อกอิน"):
        try:
            _, username, password = user_message.split()
            token = login(username, password)
            if token:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="เข้าสู่ระบบสำเร็จ! ใช้คำสั่ง 'สร้างโค้ด' เพื่อสร้างโค้ดใหม่.")
                )
            else:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="ล็อกอินล้มเหลว: ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง.")
                )
        except ValueError:
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(text="กรุณาใช้คำสั่งในรูปแบบ: ล็อกอิน <username> <password>")
            )

    elif user_message == "สร้างโค้ด":
        token = login("6FocoC0F7a", "hmSwvyVmAo")  # ใช้ข้อมูลล็อกอินตัวอย่าง
        if token:
            code = create_code(token)
            if code:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=f"โค้ดของคุณ:\n{code}")
                )
            else:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text="สร้างโค้ดล้มเหลว: โปรดลองอีกครั้ง.")
                )
        else:
            line_bot_api.reply_message(
                event.reply_token,
                TextSendMessage(text="คุณยังไม่ได้ล็อกอิน! ใช้คำสั่ง 'ล็อกอิน <username> <password>'")
            )
    else:
        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text="ไม่เข้าใจคำสั่งของคุณ. ใช้ 'ล็อกอิน' หรือ 'สร้างโค้ด'")
        )

if __name__ == "__main__":
    app.run(port=5000)
