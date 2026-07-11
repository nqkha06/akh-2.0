# Social Actions

## Configuration

Status: Observed on public create form

The public form exposes an action list area and supports multiple action rows through an Add action control.

Evidence:

- `evidence/screenshots/create-link/public-create-initial.png`
- `evidence/screenshots/social-links/public-create-action-menu.png`

## Visible Action Labels

Status: Observed in public UI examples

- Subscribe to channel
- Join server
- Follow user
- Follow streamer
- Follow artist
- Subscribe
- Follow

Status: Inferred platform mapping

- Subscribe to channel: likely YouTube or similar video platform.
- Join server: likely Discord.
- Follow streamer: likely Twitch or streaming platform.
- Follow user/artist: likely social/music platforms.

Authenticated create showed reusable recent actions such as Subscribe to channel and Like a video. Selecting a recent Subscribe action populated a required action row and enabled URL-link creation.

## Visitor Completion

Status: Observed for created URL link

Public demo cards show locked buttons and progress counters. For the created URL link, clicking "Subscribe to channel" opened YouTube in a new tab at `youtube.com/@pnhlong88?sub_confirmation=1`. Returning to the unlock page left progress at `0/1` and the unlock button disabled during the observation window. The action button itself became disabled after click.

This does not prove backend verification; completion behavior remains unknown beyond the observed click/open state.

Evidence:

- `evidence/screenshots/visitor-flow/created-url-mobile-initial.png`
- `evidence/screenshots/visitor-flow/created-url-mobile-after-action-click.png`
- `evidence/notes/post-create-extra-summary.json`

## Recommended Rebuild Behavior

Status: Recommended

- Represent actions as ordered rows under a gated link.
- Require platform, action type, target URL, display label, and enabled state.
- Allow multiple actions per gated link.
- Use trust-based open-and-confirm flow unless a platform API provides compliant verification.
- Clearly label unverified completion as visitor-confirmed.
