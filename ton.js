const ton = require('@ton/ton');
const toncrypto = require('@ton/crypto');
const tonaccess = require("@orbs-network/ton-access");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// UQCzlpkbBAjiAe1NiFa94atGzhwFM85c5pny0bgdNFJsUTIK
async function main() {
    const mnemonic = "TODO"; // your 24 secret words (replace ... with the rest of the words)
    const key = await toncrypto.mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = ton.WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    console.log(wallet.address.toString({bounceable: false}));

    const endpoint = await tonaccess.getHttpEndpoint();
    const client = new ton.TonClient({endpoint});

    // query balance from chain
    // const balance = await client.getBalance(wallet.address);
    // console.log("balance:", ton.fromNano(balance));
    // if (balance == 0) {
    //     return
    // }

    // query seqno from chain
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();
    console.log("seqno:", seqno);

    await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: seqno,
        messages: [
          ton.internal({
            to: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
            value: "0", // 0.05 TON
            body: `data:application/json,{"p":"ton-20","op":"mint","tick":"nano","amt":"100000000000"}`, // optional comment
            bounce: false,
          })
        ]
      });
    
      // wait until confirmed
      let currentSeqno = seqno;
      while (currentSeqno == seqno) {
        console.log("waiting for transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
      }
      console.log("transaction confirmed!");
};

main();