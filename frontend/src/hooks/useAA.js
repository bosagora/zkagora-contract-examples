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
  const fetchAA = useCallback( async ()=> {
    if(!provider || !signer) {
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

    const abiCoder = new ethers.utils.AbiCoder();
    const accountAddress = utils.create2Address(aaFactory.address, await aaFactory.aaBytecodeHash(), salt, abiCoder.encode(["address"], [signerAddress]));

    const aa = new ethers.Contract(accountAddress, AA_CONTRACT_ABI, signer);
    let owner;
    try{
      owner = await aa.owner();
    } catch (e) {
      return {
        err: "Account has not been created yet.",
        owner: null,
        balance: null,
        limit: null,
      };
    }
    const limit = await aa.limits(ETH_ADDRESS);

    const balance = await provider.getBalance(accountAddress);

    if (limit > 0) {
      return {
        err: "",
        owner,
        accountAddress,
        balance,
        limit,
      };
    } else {
      return {
        err: "",
        owner,
        accountAddress,
        balance,
        limit: null,
      };
    }
  }, [provider, signer]);


  return {
    fetchAA
  };
};

export default useAA;
