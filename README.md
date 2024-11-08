<img src="public/logo.png" alt="Digital Utopia Logo" width="200"/>

# Digital Utopia - Empowering Financial Independence

Digital Utopia is a comprehensive platform designed to empower individuals on their journey to financial independence through cryptocurrency trading and investment.

## About

Digital Utopia is a community-driven platform that aims to help users:

- Start their crypto journey
- Become profitable traders
- Pass prop firm challenges and secure funded accounts (10k to 400K)
- Access Copy Trading Services for passive income
- Obtain Visa Crypto Cards
- Stay updated with new digital opportunities

## Features

- User authentication (register, login, and password reset)
- Dashboard for portfolio overview
- Deposit and withdrawal management
- Invoice system for management fees
- Trade result tracking and profit distribution
- Resources section for educational content
- Admin panel for user management and trade input

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/kalemmentore868/digital-utopia.git
   cd digital-utopia
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up your Firebase configuration env variables in `lib/firebase.ts` and 'nodemailer' env variables in `.env`.

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Flow

1. **Onboarding**: Users can register or log in to access the dashboard.
2. **Depositing**: Users can initiate deposits and upload proof of payment.
3. **Withdrawing**: Users can request withdrawals to their specified wallet addresses.
4. **Payments**: Users can view and pay invoices for management fees.
5. **Trade Results**: Users can view their profits based on admin-inputted trade results.
6. **Resources**: Access educational materials uploaded by admins.

## Admin Flow

1. **User Management**: Create and manage user accounts.
2. **Deposit/Withdrawal Handling**: Confirm or reject deposit/withdrawal requests.
3. **Invoice Management**: Create and manage user invoices.
4. **Trade Result Input**: Input daily trading results and distribute profits.
5. **Resource Management**: Upload and manage educational resources.

## Technology Stack

- Next.js
- React
- Firebase (Authentication and Firestore)
- TypeScript
- Tailwind CSS
- NextUI
