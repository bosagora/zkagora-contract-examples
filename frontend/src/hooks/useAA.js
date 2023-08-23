import {useState, useEffect, useCallback} from "react";
import {utils, Web3Provider} from "zksync-web3";
import * as ethers from "ethers";
import {
  AAFACTORY_CONTRACT_ABI,
  AA_CONTRACT_ABI,
} from "../constants/consts";
const ETH_ADDRESS = "0x000000000000000000000000000000000000800A";

const salt = ethers.constants.HashZero;
const useAA = (provider, signer) => {
  const aaInfo = useCallback( async ()=> {
    console.log('signer :', signer)
    if(!provider || !signer) {
      console.log("null provider or signer")
      return {
        err: "null provider or signer",
        value: "",
      };
    }

      const aaFactory = new ethers.Contract(
          '0x094499Df5ee555fFc33aF07862e43c90E6FEe501',
          AAFACTORY_CONTRACT_ABI,
          signer
      );

    const signerAddress = await signer.getAddress();
    console.log("signerAddress :", signerAddress)

    const abiCoder = new ethers.utils.AbiCoder();
    const accountAddress = utils.create2Address(aaFactory.address, await aaFactory.aaBytecodeHash(), salt, abiCoder.encode(["address"], [signerAddress]));

    console.log('accountAddress :', accountAddress)
    const aa = new ethers.Contract(accountAddress, AA_CONTRACT_ABI, signer);
    console.log('aa :', aa)
    let limit;
    try{
      limit = await aa.limits(ETH_ADDRESS);
    } catch (e) {
      return {
        err: "null limit",
        value: "",
      };
    }
    console.log("Account limit: ", limit);
    console.log("Available limit today: ", limit.available.toString());
    console.log("Account limit value: ", limit.limit.toString());

    const owner = await aa.owner();
    console.log('owner :', owner)
    const balance = `${(await provider.getBalance(accountAddress)).toString()} WEI`;

    if (limit > 0) {
      return {
        err: "",
        owner,
        balance,
        plugins: [
          {
            name: "Enforced Limit",
            limit: `${limit} WEI`,
          },
        ],
      };
    } else {
      return {
        err: "",
        owner,
        balance,
        plugins: [],
      };
    }
  }, [provider, signer]);


  return {
    aaInfo
  };
};

export default useAA;
