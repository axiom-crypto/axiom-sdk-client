import { AccountSubquery, AxiomV2Callback, AxiomV2ComputeQuery, DataSubquery, DataSubqueryType } from "@axiom-crypto/circuit";
import { buildSendQuery } from "../../../src/sendQuery";
import { AxiomV2QueryOptions } from "../../../src/types";
import { getCallbackHash, getQueryHashV2, getQueryId } from "@axiom-crypto/circuit/pkg/tools";

const SOURCE_CHAIN_ID = "11155111";
const SOURCE_RPC_URL = process.env[`RPC_URL_${SOURCE_CHAIN_ID}`] as string;
const TARGET_CHAIN_ID = "84532";
const TARGET_RPC_URL = process.env[`RPC_URL_${TARGET_CHAIN_ID}`] as string;
const AXIOM_V2_QUERY_ADDR = "0x83c8c0B395850bA55c830451Cfaca4F2A667a983";
const CALLER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const MOCK = true;

describe("SendQuery tests", () => {
  const subqueryData: AccountSubquery = {
    blockNumber: 5000000,
    addr: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    fieldIdx: 0,
  };
  const dataQuery: DataSubquery[] = [
    {
      type: DataSubqueryType.Account,
      subqueryData,
    },
  ]
  const computeQuery: AxiomV2ComputeQuery = {
    k: 13,
    resultLen: 3,
    vkey: [
      '0x0001000009000100000004010000010080000000000000000000000000000000',
      '0xd48c2b8730fdf1c51c742ae8c1084250b13b8faaa72208e9319bd84657977f1b',
      '0x32896ec7f1c5ac47ce4ad8d97b4370a2e5a2425ee54fadf975d50527be25700c',
      '0x12a123500289d8711c26ca11446e20f33cc371f6e166619ef68d7cf6e7540760',
      '0x2a6feb76d283e8c014968892d1193937ce189ecdb4a1913c09478c1c3e19b71e',
      '0x0000000000000000000000000000000000000000000000000000000000000080',
      '0x0000000000000000000000000000000000000000000000000000000000000080',
      '0x0000000000000000000000000000000000000000000000000000000000000080',
      '0x297bfbed6bc93157c20e477404bc76c9f10a718608e7a044243cb9cd47884001',
      '0x8afaa813f597b355bab7d15e06f16077ae933a39ed9b97dbcbec629a02bea061',
      '0x9a8a73c61379755ce23a0e5370405cd4cc79d66af6d9d30e61a4ea3e8bd4ab47',
      '0xc8822d094658052bcfc4e79e3e8341db5cb3ece6dc77a7d369f466f986334a03',
      '0x7084bd1bce301a47e81c5d6d2f7ce4df819e6fe92a1426da80727e87b89f9818',
      '0x8fb57a636ef6f27745e7579f3c17e51a365910cd459ba2a5ce201f4bc8114447',
      '0x0bfd0144a36b15f5760e1975fe030958ad7d07c53bec1ab81fbdeba6dd401110'
    ],
    computeProof: '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004c4b40000000000000000000000000eaa455e4291742ec362bc21a8c46e5f2b5ed470100000000000000000000000000000000000000000000005d5fa36004ecb4d762d51cc1d4ee3533356faf1bd8b6f5a443e0a7c6b5c3d22b02add5724a6bfcc759a3634550513a8433079874368f4e96fd424d2d2d3c340af37a7c54375375585a6a6e219caa70bdbab756f1b06b249e025e04768280a7751c55c6fadabae519516c6f28d1589a21ad62a71b658ae25e214cf6eea822abc747900e1fe165a53b06090969822376ad6ff981265001834ad97cd3415b07a56cc15a812204a60d385d524a1ae87c3f61916f16a1bc5ef31e667a7b76d7a399e7621a3e7afeefae520e1f948364e17d47952e339163919c2e9b3f25bac52c2d615d704c62f84adcfa6f57e916c14e2eed494f62ee94057f25be0f3b101778d651e44b8d6cfeb2aa071db6fc81ad888f0e8b7386a2e7ace708d514b98c0e7abc41b478913eadba5731484e2a8d16f93b70f07a8cb92c5dbc904fb8973f1cea30b013a7202084d36c866ab3eed0da53eb3a5a9e4843a2d20869143d4e9998b69ac1f0cb7f921da9cace5bb975832ba724fbf61aff39f876406ef1860e119d367c981259c8762d0f7ace4a7020922bbe4d04da2581d9656c952a6f1a5d10fd95b9a9ff115eb556538d755c0ebbf40af7e3686f55754a067bfcf36bd42b648cbf21c6f420ab75168440884299165259b6eac1b3871b29531cc43989c604fe1874346ad4822e000ef7562b5a53ec7345cb94baf961b9bdaa598b6249b4dbf43c5c7c8afcbf5a7eaf22f1f86e5cfb1df2359ea794b0ea840fc84b033dfb17fe2dcce2015079bdcc887d6fed29aeeb9dc6218ce4fc2f0177be83cbfc6c8f86e8bdc6e37af8d6c37b995435291c73caabba7b14be7597dbc49413fe4d40701a5bdd2bae29103c5c2f11e1da152905d702817baab0d3ad90c29e2000c5b5eac37df7cbadcf93f97a0587c59b2915c9908fdf0a07c80661f0e5b1609af4fee571adc40690664c71e8a55152975c2d28deaa9b33d22aa3077f18416a5c500c77fd45f1abebc7581873d87cc3f88e1f9ed85bacea4b2144646c042150d3b86e5a05050db2cfabdbf44d6ab4ba22b0130ab5cb2abf2b346691fd035b00fd7942d5bc489db8e7ff75a9fc3c72193e750a3045c01eaf6fef3ab23fdd6923b105354b17321f5061bd9684ff99fbb811291fb30f66027284f8dcdcfe51698cbd44c670eb8374b047f054b0bb7fccac7e6511d5d0f28635f20ab6714b532a239bf7ccdfa16504c1b2f0f1203b3ace3438e710cf73b33e89f56f7b0cea04d8cc4c0b8c58f7f77bf7ee4000134fde200ece632a84d9fd0538beb7b4674d6cd6bee59a081160c83503bc9e64963ed7c0b95aed1264b2e2e65536e718084430319cce5d57d7f6105df0f7f1bc0bcfce34d582660742f3f6f5000dad28063666fde977f2650ae927ba370b3ce1b4b119551c33fa2dfd24ebcebd1f6adf22a7bc42175096e459d0156b2a1130951f4692aa7b3e621d763d91d7857825c5020822d6c119233e8b1d51de4042082471aa025d5d71f70c021fa23ea404bbb6f6ef972d36ae62d1289c405c2f2b25e4189577246138e61bde8092906ef1eb1d90b7d7a9ad64ab7a4c22927b4f8ceb2e6e0d8f3021f4f127328e392f978160a5ca90625fadf38e4382659d0892c859fb45b752d161c3e302000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cec6fef3457e5caebd8b9b84c48fd5a2af606667cfafb1c36379cadd5837dd094ade2e80dba47d31a31b7684f61cc3e4da0a27f03fc7c5160ed057ccb1a02f0ca75fde960c893d107571d6ca0a3205a41d0ace4a51b908d41445a6ac27e68e274055dfb9be206ecb53f3cd443dbf0df0c02eb065795cc6016469868588f077073c6031f4e1ed4a6a74c7bae8616fe7bd755cb262480efd1034d89e247b886f0cd21966bb983ca966756a2faff3eacfe2441ab637954646eb9bff9b3c54f19c0da2e0b09ea5e6474f783c43e2adf25e55bf3bf984e657d8119605e2d5cbefe0026ed34b0c974d6fbd9e118e55dc477ba9e8095e7ddabf0e755620ac0755880d182f4541ef2b372e341525d9c4ee202685ced4ef56e2f283d5a6beb315a0168f204a1503e1fafe888af2bb23d16bf620279e3b4f69a9b313273ccb48fcee51da13ac178045d5fe132169a0ddfd93c925bb02309ab355942a6f228baa097a78ea2db62dc3ff586d6e14796aa95f3ef824b761f2aee6e1f881361e3071292c46bc0654c753ab5e6e00351da37404d68259d38e2cc002eb8f6d49fcd1a9e1f45ff114b87c4c0407ac8b6b898eee280ee196394a89482ead1aeac62bb2f6cf456b8305f161d4e43bc97b20e9e9d6ad2ef73b3a327ab0fc3dafa9315903322417cd441a1a07131ed86d458f886adb34530fbdbc4d0072eb74e8392670e8379a89c4c00f46d2ff601b91e983c69a80b2546c8ff240a79c284073b7d93920e6a621050308b7651af8b9e1b64e29d3a059a9f7fd8330c3c9768dff12fb22da9966ff191224ebe7d44575d1a1ed075983ffee06a8cef12c099d01e18ea980bb61aa5b18112c241403fb8a93c1caad8af32781097d9cf2120230ea750fb155e3e93823c3ea0e1896c08235f2e55380d3baeba0f5d3a0abe2518c903c93954425c6adf4629218ecec2e95964d8a0080be2874599b3ee9651736d9667474e9d784655a356cfc2db7c6345130964556340653c6a8db9f73397531f59e73ec2c7ab8821d90d43a1d0ab377546229735d6b1b0f36ce8ca575d250363e71a7dacc2a3aca46c849822d86a7df20c01f6b29b011dc08f0f7cd7481d0ff28c957b80d2ef7e1df6b3009588da1ab754f3a6f63ba47bfdc3107004f68015450dff4e1d3d8ce5c1eb11f900d'
  };
  const callback: AxiomV2Callback = {
    target: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
    extraData: "0x",
  }
  const options: AxiomV2QueryOptions = {};

  test("Check sendQuery params", async () => {
    const sendQueryParams = await buildSendQuery({
      chainId: SOURCE_CHAIN_ID,
      rpcUrl: SOURCE_RPC_URL,
      axiomV2QueryAddress: AXIOM_V2_QUERY_ADDR,
      dataQuery,
      computeQuery,
      callback,
      caller: CALLER,
      mock: MOCK,
      options,
    });
    const args = sendQueryParams.args;
    expect(args[0]).toEqual(SOURCE_CHAIN_ID);
    expect(args[1]).toEqual("0xbf0bafe9d8b45ce53265cd7afa042d7373e0f4eb1b1f641fbfe44d3f8962cba9");
    expect(args[2]).toEqual(computeQuery);
    expect(args[3]).toEqual(callback);
    expect(args[6]).toEqual(CALLER.toLowerCase());
    expect(args[7]).toEqual("0x0000000000aa36a700010002004c4b40f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000");
    const dataQueryHash = args[1];
    const salt = args[5];
    const queryHash = getQueryHashV2(SOURCE_CHAIN_ID, dataQueryHash, computeQuery);
    const callbackHash = getCallbackHash(callback.target, callback.extraData);
    const queryId = getQueryId(SOURCE_CHAIN_ID, CALLER, salt, queryHash, callbackHash, CALLER);
    expect(BigInt(queryId).toString()).toEqual(sendQueryParams.queryId);
  });

  test("Check sendQuery crosschain params", async () => {
    const sendQueryParams = await buildSendQuery({
      chainId: SOURCE_CHAIN_ID,
      rpcUrl: SOURCE_RPC_URL,
      axiomV2QueryAddress: AXIOM_V2_QUERY_ADDR,
      dataQuery,
      computeQuery,
      callback,
      caller: CALLER,
      mock: MOCK,
      options,
      target: {
        chainId: TARGET_CHAIN_ID,
        rpcUrl: TARGET_RPC_URL,
      },
    });
    const args = sendQueryParams.args;
    expect(args[0]).toEqual(SOURCE_CHAIN_ID);
    expect(args[1]).toEqual("0xbf0bafe9d8b45ce53265cd7afa042d7373e0f4eb1b1f641fbfe44d3f8962cba9");
    expect(args[2]).toEqual(computeQuery);
    expect(args[3]).toEqual(callback);
    expect(args[6]).toEqual(CALLER.toLowerCase());
    expect(args[7]).toEqual("0x0000000000aa36a700010002004c4b40f39fd6e51aad88f6f4ce6ab8827279cfffb9226600000000");
    const dataQueryHash = args[1];
    const salt = args[5];
    const queryHash = getQueryHashV2(SOURCE_CHAIN_ID, dataQueryHash, computeQuery);
    const callbackHash = getCallbackHash(callback.target, callback.extraData);
    const queryId = getQueryId(TARGET_CHAIN_ID, CALLER, salt, queryHash, callbackHash, CALLER);
    expect(BigInt(queryId).toString()).toEqual(sendQueryParams.queryId);
  });
});