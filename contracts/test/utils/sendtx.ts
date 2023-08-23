import { Wallet, Contract, Provider, utils, EIP712Signer, types } from "zksync-web3"
import { ethers } from "ethers"

export async function sendTx(provider: Provider, account: Contract, user: Wallet, tx: any) {
    tx = {
        ...tx,
        from: account.address,
        chainId: (await provider.getNetwork()).chainId,
        nonce: await provider.getTransactionCount(account.address),
        type: 113,
        customData: {
            gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
        } as types.Eip712Meta,
    }

    tx.gasPrice = await provider.getGasPrice()
    if (tx.gasLimit == undefined) {
        tx.gasLimit = ethers.BigNumber.from(20000000)
    }

    const signedTxHash = EIP712Signer.getSignedDigest(tx)
    const signature = ethers.utils.arrayify(
        ethers.utils.joinSignature(user._signingKey().signDigest(signedTxHash)),
    )

    tx.customData = {
        ...tx.customData,
        customSignature: signature,
    }

    let sentTx ;
    try{
        sentTx = await provider.sendTransaction(utils.serialize(tx));
        await sentTx.wait();
    } catch (e) {
        sentTx = function () { throw e; };
    }

    return sentTx
}
