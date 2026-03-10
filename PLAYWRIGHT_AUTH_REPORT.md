# Playwright Auth Check Report

Date: 2026-03-09
App under test: `http://localhost:3000`
Scope: `/login` and `/register`

## Current Status

The app-side auth flow is now wired correctly, and the linked Supabase project has been prepared enough for app provisioning.

Completed:

- Added working login and register forms to the web app.
- Verified in Playwright that both pages render real form controls.
- Verified login submits to Supabase `auth/v1/token`.
- Verified signup submits to Supabase `auth/v1/signup`.
- Applied the initial app schema to the linked Supabase project so `public` tables now exist.
- Changed app-side provisioning to use the Supabase service-role client instead of local Prisma DB connectivity for user bootstrap.

Still blocked:

- Supabase rejects `admin@quan.com` during browser signup before session creation.
- Because signup is rejected upstream, no auth user row or app user row is created.
- I could not disable email confirmation using the currently available MCP surface.

## Playwright Results

### Login page

- URL: `http://localhost:3000/login`
- Controls present:
  - email input
  - password input
  - submit button
- Network request:
  - `POST https://efpafbrfcpkarjbawyjf.supabase.co/auth/v1/token?grant_type=password`
- Result with invalid credentials:
  - HTTP `400`
  - UI shows `Invalid login credentials`

Interpretation:

- The login form is connected to Supabase correctly.

### Register page

- URL: `http://localhost:3000/register`
- Controls present:
  - email input
  - password input
  - confirm password input
  - submit button

#### Requested browser test

Credentials used through site interaction:

- email: `admin@quan.com`
- password: `admin@123`

Observed result:

- Browser sent `POST https://efpafbrfcpkarjbawyjf.supabase.co/auth/v1/signup`
- Supabase returned HTTP `400`
- UI showed: `Email address "admin@quan.com" is invalid`

Interpretation:

- The web app is submitting the signup request correctly.
- The rejection is now on the Supabase side, not in the app UI.

#### Additional requested browser test

Credentials used through site interaction:

- email: `mailtomadhu004@gmail.com`
- password: `Admin@123`

Observed result:

- Browser sent `POST https://efpafbrfcpkarjbawyjf.supabase.co/auth/v1/signup`
- Supabase returned HTTP `429`
- UI showed: `email rate limit exceeded`

Interpretation:

- The signup form is still wired correctly.
- The current blocker is Supabase auth email throttling / delivery limits, not the app.

## Supabase State Verification

After the `admin@quan.com` browser signup attempt:

- `auth.users` has no row for `admin@quan.com`
- `public."User"` has no row for `admin@quan.com`
- `public."Subscription"` has no rows yet

Interpretation:

- The signup request is failing before user creation.

After the `mailtomadhu004@gmail.com` browser signup attempt:

- `auth.users` has no row for `mailtomadhu004@gmail.com`
- `public."User"` has no row for `mailtomadhu004@gmail.com`

Interpretation:

- The `429` rate-limit response occurred before user creation or provisioning.

## Supabase Project Work Completed

The linked project originally had only `auth.*` tables and no `public` schema tables for the app.

Applied app schema:

- `public."User"`
- `public."Subscription"`
- `public."Agent"`
- `public."SwarmRun"`
- `public."SwarmAgent"`
- `public."SwarmMessage"`

Also created the matching enum types:

- `"SubscriptionPlan"`
- `"SubscriptionStatus"`
- `"AgentRole"`
- `"SwarmStatus"`

## Email Confirmation Setting

I checked the Supabase docs through MCP. For hosted Supabase projects, email confirmation is controlled from the Auth provider settings in the Supabase dashboard, or via the Management API with an account access token.

Source:

- `https://supabase.com/docs/guides/auth/passwords`
- `https://supabase.com/docs/guides/auth/auth-smtp`

With the tools available in this session, I do not have a direct management action to toggle that hosted auth setting.

## Important Local Env Note

Your checked-in `.env.local` still shows placeholder values for:

- `DATABASE_URL`
- `DIRECT_URL`

I worked around that for user provisioning by moving bootstrap writes to the Supabase service-role client, but if you expect the rest of the Prisma-backed server routes to work locally, those env values still need to be real in the running app environment.

## Conclusion

The frontend auth bug is fixed.

The app now sends login and signup requests correctly, and the linked Supabase database has the app schema needed for provisioning.

The remaining blocker for the exact requested test account is Supabase rejecting `admin@quan.com` during signup. No user was inserted directly. The failed result came from site interaction testing only.

## Authenticated Product E2E

Date: 2026-03-09
Credentials used:

- email: `mailtomadhu004@gmail.com`
- password: `Admin@123`

### Verified flow

Playwright completed the authenticated flow using the live app on `http://localhost:3000`:

1. Logged in successfully through `/login`
2. Loaded `/dashboard`
3. Opened `/agents`
4. Verified `Custom Agent` starts with empty fields
5. Verified template-based agents prefill name, description, prompt, and color
6. Removed the previous specialist test agent
7. Created a new specialist agent: `Launch Writer`
8. Returned to `/dashboard`
9. Submitted a swarm task
10. Followed the run page until completion

### Agent builder layout

The agent creation page alignment issue is fixed in the live UI.

Observed result:

- form fields are stacked correctly
- textareas render full width
- create panel and roster panel align cleanly
- screenshot saved at `output/playwright/agents-layout-verify.png`

### Full swarm run

Fresh run created through the UI:

- run id: `run_8acf73b08b074c32a9e289a3495ad7d0`
- status: `COMPLETED`
- total tokens: `3411`

Task used:

`Create a launch-day readiness brief for QuanCore. Summarize the product status, identify the top 3 remaining launch blockers, and write a short launch announcement draft I can post today.`

Observed behavior:

- CEO planning completed
- Manager delegation completed
- specialist execution completed
- final result was saved and rendered on the run page

### Final output formatting fix

During the first successful swarm completion, the final answer still rendered as CEO JSON because the orchestration layer reused the structured CEO planning prompt for the final synthesis pass.

This was fixed by:

- adding explicit `structuredOutput` control to the agent runner
- keeping structured JSON for CEO/Manager planning phases
- switching the final CEO synthesis pass to plain Markdown output

Verification rerun:

- run id: `run_9501a862b88744e9b048d1898e12b948`
- status: `COMPLETED`
- final output rendered as user-facing prose instead of raw orchestration JSON

Task used:

`Write a short launch-ready status update for QuanCore with 3 bullets for wins, 3 bullets for blockers, and a 2-sentence public announcement.`

### Additional bug fixed during E2E

Deleting a specialist agent with prior run history originally failed with a foreign key error from `public."SwarmAgent"` and the client then threw a JSON parse error.

What changed:

- the delete/update agent API now returns JSON errors consistently
- the agents UI now handles non-JSON delete failures safely
- previous test swarm records for this user were cleared so a clean specialist replacement could be tested on the `FREE` plan

### Current outcome

The authenticated product path is now working from login through:

- dashboard
- agent creation
- prompt-aware roster setup
- swarm launch
- swarm completion
- final output display

## Swarm UX Retest

Date: 2026-03-09
App under test: `http://localhost:3000`
Account used:

- email: `mailtomadhu004@gmail.com`
- password: `Admin@123`

### Changes verified

- launching from the dashboard still auto-navigates directly to `/swarm/[id]`
- the agent flow chart is now visible on the run page
- the run page now shows an `Agent Outputs` section even while execution is in progress
- completed runs now reload correctly from persisted data and show:
  - graph nodes
  - message edges
  - agent outputs
  - final output
- a logout button now appears at the bottom-left of the dashboard sidebar
- clicking `Stop` now updates the run status in the UI to `STOPPED`

### Stop test

Playwright launched a fresh swarm and then clicked `Stop` while it was running.

Observed result:

- run id: `run_9f761fa4b6b048899f7173720ebd1601`
- status changed from `RUNNING` to `STOPPED` in the run header
- the button changed from `Stop` to `Stopped`
- the page rendered the `Run Stopped` state message
- partial flow data remained visible

### Completed run reload test

Playwright opened an existing completed run directly by URL:

- run id: `run_9501a862b88744e9b048d1898e12b948`

Observed result after page reload:

- task text loaded from the backend
- status displayed `COMPLETED`
- flow graph showed CEO, Manager, and Writer nodes
- agent outputs rendered in the `Agent Outputs` section
- final output rendered in the `Final Output` panel

### Live run visibility test

Playwright launched a fresh run from the dashboard and confirmed the new run page immediately showed:

- visible agent nodes in the chart
- edge routing between CEO, Manager, and Writer
- `Agent Outputs` section
- live status header

Run used:

- run id: `run_bcc8301ee78746c4add6b475e0925aeb`

This specific task still failed later in orchestration, but the UI regression requested in this pass is fixed: the user can now see the flow and the partial outputs instead of landing on a blank or opaque run page.

### Residual backend note

Swarm orchestration is still not fully stable for every prompt. During this retest, some new runs failed after partial execution with `Orchestration failed`.

That is now easier to diagnose from the product because:

- the graph stays visible
- partial agent output stays visible
- the run error panel is visible

The remaining issue is backend orchestration reliability, not run-page visibility or navigation.

## Cleanup Pass

Date: 2026-03-09
App under test: `http://localhost:3000`
Account used:

- email: `mailtomadhu004@gmail.com`
- password: `Admin@123`

### Root causes found

- realtime broadcasts were awaited inline during orchestration, so a slow `Supabase Realtime` send could leave a run stuck in `RUNNING`
- the `OpenRouter` timeout only covered the initial `fetch()` call; if the provider stalled while sending the response body, the swarm could hang before `COMPLETED`
- free-model responses could return placeholder or off-topic content while still technically succeeding

### Fixes applied

- timeboxed realtime broadcast sends in `lib/orchestrator/MessageBus.ts`
- extended the OpenRouter timeout in `lib/openrouter/client.ts` to cover response body reads, not just headers
- added relevance and placeholder guards in `lib/orchestrator/SwarmOrchestrator.ts` so weak manager/final outputs fall back to deterministic swarm summaries
- tightened persisted swarm-agent bookkeeping so CEO and Manager outputs/tokens survive page reload correctly

### Playwright verification

Fresh verified run:

- run id: `run_763cdc0144da414789852da330bdc20e`

Observed result:

- dashboard launch navigated directly to the live run page
- the flow graph rendered during execution
- the run no longer remained stuck in `RUNNING`
- the run completed and appeared in dashboard history as `COMPLETED`
- reopening the saved run showed persisted CEO, Manager, and Writer cards with tokens and output
- final output rendered after reload

Additional verified run after the persistence fix:

- run id: `run_d19ef71f943341bfacabd93777d9c064`

Observed result:

- the previously hanging run eventually completed after the broadcast timeout fix
- reopening the run showed persisted outputs instead of blank/idle agent cards

### Current status

The swarm completion path is materially more reliable now:

- `RUNNING forever` behavior is fixed for the verified path
- persisted agent state survives reload
- run history and run detail pages remain aligned after completion

One quality gap still remains:

- free-model output can still be broadly on-topic but miss the user's exact requested format

That is now a prompt/output-shaping issue rather than a run-state or orchestration-completion bug.
