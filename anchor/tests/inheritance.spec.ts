// import * as anchor from '@coral-xyz/anchor'
// import {Program} from '@coral-xyz/anchor'
// import {Keypair, PublicKey, SystemProgram} from '@solana/web3.js'
// import { Inheritance } from '../target/types/inheritance'
// import { BankrunProvider, startAnchor } from 'anchor-bankrun'
// import { program } from '@coral-xyz/anchor/dist/cjs/native/system'
// import { assert } from 'console'
// import { Connection, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";


// const IDL = require("../target/idl/inheritance.json");

// // Replace the provider's connection with a valid Solana connection
// const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// const inheritanceAddress = new PublicKey("CRpkPb9EwbMSvNiyiMD4nqAdGJZGwdcS69vBZq77VZUn");

// let context;
// let provider: BankrunProvider;
// let inheritanceProgram: Program<Inheritance>;
// let owner: PublicKey;
// // let owner: PublicKey = new PublicKey('4qHa23pg8F5PgZUkxSbjN42HjZobNDZstvLv7kNnumWt');
// let beneficiary = new PublicKey('9QCpL8mWW32gfJL6yc9kUKHDVvFD5MBsYTb2ZKaTgoU6');

// beforeAll( async() => {

//     context = await startAnchor(
//         "",
//         [{ name: "inheritance", programId: inheritanceAddress }],
//         []
//     );
//     provider = new BankrunProvider(context);

//     inheritanceProgram = new Program<Inheritance>(
//         IDL,
//         provider,
//     );

//     if (!inheritanceProgram.provider.publicKey) {
//         throw new Error("Provider public key is undefined");
//     }
//     // owner = Keypair.generate()
//     // console.log("Owner publickey: {}", owner);

//     if (!inheritanceProgram.provider.publicKey) {
//         throw new Error("Provider public key is undefined");
//     }

//     owner = inheritanceProgram.provider.publicKey;
// }
// )

// describe("Inheritance", () => {
//     it("Initialize Pda", async () => {
    
//         // Call the on-chain method
//             const beneficiary = new PublicKey(
//                 "9QCpL8mWW32gfJL6yc9kUKHDVvFD5MBsYTb2ZKaTgoU6"
//             );

//             // const beneficiary = Keypair.generate();
//             const seed = "s";
//             const inactivityPeriod = new anchor.BN(30);

//             console.log("Seeds:", {
//                 prefix: "user_pda",
//                 owner: owner.toString(),
//                 seed: seed
//             });

//             await inheritanceProgram.methods
//                 .initializePda(beneficiary, seed, inactivityPeriod)
//                 .rpc();

//            const [pdaAddress] = PublicKey.findProgramAddressSync(
//             [Buffer.from("user_pda"), owner.toBuffer(), Buffer.from(seed)],
//             inheritanceProgram.programId,
//            );

//            const pda = await inheritanceProgram.account.userPda.fetch(pdaAddress);

//            console.log(pda);
//            expect(pda.seed).toEqual("s")
//            expect(pda.beneficiary.toBase58()).toEqual(beneficiary.toBase58())


//            await inheritanceProgram.methods
//            .transferToBeneficiary()
//            .accounts({
//                userPda: pdaAddress,
//                owner: owner,
//                //@ts-ignore
//                beneficiary: beneficiary,
//            })
//            .rpc();
   
//     });

//     // it("revoke", async () => {
//     //     const [pdaAddress, bump] = PublicKey.findProgramAddressSync(
//     //       [Buffer.from("user_pda"), owner.toBuffer(), Buffer.from("s")],
//     //       inheritanceProgram.programId
//     //     );
    
//     //     const pda = await inheritanceProgram.account.userPda.fetch(pdaAddress);
        
//     //     console.log("Fetched PDA:", pda);
//     //     console.log("Before revoke: is_delegated =", pda.isDelegated);

//     //     await inheritanceProgram.methods
//     //     .revokeDelegation()
//     //     .accounts({
//     //         //@ts-ignore
//     //         userPda: pdaAddress,
//     //         owner: owner,
//     //     })
//     //     .rpc();
//     //   });

//     //   it("checkin", async() => {
//     //     const [pdaAddress, bump] = PublicKey.findProgramAddressSync(
//     //         [Buffer.from("user_pda"), owner.toBuffer(), Buffer.from("s")],
//     //         inheritanceProgram.programId
//     //       );
      
//     //       const pda = await inheritanceProgram.account.userPda.fetch(pdaAddress);
//     //       console.log(pda);

//     //       await inheritanceProgram.methods.manualCheckin(new anchor.BN(3))
//     //       .accounts({
//     //          //@ts-ignore
//     //          userPda: pdaAddress,
//     //          owner: owner,
//     //       })
//     //       .rpc();
//     //       const updatedPda = await inheritanceProgram.account.userPda.fetch(pdaAddress);
//     //       expect(updatedPda.inactivityPeriod.toNumber()).toEqual(3)
//     //   })

//     //   it('deadline update', async() => {
//     //     const [pdaAddress, bump] = PublicKey.findProgramAddressSync(
//     //         [Buffer.from("user_pda"), owner.toBuffer(), Buffer.from("s")],
//     //         inheritanceProgram.programId
//     //     )

//     //     await inheritanceProgram.methods.deadlinePeriodUpdate(new anchor.BN(5))
//     //     .accounts({
//     //         //@ts-ignore
//     //         userPda: pdaAddress,
//     //         owner: owner,
//     //     })
//     //     .rpc();

//     //     const pda = await inheritanceProgram.account.userPda.fetch(pdaAddress);
//     //     expect(pda.inactivityPeriod.toNumber()).toEqual(5)

//     //   })
      
//     // it("Transfer funds to beneficiary after inactivity period", async () => {
//     //     const seed = "s";
//     //     const ownerInitialBalance = (await provider.connection.getAccountInfo(owner))?.lamports || 0;

//     //     const inactivityPeriod = new anchor.BN(30); // 30 seconds
//     //     const beneficiary = new PublicKey("9QCpL8mWW32gfJL6yc9kUKHDVvFD5MBsYTb2ZKaTgoU6");
//     //     // const beneficiaryInitialBalance = (await provider.connection.getAccountInfo(beneficiary))?.lamports || 0;
    
//     //     // Initialize the PDA
//     //     await inheritanceProgram.methods
//     //         .initializePda(beneficiary, seed, inactivityPeriod)
//     //         .rpc();
    
//     //     const [pdaAddress] = PublicKey.findProgramAddressSync(
//     //         [Buffer.from("user_pda"), owner.toBuffer(), Buffer.from(seed)],
//     //         inheritanceProgram.programId
//     //     );
    
//     //     let pda = await inheritanceProgram.account.userPda.fetch(pdaAddress);
//     //     console.log("Initialized PDA:", pda);

//     //     console.log("owner publickey", owner)
    
//     //     // Confirm initial state
//     //     expect(pda.seed).toEqual(seed);
//     //     expect(pda.beneficiary.toBase58()).toEqual(beneficiary.toBase58());
//     //     expect(pda.isDelegated).toBeTruthy(); // Ensure delegation is active
    
//     //     // Wait for inactivity period to pass
//     //     console.log("Waiting for inactivity period...");
//     //     // await new Promise((resolve) => setTimeout(resolve, 35000)); // Wait 35 seconds

    
//     //     // Call transfer_to_beneficiary
//     //     await inheritanceProgram.methods
//     //         .transferToBeneficiary()
//     //         .accounts({
//     //             userPda: pdaAddress,
//     //             owner: owner,
//     //             //@ts-ignore
//     //             beneficiary: beneficiary,
//     //         })
//     //         .rpc();
    
//     //     // Fetch updated lamport balances
//     //     const ownerAccountInfo = await provider.connection.getAccountInfo(owner);
//     //     console.log(ownerAccountInfo)
//     //     const ownerFinalBalance = ownerAccountInfo ? ownerAccountInfo.lamports : 0;
//     //     const beneficiaryAccountInfo = await provider.connection.getAccountInfo(beneficiary);
//     //     const beneficiaryFinalBalance = beneficiaryAccountInfo ? beneficiaryAccountInfo.lamports : 0;
    
//     //     console.log("Owner final balance:", ownerFinalBalance);
//     //     console.log("Beneficiary final balance:", beneficiaryFinalBalance);
    
//     //     // Verify balances and PDA state
//     //     expect(ownerFinalBalance).toBeLessThan(ownerInitialBalance); // Owner should have transferred lamports
    
//     // }, 
//     // 60000);
    

    
    
 
// });

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Inheritance } from "../target/types/inheritance";
import { PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createAccount, getOrCreateAssociatedTokenAccount, mintTo, createMint } from "@solana/spl-token";
import { Provider } from "@project-serum/anchor";

// Initialize Anchor provider
anchor.setProvider(anchor.AnchorProvider.env());
const provider = anchor.getProvider();
const program = anchor.workspace.Inheritance as Program<Inheritance>;

// Test Setup
let owner: Keypair;
let beneficiary: PublicKey;
let userTokenAccount: PublicKey;
let beneficiaryTokenAccount: PublicKey;
let statePDA: PublicKey;
let mint: PublicKey;

// beforeAll(async () => {
//     owner = Keypair.generate();
//     beneficiary = Keypair.generate().publicKey;
//     mint = Keypair.generate().publicKey;

//     // Create Token Accounts
//     userTokenAccount = await getOrCreateAssociatedTokenAccount(
//         provider.connection, owner, mint, owner.publicKey
//     ).then(acc => acc.address);

//     beneficiaryTokenAccount = await getOrCreateAssociatedTokenAccount(
//         provider.connection, owner, mint, beneficiary
//     ).then(acc => acc.address);

//     // Mint some tokens to the owner's token account
//     await mintTo(provider.connection, owner, mint, userTokenAccount, owner, 1000);

//     // Find PDA
//     [statePDA] = PublicKey.findProgramAddressSync([
//         Buffer.from("inheritance_state"),
//         owner.publicKey.toBuffer()
//     ], program.programId);
// });

beforeAll(async () => {
    owner = Keypair.generate();
    beneficiary = Keypair.generate().publicKey;
    console.log('here');

    // Add this airdrop section before creating the mint
    const airdropSignature = await provider.connection.requestAirdrop(
        owner.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL // Airdrop 2 SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    console.log('Airdropped SOL to owner');

    // ✅ Step 1: Create a real SPL Token Mint
    mint = await createMint(
        provider.connection, 
        owner,              // Payer (Transaction signer)
        owner.publicKey,    // Mint Authority
        null,               // Freeze Authority (can be `null` if not needed)
        9,                  // Decimals (9 for SOL-based tokens)
        undefined,          // Keypair (optional, auto-generated if undefined)
        undefined,          // ConfirmOptions (optional)
        TOKEN_PROGRAM_ID    // Token Program ID (Default SPL Token Program)
    );
    console.log('here is the mint', mint)
    // ✅ Step 2: Create token accounts for owner & beneficiary
    userTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection, owner, mint, owner.publicKey
    ).then(acc => acc.address);

    beneficiaryTokenAccount = await getOrCreateAssociatedTokenAccount(
        provider.connection, owner, mint, beneficiary
    ).then(acc => acc.address);

    // ✅ Step 3: Mint tokens to the owner's token account
    await mintTo(provider.connection, owner, mint, userTokenAccount, owner, 1000);

    // ✅ Step 4: Find PDA
    [statePDA] = PublicKey.findProgramAddressSync([
        Buffer.from("inheritance"),
        owner.publicKey.toBuffer()
    ], program.programId);
},60000);


    describe("Inheritance Program", () => {
        it("Initializes State", async () => {
            const duration = new anchor.BN(60); // 60 seconds
            const amount = new anchor.BN(100);
    
            await program.methods
                .initialize(beneficiary, duration, amount)
                .accounts({
                    //@ts-ignore
                    state: statePDA,
                    owner: owner.publicKey,
                    userTokenAccount: userTokenAccount,
                    //@ts-ignore
                    systemProgram: anchor.web3.SystemProgram.programId, // Add SystemProgram
                    tokenProgram: TOKEN_PROGRAM_ID,
                    payer: owner.publicKey, // Add payer
                })
                .signers([owner])
                .rpc();
    
            const state = await program.account.state.fetch(statePDA);
            expect(state.owner.toBase58()).toBe(owner.publicKey.toBase58());
            expect(state.beneficiary.toBase58()).toBe(beneficiary.toBase58());
            expect(state.duration.toNumber()).toBe(60);
        });

    // it("Performs Manual Check-in", async () => {
    //     await program.methods
    //         .manualCheckin()
    //         .accounts({ state: statePDA,
    //              //@ts-ignore
    //              owner: owner.publicKey })
    //         .signers([owner])
    //         .rpc();
    // });

    // it("Updates Duration", async () => {
    //     const newDuration = new anchor.BN(120);
    //     await program.methods
    //         .updateDuration(newDuration)
    //         .accounts({ state: statePDA,
    //              //@ts-ignore
    //              owner: owner.publicKey })
    //         .signers([owner])
    //         .rpc();

    //     const state = await program.account.state.fetch(statePDA);
    //     expect(state.duration.toNumber()).toBe(120);
    // });

    // it("Removes Delegation", async () => {
    //     await program.methods
    //         .removeDelegation()
    //         .accounts({
    //              //@ts-ignore
    //             state: statePDA,
    //             owner: owner.publicKey,
    //             userTokenAccount: userTokenAccount,
    //             tokenProgram: TOKEN_PROGRAM_ID,
    //         })
    //         .signers([owner])
    //         .rpc();
    // });

    // it("Executes Transfer After Expiry", async () => {
    //     // Simulate expiry by advancing blockchain time
    //     await provider.connection.confirmTransaction(
    //         await provider.connection.requestAirdrop(owner.publicKey, 1000000000),
    //         "confirmed"
    //     );

    //     await program.methods
    //         .executeTransfer()
    //         .accounts({
    //             state: statePDA,
    //             userTokenAccount: userTokenAccount,
    //             beneficiaryTokenAccount: beneficiaryTokenAccount,
    //              //@ts-ignore
    //             tokenProgram: TOKEN_PROGRAM_ID,
    //         })
    //         .signers([])
    //         .rpc();
    // });
});
