import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Lotto } from '../target/types/lotto';
import * as spl from '@solana/spl-token';
import { NodeWallet } from "@project-serum/anchor/dist/cjs/provider";
import * as assert from 'assert';


describe('token-cpi', () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Lotto as Program<Lotto>;
   function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  };
  const ticket=anchor.web3.Keypair.generate();
  it('get ticket', async () => {
    //e.g. call payment function here

    //send random number to smart contract
    await program.rpc.getTicket(getRandomArbitrary(100000,999999),getRandomArbitrary(100000,999999),{
      accounts: {
        ticket: ticket.publicKey,
        owner: program.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
       
      },
      signers:[ticket]
    })
    const ticketAccount = await program.account.ticket.fetch(ticket.publicKey);

    console.log("ticket number",ticketAccount.ticketNum)
    console.log("winner number",ticketAccount.winnerNum)
   
  }); 
  //retrun the spl balance of any mint
  const getBalance = async (mint) => {
    try {
      const parsedAccount = await program.provider.connection.getParsedTokenAccountsByOwner(program.provider.wallet.publicKey, { mint, });
      return parsedAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    } catch (error) {
      console.log("No mints found for wallet");
    }
  }

  //example get reward function you can write conditions here or you can write in smart contract
  const airdrop = async (seed, bump, mintPda, amount, associatedAccount) => {

    await program.rpc.airdrop(
      seed,
      bump,
      amount,
      {
        accounts: {
          payer: program.provider.wallet.publicKey,
          mint: mintPda,
          destination: associatedAccount,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          tokenProgram: spl.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
        },
        signers: [],
      }
    );

  }
  //usage of get reward function
  it('get reward', async () => {
    const web3 = require('@solana/web3.js');
    const {Token} = require('@solana/spl-token');
    const connection = program.provider.connection;
    const vaultWallet = web3.Keypair.generate();
    var fromWallet = (program.provider.wallet as NodeWallet).payer
    
    const boneSeed = Buffer.from(anchor.utils.bytes.utf8.encode("bone-mint-faucet"));

    const [boneMintPda, boneMintPdaBump] = await anchor.web3.PublicKey.findProgramAddress(
      [boneSeed],
      program.programId);

    let associatedBoneTokenAccount = await spl.Token.getAssociatedTokenAddress(
      spl.ASSOCIATED_TOKEN_PROGRAM_ID,
      spl.TOKEN_PROGRAM_ID,
      boneMintPda,
      program.provider.wallet.publicKey,
    );
    var boneToken = new spl.Token(
      connection,
      boneMintPda,
      spl.TOKEN_PROGRAM_ID,
      fromWallet
    );
    let amount = new anchor.BN(25 * 1000000000);
    const boneBalanceBeforeDrop = await getBalance(boneMintPda);

    await airdrop(boneSeed, boneMintPdaBump, boneMintPda, amount, associatedBoneTokenAccount);

    const boneBalanceAfterDrop = await getBalance(boneMintPda);
    console.log(boneBalanceAfterDrop)
    assert.equal(boneBalanceAfterDrop - boneBalanceBeforeDrop, 25);

    //---------- 
    
    // Get the token account of the fromWallet Solana address, if it does not exist, create it
    const fromTokenAccount = await boneToken.getOrCreateAssociatedAccountInfo(
      fromWallet.publicKey,
    );
  
    //get the token account of the toWallet Solana address, if it does not exist, create it
    const toTokenAccount = await boneToken.getOrCreateAssociatedAccountInfo(
      vaultWallet.publicKey,
    );
  
    // Add token transfer instructions to transaction
    const transaction = new web3.Transaction().add(
      spl.Token.createTransferInstruction(
        spl.TOKEN_PROGRAM_ID,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        [],
        3000000000,
      ),
    );
  
    // Sign transaction, broadcast, and confirm
    await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [fromWallet]
    );
    const boneBalanceLast = await getBalance(boneMintPda);

    console.log(boneBalanceLast);
    console.log(fromWallet)
    });

      


    });