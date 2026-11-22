const assert = require("node:assert/strict");
const express = require("express");
const http = require("node:http");
const { after, test } = require("node:test");
const coverUpload = require("../src/middlewares/coverUpload");

const servers = [];
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function startUploadServer() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.post("/upload", coverUpload, (req, res) => res.status(201).send("accepted"));
    const server = http.createServer(app);
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve(`http://127.0.0.1:${server.address().port}/upload`);
    });
  });
}

async function postImage(mimeType, contents) {
  const url = await startUploadServer();
  const form = new FormData();
  form.append("capa", new Blob([contents], { type: mimeType }), "cover");
  return fetch(url, { method: "POST", body: form });
}

after(async () => {
  await Promise.all(servers.map((server) => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  })));
});

test("accepts a PNG whose content signature matches its MIME type", () => {
  assert.equal(coverUpload.getImageExtension(pngSignature, "image/png"), ".png");
});

test("accepts a JPEG whose content signature matches its MIME type", () => {
  assert.equal(
    coverUpload.getImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"),
    ".jpg"
  );
});

test("rejects content that does not match the declared image type", async () => {
  const response = await postImage("image/png", Buffer.from("GIF89a"));
  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /conteúdo não corresponde/i);
});

test("rejects formats outside PNG and JPEG", async () => {
  const response = await postImage("image/gif", Buffer.from("GIF89a"));
  assert.equal(response.status, 415);
  await response.text();
});

test("rejects images larger than 5 MB", async () => {
  const oversizedImage = Buffer.concat([
    pngSignature,
    Buffer.alloc(coverUpload.MAX_FILE_SIZE),
  ]);
  const response = await postImage("image/png", oversizedImage);
  assert.equal(response.status, 413);
  await response.text();
});
