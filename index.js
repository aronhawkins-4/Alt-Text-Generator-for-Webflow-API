import "dotenv/config";
import express, { json as _json } from "express";
import cors from "cors";
import axios from "axios";
import bops from "bops";
import ConvertAPI from "convertapi";

const convertapi = new ConvertAPI(process.env.CONVERTAPI_SECRET);

const app = express();
app.use(cors());
app.use(_json());

app.listen(3000, () => {
  console.log("Listening on port 3000!");
});

app.get("/", (req, res) => {
  res.send(new Date().toISOString());
});

app.post("/generate", (req, res) => {
  console.log(req.body);
  if (!req.body) {
    res.status(400).json({ error: "Body not specified" });
    return;
  }
  if (!req.body.url) {
    res.status(400).json({ error: "No URL specified" });
    return;
  }
  if (!req.body.url.includes("http")) {
    res.status(400).json({ error: "Invalid URL format" });
    return;
  }
  const reqUrl = req.body.url;

  if (reqUrl.slice(-3) === "svg") {
    convertSvg(reqUrl).then((response) => {
      generate(response, res);
    });
  } else {
    generate(reqUrl, res);
  }
});

function generate(url, res) {
  axios
    .get(url, { responseType: "arraybuffer" })
    .then((axiosRes) => {
      const uintArr = new Uint8Array(axiosRes.data);
      const regularArr = Array.from(uintArr);
      const bopsArray = bops.from(regularArr, "utf-8");
      return bopsArray;
    })
    .then((array) => {
      const apiUrl =
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base";
      const apiKey = process.env.HUGGINGFACE_API_KEY;
      console.log("apiKey: " + apiKey);
      fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        method: "POST",
        body: array,
      })
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          if (json && json[0].generated_text) {
            res.send(json[0].generated_text);
          } else {
            res.status(400).json({ error: "Invalid response format" });
          }
        })
        .catch((error) => {
          console.log(error.message);
          res.status(500).json({ error: "Server Error" });
        });
    });
}

async function convertSvg(url) {
  const convertedUrl = await convertapi
    .convert(
      "png",
      {
        File: url,
      },
      "svg"
    )
    .then(function (result) {
      if (result) {
        const url = result.file.url;
        if (url) {
          return url;
        }
        return undefined;
      }
    });
  return convertedUrl;
}
