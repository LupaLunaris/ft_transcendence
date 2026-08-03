# Audit Actions by Owner

The goal is to assign every corrective action to the **actual owner of the affected area**.

A person appears only when:

- the issue belongs directly to their subsystem;
- the issue was introduced by work for which they are responsible;
- or the corresponding documentation section is still their responsibility.

---

# Global status

Current decision:

> **NO-GO — the project is not ready for evaluation.**

The project has a solid technical base, but the current `dev` snapshot still contains several P1 issues affecting mandatory requirements and claimed modules:

- startup is not reproducible from a clean clone with one command;
- Vault and local development are incompatible;
- WAF configuration contains invalid directives;
- avatar upload is broken, insecure, inaccessible through Nginx and non-persistent;
- friend removal and online status are incomplete;
- Tower levels are absent on a fresh database volume;
- scores, XP, map publication and Tower progression can be forged through direct API calls;
- CORS and Socket.IO still use an obsolete HTTP origin;
- the game is not usable on mobile in the audited snapshot;
- the README is incomplete and documents obsolete direct HTTP ports;
- no CI protects `dev`;
- several claimed modules cannot currently be safely demonstrated.

---

# Priority levels

- **P0 — Critical:** exposed secrets, serious security issue or certain rejection risk.
- **P1 — Blocking:** mandatory requirement or claimed module not demonstrable.
- **P2 — Important:** reliability, testing, governance or maintainability issue.
- **P3 — Minor:** cleanup, optimization or technical debt.

---

# Jérémie — Backend, Database, Infrastructure and Security

## P0 — Critical

### 1. Rotate and purge exposed secrets

- [ ] Revoke and regenerate the PostgreSQL password.
- [ ] Revoke and regenerate the Vault AppRole Secret ID.
- [ ] Regenerate the JWT secret.
- [ ] Remove `.env.secu` from Git tracking.
- [ ] Verify that the old credentials no longer work.
- [ ] Run a new secret scan on the current tree and complete Git history.
- [ ] Verify that no Vault credential, password, token or private key remains accessible.

#### Validation

- no secret is detected in the repository;
- old credentials are invalid;
- the application starts with the new credentials;
- every team member can work.

---

### 2. Secure avatar uploads

The current upload trusts the MIME type supplied by the client and preserves the original extension.

- [ ] Stop trusting `file.mimetype` supplied by the client.
- [ ] Detect the real file type using binary signatures.
- [ ] Allow only JPEG, PNG and WebP.
- [ ] Reject HTML, SVG and unsupported formats.
- [ ] Generate the final filename on the server.
- [ ] Generate the final extension on the server.
- [ ] Never reuse the extension from `originalname`.
- [ ] Add `X-Content-Type-Options: nosniff` when files are served.
- [ ] Ensure uploaded files cannot execute active content.
- [ ] Delete the previous uploaded avatar when it is replaced, when appropriate.
- [ ] Consider decoding and re-encoding images if it can be implemented without destabilizing the project.
- [ ] Add automated tests for:
  - [ ] valid JPEG;
  - [ ] valid PNG;
  - [ ] valid WebP;
  - [ ] false MIME;
  - [ ] HTML renamed as image;
  - [ ] unsupported format;
  - [ ] oversized file.

#### Validation

- valid images are accepted;
- a renamed HTML file declared as `image/png` is rejected;
- uploaded files cannot execute JavaScript under the application origin.

---

## P1 — Blocking

### 3. Make the project start with one command

- [ ] Make the official startup target the first/default Makefile target.
- [ ] Decide whether the official command is `make` or `make up`.
- [ ] Automatically create `.env` from `.env.example` if it is missing.
- [ ] Do not require an undocumented preliminary command.
- [ ] Include Vault initialization in the same startup workflow.
- [ ] Generate or bootstrap `VAULT_ROLE_ID`.
- [ ] Generate or bootstrap `VAULT_SECRET_ID`.
- [ ] Ensure PostgreSQL is healthy before backend startup.
- [ ] Ensure Prisma migrations run automatically.
- [ ] Ensure mandatory Tower data is seeded automatically.
- [ ] Verify startup from a completely clean clone.
- [ ] Verify that no untracked local file is required.
- [ ] Align the Makefile with the final README instructions.

#### Validation

From a fresh clone, the official command must:

1. create the required local configuration;
2. build the images;
3. start PostgreSQL;
4. initialize Vault;
5. apply Prisma migrations;
6. seed mandatory Tower data;
7. start backend, frontend, WAF and Nginx;
8. expose the complete application on `https://localhost`.

---

### 4. Fix local development mode and Vault

The documented local mode launches PostgreSQL and the backend, but the backend requires Vault credentials immediately.

- [ ] Decide whether local development uses Vault.
- [ ] If local development uses Vault, start and bootstrap Vault in `make dev`.
- [ ] If local development does not use Vault, add an explicit development mode that reads:
  - [ ] `DATABASE_URL`;
  - [ ] `JWT_SECRET`;
  - [ ] all other required values from a local environment file.
- [ ] Ensure `backend/.env.example` contains every required variable.
- [ ] Verify `make dev`.
- [ ] Verify `make dev-backend`.
- [ ] Remove or rewrite unsupported Makefile targets rather than keeping broken commands.
- [ ] Document the selected local development strategy.

---

### 5. Add missing Makefile commands

- [ ] Add `down: docker-down`.
- [ ] Add `logs: docker-logs`.
- [ ] Clarify `clean`.
- [ ] Clarify `fclean`.
- [ ] Clearly identify commands that delete volumes.
- [ ] Ensure `re` actually rebuilds and restarts the full application.
- [ ] Verify:
  - [ ] `make`;
  - [ ] `make up`;
  - [ ] `make down`;
  - [ ] `make logs`;
  - [ ] `make re`.
- [ ] Ensure normal shutdown does not delete persistent data.

---

### 6. Fix WAF configuration

- [ ] Replace `MODSEC_RULE_ENGING` with `MODSEC_RULE_ENGINE`.
- [ ] Replace `SecAuditEnging` with `SecAuditEngine`.
- [ ] Validate the configuration inside the exact WAF image.
- [ ] Check WAF startup logs.
- [ ] Verify that no directive is ignored.
- [ ] Verify the WAF healthcheck is meaningful.
- [ ] Add a smoke test expecting:
  - [ ] `200` on `/api/health`;
  - [ ] `403` on a known XSS payload;
  - [ ] `403` on a known SQL injection payload;
  - [ ] no false positive on normal requests.

---

### 7. Fix avatar route and backend API contract

The frontend avatar flow existed before the backend route changes. The backend must restore or properly update the agreed contract.

- [ ] Confirm the canonical avatar endpoint.
- [ ] Restore a route compatible with the established frontend contract, or explicitly update the shared API contract.
- [ ] Remove obsolete or duplicate avatar routes.
- [ ] Use the same authentication mechanism as the rest of the application.
- [ ] Return the response shape expected by the frontend.
- [ ] Verify avatar upload.
- [ ] Verify avatar replacement.
- [ ] Verify default avatar behavior.
- [ ] Verify logout and session restoration after an avatar change.
- [ ] Document the final endpoint.

---

### 8. Expose uploaded avatars through HTTPS

The backend serves `/uploads`, but Nginx does not currently proxy it.

- [ ] Add an Nginx `location /uploads/`.
- [ ] Proxy it to the backend or expose it through another safe backend route.
- [ ] Verify that avatar URLs returned by the backend use the public application origin.
- [ ] Verify avatars are accessible through `https://localhost`.
- [ ] Ensure direct internal backend ports are not required.

---

### 9. Persist uploaded avatars

- [ ] Add a named Docker volume mounted on `/app/backend/uploads`.
- [ ] Preserve that volume during normal `docker compose down`.
- [ ] Remove it only through an explicit destructive command.
- [ ] Verify directory ownership and permissions.
- [ ] Verify that files survive container recreation.
- [ ] Verify avatar replacement after restart.
- [ ] Verify that broken database URLs are not left behind after deletion.

#### Validation

1. upload an avatar;
2. open it through the HTTPS application origin;
3. run normal Docker shutdown;
4. restart the stack;
5. verify that the avatar remains visible;
6. replace it;
7. restart again;
8. verify that the replacement remains visible.

---

### 10. Fix friends backend behavior

- [ ] Verify friend creation.
- [ ] Verify friend removal.
- [ ] Verify both users see the updated relationship.
- [ ] Prevent duplicate friendships.
- [ ] Handle inverse friendship creation.
- [ ] Handle concurrent friendship creation.
- [ ] Return controlled business errors instead of raw Prisma errors.
- [ ] Verify authorization on friend operations.
- [ ] Add tests for:
  - [ ] search;
  - [ ] add;
  - [ ] list;
  - [ ] remove;
  - [ ] duplicate add;
  - [ ] concurrent inverse add;
  - [ ] unauthorized operation.

---

### 11. Fix backend online-status management

The current `Set` cannot represent several sockets or `in_game`.

- [ ] Replace the single `Set` with per-user socket tracking or connection counting.
- [ ] Mark a user offline only after their final active socket disconnects.
- [ ] Support multiple browser tabs.
- [ ] Support global, lobby and game sockets simultaneously.
- [ ] Expose:
  - [ ] `online`;
  - [ ] `offline`;
  - [ ] `in_game`.
- [ ] Set `in_game` when a race starts.
- [ ] Restore `online` or `offline` when a race ends.
- [ ] Ensure the friends endpoint returns the actual status.
- [ ] Handle reconnection correctly.
- [ ] Add multi-socket tests.

#### Validation

- an account with two tabs remains online after one tab closes;
- a player in a race appears as `in_game`;
- the user becomes offline only after the final socket disconnects.

---

### 12. Protect Socket.IO race rooms

- [ ] Verify race membership before `socket.join(raceId)`.
- [ ] Reject authenticated users who are not participants.
- [ ] Prevent external users from receiving race state.
- [ ] Prevent unauthorized sockets from changing room size.
- [ ] Prevent unauthorized users from blocking race startup.
- [ ] Add tests for:
  - [ ] authorized participant;
  - [ ] authenticated non-participant;
  - [ ] two isolated races;
  - [ ] unauthorized state reception.

---

### 13. Align HTTPS origin, CORS and Socket.IO

The Docker environment still references `http://localhost:5173`, while the public origin is now `https://localhost`.

- [ ] Set the Docker frontend origin to `https://localhost`.
- [ ] Support a clear origin list per environment if needed.
- [ ] Verify REST requests through Nginx and WAF.
- [ ] Verify Socket.IO polling.
- [ ] Verify WebSocket upgrade.
- [ ] Test polling with WebSocket upgrade disabled.
- [ ] Ensure WSS works through the public HTTPS origin.
- [ ] Verify no obsolete direct-port URL remains in backend configuration.

---

### 14. Seed mandatory Tower levels automatically

A new database volume contains migrations but no Tower levels.

- [ ] Separate mandatory Tower levels from optional demo accounts.
- [ ] Create an idempotent production-safe seed for the eight required levels.
- [ ] Run it automatically after migrations.
- [ ] Ensure repeated execution does not create duplicates.
- [ ] Add a smoke test for `/api/v1/tower`.
- [ ] Verify all eight levels exist after `docker-down-v` followed by a new startup.

---

### 15. Prevent forged scores

- [ ] Stop accepting the client completion time as the only proof of a valid run.
- [ ] Prevent users from submitting arbitrary values such as `1 ms`.
- [ ] Bind the score to a server-controlled run.
- [ ] Bind the run to:
  - [ ] the authenticated user;
  - [ ] the correct map;
  - [ ] the start time;
  - [ ] the completion event.
- [ ] Reject reused or expired proof.
- [ ] Add anti-replay tests.

---

### 16. Prevent forged map completion and publication

- [ ] Prevent direct calls to `/complete` from validating a map without gameplay.
- [ ] Prevent direct publication after a forged completion.
- [ ] Require a validated server-side run or signed one-time run proof.
- [ ] Bind the proof to the map owner and map ID.
- [ ] Reject reused proof.
- [ ] Add tests with direct `curl` calls.

---

### 17. Prevent forged Tower progression

- [ ] Prevent direct repeated completion requests without gameplay.
- [ ] Require a validated run for each Tower level.
- [ ] Enforce level order server-side.
- [ ] Prevent completion of locked levels.
- [ ] Prevent repeated XP rewards.
- [ ] Add tests for:
  - [ ] locked level;
  - [ ] valid level;
  - [ ] repeated completion;
  - [ ] direct forged request.

---

### 18. Prevent forged XP and achievements

- [ ] Award XP only from validated server-side events.
- [ ] Make unique achievements idempotent.
- [ ] Prevent repeated identical requests from awarding XP again.
- [ ] Protect leaderboard updates.
- [ ] Add transaction or uniqueness protections where needed.
- [ ] Add anti-replay tests.
- [ ] Verify direct API calls cannot grant progression.

---

### 19. Fix rate limiting and proxy configuration

- [ ] Mount the global limiter before all API routes.
- [ ] Include `/users`.
- [ ] Include `/friends`.
- [ ] Add stricter limits to login and registration.
- [ ] Add limits to user search.
- [ ] Add limits to upload.
- [ ] Configure `app.set('trust proxy', ...)` for Nginx → WAF → backend.
- [ ] Verify the actual client IP is used.
- [ ] Remove `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`.
- [ ] Verify different users are not grouped under the proxy IP.

---

### 20. Remove fixed global container names

- [ ] Remove `container_name` for Vault.
- [ ] Remove `container_name` for WAF.
- [ ] Remove `container_name` for Nginx.
- [ ] Let Compose prefix resources with the project name.
- [ ] Update scripts that rely on fixed names.
- [ ] Verify that two separate clones can start independently.

---

### 21. Add `.dockerignore`

Exclude at least:

- [ ] `.git`;
- [ ] `.env`;
- [ ] sensitive `.env*`;
- [ ] Vault secrets;
- [ ] private keys;
- [ ] local certificates where appropriate;
- [ ] `node_modules`;
- [ ] `dist`;
- [ ] logs;
- [ ] generated local files.

Then:

- [ ] verify the build context;
- [ ] verify no local secret is sent to Docker.

---

### 22. Add CI and protect `dev`

No GitHub Actions workflow currently protects the audited snapshot.

- [ ] Add `.github/workflows/`.
- [ ] Run `npm ci`.
- [ ] Run frontend build.
- [ ] Run backend build.
- [ ] Run frontend lint.
- [ ] Run backend lint.
- [ ] Run frontend tests.
- [ ] Run backend tests.
- [ ] Run `prisma validate`.
- [ ] Run migrations against a CI PostgreSQL service.
- [ ] Run `docker compose config`.
- [ ] Add an HTTPS smoke test if feasible.
- [ ] Add a Socket.IO smoke test if feasible.
- [ ] Require status checks on `dev`.
- [ ] Require status checks on `main`.
- [ ] Protect `main` from direct pushes.

---

## P2 — Important

### 23. Add backend and Nginx healthchecks

- [ ] Add an HTTP healthcheck for the backend.
- [ ] Add a healthcheck for Nginx.
- [ ] Add frontend readiness checking if required.
- [ ] Use `service_healthy` where actual readiness matters.
- [ ] Test slow-start behavior.

---

### 24. Add graceful shutdown

- [ ] Handle `SIGTERM`.
- [ ] Handle `SIGINT`.
- [ ] Close the HTTP server.
- [ ] Close Socket.IO.
- [ ] Clear race timers and intervals.
- [ ] Disconnect Prisma.
- [ ] Verify clean Docker shutdown.

---

### 25. Handle Prisma uniqueness conflicts

- [ ] Catch `P2002` for user registration.
- [ ] Catch `P2002` for friendship creation.
- [ ] Return `409 Conflict`.
- [ ] Review every “check then create” flow.
- [ ] Add concurrency tests.

---

### 26. Reduce sensitive logging

- [ ] Use production logging in the evaluation stack.
- [ ] Restrict Prisma logging to `error`.
- [ ] Ensure hashes are not logged.
- [ ] Ensure emails and private data are not unnecessarily logged.
- [ ] Ensure tokens and secrets are never logged.
- [ ] Remove debug logs.

---

### 27. Revalidate admin permissions

- [ ] Verify the current admin role in the database for sensitive operations.
- [ ] Do not rely only on `is_admin` stored in a JWT.
- [ ] Test role removal while an old token still exists.
- [ ] Decide whether token versioning/revocation is needed.

---

### 28. Complete backend validation

- [ ] Validate UUID parameters.
- [ ] Validate query parameters.
- [ ] Validate admin bodies.
- [ ] Add length limits.
- [ ] Validate Socket.IO payloads.
- [ ] Standardize validation errors.
- [ ] Review:
  - [ ] users;
  - [ ] friends;
  - [ ] maps;
  - [ ] scores;
  - [ ] Tower;
  - [ ] admin routes.

---

### 29. Fix backend tests

- [ ] Set `JWT_SECRET` in test setup.
- [ ] Fix the failing auth suite.
- [ ] Remove `ts-jest` warnings.
- [ ] Make all backend tests pass.
- [ ] Add tests for:
  - [ ] friends;
  - [ ] users;
  - [ ] uploads;
  - [ ] online status;
  - [ ] Socket.IO auth;
  - [ ] room authorization;
  - [ ] scoring;
  - [ ] gamification;
  - [ ] Tower;
  - [ ] Docker persistence where feasible.

---

### 30. Add backend lint

- [ ] Add ESLint.
- [ ] Configure ESLint for TypeScript.
- [ ] Make `npm run lint` work.
- [ ] Fix all backend lint errors.
- [ ] Add lint to CI.

---

### 31. Fix vulnerable dependencies

- [ ] Identify the parent dependency introducing `brace-expansion`.
- [ ] Update it safely.
- [ ] Re-run `npm audit`.
- [ ] Review deprecated packages.
- [ ] Avoid risky major upgrades unless necessary.

---

## README sections owned by Jérémie

- [ ] Installation instructions.
- [ ] Environment configuration.
- [ ] Docker and Makefile commands.
- [ ] Local development and Vault behavior.
- [ ] Project organization.
- [ ] Project-management tools.
- [ ] Communication methods.
- [ ] Backend architecture.
- [ ] PostgreSQL architecture.
- [ ] Prisma architecture.
- [ ] Database schema and relations.
- [ ] Migrations.
- [ ] Mandatory Tower seed.
- [ ] Authentication.
- [ ] Authorization.
- [ ] REST API.
- [ ] Socket.IO backend architecture.
- [ ] HTTPS and Nginx.
- [ ] WAF and ModSecurity.
- [ ] Vault.
- [ ] Avatar storage and persistence.
- [ ] Security limitations.
- [ ] Known backend risks.
- [ ] Final list of backend features actually implemented.

---

# Martin — Gameplay, Phaser, Multiplayer, Tower and Editor Core

## P1 — Blocking

### 1. Prove the complete two-player flow

- [ ] Create a lobby.
- [ ] Join with two users.
- [ ] Confirm the real countdown duration.
- [ ] Verify both players receive `duel_start`.
- [ ] Verify both players appear.
- [ ] Verify movements are synchronized.
- [ ] Verify enemies are synchronized.
- [ ] Verify collisions are authoritative.
- [ ] Verify victory.
- [ ] Verify death.
- [ ] Verify final ranking.
- [ ] Verify race cleanup.
- [ ] Verify return to the hub.

---

### 2. Prove the four-player flow

- [ ] Join with four users.
- [ ] Verify startup behavior.
- [ ] Verify all players receive the same state.
- [ ] Verify player states do not overwrite one another.
- [ ] Verify fair gameplay.
- [ ] Verify death and victory for different players.
- [ ] Verify final ranking.
- [ ] Verify cleanup.

---

### 3. Validate reconnection

- [ ] Disconnect for less than 10 seconds.
- [ ] Verify restoration to the same race.
- [ ] Verify the same player identity is restored.
- [ ] Verify no duplicate player appears.
- [ ] Verify the state remains coherent.
- [ ] Disconnect for more than 10 seconds.
- [ ] Verify forfeit or expected end-state behavior.
- [ ] Verify other players are not blocked.
- [ ] Verify rematch/restart afterward.

---

### 4. Validate remote play on separate machines

- [ ] Test on two physical computers.
- [ ] Use two different accounts.
- [ ] Join the same map.
- [ ] Verify movement synchronization.
- [ ] Verify enemy synchronization.
- [ ] Verify race completion.
- [ ] Test moderate latency.
- [ ] Test temporary network interruption.
- [ ] Verify reconnecting feedback is understandable.

---

### 5. Validate three-or-more-player module

- [ ] Test with three players.
- [ ] Test with four players.
- [ ] Verify fairness.
- [ ] Verify no state overwrite.
- [ ] Verify final ranking.
- [ ] Verify a player disconnecting does not block the race.
- [ ] Verify two simultaneous races remain isolated.
- [ ] Do not claim the module until this demonstration is repeatable.

---

### 6. Make gameplay responsive on mobile

The audited `dev` snapshot still uses fixed 800×600 canvases. PR #80 was still open and was therefore not part of the audited version.

- [ ] Finish the responsive canvas implementation.
- [ ] Merge the final corrected PR.
- [ ] Add touch controls.
- [ ] Ensure controls do not overlap gameplay.
- [ ] Verify solo gameplay on mobile.
- [ ] Verify duel gameplay on mobile.
- [ ] Test:
  - [ ] 390×844;
  - [ ] 768×1024;
  - [ ] desktop.
- [ ] Verify no horizontal overflow.
- [ ] Verify the player can complete a level without a keyboard.
- [ ] Verify touch controls do not send duplicate inputs.

---

### 7. Finalize game customization

- [ ] Decide exactly which customization features are claimed.
- [ ] Verify map choice changes gameplay.
- [ ] Verify difficulty changes gameplay.
- [ ] Verify enemy speed changes gameplay.
- [ ] Define explicit default values.
- [ ] Apply settings in solo mode.
- [ ] Apply settings in multiplayer mode.
- [ ] Synchronize settings to all players.
- [ ] Persist settings if persistence is claimed.
- [ ] Fully integrate `MapSettingsPanel` or remove it.
- [ ] Remove unused customization UI.
- [ ] Do not claim unused or non-persisted settings.

---

### 8. Validate Tower gameplay

After Jérémie adds the automatic seed:

- [ ] verify all eight levels appear;
- [ ] verify each level can start;
- [ ] verify unlock order;
- [ ] verify victory;
- [ ] verify defeat;
- [ ] verify progression;
- [ ] verify progression after restart;
- [ ] verify a locked level cannot be completed;
- [ ] verify direct API completion is rejected after backend correction.

---

### 9. Validate gamification through real gameplay

- [ ] Verify XP is only awarded after valid gameplay.
- [ ] Verify unique achievements are awarded once.
- [ ] Verify `FIRST_ESCAPE`.
- [ ] Verify `FIRST_CREATOR`.
- [ ] Verify `DUEL_CHAMPION`.
- [ ] Verify levels.
- [ ] Verify leaderboard calculation.
- [ ] Verify persistence.
- [ ] Verify no duplicate reward after reconnect or retry.
- [ ] Verify direct API calls cannot forge progression after backend correction.

---

## P2 — Important

### 10. Add multiplayer integration tests

- [ ] lobby creation;
- [ ] lobby join;
- [ ] two-player start;
- [ ] four-player start;
- [ ] input synchronization;
- [ ] enemy synchronization;
- [ ] authoritative collision;
- [ ] victory;
- [ ] death;
- [ ] reconnect before 10 seconds;
- [ ] forfeit after 10 seconds;
- [ ] cleanup;
- [ ] concurrent races;
- [ ] minimal load.

---

### 11. Validate the complete web game module

- [ ] movement;
- [ ] wall collisions;
- [ ] enemy collisions;
- [ ] spawn;
- [ ] exit;
- [ ] victory;
- [ ] defeat;
- [ ] restart;
- [ ] valid map;
- [ ] invalid map;
- [ ] publication;
- [ ] play published map;
- [ ] score;
- [ ] leaderboard;
- [ ] player-versus-player demonstration.

---

### 12. Reduce gameplay technical debt

- [ ] Remove remaining `console.log`.
- [ ] Replace `any` with concrete types.
- [ ] Use `GameSettings` consistently.
- [ ] Extract testable state logic from oversized files where safe.
- [ ] Extract serializers where safe.
- [ ] Review disabled `exhaustive-deps` rules.
- [ ] Remove unused components.
- [ ] Document gameplay state transitions.
- [ ] Document reconnection behavior.

---

## README sections owned by Martin

- [ ] Project description.
- [ ] Project goal.
- [ ] Product concept.
- [ ] Complete gameplay feature list.
- [ ] Core rules.
- [ ] Victory conditions.
- [ ] Defeat conditions.
- [ ] Phaser architecture.
- [ ] Editor and map representation.
- [ ] Tower mode.
- [ ] Multiplayer.
- [ ] Remote players.
- [ ] Three-or-more players.
- [ ] Reconnection.
- [ ] Game customization.
- [ ] Gamification rules.
- [ ] Anti-cheat behavior from the gameplay side.
- [ ] Gameplay limitations.
- [ ] Exact evaluation demonstration sequence.

---

# Élise — UI/UX, Responsive UI Outside Gameplay, Accessibility, i18n, Notifications and Legal Pages

## P0 — Critical

### 1. Correct Privacy Policy

- [ ] Remove promises of account deletion if the feature does not exist.
- [ ] Remove promises of data deletion if the feature does not exist.
- [ ] Describe the real deletion process honestly.
- [ ] Describe the data actually stored:
  - [ ] account;
  - [ ] profile;
  - [ ] avatar;
  - [ ] maps;
  - [ ] friendships;
  - [ ] scores;
  - [ ] XP;
  - [ ] achievements.
- [ ] Keep FR, EN and NL aligned.
- [ ] Verify footer access.
- [ ] Remove placeholders.

---

### 2. Correct Terms of Service

- [ ] Remove unsupported features.
- [ ] Describe actual game and account behavior.
- [ ] Keep the Terms consistent with the Privacy Policy.
- [ ] Verify FR, EN and NL.
- [ ] Verify footer access.
- [ ] Remove placeholders.

---

## P1 — Blocking

### 3. Complete three-language support

- [ ] Translate hardcoded `Email`.
- [ ] Translate hardcoded `Preview`.
- [ ] Translate avatar ARIA labels.
- [ ] Replace forced `fr-BE`.
- [ ] Use the active locale for dates.
- [ ] Search all visible strings.
- [ ] Translate buttons.
- [ ] Translate forms.
- [ ] Translate modals.
- [ ] Translate validation errors.
- [ ] Translate success messages.
- [ ] Translate lobby states.
- [ ] Translate gameplay UI.
- [ ] Translate notifications.
- [ ] Verify legal pages.
- [ ] Add key-parity tests.
- [ ] Verify no raw translation key appears.

---

### 4. Decide whether the notification module is still claimed

The GitHub audit considers the current implementation to be transient toasts rather than a complete notification system.

#### If the module remains claimed

- [ ] Add real notification records.
- [ ] Cover important create actions.
- [ ] Cover important update actions.
- [ ] Cover important delete actions.
- [ ] Cover friend addition.
- [ ] Cover friend removal.
- [ ] Cover profile modification.
- [ ] Cover avatar modification.
- [ ] Cover map creation.
- [ ] Cover map update.
- [ ] Cover map deletion.
- [ ] Cover map publication.
- [ ] Add read/unread state.
- [ ] Add persistence.
- [ ] Add notification history/list UI.
- [ ] Prevent duplicates.
- [ ] Add tests.

#### If only toasts remain

- [ ] Remove the complete notification module from the claimed points.
- [ ] Document toasts as ordinary UI feedback rather than a module.

---

### 5. Validate responsive UI outside gameplay

- [ ] Test desktop.
- [ ] Test tablet.
- [ ] Test mobile.
- [ ] Test Navbar.
- [ ] Test Footer.
- [ ] Test login.
- [ ] Test register.
- [ ] Test profile.
- [ ] Test friends.
- [ ] Test editor controls outside the canvas.
- [ ] Test Explore.
- [ ] Test lobby UI.
- [ ] Test legal pages.
- [ ] Fix overflow.
- [ ] Fix unusable controls.
- [ ] Fix touch-target sizes.
- [ ] Document remaining limitations.

---

## P2 — Important

### 6. Complete accessibility verification

- [ ] Keyboard navigation.
- [ ] Visible focus.
- [ ] Form labels.
- [ ] Error associations.
- [ ] ARIA labels.
- [ ] Modal focus management.
- [ ] Focus trap.
- [ ] Contrast.
- [ ] Text size.
- [ ] Touch targets.
- [ ] Automated accessibility audit.
- [ ] Document Phaser/canvas limitations.

---

### 7. Validate the design system

- [ ] Document palette.
- [ ] Document typography.
- [ ] Document icons.
- [ ] List at least ten reusable components.
- [ ] Show reuse across pages.
- [ ] Verify hover.
- [ ] Verify focus.
- [ ] Verify disabled.
- [ ] Verify loading.
- [ ] Verify error.
- [ ] Verify mobile states.
- [ ] Consolidate duplicates.

---

### 8. Validate additional browsers

- [ ] Firefox.
- [ ] Edge or Safari.
- [ ] Authentication.
- [ ] Profile.
- [ ] Avatar.
- [ ] Maps.
- [ ] Phaser.
- [ ] Socket.IO.
- [ ] Responsive behavior.
- [ ] Document limitations.
- [ ] Do not claim the module before two additional browsers are fully tested.

---

### 9. Add UI and i18n tests

- [ ] Language switching.
- [ ] Key parity.
- [ ] Notification display.
- [ ] Friend feedback.
- [ ] Legal pages.
- [ ] Responsive checks where practical.

---

## README sections owned by Élise

- [ ] Responsive interface.
- [ ] Accessibility.
- [ ] Design system.
- [ ] Reusable-component inventory.
- [ ] Internationalization.
- [ ] Supported languages.
- [ ] Notification implementation, or explanation that only toasts are used.
- [ ] Privacy Policy.
- [ ] Terms of Service.
- [ ] Additional browsers.
- [ ] UI/UX limitations.
- [ ] Final list of UI features actually implemented.

---

# Jennifer — Final Technical Review and Integration Verification

Jennifer is not assigned backend corrections caused by changed routes or incomplete backend work.

Jennifer is not responsible for writing the unfinished README sections of the other members.

Her work begins mainly after the responsible owners merge their corrections.

## P1 — Blocking

### 1. Final frontend/backend integration verification

- [ ] Verify repaired backend routes match existing frontend contracts.
- [ ] Verify profile modification end to end.
- [ ] Verify avatar upload end to end.
- [ ] Verify avatar replacement.
- [ ] Verify default avatar.
- [ ] Verify session restoration.
- [ ] Verify friend addition.
- [ ] Verify friend removal.
- [ ] Verify `online`.
- [ ] Verify `offline`.
- [ ] Verify `in_game`.
- [ ] Verify SocketProvider after backend corrections.
- [ ] Verify Tower after the seed correction.
- [ ] Verify no integration regression after merges.

This is a verification task. Backend corrections remain Jérémie’s responsibility.

---

### 2. Final module list and point calculation

- [ ] Create one official module list.
- [ ] Verify the list against subject v21.0.
- [ ] Verify each module is complete.
- [ ] Verify each module has a repeatable demonstration.
- [ ] Verify the secured total reaches at least 14 points.
- [ ] Remove partial modules.
- [ ] Do not count open PRs.
- [ ] Do not count unmerged work.
- [ ] Record the final evaluated SHA.

---

## P2 — Important

### 3. Final Chrome console audit

Only after backend, i18n, gameplay and responsive corrections are merged:

- [ ] test latest stable Chrome;
- [ ] verify no React warning;
- [ ] verify no i18n warning;
- [ ] verify no Phaser warning;
- [ ] verify no unhandled API error;
- [ ] verify no normal-use WebSocket error;
- [ ] test login;
- [ ] test logout;
- [ ] test profile;
- [ ] test avatar;
- [ ] test friends;
- [ ] test editor;
- [ ] test solo game;
- [ ] test Tower;
- [ ] test multiplayer;
- [ ] return remaining issues to their actual owner.

---

### 4. Final technical consistency review

- [ ] Verify frontend/backend contracts.
- [ ] Verify shared TypeScript types.
- [ ] Verify documented routes.
- [ ] Ensure `https://localhost` is the public entry point.
- [ ] Remove obsolete `localhost:5173`.
- [ ] Remove obsolete `localhost:3001`.
- [ ] Verify claimed modules match actual implementation.
- [ ] Verify no obsolete integration remains.
- [ ] Verify the final branch state.

---

### 5. Final GitHub governance review

- [ ] Verify CI is active.
- [ ] Verify checks are green on the final SHA.
- [ ] Verify `main` protection.
- [ ] Verify `dev` is the integration branch.
- [ ] Verify no important PR remains open.
- [ ] Verify PR #80/#81 or replacement work is merged before claiming it.
- [ ] Verify no unresolved conflicts.
- [ ] Verify no last-minute unreviewed large push.
- [ ] Verify contributions are documented honestly.
- [ ] Treat weak commit messages as governance debt, not missing contribution.

---

## README sections owned by Jennifer

- [ ] Resources used.
- [ ] AI usage.
- [ ] Team presentation.
- [ ] Role distribution.
- [ ] Technical-stack overview.
- [ ] Technical-choice overview.
- [ ] Jennifer’s own contribution section.
- [ ] Final consistency review.
- [ ] Final module-list review.
- [ ] Final point calculation.
- [ ] Final known-limitations consolidation.

Jennifer is not responsible for writing:

- Jérémie’s backend, Docker, database or security sections;
- Martin’s gameplay, Tower or multiplayer sections;
- Élise’s UI, i18n, notifications or legal sections.

---

# Mandatory tests before evaluation

## Jérémie

- [ ] Fresh Docker boot.
- [ ] HTTPS available.
- [ ] WAF valid.
- [ ] Migrations applied.
- [ ] Tower levels seeded.
- [ ] Local mode works.
- [ ] Valid image accepted.
- [ ] False MIME rejected.
- [ ] Avatar persists.
- [ ] Friend add/remove.
- [ ] Concurrent friendship.
- [ ] Multi-tab status.
- [ ] Invalid Socket JWT rejected.
- [ ] Unauthorized room join rejected.
- [ ] Forged score rejected.
- [ ] Forged XP rejected.
- [ ] Forged publication rejected.
- [ ] Forged Tower completion rejected.

## Martin

- [ ] Two-player lobby.
- [ ] Four-player lobby.
- [ ] Two isolated rooms.
- [ ] Movement synchronization.
- [ ] Enemy synchronization.
- [ ] Authoritative collisions.
- [ ] Victory.
- [ ] Death.
- [ ] Cleanup.
- [ ] Reconnect before 10 seconds.
- [ ] Forfeit after 10 seconds.
- [ ] Mobile gameplay at 390×844.
- [ ] Tower progression through real gameplay.

## Élise

- [ ] FR/EN/NL key parity.
- [ ] No raw translation keys.
- [ ] Accurate Privacy Policy.
- [ ] Accurate Terms.
- [ ] Notification behavior matches claimed scope.
- [ ] Responsive UI.
- [ ] Firefox.
- [ ] Edge or Safari if claimed.

## Jennifer

- [ ] End-to-end integration on the final SHA.
- [ ] Latest Chrome without console warnings/errors.
- [ ] Final module demonstration checklist.
- [ ] Final README consistency.
- [ ] Final CI and GitHub review.

---

# Recommended implementation order

1. **Jérémie:** rotate and purge secrets.
2. **Jérémie:** secure avatar uploads.
3. **Jérémie:** correct WAF.
4. **Jérémie:** restore one-command startup.
5. **Jérémie:** fix local development and Vault.
6. **Jérémie:** fix avatar route, exposure and persistence.
7. **Jérémie:** fix friends and online status.
8. **Jérémie:** align HTTPS, CORS and Socket.IO.
9. **Jérémie:** add Tower seed.
10. **Jérémie:** prevent forged progression.
11. **Jérémie:** protect race rooms.
12. **Jérémie:** add CI.
13. **Élise:** correct legal pages.
14. **Martin and Jérémie:** stabilize multiplayer and reconnection.
15. **Martin:** finish mobile gameplay.
16. **Martin:** finish or reduce customization scope.
17. **Élise:** complete i18n.
18. **Élise:** decide whether notifications remain claimed.
19. **Each owner:** make tests and lint green in their own area.
20. **Each owner:** complete their own README sections.
21. **Jennifer:** perform final integration, module, console, CI and README reviews.
22. **Team:** rehearse the exact evaluation flow on a frozen SHA.

---

# Green-light criteria

The project can be considered ready only when:

- [ ] one-command startup works on a clean machine;
- [ ] the full application is available on `https://localhost`;
- [ ] build, lint, tests and CI are green on the exact SHA;
- [ ] migrations and Tower seed run automatically;
- [ ] avatars are secure, reachable and persistent;
- [ ] friend removal works;
- [ ] online/in-game/offline status is reliable;
- [ ] two machines complete a race;
- [ ] three-or-more-player gameplay works if claimed;
- [ ] reconnection works;
- [ ] rooms are isolated;
- [ ] mobile gameplay works with touch controls;
- [ ] direct API calls cannot forge scores, XP, publication or Tower progression;
- [ ] legal pages match reality;
- [ ] README contains no placeholder;
- [ ] README contains no obsolete direct-port URL;
- [ ] the official module list is truthful;
- [ ] the official module total reaches at least 14 validated points;
- [ ] each owner can explain and modify their subsystem.

---

# Rule for closing an action

An action can be marked complete only when:

- the code is corrected;
- the relevant automated tests pass;
- the manual reproduction scenario passes;
- no important regression is introduced;
- the responsible owner can explain the implementation;
- the README is updated when setup, features or modules change;
- the final integration review finds no regression.