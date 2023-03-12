import { useState } from "react";
import axios from "axios";
import { NFTStorage } from "nft.storage";

const convertUriIfpsToHttps = (url) => {
  if (url.includes("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);

  const [imageName, setImageName] = useState("");
  const [imageDescription, setImageDescription] = useState("");

  const [walletAddress, setWalletAddress] = useState("0xb8Dfff92aa9A06A0CfF733D6cd1B62a560B622ef");

  const generateArt = async () => {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}`,
          },
          method: "POST",
          inputs: prompt,
        },
        { responseType: "blob" }
      );
      // convert blob to a image file type
      const file = new File([response.data], "image.png", {
        type: "image/png",
      });
      // saving the file in a state
      setFile(file);

      const url = URL.createObjectURL(response.data);
      console.log(url);
      setImageBlob(url);
    } catch (err) {
      console.error(err);
    }
  };

  const uploadArtToIpfs = async () => {
    try {
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_NFT_STORAGE,
      });

      const store = await nftstorage.store({
        name: imageName,
        description: imageDescription,
        image: file,
      });

      console.log(store);
      return convertUriIfpsToHttps(store.data.image.href);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const mintNft = async () => {
    try {
      const imageURL = await uploadArtToIpfs();

      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: imageName ?? `AI ART: "${prompt.trim().toLowerCase()}`,
          description: imageDescription ?? "",
          mint_to_address: walletAddress,
        },
        {
          headers: {
            Authorization: process.env.REACT_APP_NFT_PORT,
          },
        }
      );
      const data = await response.data;
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless mints</h1>
      <div className="flex items-center justify-center gap-4">
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setPrompt(e.target.value)}
          type="text"
          placeholder="What do you wanna see"
        />
        <button
          onClick={generateArt}
          className="bg-black text-white rounded-md p-2"
        >
          Next
        </button>
      </div>
      <div>
        {imageBlob && (
          <div className="flex flex-col gap-4 items-center justify-center">
            <img src={imageBlob} alt={`AI generated art of "${prompt}"`} />
            <input
              className="border-2 border-black rounded-md p-2"
              onChange={(e) => setImageName(e.target.value)}
              type="text"
              placeholder="Enter name"
            />
            <input
              className="border-2 border-black rounded-md p-2"
              onChange={(e) => setImageDescription(e.target.value)}
              type="text"
              placeholder="Enter description"
            />
            <input
              className="border-2 border-black rounded-md p-2"
              onChange={(e) => setWalletAddress(e.target.value)}
              type="text"
              placeholder="Mint to address"
              value={walletAddress}
            />            
            <button
              onClick={mintNft}
              className="bg-black text-white rounded-md p-2"
            >
              Mint NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
