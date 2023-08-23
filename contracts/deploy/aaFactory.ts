import { utils, Wallet, Provider } from "zksync-web3"
import * as ethers from "ethers"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { Deployer } from "@matterlabs/hardhat-zksync-deploy"
import {HttpNetworkConfig} from "hardhat/src/types/config";

// load env file
import dotenv from "dotenv";
dotenv.config();

// load wallet private key from env file
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

if (!PRIVATE_KEY)
    throw "⛔️ Private key not detected! Add it to the .env file!";

export default async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore target zkSyncTestnet in config file which can be testnet or local
    const url = ((hre.config.networks.zkSyncLocal) as HttpNetworkConfig).url;
    const provider = new Provider(((hre.config.networks.zkSyncLocal) as HttpNetworkConfig).url);
    const wallet = new Wallet(PRIVATE_KEY, provider);
    const deployer = new Deployer(hre, wallet)

    const factoryArtifact = await deployer.loadArtifact("AAFactory")
    const aaArtifact = await deployer.loadArtifact("Account")
    const factory = await deployer.deploy(
        factoryArtifact,
        [utils.hashBytecode(aaArtifact.bytecode)],
        undefined,
        [aaArtifact.bytecode],
    )

    process.env['AA_FACTORY_ADDRESS'] = factory.address;
    console.log(`AA factory address: ${factory.address}`)
    // const aaFactory = new ethers.Contract(factory.address, factoryArtifact.abi, wallet);
    //
    // const salt = ethers.constants.HashZero;
    // // const owner = Wallet.createRandom();
    // // console.log("SC Account owner pk: ", owner.privateKey);
    //
    //
    // const tx = await aaFactory.deployAccount(salt, wallet.address);
    // await tx.wait();
    //
    //
    // const abiCoder = new ethers.utils.AbiCoder();
    // const accountAddress = utils.create2Address(factory.address, await aaFactory.aaBytecodeHash(), salt, abiCoder.encode(["address"], [wallet.address]));
    //
    // console.log(`SC Account deployed on address ${accountAddress}`)
    // console.log("Funding smart contract account with some ETH");
    // await (
    //     await wallet.sendTransaction({
    //         to: accountAddress,
    //         value: ethers.utils.parseEther("0.02"),
    //     })
    // ).wait();
    console.log(`Done!\n\n`)
}