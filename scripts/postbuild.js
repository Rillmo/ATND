const fs = require("fs");
const path = require("path");

const nftPath = path.join(
  process.cwd(),
  ".next",
  "server",
  "middleware.js.nft.json"
);
const middlewareJsPath = path.join(
  process.cwd(),
  ".next",
  "server",
  "middleware.js"
);

if (!fs.existsSync(nftPath)) {
  const payload = JSON.stringify({ version: 1, files: [] }, null, 2);
  fs.writeFileSync(nftPath, payload, "utf8");
}

if (!fs.existsSync(middlewareJsPath)) {
  fs.writeFileSync(middlewareJsPath, "", "utf8");
}
