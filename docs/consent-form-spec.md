# Permission form — build spec

Copy this into a new Google Form at <https://forms.new>. Every question below is written
as it should appear to a parent.

Once created: **Send → link icon (🔗) → Copy**, then paste the URL into
`config/site.json` → `forms.consentFormUrl`.

---

## Form settings

| Setting | Value | Why |
|---|---|---|
| Title | **Road to Zones — Swimmer Name Permission** | |
| Collect email addresses | **On (Verified)** | You must be able to reply to verify the request |
| Limit to 1 response | **Off** | A parent may need to change their mind later |
| Allow response editing | **On** | Lets a parent withdraw without emailing you |
| Send responders a copy | **On** | Gives the family a record of what they agreed to |
| Require sign-in | **Off** | Requiring a Google account would exclude families |

⚠️ **Do not create this form in an ASU-affiliated Google account** unless you've cleared it
first. Responses will contain minors' names plus parent contact details, and putting that in a
university-governed account brings it under ASU data-governance rules. A personal account keeps
this a personal project.

---

## Form description (paste into the header)

> Road to Zones is an independent, unofficial site that highlights Arizona swimmers who have
> achieved a Western Zones qualifying time. It is not affiliated with Arizona Swimming or USA
> Swimming, and appearing on it is not team selection.
>
> By default we show swimmers as first name and last initial (like "Ana L."). Use this form if
> you'd like your swimmer's full name shown, if you'd like us to use their name when we celebrate
> new qualifiers, or if you'd like them removed from the site entirely.
>
> Only a parent or legal guardian should submit this form. We'll email you to confirm before
> changing anything.

---

## Questions

**1. Your name** — Short answer — *Required*
> Parent or legal guardian

**2. Your relationship to the swimmer** — Multiple choice — *Required*
- Parent
- Legal guardian
- Other (please explain below)

**3. Swimmer's full name** — Short answer — *Required*

**4. Swimmer's club / team** — Short answer — *Required*
> Helps us match the right swimmer — some swimmers share a name.

**5. Swimmer's age group** — Multiple choice — *Required*
- 10 & Under
- 11-12
- 13-14

**6. What would you like us to do?** — Checkboxes — *Required*
- Show my swimmer's **full name** on the site
- Use my swimmer's name in **announcements** celebrating new qualifiers
- **Remove my swimmer** from the site entirely
- Correct something that's wrong (describe below)

> Note under the question:
> These are separate choices. Choosing a full name on the site does not mean we'll use your
> swimmer's name in announcements — pick that separately if you want it.

**7. Anything we should know or fix?** — Paragraph — *Optional*
> Wrong age group? Wrong time? Tell us here.

**8. Confirmation** — Checkboxes — *Required*
- ☐ I am the parent or legal guardian of this swimmer and I'm authorized to make this request.
- ☐ I understand this site is unofficial, is not affiliated with Arizona Swimming or USA
  Swimming, and that appearing on it is not team selection.
- ☐ I understand I can change or withdraw this at any time.

---

## Handling responses — important

**A form response is a request, not a completed consent.** Never wire responses straight into
`data/consent.json`.

Anyone can type any child's name into a public form. Without verification, an unverified
submission could opt a child *into* full-name display — which would be worse than the default.
So:

1. A response arrives.
2. **Reply to the submitted email address** and get a confirmation back.
3. Only then hand-edit `data/consent.json`.
4. Removal requests are the exception — **apply those immediately, before verifying.** Failing
   toward less exposure is always the safe direction, and a bad-faith removal request costs
   nothing but a board entry.

`data/consent.json` shape:

```json
{
  "consent": {
    "ana-lopez-scottsdale": "full",
    "sam-rivera-tucson": "full-with-announcements",
    "jordan-kim-phoenix": "excluded"
  }
}
```

Levels: `excluded` · `initial` (default, no record needed) · `full` · `full-with-announcements`.

A swimmer with no record is shown as "Ana L." — the code defaults to less disclosure and never
escalates on its own.

---

## Two more forms (same process, lower priority)

**Report a data error** — pre-fillable so a page can pass the swimmer/event in via query params:
swimmer name, event, what's wrong, your email.

**Suggest a feature** — what you'd like to see, your email (optional).

Add their URLs to `config/site.json` under `forms.errorReportFormUrl` and
`forms.featureRequestFormUrl`.
