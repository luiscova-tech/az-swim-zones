# Awareness & distribution plan

> Produced by a multi-agent strategy pass (4 independent strategies, 2 judge panels, 1 synthesis).
> Treat the factual claims as UNVERIFIED until checked against public documents — especially the
> roster-cap and school-calendar questions in section 1, which could change the project premise.

# Road to Zones — One Awareness Plan

## 1. The core insight

**This is not marketing. It's canvassing — and the unit isn't impressions, it's roughly 100 specific Arizona households.** Optimizing for reach is the category error that would waste a year. Two facts do the unblocking. First, the coach is an *informational* gatekeeper, not a legal one: the family submits the application; the coach supplies a signature, an attendance number, and a comment box. So the whole problem collapses to getting the right ~100 families to see one PDF and one deadline before it closes — and to shrinking what they need from the coach from "please educate us and do paperwork" to "please sign this," which is easy to grant and awkward to refuse without giving an actual reason. Second, the only channels that route around a club are physical presence at meets and an email list you own. Everything else is decoration. But before any of it: **verify the diagnosis.** If Arizona's funded travel team is capped at 7 boys and 7 girls per age group, "14" was a policy cap, not ignorance, and the ask changes entirely. Also check whether the meet (early August, in Oregon) collides with the Arizona school start — a family that knew and said no because of the first week of school is not a family you reach with awareness.

## 2. Do this first (week one)

**Day 1 (2 hrs, $0).** Download the current Western Zone meet sheet and Arizona's own application packet from public URLs. Extract verbatim: roster cap (80), individual-entry cap (400), bonus entries allowed slower than standard (≤160), no de-qualification standards, six events per athlete. Find the application open and close dates. Answer three questions in writing: (a) is there a funded-team size cap; (b) do SCY times count toward qualifying; (c) does the application deadline close *before* the last long-course chances to qualify. Recompute 117/14/80 yourself. Any number you can't cite publicly, cut.

**Day 2.** Write "Why Your Coach Might Say No — And When They're Right" (see §4). Write it before anything else parent-facing; it forces even-handedness into every page downstream and it's what a skeptical coach finds when he scans your QR code.

**Day 3.** Write "Five Questions to Ask Your Coach" as a web page + printable one-pager: (1) When does the application open and close? (2) Does it need your signature and an attendance percentage — what number would you put today? (3) If she's on the edge, what would you want to see between now and then? (4) Is there anything about Zones you think is a bad fit for her right now? I'd genuinely like your honest read. (5) Who does the paperwork, and can I do any of it? Ask in person. **Do not** send a "just capturing what we discussed" follow-up email — coaches read a paper trail instantly and it poisons the relationship you need.

**Day 4.** Lay out and order 500 wallet cards (~$25). Front: a dense AAA cut grid for the five most-swum events across 10&U / 11-12 / 13-14 — a tool a parent keeps in a swim bag, not an ad. Back: one sentence ("A AAA time is the qualifying standard for the Western Zone Age Group Championships. Arizona can send up to 80. Free to check:"), a 1-inch QR, and the plain URL. **No dates on anything printed** — dates live only on the site, so the card stays credible for three seasons.

**Day 5.** Stand up a free email list (Buttondown free tier) with the ceiling stated on the signup itself: *"Four emails a year: applications open, deadline, standards update, results. Nothing else, ever."* Wire the signup into the end of every calculator result. This is the only channel no club can close.

**Day 6-7.** Sign up as a timer for a full session at the next two multi-club meets, in age groups your kid isn't in. Email two host-club meet directors (clubs, not the LSC): "Are you printing heat sheets, and what does a business-card ad cost?" Buy one at ≤$25. Then hand the coach-facing page to one head coach you personally trust and ask exactly one question: *"Would this make you warn families away?"* Anything short of a clear no means rewrite.

## 3. Build this on the site (ranked by leverage)

1. **Make the calculator's success state a next step, not a dead end.** Today "yes, that's a AAA time" terminates. It should immediately show: application open/close dates, the one-cut explainer, the Five Questions, and the email signup. Highest-leverage change on the site — it converts the tool that already works into the top of the funnel.
2. **`/check` — the single-input landing page.** Every QR, card, and link lands here, never the homepage. One time field above the fold, verdict in under 10 seconds, no signup. Under 50KB, system fonts, 60px tap targets, service worker for offline — pool-deck LTE is congested and the sun is brutal. Two branches: cut → next steps; no cut → **"0.9 seconds away"** with a progress bar. Most visitors won't have a cut; the near-miss is the honest and the most motivating state.
3. **`/calendar` + the .ics download.** Dated timeline: SC champs, the application window boxed in red, LC regionals, LC state with its new-qualifier cutoff, the meet. Lead with the deadline-ordering warning if it verifies: *the application may close before the last chance to qualify — apply without the cut in hand.*
4. **Four evergreen pages, hand-written:** "What is Zones? A plain-English guide for Arizona swim parents" (essentially uncontested search query), "Qualifying time vs. team selection: two different things," "One Cut Can Be Enough" (the bonus-swim rule, with the honest caveat that how many cuts the LSC requires for selection is the LSC's call), and the coach page from §4.
5. **"What It Took," wired into My Times.** When a logged time beats the 8th- or 16th-place time from a real Zones meet, say so by name, automatically. Also render it as a printable one-pager you can laminate and turn around in a deck conversation. It's a fact about *their* child, not a claim about anyone's club.
6. **`/print`** — ten cards on one 8.5x11 sheet, so a parent you convinced can print and hand them out inside their own team.
7. **`/for-coaches`** with a copy-pasteable paragraph a club can drop into its own newsletter.

Add ~10 genuinely distinct event/age pages over several weeks. Not 60 templated ones — thin near-duplicates on a new domain rank for nothing and risk the whole site.

## 4. The coach question

Write the honest page and put it early in the navigation. Walk through all six reasons plainly: Zones pulls swimmers out of a key training and taper window; it can collide with the club's own championship meet; the club coach usually isn't on deck there, LSC staff are; travel-cost complaints come back to the club, not the LSC; some coaches sincerely believe an all-star travel meet is wrong for a ten-year-old; and someone has to do the admin. For each, say when it's a legitimate coaching call. Offer one fair heuristic instead of an accusation: **the tell isn't the objection, it's the timing** — a coach who explained his philosophy on all-star meets in October is coaching your kid; a reason that only materializes in June may just mean nobody had thought about it yet.

Then recruit the allies. Some Arizona clubs *do* send swimmers. Email five of those coaches individually — not a blast — with a small flattering ask: *"You've sent kids to Zones. Would you write three sentences for parents about what the trip did for a swimmer?"* Named exposure to age-group families choosing a club is a real, honest benefit to them.

Hard editorial rule: **no club is ever named in a negative sentence, and the LSC is referred to only in neutral, linking terms.** You are angry at Arizona Swimming. One sarcastic clause anywhere converts the site from resource to grievance blog, and then coaches warn families away and the whole thing inverts.

## 5. What NOT to do

- **The Coaches' Wall.** Both panels called it the worst idea proposed, and they're right. An opt-in list of clubs promising to tell families is read by everyone as the list of clubs that didn't sign — you only need a "absence means nothing" disclaimer when absence obviously means something. It asks a parent to run a certification scheme over licensed professionals, and it contradicts your own fair page conceding a coach may rightly decline. Delete, don't delay.
- **Share cards built from a kid's time.** The panels split hardest here; take the delete. Name off, the card is generic and nobody shares it. Name on, a minor's first name, age, and time become a permanent graphic circulating in team chats where that child's own peers rank each other. It also multiplies an Arizona audience that currently rounds to zero (k < 1, by the proposal's own admission), and it's months of engineering that is the founder's comfort zone rather than the actual problem. Keep My Times private and on-device, as it already is.
- **Cold-DMing alumni parents found through clubs' "congrats to our Zones swimmers" posts.** The posts name *children*; getting to the parent means compiling a private spreadsheet keyed to kids' results. Nothing illegal, good intent, indefensible optic for a lone swim dad. Recruit the same parents in person at meets or via one warm intro — higher reply rate, a fraction of the risk. Do three interviews, not fifteen, and publish the negative answers alongside the positive ones; that's what makes the page un-dismissable.
- **Unattended card stacks on timer chairs and volunteer tables.** This is the single thing most likely to get you a conversation with meet management. Hand-to-hand, in conversation, adults only, never an unaccompanied minor, never a photograph. If anyone asks you to stop, stop instantly and pleasantly — one retold deck confrontation travels faster than the site ever will.
- **A SwimSwam piece framed as "Arizona sent 14."** One panel loved the reach; the other called it the fastest route to backfire. Position: write it, but about unclaimed Zone seats and the bonus-swim rule generally, with Arizona as one line of arithmetic among several. An LSC callout in the sport's national outlet is a screenshot every Arizona head coach will have by Tuesday.
- **National Facebook swim-parent groups as a distribution channel.** They're national; your target is ~100 Arizona households. Answering real questions there is a fine slow habit. It is not a channel.
- **The branded shirt, the car decal, the PWA, the Wrapped-style recap, and 60 programmatic pages.** Low or zero yield; the last three are months of evenings solving retention for an audience that doesn't exist yet.

## 6. How to know it's working

With no site analytics, count things you can tally in a notebook and in your inbox:

- **Email subscribers** (Buttondown gives you the number free). Put a one-line "where did you hear about this?" field on the form, or ask it in the welcome email and count replies. That's your channel attribution, and it costs nothing.
- **Use a different signup form per channel** — the card QR points to `/check?from=card`, the heat-sheet ad to `/check?from=sheet` — and give each its own Buttondown form. Subscriber counts per form tell you which physical surface actually works.
- **Cards handed out**, tallied per meet. And the metric that matters more: **parents who agreed to print and hand out cards inside their own team.** That's the only scaling mechanism you have; track it as the primary number, not site visits.
- **Alumni parents on record** (target: 3 in year one, not 15). **Coaches who replied** to the five warm emails.
- **The terminal metric, published and free:** the number of Arizona swimmers on next August's Zones roster. One number, once a year.

**Be honest with yourself about what success looks like.** A good first year is not 80 swimmers. It's 300 cards handed out at four meets, one page a head coach reads without flinching, three alumni parents on record, 80 families on an email list, and a dozen more Arizona kids on that plane. Judged against 80 seats, this will feel like failure by month four — which is exactly when solo projects die. And the real clock nobody mentions: your own kid ages out of 14-and-under in two or three seasons. The email list and the evergreen pages are the only assets that outlive that. Build those first.
