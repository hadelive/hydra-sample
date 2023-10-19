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

const utxo: OutRef = { txHash: Deno.args[0], outputIndex: 0 };

const txHash = await unlock(utxo, {
  from: validator,
});

await lucid.awaitTx(txHash);

console.log(`1 tADA unlocked from the contract
    Tx ID:    ${txHash}
`);

// --- Supporting functions

async function unlock(
  ref: OutRef,
  { from }: { from: SpendingValidator }
): Promise<TxHash> {
  const [utxo] = await lucid.utxosByOutRef([ref]);

  const Datum = Data.Object({
    id: Data.BigInt,
  });

  type Datum = Data.Static<typeof Datum>;

  const datum = Data.from<Datum>(utxo.datum, Datum);
  const newDatum = Data.to<Datum>(
    {
      id: datum.id + 1n,
    },
    Datum
  );
  const tx = await lucid
    .newTx()
    .addSigner(await lucid.wallet.address())
    .attachSpendingValidator(from)
    .collectFrom([utxo], Data.empty())
    .payToContract(utxo.address, { inline: newDatum }, utxo.assets)
    .complete();

  const signedTx = await tx.sign().complete();

  return signedTx.submit();
}
