// index.js

const line = require('@line/bot-sdk');
const express = require('express');
const fetch = require('node-fetch'); // ใช้ node-fetch เวอร์ชัน 2
const { v4: uuidv4 } = require('uuid');
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
            console.error('Error in webhook handler:', err);
            res.status(500).end();
        });
});

// ฟังก์ชันจัดการเหตุการณ์
const client = new line.Client(config);

// แผนที่เก็บสถานะผู้ใช้
const userStates = new Map();

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // ไม่ใช่ข้อความที่สนใจ
        return Promise.resolve(null);
    }

    const userId = event.source.userId;
    const userMessage = event.message.text.trim();

    // ตรวจสอบสถานะของผู้ใช้
    const userState = userStates.get(userId) || {};

    if (userState.awaitingCodeName) {
        // ผู้ใช้กำลังรอการตั้งชื่อโค้ด
        const codeName = userMessage;
        userStates.set(userId, { awaitingCodeName: false }); // รีเซ็ตสถานะ

        // เริ่มสร้างโค้ด
        return createCode(codeName)
            .then(vlessLink => {
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: `กำลังสร้างโค้ด... โปรดรอสักครู่\n\nนี่คือโค้ดของคุณ:\n${vlessLink}`
                });
            })
            .catch(error => {
                console.error('Error in createCode:', error);
                return client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: 'เกิดข้อผิดพลาดในการสร้างโค้ด'
                });
            });
    }

    if (userMessage === '/สร้างโค้ด') {
        // ตั้งค่าสถานะผู้ใช้ว่ากำลังรอการตั้งชื่อโค้ด
        userStates.set(userId, { awaitingCodeName: true });

        // ถามผู้ใช้ให้ตั้งชื่อโค้ด
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาตั้งชื่อโค้ดของคุณ'
        });
    } else {
        // ตอบกลับข้อความอื่นๆ
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาใช้คำสั่ง /สร้างโค้ด เพื่อสร้างโค้ดใหม่'
        });
    }
}

// ฟังก์ชันล็อกอิน
async function login() {
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
        console.log('เข้าสู่ระบบสำเร็จ:', result.msg);
        return true;
    } else {
        console.log('เข้าสู่ระบบล้มเหลว:', result.msg);
        throw new Error('Login failed: ' + result.msg);
    }
}

// ฟังก์ชันสร้างโค้ด
async function createCode(codeName) {
    try {
        // ล็อกอินก่อนสร้างโค้ด
        await login();

        // สร้าง UUID สำหรับ ID ใหม่
        const newId = uuidv4();

        // ตั้งค่า expiryTime เป็นเวลา 2 ชั่วโมงจากนี้ (มิลลิวินาที)
        const expiryTime = Date.now() + 2 * 60 * 60 * 1000;

        // สร้าง settings JSON
        const settings = {
            clients: [
                {
                    id: newId,
                    alterId: 0,
                    email: "New Client",
                    limitIp: 2,
                    totalGB: 0, // ไม่จำกัด
                    expiryTime: expiryTime,
                    enable: true,
                    tgId: "",
                    subId: ""
                }
            ]
        };

        const payload = {
            id: 1,
            settings: JSON.stringify(settings)
        };

        const myHeaders = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(payload),
            redirect: 'follow'
        };

        const response = await fetch("http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/panel/api/inbounds/addClient", requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Add Client response:', result);

        if (result.success) {
            // สร้างลิงก์ VLESS
            const vlessLink = `vless://${newId}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#${encodeURIComponent(codeName)}`;
            return vlessLink;
        } else {
            throw new Error('Failed to create code: ' + result.msg);
        }
    } catch (error) {
        console.error('Error in createCode function:', error);
        throw error;
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
