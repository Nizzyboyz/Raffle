// src/ipfs.js
export async function uploadToIPFS(file) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      pinata_api_key:     process.env.REACT_APP_PINATA_API_KEY,
      pinata_secret_api_key: process.env.REACT_APP_PINATA_API_SECRET,
    },
    body: data,
  });

  if (!res.ok) throw new Error(`Pinata upload failed: ${await res.text()}`);
  const json = await res.json();          // { IpfsHash: "Qm..." , ... }
  return `ipfs://${json.IpfsHash}`;
}
