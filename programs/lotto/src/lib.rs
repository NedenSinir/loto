use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::{
    token::{self,Mint, Token,TokenAccount,Transfer},
};
pub mod airdrop;
use airdrop::*;

declare_id!("9sXe1DKZaBGNURjUwKe9EhJrhFGTw8NgGpa9gsZfr3zo");

#[program]
pub mod lotto {
    use super::*;
    //on-chain spl token transfer
    pub fn transfer_wrapper(ctx: Context<TransferWrapper>, amount: u64) -> Result<()> {
        msg!("starting tokens: {}", ctx.accounts.sender_token.amount);
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        ctx.accounts.sender_token.reload()?;
        msg!("remaining tokens: {}", ctx.accounts.sender_token.amount);
        Ok(())
    }

    // init 6 decimals ticket before calling this function call on-chain/off-chain spl token transfer to pay ticket's price. Store winner number to compare with lucky_num(lucky_num = buyer's ticket number)
    pub fn get_ticket(ctx: Context<GetTicket>,lucky_num:u32,winner_num:u32) -> Result<()> {
        let ticket: &mut Account<Ticket> = &mut ctx.accounts.ticket;
        let owner: &Signer = &ctx.accounts.owner;

        ticket.owner = *owner.key;
        ticket.ticket_num = lucky_num;
        ticket.winner_num=winner_num;

        Ok(())
    }
    //Claim reward with airdropping spl token
    pub fn airdrop(
        ctx: Context<Airdrop>,
        mint_seed: Vec<u8>,
        mint_bump: u8,
        amount: u64,
    ) -> Result<()> {


        //EDIT "amount" VARIBLE HERE WITH YOUR CUSTOM MATCHING DIGIT


        handler(ctx, mint_seed, mint_bump, amount)
    } 
 
}



// transfer object
#[derive(Accounts)]
pub struct TransferWrapper<'info> {
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

//Get ticket instructions
#[derive(Accounts)]
pub struct GetTicket<'info> {
    #[account(init, payer = owner, space = Ticket::LEN)]
    pub ticket: Account<'info, Ticket>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK:
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

//ticket account instructions
#[account]
pub struct Ticket {
    pub owner: Pubkey,
    pub ticket_num: u32,
    pub winner_num: u32
}
//storage size with bytes
const DISCRIMINATOR_LENGTH: usize = 8;
    const PUBLIC_KEY_LENGTH: usize = 32; 
    const TICKET_NUM_LENGTH: usize = 4;
    const WINNER_NUM_LENGTH: usize = 4;
impl Ticket{
    const LEN: usize = DISCRIMINATOR_LENGTH+PUBLIC_KEY_LENGTH+TICKET_NUM_LENGTH+WINNER_NUM_LENGTH;


}
//-----
//on chain transfer details implemantation 
impl<'info> TransferWrapper<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_token.to_account_info(),
                to: self.receiver_token.to_account_info(),
                authority: self.sender.to_account_info(),
            },
        )
    }
}

//--------------------------------------------------------------------------------------------