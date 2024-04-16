import { ethers } from "ethers";
import dotenv from 'dotenv';
dotenv.config();

const PROVIDER_URI = process.env.PROVIDER_URI as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

async function main() {
    const provider = new ethers.JsonRpcProvider(PROVIDER_URI);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    const contractAddress = "0x88941290daBd7884e31B047459d25cA530B293F0";
    const contract = new ethers.Contract(contractAddress, ["function sendTxWithCalldata(bytes calldata data)"], signer);

    const calldata = contract.interface.encodeFunctionData("sendTxWithCalldata", [ethers.randomBytes(7500)]);

    const accessList = [];
    for (let i = 0; i < 50; i++) {
        accessList.push({
            address: contractAddress,
            storageKeys: ['0x' + i.toString(16).padStart(64, '0')]
        });
    }

    const tx = {
        to: contractAddress,
        data: calldata,
        type: 2,
        accessList: accessList,
        gasLimit: 10000000,
        // gasPrice: 1000000000,
    };

    let txResponse = await signer.sendTransaction(tx);
    console.log("Transaction Hash:", txResponse.hash);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
