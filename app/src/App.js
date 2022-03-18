import './App.css';
import { useState } from 'react';
import { Connection, PublicKey,Transaction } from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';

//don't forget update idl file after deploying smart contract. New idl file can be found in target/idl/lotto.json
import idl from './idl.json';
import * as anchor from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import { PhantomWalletAdapter, PhantomWalletName } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet } from '@project-serum/anchor';

require('@solana/wallet-adapter-react-ui/styles.css');


//DEMO UI DO NOT TRUST IT DETAILED FUNCTION USAGE DESCRIBED IN tests/lotto.ts 
const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter()
]

const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [value, setValue] = useState(null);
  const [valuee, setValuee] = useState(null);
  const wallet = useWallet();
  const {sendTransaction } = useWallet();
  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new Provider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }
  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  };
   async function airdropWrapper() {
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
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    
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
    let amount = new anchor.BN(25 * 1000000000);
    await airdrop(boneSeed, boneMintPdaBump, boneMintPda, amount, associatedBoneTokenAccount);
  }
 
  async function getTicket() {    


    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    const fromWallet = program.provider.wallet
    const connection = program.provider.connection;
    try {
     
      const ticket = web3.Keypair.generate()
      /* interact with the program via rpc */
      await program.rpc.getTicket(getRandomArbitrary(100000,999999),getRandomArbitrary(100000,999999),{
        accounts: {
          ticket: ticket.publicKey,
          owner: program.provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
         
        },
        signers:[ticket]
      }); 
      const ticketAccount = await program.account.ticket.fetch(ticket.publicKey);
      setValue(ticketAccount.ticketNum)
      setValuee(ticketAccount.winnerNum)
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }
  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          Winner Number:
           {(valuee)
                        }
        </div>
        <div>
          
          {
            (<button onClick={getTicket}>{value}aa</button>)
          }
          {
            (<button onClick={airdropWrapper}>claim reward</button>)
          }
         
        </div>
      </div>
    );
  }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;