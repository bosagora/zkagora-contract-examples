import { expect } from "chai";
import { Wallet, Provider, Contract, utils } from "zksync-web3";
import * as hre from "hardhat";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as ethers from "ethers";

import { deployContract, fundAccount } from "./utils";

import * as ContractArtifact from "../artifacts-zk/contracts/utils/Greeter.sol/Greeter.json";
// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";
const L1_RPC_ENDPOINT = "http://localhost:8545";
const L2_RPC_ENDPOINT = "http://localhost:3050";

let l1provider: Provider;
let l2provider: Provider;
let wallet: Wallet;
let deployer: Deployer;
let contract: Contract;

before(async function () {
  // setup deployer
  l1provider = new Provider(L1_RPC_ENDPOINT);
  l2provider = new Provider(L2_RPC_ENDPOINT);
  wallet = new Wallet(PRIVATE_KEY, l2provider, l1provider);
  deployer = new Deployer(hre, wallet);

  // deploy contracts
  contract = await deployContract(deployer, "Greeter", ["Hi"]);
  console.log(`contract was deployed to  ${contract.address}`);
});
describe.only("L1 to L2 Transaction", function () {

  it.only("Should be Hi for greet", async function () {
    const msg = await contract.greet();
    expect(await contract.greet()).to.equal("Hi");
  });

  it.only("should set new message correctly", async function () {
    const l1GasPrice = await l2provider.getGasPrice();
    const message = `Updated at ${new Date().toUTCString()}`;

    const tx = await contract.populateTransaction.setGreeting(message);

    // call to RPC method zks_estimateGasL1ToL2 to estimate L2 gas limit
    const l2GasLimit = await l2provider.estimateGasL1(tx);

    console.log(`L2 gasLimit ${l2GasLimit.toString()}`);

    const baseCost = await wallet.getBaseCost({
      // L2 computation
      gasLimit: l2GasLimit,
      // L1 gas price
      gasPrice: l1GasPrice,
    });

    console.log(`Executing this transaction will cost ${ethers.utils.formatEther(baseCost)} ETH`);

    const iface = new ethers.utils.Interface(ContractArtifact.abi);
    const calldata = iface.encodeFunctionData("setGreeting", [message]);

    const txReceipt = await wallet.requestExecute({
      contractAddress: contract.address,
      calldata,
      l2GasLimit: l2GasLimit,
      refundRecipient: wallet.address,
      overrides: {
        // send the required amount of ETH
        value: baseCost,
        gasPrice: l1GasPrice,
      },
    });

    console.log("L1 tx hash is :>> ", txReceipt.hash);

    txReceipt.wait();
    await utils.sleep(15 * 1000)

    const msg = await contract.greet();
    expect(await contract.greet()).to.equal(message);
  });

});
