// index.js

const line = require('@line/bot-sdk');
const express = require('express');
const fetch = require('node-fetch'); // ใช้ node-fetch เวอร์ชัน 2
const { v4: uuidv4 } = require('uuid'); // สำหรับสร้าง UUID

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
            console.error('Error in webhook handler:', err);
            res.status(500).end();
        });
});

// สถานะของผู้ใช้ในการสร้างโค้ด
const userStates = new Map();

// ฟังก์ชันจัดการเหตุการณ์
const client = new line.Client(config);

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ไม่ใช่ข้อความที่สนใจ
        return Promise.resolve(null);
    }

    const userMessage = event.message.text.trim();
    const userId = event.source.userId;

    // ตรวจสอบสถานะของผู้ใช้
    if (userStates.has(userId)) {
        const state = userStates.get(userId);
        if (state === 'awaiting_code_name') {
            // ผู้ใช้ได้ส่งชื่อโค้ดแล้ว
            const codeName = userMessage;
            userStates.delete(userId); // ลบสถานะหลังจากได้รับชื่อโค้ด

            // ตอบกลับว่า กำลังสร้างโค้ด
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'กำลังสร้างโค้ด กรุณารอสักครู่...'
            }).then(() => {
                return createVLESSCode(codeName)
                    .then(vlessUrl => {
                        return client.pushMessage(userId, {
                            type: 'text',
                            text: `นี่คือโค้ดของคุณ:\n${vlessUrl}`
                        });
                    })
                    .catch(error => {
                        console.error('Error creating VLESS code:', error);
                        return client.pushMessage(userId, {
                            type: 'text',
                            text: 'เกิดข้อผิดพลาดในการสร้างโค้ด กรุณาลองใหม่อีกครั้ง'
                        });
                    });
            });
        }
    }

    if (userMessage === '/สร้างโค้ด') {
        // เปลี่ยนสถานะของผู้ใช้เป็นรอชื่อโค้ด
        userStates.set(userId, 'awaiting_code_name');
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาตั้งชื่อโค้ดของคุณ:'
        });
    } else {
        // ตอบกลับข้อความอื่นๆ
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาใช้คำสั่ง /สร้างโค้ด เพื่อสร้างโค้ดใหม่'
        });
    }
}

// ฟังก์ชันสร้าง VLESS โค้ด
async function createVLESSCode(codeName) {
    const clientId = uuidv4(); // สร้าง UUID แบบสุ่ม
    const expiryTime = Date.now() + (2 * 60 * 60 * 1000); // อายุ 2 ชั่วโมงในมิลลิวินาที

    const settings = {
        clients: [
            {
                id: clientId,
                alterId: 0,
                email: codeName,
                limitIp: 2,
                totalGB: 0, // 0 หมายถึงไม่จำกัด
                expiryTime: expiryTime,
                enable: true,
                tgId: "",
                subId: ""
            }
        ]
    };

    const raw = JSON.stringify({
        id: 5,
        settings: JSON.stringify(settings)
    });

    const myHeaders = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch("http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/panel/api/inbounds/addClient", requestOptions);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Create Client Response:', result);

    if (result.success) {
        // สร้าง VLESS URL
        const vlessUrl = `vless://${clientId}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#${encodeURIComponent(codeName)}`;
        return vlessUrl;
    } else {
        throw new Error(result.msg || 'Unknown error');
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
