const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');
const { v4: uuidv4 } = require('uuid');

const config = {
  channelAccessToken: '8O9ckJOLOhoRhUKcKSyyqK1MMiHa1ED4QqAvrx3n1wk78RmEiLep2Ejuyam1HvjRfgHsrakIGT9Q4UCphSpIhNJwMBeDKaWMzU06YUwhHUo6l/YnA29SnmXgqeBqDiPv02BGcZjEQgWTRaKqQVIfiwdB04t89/1O/w1cDnyilFU=', // ใส่ Channel Access Token ของคุณตรงนี้เลย
  channelSecret: '6884027b48dc05ad5deadf87245928da' // ใส่ Channel Secret ของคุณตรงนี้เลย
};

const client = new line.Client(config);

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  if (event.message.text === '/สร้างโค้ด') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กรุณาตั้งชื่อโค้ดของคุณ'
    });
  } else if (event.replyToken) { 
    const codeName = event.message.text; 
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'กำลังสร้างโค้ด...'
    }).then(() => {
      const clientId = uuidv4(); 
      const expiryTime = Date.now() + (2 * 60 * 60 * 1000); 

      const loginOptions = { 
        'method': 'POST',
        'url': 'http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/login',
        'headers': {},
        form: {
          'username': '6FocoC0F7a',
          'password': 'hmSwvyVmAo'
        }
      };

      return request(loginOptions, function (loginError, loginResponse) {
        if (loginError) {
          console.error(loginError);
          return client.pushMessage(event.source.userId, { 
            type: 'text',
            text: 'ล็อกอินล้มเหลว'
          });
        }

        const addClientOptions = {
          'method': 'POST',
          'url': 'http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/panel/api/inbounds/addClient',
          'headers': {
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            "id": 5,
            "settings": `{\"clients\":[{\"id\":\"${clientId}\",\"alterId\":0,\"email\":\"${clientId}\",\"limitIp\":2,\"totalGB\":42949672960,\"expiryTime\":${expiryTime},\"enable\":true,\"tgId\":\"\",\"subId\":\"\"}]}`
          })
        };

        return request(addClientOptions, function (addClientError, addClientResponse) {
          if (addClientError) {
            console.error(addClientError);
            return client.pushMessage(event.source.userId, {
              type: 'text',
              text: 'สร้างโค้ดล้มเหลว'
            });
          }

          const vlessCode = `vless://${clientId}@172.64.155.231:80?path=%2F&security=none&encryption=none&host=www.opensignal.com.vipbot.vipv2boxth.xyz&type=ws#${codeName}`;

          return client.pushMessage(event.source.userId, { 
            type: 'text',
            text: `นี้โค้ดของคุณ:\n${vlessCode}`
          });
        });
      });
    });
  } else {
    return Promise.resolve(null);
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log('listening on ' + (process.env.PORT || 3000));
});
