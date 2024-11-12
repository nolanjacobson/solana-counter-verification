use anchor_lang::prelude::*;
use std::str::FromStr; // Import the FromStr trait

declare_id!("8LtzJSK27hrTfBW8ppWtXvwZvme1Hjj6CHVUUQ7ahwjG");

#[program]
pub mod solanacounterverification {
    use super::*;

    pub fn initialize_counter(ctx: Context<InitializeCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn reset_counter(ctx: Context<ResetCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        let signer = &ctx.accounts.signer;

        let expected_state_program_id =
            Pubkey::from_str("EFCNdFXKnbcoHZJEQpmKrePsCYYPeMhPoAuAtaoPNy92")
                .map_err(|_| ProgramError::InvalidArgument)?;

        // Derive the PDA using the signer's public key
        let (pda, _bump) =
            Pubkey::find_program_address(&[signer.key().as_ref()], &expected_state_program_id);

        // Ensure the PDA matches the provided state account
        require_keys_eq!(pda, ctx.accounts.state_account.key());

        // Borrow the account data
        let state_data = &ctx.accounts.state_account.data.borrow();

        // Skip the first 8 bytes (discriminator) to access the UserInfo data
        let user_info_data = &state_data[8..];

        // Ensure the data length matches the expected size of UserInfo
        if user_info_data.len() != std::mem::size_of::<UserInfo>() {
            msg!("Expected size: {}", std::mem::size_of::<UserInfo>());
            return Err(ProgramError::InvalidAccountData.into());
        }

        // Deserialize the UserInfo data
        let state: &UserInfo = bytemuck::from_bytes(user_info_data);
        msg!("Account State {}", ctx.accounts.signer.key());
        msg!("Verification status: {}", state.is_verified);

        // Check if the user is verified
        if state.is_verified == 1 {
            counter.count += 1;
            msg!("Counter incremented to: {}", counter.count);
        } else {
            return Err(CustomError::UserNotVerified.into());
        }

        Ok(())
    }
}
#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(init, payer = user, space = 8 + 8, seeds = [b"counter"], bump)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    /// CHECK: This account is safe to use because it is derived from a known PDA and is read-only.
    pub state_account: AccountInfo<'info>,
    /// CHECK: This account is safe to use because it is a signer, ensuring it is valid and authorized.
    #[account(signer)]
    pub signer: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ResetCounter<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

#[account]
pub struct Counter {
    pub count: u64,
}

#[account]
pub struct Verifier {
    pub is_verified: bool,
}

#[error_code]
pub enum CustomError {
    #[msg("User is not verified.")]
    UserNotVerified,
}

#[account(zero_copy)]
#[repr(C)]
#[derive(Default)]
pub struct UserInfo {
    pub user: Pubkey,    // 32
    pub is_verified: u8, // 1, use u8 instead of bool
    pub mtid: [u8; 32],  // Fixed size array for mtid
    pub bump: u8,        // 1
}
