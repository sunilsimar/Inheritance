#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
  program::invoke,
  system_instruction,
};
use anchor_spl::associated_token::{self, Create};
use anchor_spl::token:: {self, Token,Mint, Approve as TokenApprove, Revoke as TokenRevoke, Transfer as TokenTransfer};
use anchor_spl::token_2022::{self, Token2022, Transfer as Token2022Transfer, Approve as Token2022Approve, Revoke as Token2022Revoke};


declare_id!("CRpkPb9EwbMSvNiyiMD4nqAdGJZGwdcS69vBZq77VZUn");

pub const MAX_STATES: usize = 10;

#[program]
pub mod inheritance {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>, beneficiary: Pubkey, duration: i64, amount: u64) -> Result<()> {
    msg!("hello from here");
    let state = &mut ctx.accounts.state;
    state.owner = *ctx.accounts.owner.key;
    state.beneficiary = beneficiary;
    state.expiry_time = Clock::get()?.unix_timestamp + duration;
    state.duration = duration;
    state.delegated_amount = amount;
    state.token_account = ctx.accounts.user_token_account.key();

     if ctx.accounts.token_program.key() == token_2022::ID {
      let cpi_accounts = Token2022Approve {
          to: ctx.accounts.user_token_account.to_account_info(),
          delegate: ctx.accounts.state.to_account_info(),
          authority: ctx.accounts.owner.to_account_info(),
      };
      let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
      token_2022::approve(cpi_ctx, amount)?;
  } else if ctx.accounts.token_program.key() == token::ID {
      let cpi_accounts = TokenApprove {
          to: ctx.accounts.user_token_account.to_account_info(),
          delegate: ctx.accounts.state.to_account_info(),
          authority: ctx.accounts.owner.to_account_info(),
      };
      let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
      token::approve(cpi_ctx, amount)?;
  } else {
      return Err(ProgramError::InvalidAccountData.into());
  }


    Ok(())
  }

  pub fn manual_checkin(ctx: Context<CheckIn>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.expiry_time = Clock::get()?.unix_timestamp + state.duration;
    Ok(())
  }

//   pub fn manual_checkin_all(ctx: Context<CheckInAll>) -> Result<()> {
//     let now = Clock::get()?.unix_timestamp;
//     let owner_key = ctx.accounts.owner.key();

//     for acc in ctx.remaining_accounts {
//         // Using try_deserialize to avoid lifetime issues
//         let mut data = acc.try_borrow_mut_data()?;
//         let disc_bytes = array_ref![data, 0, 8];
//         if disc_bytes != &State::discriminator() {
//             continue;
//         }

//         let mut state: State = AccountDeserialize::try_deserialize(&mut &data[8..])?;
        
//         // Verify ownership
//         require!(state.owner == owner_key, CustomError::InvalidOwner);
        
//         // Update expiry time
//         state.expiry_time = now + state.duration;
        
//         // Manually serialize back
//         let mut writer = &mut data[8..];
//         state.try_serialize(&mut writer)?;
//     }

//     Ok(())
// }
  pub fn update_duration(ctx: Context<UpdateDuration>, new_duration: i64) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.duration = new_duration;
    state.expiry_time = Clock::get()?.unix_timestamp + new_duration;
    Ok(())
  }

  pub fn update_delegation(ctx: Context<UpdateDelegation>, amount: u64) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.delegated_amount += amount;
    state.expiry_time = Clock::get()?.unix_timestamp + state.duration;

    if ctx.accounts.token_program.key() == token_2022::ID {
      let cpi_accounts = Token2022Approve {
        to: ctx.accounts.user_token_account.to_account_info(),
        delegate: state.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
      };

      let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
      token_2022::approve(cpi_ctx, amount)?;
    } else if ctx.accounts.token_program.key() == token::ID {
      let cpi_accounts = TokenApprove {
        to: ctx.accounts.user_token_account.to_account_info(),
        delegate: state.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
      };
      let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
      token::approve(cpi_ctx, amount)?;
    } else {
      return Err(ProgramError::InvalidAccountData.into());
    }

    Ok(())
  }

  pub fn remove_delegation(ctx: Context<RemoveDelegation>) -> Result<()> {
    if ctx.accounts.token_program.key() == token_2022::ID {
        let cpi_accounts = Token2022Revoke {
            source: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts
        );
        token_2022::revoke(cpi_ctx)?;
    } else if ctx.accounts.token_program.key() == token::ID {
        let cpi_accounts = TokenRevoke {
            source: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts
        );
        token::revoke(cpi_ctx)?;
    } else {
        return Err(ProgramError::InvalidAccountData.into());
    }

    Ok(())
}

// pub fn execute_transfer(ctx: Context<ExecuteTransfer>) -> Result<()> {
//   let state = &ctx.accounts.state;
//   let clock = Clock::get()?;

//   msg!("starting");

//   require!(clock.unix_timestamp > state.expiry_time, CustomError::StillActive);
//   require!(
//       ctx.accounts.user_token_account.key() == state.token_account,
//       CustomError::InvalidTokenAccount
//   );

//   let user_token_account_key = ctx.accounts.user_token_account.key();

//   let seeds = &[
//       b"inheritance",
//       state.owner.as_ref(),
//       user_token_account_key.as_ref(),
//       &[ctx.bumps.state],
//   ];
//   let signer_seeds = &[&seeds[..]];

//   msg!("till cpi transfer");

//   let cpi_accounts = Transfer {
//       from: ctx.accounts.user_token_account.to_account_info(),
//       to: ctx.accounts.beneficiary_token_account.to_account_info(),
//       authority: ctx.accounts.state.to_account_info(),
//   };

//   let cpi_ctx = CpiContext::new_with_signer(
//       ctx.accounts.token_program.to_account_info(),
//       cpi_accounts,
//       signer_seeds
//   );
//   token_2022::transfer(cpi_ctx, state.delegated_amount)?;
//   Ok(())
// }


pub fn execute_transfer(ctx: Context<ExecuteTransfer>) -> Result<()> {
  let state = &ctx.accounts.state;
  let clock = Clock::get()?;

  msg!("starting");

  // Ensure that the expiry time has passed
  require!(clock.unix_timestamp > state.expiry_time, CustomError::StillActive);
  
  // Ensure the user's token account matches the state record
  require!(
      ctx.accounts.user_token_account.key() == state.token_account,
      CustomError::InvalidTokenAccount
  );

  let user_token_account_key = ctx.accounts.user_token_account.key();
  
  let seeds = &[
      b"inheritance",
      state.owner.as_ref(),
      user_token_account_key.as_ref(),
      &[ctx.bumps.state],
  ];
  let signer_seeds = &[&seeds[..]];

  msg!("Checking if Beneficiary ATA exists");

  // If the beneficiary ATA does not exist, create it
  if ctx.accounts.beneficiary_token_account.data_is_empty() {
      msg!("Creating Beneficiary ATA");

      let cpi_accounts = Create {
          payer: ctx.accounts.payer.to_account_info(),
          associated_token: ctx.accounts.beneficiary_token_account.to_account_info(),
          authority: ctx.accounts.beneficiary.to_account_info(),
          mint: ctx.accounts.mint.to_account_info(),
          system_program: ctx.accounts.system_program.to_account_info(),
          token_program: ctx.accounts.token_program.to_account_info(),
      };

      let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);
      associated_token::create(cpi_ctx)?;
  }

  msg!("Proceeding with Transfer");

  // let cpi_accounts = Transfer {
  //     from: ctx.accounts.user_token_account.to_account_info(),
  //     to: ctx.accounts.beneficiary_token_account.to_account_info(),
  //     authority: ctx.accounts.state.to_account_info(),
  // };

  // let cpi_ctx = CpiContext::new_with_signer(
  //     ctx.accounts.token_program.to_account_info(),
  //     cpi_accounts,
  //     signer_seeds
  // );

  // token_2022::transfer(cpi_ctx, state.delegated_amount)?;

  if ctx.accounts.token_program.key() == token_2022::ID {
    let cpi_accounts = Token2022Transfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.beneficiary_token_account.to_account_info(),
        authority: ctx.accounts.state.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds
    );
    token_2022::transfer(cpi_ctx, state.delegated_amount)?;
} else if ctx.accounts.token_program.key() == token::ID {
    let cpi_accounts = TokenTransfer {
        from: ctx.accounts.user_token_account.to_account_info(),
        to: ctx.accounts.beneficiary_token_account.to_account_info(),
        authority: ctx.accounts.state.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds
    );
    token::transfer(cpi_ctx, state.delegated_amount)?;
} else {
    return Err(ProgramError::InvalidAccountData.into());
}


  Ok(())
}




}

#[derive(Accounts)]
pub struct Initialize<'info> {
  #[account(
    init, payer = owner, space = 8 + 32 + 32 + 8 + 8 + 8 + 32,
    seeds = [b"inheritance", owner.key().as_ref(), user_token_account.key().as_ref()],
    bump
  )]
  pub state: Account<'info, State>,
  #[account(mut)]
  pub owner: Signer<'info>,
  #[account(mut)]
   /// CHECK: This is a token account, and we manually verify it later
  pub user_token_account: AccountInfo<'info>,
  /// CHECK: This is a token account, and we manually verify it later.
  pub token_program: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CheckIn<'info> {
  #[account(mut, has_one = owner)]
  pub state: Account<'info, State>,
  #[account(mut)]
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckInAll<'info> {
  #[account(mut)]
  pub owner: Signer<'info>,

  // #[account(
  //   mut,
  //   // has_one = owner,
  //   constraint = states.iter().all(|state| state.owner == *owner.key()),
  //   constraint = states.len() <= MAX_STATES,
  // )]
  // pub states: Vec<Account<'info, State>>,
}

#[derive(Accounts)]
pub struct UpdateDuration<'info> {
  #[account(mut, has_one = owner)]
  pub state: Account<'info, State>,
  pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateDelegation<'info> {
  #[account(
    mut,
    seeds= [b"inheritance", owner.key().as_ref(), user_token_account.key().as_ref()],
    bump,
    has_one = owner,
  )]
  pub state: Account<'info, State>,
  
  #[account(mut)]
  pub owner: Signer<'info>,

  #[account(mut)]
   /// CHECK: This is a token account, and we manually verify it later
  pub user_token_account: AccountInfo<'info>,
  /// CHECK: This can be either Token or Token2022 program
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RemoveDelegation<'info> {
  #[account(
    mut,
    seeds=[b"inheritance", owner.key().as_ref(), user_token_account.key().as_ref()],
    bump,
    has_one = owner,
    close = owner,
  )]
  pub state: Account<'info, State>,
  #[account(mut)]
   /// CHECK: This is a token account, and we manually verify it later.
  pub user_token_account: AccountInfo<'info>,
  pub owner: Signer<'info>,
  /// CHECK: This can be either Token or Token2022 program
  #[account(
    constraint = (
        *token_program.key == token::ID ||
        *token_program.key == token_2022::ID
    )
)]
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ExecuteTransfer<'info> {
    #[account(mut)]
    /// CHECK: This is a token account that belongs to the owner
    pub user_token_account: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: This is the token account that belongs to the beneficiary
    pub beneficiary_token_account: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"inheritance", state.owner.as_ref(), user_token_account.key().as_ref()],
        bump,
        constraint = state.beneficiary == beneficiary.key(),
        close = beneficiary
    )]
    pub state: Account<'info, State>,
    
    /// The beneficiary who will receive the tokens
    pub beneficiary: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: This is the mint account 
    pub mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    
     /// CHECK: This can be either Token or Token2022 program
    #[account(
      constraint = (
          *token_program.key == token::ID ||
          *token_program.key == token_2022::ID
      )
  )]
    pub token_program: AccountInfo<'info>,

    /// CHECK: This is the ata
    pub associated_token_program: AccountInfo<'info>,
}


#[account(mut)]
pub struct State {
  pub owner: Pubkey,
  pub beneficiary: Pubkey,
  pub expiry_time: i64,
  pub duration: i64,
  pub delegated_amount: u64,
  pub token_account: Pubkey,
}

impl anchor_lang::Owner for State {
  fn owner() -> Pubkey {
      ID
  }
}

#[error_code]
pub enum CustomError {
  #[msg("The user is still active")]
  StillActive,
  #[msg("Invalid owner for state account")]
  InvalidOwner,
  #[msg("invalid token account")]
  InvalidTokenAccount
}