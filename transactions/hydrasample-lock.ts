import {
  Blockfrost,
  C,
  Constr,
  Data,
  Lucid,
  SpendingValidator,
  TxHash,
  fromHex,
  toHex,
  utf8ToHex,
} from "https://deno.land/x/lucid@0.8.3/mod.ts";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

const lucid = await Lucid.new(
  new Blockfrost(
    "https://cardano-preview.blockfrost.io/api/v0",
    Deno.env.get("BLOCKFROST_API_KEY")
  ),
  "Preview"
);

lucid.selectWalletFromPrivateKey(await Deno.readTextFile("./key.sk"));

const validator = await readValidator();

// --- Supporting functions

async function readValidator(): Promise<SpendingValidator> {
  const validator = JSON.parse(await Deno.readTextFile("../plutus.json"))
    .validators[0];
  return {
    type: "PlutusV2",
    script: toHex(cbor.encode(fromHex(validator.compiledCode))),
  };
}

const Datum = Data.Object({
  id: Data.BigInt,
});

type Datum = Data.Static<typeof Datum>;

const datum = Data.to<Datum>(
  {
    id: 1n,
  },
  Datum
);

const txHash = await lock(1000000n, { into: validator, status: datum });

await lucid.awaitTx(txHash);

console.log(`1 tADA locked into the contract at:
      Tx ID: ${txHash}
      Datum: ${datum}
  `);

// --- Supporting functions

async function lock(
  lovelace: bigint,
  { into, status }: { into: SpendingValidator; status: string }
): Promise<TxHash> {
  const contractAddress = lucid.utils.validatorToAddress(into);

  const tx = await lucid
    .newTx()
    .payToContract(contractAddress, { inline: status }, { lovelace })
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}
