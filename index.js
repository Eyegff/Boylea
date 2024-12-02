const line = require('@line/bot-sdk');
const express = require('express');
const fetch = require('node-fetch');

// กำหนดค่า LINE Messaging API
const config = {
  channelAccessToken: '8O9ckJOLOhoRhUKcKSyyqK1MMiHa1ED4QqAvrx3n1wk78RmEiLep2Ejuyam1HvjRfgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUo6l/YnA29SnmXgqeBqDiPv02BGcZjEQgWTRaKqQVIfiwdB04t89/1O/w1cDnyilFU=', // แทนที่ด้วย Channel Access Token ของคุณ
  channelSecret: 'U9d5a0602294bec4b5e3ae01028b002b5' // แทนที่ด้วย Channel Secret ของคุณ
};

const client = new line.Client(config);

const app = express();

// สร้างฟังก์ชันสำหรับการเข้าสู่ระบบ
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
    return result.success;
  } catch (error) {
    console.log('error', error);
    return false;
  }
}

// กำหนด Webhook endpoint
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันสำหรับจัดการเหตุการณ์
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if (event.message.text === '/เทส') { // แก้ไขตรงนี้
    const loginSuccess = await login();
    let message;
    if (loginSuccess) {
      message = 'เข้าสู่ระบบสำเร็จ';
    } else {
      message = 'เข้าสู่ระบบล้มเหลว';
    }
    return client.replyMessage(event.replyToken, { type: 'text', text: message });
  }
}

// เริ่มต้น server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
