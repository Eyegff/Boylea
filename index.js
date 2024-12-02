// index.js

const line = require('@line/bot-sdk');
const express = require('express');
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

// ตั้งค่าบอทไลน์โดยตรงในโค้ด
const config = {
    channelAccessToken: '8O9ckJOLOhoRhUKcKSyyqK1MMiHa1ED4QqAvrx3n1wk78RmEiLep2Ejuyam1HvjRfgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUo6l/YnA29SnmXgqeBqDiPv02BGcZjEQgWTRaKqQVIfiwdB04t89/1O/w1cDnyilFU=', // ใส่ Channel Access Token ของคุณที่นี่
    channelSecret: '6884027b48dc05ad5deadf87245928da'            // ใส่ Channel Secret ของคุณที่นี่
};

const app = express();

// Middleware สำหรับตรวจสอบ webhook
app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// ฟังก์ชันจัดการเหตุการณ์
const client = new line.Client(config);

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ไม่ใช่ข้อความที่สนใจ
        return Promise.resolve(null);
    }

    const userMessage = event.message.text.trim();

    if (userMessage === '/เทส') {
        // เรียกฟังก์ชันทดสอบการล็อกอิน
        return testLogin()
            .then(responseMsg => {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: responseMsg
                });
            })
            .catch(error => {
                console.error(error);
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: 'เกิดข้อผิดพลาดในการทดสอบการล็อกอิน'
                });
            });
    } else {
        // ตอบกลับข้อความอื่นๆ
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาใช้คำสั่ง /เทส เพื่อทดสอบการเชื่อมต่อ'
        });
    }
}

// ฟังก์ชันทดสอบการล็อกอิน
async function testLogin() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("username", "6FocoC0F7a");
    urlencoded.append("password", "hmSwvyVmAo");

    const requestOptions = {
        method: 'POST',
        body: urlencoded,
        redirect: 'follow'
    };

    const response = await fetch("http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/login", requestOptions);
    const result = await response.json();

    if (result.success) {
        return 'เข้าสู่ระบบสำเร็จ: ' + result.msg;
    } else {
        return 'เข้าสู่ระบบล้มเหลว: ' + result.msg;
    }
}

// เส้นทางตรวจสอบ
app.get('/', (req, res) => {
    res.send('LINE Bot is running.');
});

// เริ่มเซิร์ฟเวอร์
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on ${port}`);
});
