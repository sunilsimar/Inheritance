import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { assert } from "chai";

describe("inheritance-man", () => {
    const provider = anchor.AnchorProvider.local();
    anchor.setProvider(provider);

    const program = anchor.workspace.inheritance;
    it("Initializes the account", async () => {
        const baseAccount = Keypair.generate();

        await program.rpc.initialize({
            accounts: {
                baseAccount: baseAccount.publicKey,
                user: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [baseAccount],
        });

        const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
        assert.ok(account.initialized);
    });
});