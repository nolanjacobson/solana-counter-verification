const anchor = require("@project-serum/anchor");
const {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
import crypto from "crypto";

// Function to get the 8-byte instruction identifier
function getInstructionIdentifier(name: string): Buffer {
  return crypto.createHash("sha256").update(name).digest().slice(0, 8);
}

async function main() {
  // Set up the connection to the Solana devnet
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Load the wallet keypair
  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        require("fs").readFileSync(
          "/Users/nolanjacobson/.config/solana/anothernewacct1.json",
          "utf8"
        )
      )
    )
  );

  // Define the program ID and the PDA seeds
  const programId = new PublicKey(
    "8LtzJSK27hrTfBW8ppWtXvwZvme1Hjj6CHVUUQ7ahwjG"
  );

  const stateProgramId = new PublicKey("EFCNdFXKnbcoHZJEQpmKrePsCYYPeMhPoAuAtaoPNy92");
  const signer = wallet.publicKey;

  // Derive the PDA for the state account
  const [stateAccount, _bump] = await PublicKey.findProgramAddress(
    [signer.toBuffer()],
    stateProgramId
  );

  // Define the counter account (this should be created and initialized beforehand)
  const counterAccount = new PublicKey(
    "7LS1SBi2f1YGgzJREEk4g7DAcJEjtimRQZukm2PXM2dB"
  );
  // Derive the PDA for the counter account
  const [counterPDA, bump] = await PublicKey.findProgramAddress(
    [Buffer.from("counter")],
    programId
  );

  // Create the transaction instruction for initializing the counter
//   const initializeIx = new anchor.web3.TransactionInstruction({
//     keys: [
//       { pubkey: counterPDA, isSigner: false, isWritable: true }, // Counter account
//       { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // User as signer and payer
//       { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
//     ],
//     programId: programId,
//     data: Buffer.concat([
//         getInstructionIdentifier("global:initialize_counter"), // 8-byte identifier
//       ]),
//   });

//   // Create and send the transaction
//   const transaction1 = new Transaction().add(initializeIx);
//   transaction1.feePayer = wallet.publicKey;
// //   transaction.recentBlockhash = (
// //     await connection.getLatestBlockhash()
// //   ).blockhash;

//   // Sign and send the transaction
//   const signature1 = await connection.sendTransaction(transaction1, [wallet]);
//   console.log("Transaction signature:", signature1);

// //   Confirm the transaction
//   await connection.confirmTransaction(signature1, "confirmed");
//   console.log("Transaction confirmed");


//   const resetIx = new anchor.web3.TransactionInstruction({
//     keys: [
//       { pubkey: counterPDA, isSigner: false, isWritable: true }, // Counter account
//       { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // User as signer
//     ],
//     programId: programId,
//     data: Buffer.concat([
//       getInstructionIdentifier("global:reset_counter"), // 8-byte identifier
//     ]),
//   });

//     // Create and send the transaction
//   const resetTx = new Transaction().add(resetIx);
//   resetTx.feePayer = wallet.publicKey;
// //   transaction.recentBlockhash = (
// //     await connection.getLatestBlockhash()
// //   ).blockhash;

//   // Sign and send the transaction
//   const resetSignature = await connection.sendTransaction(resetTx, [wallet]);
//   console.log("Transaction signature:", resetSignature);

//   //   Confirm the transaction
//   await connection.confirmTransaction(resetSignature, "confirmed");
//   console.log("Transaction confirmed");

  // Create the transaction instruction
  const instruction = new anchor.web3.TransactionInstruction({
    keys: [
      { pubkey: counterPDA, isSigner: false, isWritable: true },
      { pubkey: stateAccount, isSigner: false, isWritable: false },
      { pubkey: signer, isSigner: true, isWritable: false },
    ],
    programId: programId,
    data: Buffer.concat([
      getInstructionIdentifier("global:increment"), // 8-byte identifier
    ]),
  });

  // Create and send the transaction
  const transaction = new Transaction().add(instruction);
  transaction.feePayer = wallet.publicKey;
  //   transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

  // Sign and send the transaction
  const signature = await connection.sendTransaction(transaction, [wallet]);
  console.log("Transaction signature:", signature);

  // Confirm the transaction
  await connection.confirmTransaction(signature, "confirmed");
  console.log("Transaction confirmed");
}

main().catch((err) => {
  console.error(err);
});
