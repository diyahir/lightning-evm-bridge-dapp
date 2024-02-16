import { CashuMint, CashuWallet, getEncodedToken } from "@cashu/cashu-ts";

const MINT_URL =
  "https://legend.lnbits.com/cashu/api/v1/AptDNABNBXv8gpuywhx6NV";
const wallet = new CashuWallet(new CashuMint(MINT_URL));
const AMOUNT = 27;
const LN_INVOICE =
  "lnbc270n1pjuu6avsp5kr2zp2nusyq7m6kzvunheftrm0wfrj0kzm5w7wcq8ffts6eapw0qpp5xawlr5nlyd4x73j3s277qnzd7y99g7j3c6d7ah74jav5w00hs9asdqgv4h82arnxqzjccqpjrzjqgu2hps6htyza7vu3j6cvuerraw564rnfc2clphgjyl2d49qcrmgzrzlgqqq9lcqqyqqqqlgqqqqqqgq2q9qxpqysgqh94c5prag3kphd2l20zsr3r40xgfutqcp4pf72az3hj6me8d2vfztndz50rjn6skpauvx66vnxhzfak96xgtsytsjkexc54d7vas85qpvflhp5";

async function main() {
  const { pr, hash } = await wallet.requestMint(AMOUNT);

  //pay this LN invoice
  console.log({ pr }, { hash });

  //   wait 30 seconds
  await new Promise((resolve) => setTimeout(resolve, 30000));

  const { proofs } = await wallet.requestTokens(AMOUNT, hash);
  console.log({ proofs });

  //Encoded proofs can be spent at the mint
  const encoded = getEncodedToken({
    token: [{ mint: MINT_URL, proofs }],
  });
  console.log(encoded);

  //   request a lightning invoice from the user
  const fee = await wallet.getFee(LN_INVOICE);
  console.log({ fee });
  if (fee !== 0) {
    return;
  }

  const res = await wallet.payLnInvoice(LN_INVOICE, proofs);

  console.log(res.change);
}

main();
