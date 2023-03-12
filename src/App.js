import { useState } from "react";
import axios from "axios";
import { NFTStorage } from "nft.storage";

const cleanupIfpsImageHref = (url) => {
  if (url.includes("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile] = useState(null);

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
        name: `AI NFT: "${prompt}"`,
        description: `AI generated NFT of "${prompt.toLowerCase()}"`,
        image: file,
      });

      console.log(store);
      const imageUrl = cleanupIfpsImageHref(store.data.image.href);
      console.log(imageUrl);
      return imageUrl;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless mints</h1>
      {/* Create an input box and button saying next beside it */}
      <div className="flex items-center justify-center gap-4">
        <input
          className="border-2 border-black rounded-md p-2"
          onChange={(e) => setPrompt(e.target.value)}
          type="text"
          placeholder="Enter a prompt"
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
            <button
              onClick={uploadArtToIpfs}
              className="bg-black text-white rounded-md p-2"
            >
              Upload to IPFS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
