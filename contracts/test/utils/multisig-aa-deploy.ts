import { Wallet, Contract, utils } from "zksync-web3"
import * as hre from "hardhat"
import { Deployer } from "@matterlabs/hardhat-zksync-deploy"
import { ethers } from "ethers"

export async function deployAAFactory(wallet: Wallet): Promise<Contract> {
    let deployer: Deployer = new Deployer(hre, wallet)
    const factoryArtifact = await deployer.loadArtifact("MultisigAAFactory")
    const accountArtifact = await deployer.loadArtifact("TestTwoUserMultisig")
    const bytecodeHash = utils.hashBytecode(accountArtifact.bytecode)

    return await deployer.deploy(factoryArtifact, [bytecodeHash], undefined, [
        accountArtifact.bytecode,
    ])
}

export async function deployAccount(
    wallet: Wallet,
    owner1: Wallet,
    owner2: Wallet,
    factory_address: string,
): Promise<Contract> {
    let deployer: Deployer = new Deployer(hre, wallet)
    const factoryArtifact = await hre.artifacts.readArtifact("MultisigAAFactory")
    const factory = new ethers.Contract(factory_address, factoryArtifact.abi, wallet)

    const salt = ethers.constants.HashZero
    await (await factory.deployAccount(salt, owner1.address, owner2.address)).wait()

    const AbiCoder = new ethers.utils.AbiCoder()
    const account_address = utils.create2Address(
        factory.address,
        await factory.aaBytecodeHash(),
        salt,
        AbiCoder.encode(["address", "address"], [owner1.address, owner2.address]),
    )

    const accountArtifact = await deployer.loadArtifact("TestTwoUserMultisig")

    return new ethers.Contract(account_address, accountArtifact.abi, wallet)
}
