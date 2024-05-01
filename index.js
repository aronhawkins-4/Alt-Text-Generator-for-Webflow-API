import 'dotenv/config';
import express, { json as _json } from 'express';
import cors from 'cors';
import axios from 'axios';
import bops from 'bops';
import sharp from 'sharp';

const app = express();
app.use(cors());
app.use(_json());

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});

app.get('/', (req, res) => {
  res.send(new Date().toISOString());
});

app.post('/generate', async (req, res) => {
  console.log(req.body);
  if (!req.body) {
    res.status(400).json({ error: 'Body not specified' });
    return;
  }
  if (!req.body.url) {
    res.status(400).json({ error: 'No URL specified' });
    return;
  }
  if (!req.body.url.includes('http')) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }
  const reqUrl = req.body.url;
  generate(reqUrl, res);
});

async function generate(url, res) {
  const body = await fetch(url);
  const blob = await body.blob();
  const buffer = await blob.arrayBuffer();
  const png = await sharp(buffer).png().toBuffer();
  const uintArr = new Uint8Array(png);
  const regularArr = Array.from(uintArr);
  const bopsArray = bops.from(regularArr, 'utf-8');

  const apiUrl =
    'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large';
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  console.log('apiKey: ' + apiKey);
  fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    method: 'POST',
    body: bopsArray,
  })
    .then((res) => {
      return res.json();
      // return undefined;
    })
    .then((json) => {
      console.log(json);
      if (json[0] && json[0].generated_text) {
        res.send(
          json[0].generated_text
            .replace('arafed ', '')
            .replace('arafed', '')
            .replace('araffe ', '')
        );
      } else {
        res.status(400).json({ error: 'Invalid response format' });
      }
    })
    .catch((error) => {
      console.log(error.message);
      res.status(500).json({ error: 'Server Error' });
    });
  // });
}

// async function convertSvg(url) {
//   const body = await fetch(url);
//   const blob = await body.blob();
//   const buffer = await blob.arrayBuffer();
//   const png = await sharp(buffer).png().toBuffer();
//   const uintArr = new Uint8Array(png);
//   const regularArr = Array.from(uintArr);
//   const bopsArray = bops.from(regularArr, "utf-8");
//   console.log(bopsArray);
//   const apiUrl =
//     "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";
//   const apiKey = process.env.HUGGINGFACE_API_KEY;
//   fetch(apiUrl, {
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//     },
//     method: "POST",
//     body: bopsArray,
//   })
//     .then((res) => {
//       return res.json();
//     })
//     .then((json) => {
//       console.log(json);
//     });
// }
// convertSvg(
//   "https://uploads-ssl.webflow.com/654aa13e65712cfc993cd15a/654aa13f65712cfc993cd19d_image.svg"
// );

// https://uploads-ssl.webflow.com/654aa13e65712cfc993cd15a/654aa13f65712cfc993cd19f_cloneable.png
// https://uploads-ssl.webflow.com/65f3601ba2bddc716140a160/66047edcc6e172e5f071f386_hand-holding-heart-light.svg
