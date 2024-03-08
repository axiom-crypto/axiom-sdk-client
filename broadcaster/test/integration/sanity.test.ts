import { ethers } from 'ethers';
import { ChildProcess, execSync, spawn } from 'child_process';
import { sleep } from "../testUtils";
import { Broadcaster, BroadcastParams, Channel, OpStackBroadcastModule } from "../../src";
import { getAxiomV2BroadcasterAddress } from "../../src/lib/address";

const PMMR_SIZE = 5430616;
const BLOCKS_AFTER = 1200;
const CHAIN_ID_BASE_SEPOLIA = "84532";
const ANVIL_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const broadcastModuleAddr = "0xCf0F7382EE8715C6fC97e64a786C46bBa39AE174";

describe("Channel Actions", () => {
  let broadcaster: Broadcaster;
  let anvilProvider: ethers.JsonRpcProvider;
  let sepoliaProvider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI_11155111 as string);
  let anvilProcess: ChildProcess;

  beforeAll(async () => {
    // Clean up db and any anvil processes
    try { 
      execSync("killall -9 anvil");
    } catch (e) {
      // do nothing
    }

    // Get latest block
    // const currentBlock = await sepoliaProvider.getBlockNumber();
    // if (currentBlock === undefined) {
    //   throw new Error("Failed to get the current block number");
    // }

    // start the local anvil fork
    anvilProcess = spawn('anvil', [`--fork-url`, `${process.env.PROVIDER_URI_11155111}`, `--fork-block-number`, `${PMMR_SIZE + BLOCKS_AFTER}`, `--block-time`, `10`], {
      cwd: process.cwd(),
      detached: true,
      stdio: "inherit"
    });

    // Wait for anvil to start
    await sleep(2000);

    anvilProvider = new ethers.JsonRpcProvider("http://localhost:8545");

    broadcaster = new Broadcaster({
      chainId: "11155111",
      provider: "http://localhost:8545",
      privateKey: ANVIL_PK,
    });
    
    // Calculate the storage slot for the Prover role for the signer address
    // AxiomAccess: https://github.com/axiom-crypto/axiom-v2-contracts/blob/main/contracts/libraries/access/AxiomAccess.sol
    // AccessControlUpgradeable (v4.8.3): https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/58fa0f81c4036f1a3b616fdffad2fd27e5d5ce21/contracts/access/AccessControlUpgradeable.sol
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const rolesSlot = ethers.keccak256(coder.encode(
      ["bytes32", "uint256"], 
      ["0xf66846415d2bf9eabda9e84793ff9c0ea96d87f50fc41e66aa16469c6a442f05", "0x65"]
    ));
    const roleDataSlot = ethers.keccak256(coder.encode(
      ["address", "bytes32"],
      ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", rolesSlot]
    ));

    // Enable TIMELOCK_ROLE by updating contract storage data in anvil fork
    await anvilProvider.send("anvil_setStorageAt", [
      getAxiomV2BroadcasterAddress("11155111"),
      roleDataSlot,
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    ]);
  });

  afterAll(async () => {
    // Clean up db and any anvil processes
    try { 
      execSync("killall -9 anvil");
    } catch (e) {
      // do nothing
    }
  });

  test("Add a channel", async () => {
    const channel: Channel = {
      chainId: CHAIN_ID_BASE_SEPOLIA,
      bridgeId: 0,
    }
    await broadcaster.addChannel(channel, broadcastModuleAddr);
    const onchainChannel = await broadcaster.getChannel(channel);
    expect(onchainChannel).toEqual(broadcastModuleAddr);
  }, 30000);

  test("Remove a channel", async () => {
    const channel: Channel = {
      chainId: CHAIN_ID_BASE_SEPOLIA,
      bridgeId: 0,
    }
    await broadcaster.removeChannel(channel);
    const onchainChannel = await broadcaster.getChannel(channel);
    expect(onchainChannel).toEqual("0x0000000000000000000000000000000000000000");
  }, 30000);

  test("sendBlockhashPmmr", async () => {
    const channel: Channel = {
      chainId: CHAIN_ID_BASE_SEPOLIA,
      bridgeId: 0,
    };
    const baseParams = new OpStackBroadcastModule({
      gasLimit: "30000000"
    });
    const params: BroadcastParams = baseParams.getBroadcastParams();
    await broadcaster.addChannel(channel, broadcastModuleAddr);
    try {
      await broadcaster.sendBlockhashPmmr(PMMR_SIZE, [channel], [params])
    } catch (e: any) {
      console.log(e.metaMessages.join("\n"));
      throw new Error("Failed to sendBlockhashPmmr");
    }
  }, 30000);
})