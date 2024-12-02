const express = require('express');
const request = require('request');
const line = require('@line/bot-sdk');

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

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null); 1 
  }

  if (event.message.text === '/สร้างโค้ด') {
    const options = {
      'method': 'POST',
      'url': 'http://www.opensignal.com.vipbot.vipv2boxth.xyz:2053/0UnAOmjQ1vIaSIr/login',
      'headers': {},
      form: {
        'username': '6FocoC0F7a', 
        'password': 'hmSwvyVmAo' 
      }
    };

    return request(options, function (error, response) {
      if (error) {
        console.error(error);
        return client.replyMessage(event.replyToken, { type: 'text', text: 'ล็อกอินล้มเหลว' });
      }

      const loginResponse = JSON.parse(response.body);

      if (loginResponse.success) {
        return client.replyMessage(event.replyToken, { type: 'text', text: 'ล็อกอินสำเร็จ' });
      } else {
        return client.replyMessage(event.replyToken, { type: 'text', text: 'ล็อกอินล้มเหลว' });
      }
    });
  } else {
    return Promise.resolve(null);
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log('listening on ' + (process.env.PORT || 3000));
});
