# MOVO — Hedera Integration (Project Blueprint)

Project Title: MOVO  
Track: Decentralized Financial Systems

Short description
MOVO is an application that demonstrates Hedera-native capabilities (smart contracts, tokens, and HCS) to provide secure, low-cost, and auditable interactions between frontend users and backend business logic. This repository contains four main folders:
- Frontend (React)
- Backend (Node.js / Express + Hedera SDK)
- Smart Contracts (Solidity + Hardhat / deployment scripts)
- Facilitator / deployment & helper scripts

Pitch deck & certification links
- Pitch deck: https://www.canva.com/design/DAG3W9wlc-o/wxZ_9xTGql_SVFeqBQBlFg/edit?utm_content=DAG3W9wlc-o&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
- Certification / team credentials: 

Hedera Integration Summary
We use Hedera services to guarantee low cost, predictable fees, and strong finality for all critical on-chain operations.

1) Hedera Consensus Service (HCS)
- Purpose / Why: HCS is used for immutable, ordered logging of critical application events (audit trail of state changes and off-chain-to-on-chain proofs). We chose HCS because its predictable, tiny fees and ordered consensus make event auditability lightweight and low-cost for frequent logging.
- Hedera transactions used: TopicCreateTransaction, TopicMessageSubmitTransaction
- How it's used: The backend submits event payloads to an HCS topic. Frontend and auditors can replay messages via mirror nodes for verification.

2) Hedera Token Service (HTS)
- Purpose / Why: HTS is used to represent in-app assets/tokens. HTS offers native tokens without the overhead and gas unpredictability of alternative chains.
- Hedera transactions used: TokenCreateTransaction, TokenMintTransaction, TokenAssociateTransaction, TransferTransaction
- How it's used: The backend creates token(s) on deployment (or testnet) and mints/associates them with user accounts as needed.

3) Hedera Smart Contracts (EVM-compatible)
- Purpose / Why: Contracts hold on-chain business logic and enforce rules when required (payments, state transitions). We prefer Hedera smart contracts because they combine EVM tooling with Hedera's low fees and fast finality.
- Hedera transactions used: ContractCreateTransaction, ContractExecuteTransaction, ContractCallQuery (as applicable)
- How it's used: The sc folder contains Solidity contracts. The backend deploys/executes contracts via the Hedera SDK.

4) Hedera Accounts & Mirror Nodes
- Purpose / Why: Hedera accounts are used as operator accounts for automated transactions; mirror nodes are queried to read ledger data and HCS messages.
- Hedera transactions used: AccountCreateTransaction (for test accounts, if necessary)
- Mirror node usage: Backend and frontend query mirror endpoints to display historical events and confirmations.

Transaction Types (summary list)
- TopicCreateTransaction
- TopicMessageSubmitTransaction
- TokenCreateTransaction
- TokenMintTransaction
- TokenAssociateTransaction
- TransferTransaction
- ContractCreateTransaction
- ContractExecuteTransaction
- AccountCreateTransaction
- (Other Hedera-specific transactions used by helper scripts)

Economic Justification
- Predictable, low fees: Hedera's micro-fee model and predictable cost structure ensures running costs remain negligible, which is essential for projects targeting emerging markets or low-margin use cases.
- High throughput & low latency: Hedera's high TPS and fast finality reduce user-perceived latency and allow high-frequency logging (HCS) without cost concerns.
- ABFT finality: Fast and provable finality increases trust for settlement situations (payments, supply chain checkpoints).
These characteristics make Hedera well-suited for MOVO's target scenarios (scalable, auditable, and cost-sensitive).

Deployment & Setup Instructions (Run locally on Hedera Testnet; target <10 minutes)
Prerequisites
- Node.js 18+ and npm installed
- Git installed
- A Hedera Testnet account (Operator ID and private key). Create one here: https://portal.hedera.com/testnet (or use existing)
- Optional: Hardhat installed globally if you use it locally; scripts include npx commands so global install is not required.

1) Clone repository
git clone https://github.com/ggalangswt/movo-hedera.git
cd movo-hedera

2) Create .env files
At repository root create .env (or per-folder .env). Minimum variables (example .env.example shown below):
- HEDERA_NETWORK=TESTNET
- OPERATOR_ID=0.0.xxxxx
- OPERATOR_KEY=302e02... (private key)
- CONTRACT_ID= (filled after deployment)
- HCS_TOPIC_ID= (filled after deployment)
- TOKEN_ID= (if using HTS)
Create per-folder .env if you prefer: be/.env, sc/.env, facl/.env

Example .env.example
HEDERA_NETWORK=TESTNET
OPERATOR_ID=0.0.12345
OPERATOR_KEY=302e020100...
CONTRACT_ID=
HCS_TOPIC_ID=
TOKEN_ID=

3) Smart Contracts (sc)
- Install & compile (from repository root or sc folder)
cd sc
npm install
npx hardhat compile
- Deploy to Testnet (adjust script name as needed)
npx hardhat run --network testnet scripts/deploy.js
- After successful deploy, copy CONTRACT_ID (and token/topic IDs if created) into root/.env and be/.env

4) Backend (be)
cd ../be
npm install
# Start backend (reads OPERATOR_ID & OPERATOR_KEY from env)
npm run dev
# or
node server.js
Default: runs on http://localhost:4000 (adjust if different)

5) Frontend (fe)
cd ../fe
npm install
npm start
# Open: http://localhost:3000

6) Facilitator / helper scripts (facil)
cd ../facil
npm install
# Example to create topic or token:
node create_hcs_topic.js
# Follow outputs and save HCS_TOPIC_ID to .env

Running environment (expected)
- Frontend: http://localhost:3000 (npm start)
- Backend: http://localhost:4000 (npm run dev or node server.js)
- Smart contract interactions: via backend using Hedera SDK, contract deployed on testnet (CONTRACT_ID in .env)
- Hedera: Testnet (HEDERA_NETWORK=TESTNET), mirror node endpoints used by backend to fetch HCS messages.

Architecture Diagram (ASCII)
Frontend (React)  <--->  Backend (Node.js + Hedera SDK)  <--->  Hedera Network (Testnet)
   | HTTP/WS                 | Hedera SDK (operator = OPERATOR_ID)          |
   |                         | - TopicMessageSubmitTransaction              |
   |                         | - ContractExecuteTransaction                 |
   |                         | - TokenCreate / Transfer                     |
   V                         V                                              V
[User UI]  <---- REST/WebSocket ---->  [API] ----> [HCS Topic]  (Hedera Consensus Service)
                                          \--> [Smart Contract] (EVM on Hedera)
                                          \--> [HTS Tokens] (Token IDs)
Mirror nodes <- used by frontend/backend to read HCS logs and verify events

Deployed Hedera IDs (Testnet)
- CONTRACT_ID:  (paste here after deploy)
- HCS_TOPIC_ID: 
- TOKEN_ID: 
- OPERATOR_ID (test account used for scripts): 0.0.xxxxx
Note: Judges should be given values here by maintainers. If you have already deployed to Testnet, add the above values into this section.

Repository layout and quick run
- root README.md (this file) — project blueprint (required for judges)
- fe/ — frontend (npm start)
- be/ — backend (npm run dev)
- sc/ — smart contracts and deploy scripts (npx hardhat run)
- facil/ — facilitator and deployment helper scripts

Security & secrets
- Never commit OPERATOR_KEY or private keys. Add them to .env and ensure .gitignore contains .env and any keystore files.
- For judges: provide test operator ID/key via secure channel if you want them to run full deployment; otherwise include deployed IDs and use your operator for the judge run.

Troubleshooting
- If transactions fail: ensure OPERATOR_ID / OPERATOR_KEY are correct and have testnet HBAR balance.
- If HCS message not found: check mirror node URL in backend and verify Topic ID is correct.
- If frontend cannot call backend: check CORS and ensure backend is listening on configured port.

Contact & Credits
Team / Maintainer: @ggalangswt, @lexirieru, @scientivan, @raditazar, @amantajatii
Repository: https://github.com/ggalangswt/movo-hedera
