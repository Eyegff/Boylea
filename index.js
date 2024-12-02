const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// การตั้งค่าบอทไลน์
const config = {
  channelAccessToken: '8O9ckJOLOhoRhUKcKSyyqK1MMiHa1ED4QqAvrx3n1wk78RmEiLep2Ejuyam1HvjRfgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUo6l/YnA29SnmXgqeBqDiPv02BGcZjEQgWTRaKqQVIfiwdB04t89/1O/w1cDnyilFU=', // เปลี่ยนเป็น LINE Channel Access Token ของคุณ
  channelSecret: '6884027b48dc05ad5deadf87245928da' // เปลี่ยนเป็น LINE Channel Secret ของคุณ
};

// เริ่มต้น LINE SDK client
const client = new Client(config);

// เริ่มต้นแอป Express
const app = express();

// ใช้ middleware ของ LINE
app.use(middleware(config));

// เก็บสถานะของผู้ใช้ในหน่วยความจำ
const userStates = {};

// ฟังก์ชันช่วยเหลือสำหรับการล็อกอิน
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
      console.error('การล็อกอินล้มเหลว:', result.msg);
      return false;
    }
  } catch (error) {
    console.error('ข้อผิดพลาดในการล็อกอิน:', error);
    return false;
  }
}

// ฟังก์ชันช่วยเหลือสำหรับการเพิ่มลูกค้า
async function addClient(name) {
  const myHeaders = new fetch.Headers();
  myHeaders.append("Accept", "application/json");

  const id = uuidv4();
  const expiryTime = Date.now() + 2 * 60 * 60 * 1000; // 2 ชั่วโมงนับจากนี้

  const settings = {
    clients: [{
      id: id,
      alterId: 0,
      email: name,
      limitIp: 2,
      totalGB: 0, // 0 หมายถึงไม่จำกัด
      expiryTime: expiryTime,
      enable: true,
      tgId: "",
      subId: ""
    }]
  };

  const raw = JSON.stringify({
    id: 5,
    settings: JSON.stringify(settings)
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
      return id;
    } else {
      throw new Error(result.msg);
    }
  } catch (error) {
    console.error('ข้อผิดพลาดในการเพิ่มลูกค้า:', error);
    throw error;
  }
}

// ฟังก์ชันช่วยเหลือสำหรับการสร้าง URL VLESS
function generateVlessURL(id, name) {
  return `vless://${id}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#${encodeURIComponent(name)}`;
}

// จัดการข้อความที่เข้ามา
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const userMessage = event.message.text.trim();

      // เริ่มต้นสถานะผู้ใช้หากยังไม่มี
      if (!userStates[userId]) {
        userStates[userId] = { state: 'idle' };
      }

      const currentState = userStates[userId].state;

      if (currentState === 'idle') {
        if (userMessage.toLowerCase() === 'สร้างโค้ด') { // คำสั่ง "สร้างโค้ด"
          userStates[userId].state = 'awaiting_code_name';
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'กรุณาตั้งชื่อโค้ดของคุณ' // "Please set your code name"
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'โปรดใช้คำสั่ง "สร้างโค้ด" เพื่อสร้างโค้ดใหม่' // "Please use the command 'สร้างโค้ด' to create a new code"
          });
        }
      } else if (currentState === 'awaiting_code_name') {
        const codeName = userMessage;
        userStates[userId].state = 'creating_code';

        // แจ้งให้ผู้ใช้ทราบว่ากำลังสร้างโค้ด
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กำลังสร้างโค้ด...' // "Creating code..."
        });

        // ทำการล็อกอิน
        const isLoggedIn = await login();
        if (!isLoggedIn) {
          await client.pushMessage(userId, {
            type: 'text',
            text: 'ล็อกอินไม่สำเร็จ โปรดลองใหม่อีกครั้ง' // "Login failed. Please try again."
          });
          userStates[userId].state = 'idle';
          continue;
        }

        // เพิ่มลูกค้า
        try {
          const id = await addClient(codeName);
          const vlessURL = generateVlessURL(id, codeName);
          await client.pushMessage(userId, {
            type: 'text',
            text: `นี่คือโค้ดของคุณ:\n${vlessURL}`
          });
        } catch (error) {
          await client.pushMessage(userId, {
            type: 'text',
            text: `เกิดข้อผิดพลาด: ${error.message}` // "An error occurred: ..."
          });
        }

        userStates[userId].state = 'idle';
      }
    }
  }

  res.sendStatus(200);
});

// เริ่มต้นเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์กำลังรันที่พอร์ต ${PORT}`);
});
