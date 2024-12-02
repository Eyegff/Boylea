const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// ตั้งค่าบอทไลน์
const config = {
    channelAccessToken: '8O9ckJOLOhoRhUKcKSyyqK1MMiHa1ED4QqAvrx3n1wk78RmEiLep2Ejuyam1HvjRfgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUo6l/YnA29SnmXgqeBqDiPv02BGcZjEQgWTRaKqQVIfiwdB04t89/1O/w1cDnyilFU=',
    channelSecret: '6884027b48dc05ad5deadf87245928da'
};

const client = new Client(config);
const app = express();

app.use(middleware(config));

// ตัวแปรสำหรับเก็บสถานะผู้ใช้
const userStates = {};

// ฟังก์ชันสำหรับล็อกอิน
async function login() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("username", "6FocoC0F7a");
    urlencoded.append("password", "hmSwvyVmAo");

    const requestOptions = {
        method: 'POST',
        body: urlencoded,
        redirect: 'follow'
    };

    try {
        const response = await fetch("http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/login", requestOptions);
        const result = await response.json();
        if (result.success) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// ฟังก์ชันสำหรับสร้างโค้ด
async function createCode(codeName) {
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");

    const randomId = uuidv4();
    const raw = JSON.stringify({
        "id": 5,
        "settings": `{\"clients\":[{\"id\":\"${randomId}\",\"alterId\":0,\"email\":\"${codeName}\",\"limitIp\":2,\"totalGB\":42949672960,\"expiryTime\":${Date.now() + 2 * 60 * 60 * 1000},\"enable\":true,\"tgId\":\"\",\"subId\":\"\"}]}`
    });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    try {
        const response = await fetch("http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/panel/api/inbounds/addClient", requestOptions);
        const result = await response.json();
        if (result.success) {
            const vlessURL = `vless://${randomId}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#${codeName}`;
            return vlessURL;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Create code error:', error);
        return null;
    }
}

// ฟังก์ชันจัดการข้อความจากผู้ใช้
client.on('message', async (event) => {
    const userId = event.source.userId;
    const message = event.message.text;

    if (!userStates[userId]) {
        userStates[userId] = { state: 'idle' };
    }

    if (message.toLowerCase() === 'สร้างโค้ด') {
        const loggedIn = await login();
        if (loggedIn) {
            userStates[userId].state = 'awaiting_code_name';
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'กรุณาตั้งชื่อโค้ดของคุณ'
            });
        } else {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'ล็อกอินไม่สำเร็จ โปรดลองใหม่ภายหลัง'
            });
        }
    }

    if (userStates[userId].state === 'awaiting_code_name') {
        const codeName = message.trim();
        if (codeName.length === 0) {
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'ชื่อโค้ดไม่ถูกต้อง กรุณาตั้งชื่อโค้ดใหม่'
            });
        }

        // แจ้งกำลังสร้างโค้ด
        client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กำลังสร้างโค้ด...'
        });

        const vlessURL = await createCode(codeName);
        if (vlessURL) {
            client.replyMessage(event.replyToken, {
                type: 'text',
                text: `นี่คือโค้ดของคุณ:\n${vlessURL}\n\nโค้ดนี้จะหมดอายุใน 2 ชั่วโมง`
            });
        } else {
            client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'เกิดข้อผิดพลาดในการสร้างโค้ด กรุณาลองใหม่ภายหลัง'
            });
        }

        // รีเซ็ตสถานะ
        userStates[userId].state = 'idle';
    }
});

// กำหนดพอร์ตและเริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
