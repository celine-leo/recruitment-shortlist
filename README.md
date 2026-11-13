# Recruitment Shortlist

A small local tool for shortlisting, scheduling and messaging research participants.
No dependencies, and your data stays on your machine.

> The sample data in this repo is randomised. Participant numbers P9990–P9999 are not real people.

For what each part of the tool does, see [FEATURES.md](FEATURES.md).

## Run it

```bash
mkdir -p uploads/sample && cp sample-data/signups.csv uploads/sample/signups.csv
node server.js
```

Then open http://localhost:3000. The first run seeds from the CSV in `uploads/`.
The ⓘ icon in the page shows a short how-to. To use your own data, put your
screener CSV in `uploads/<date_time>/signups.csv` instead.

## Workflow

1. **Import signups.** Put your screener CSV in `uploads/<date_time>/signups.csv`
   (the first run seeds from it). Later, use the save menu → "Import updated list".
   Only new participant numbers are added; existing people never change.
2. **Place participants.** The wand icon by "New / unplaced" auto-places people into
   the slots you tick, using your screening criteria. Undo with ↶ or Ctrl/Cmd+Z.
   Drag cards to adjust.
3. **Set status and copy the message.** Statuses are Pending call, Called, Pending
   confirmation, Confirmed and Rejected. Click a participant's status icon to set it
   and copy the matching message.
4. **Save.** Everything autosaves to `data/state.json`. Save menu → "Save CSV"
   (all, or confirmed only) writes a snapshot to `exports/`. "Copy shortlist" copies
   confirmed participants only.
5. **Full list.** Filter by "Available on" and group by age or OS.

Participants are matched by `participant_no` only. Keep names and contact details in
your own separate lists, never in the tool.

## Settings

The Settings tab, beside Full list, opens a full settings page with sub-pages in a left menu. Edits are a
**draft** until you press **Save changes**. **Undo** steps back through your edits. If
you leave with unsaved changes, you are asked to save or discard the draft.

- **Schedule.** Session length, gap, the hours sessions run, an optional break and an
  optional "late from" time. Timeslots are generated from these. Each date is a column:
  set the date, whether Auto-place fills it by default, and how many people to aim for.
  Click a slot to set its priority:
  - **Prefer:** filled first.
  - **Normal.**
  - **Avoid:** used only when nothing else fits (late slots start here).
  - **Closed:** never offered.

  If you remove or close a slot that has someone in it, you are warned and they move
  back to New / unplaced. Sign-up timeslots that match no slot are listed on this page.
- **Details.** Study name, sender, organisation, venue, nearest MRT (optional: untick it
  and any message line containing `{mrt}` is left out) and incentive.
- **Message copy.** Four templates: missed call, holding, confirmation, rejection, each
  with a live preview and a reset button. Placeholders show in red; an unknown one shows
  in orange. **Reply by** sets how many days after the message you will reply (default
  +1 day) and at what time. It fills `{deadline}`.
- **Fields.** Which CSV columns the tool uses and how. For each field: label, type
  (single choice, multi-select or free text), values in priority order, and whether it
  appears in the list, on the cards, in "Group by" and in the filter.
- **Criteria.** Your screening rules, which drive Auto-place, the summary bar and the
  Screening criteria popup:
  - **Required:** a field must have certain values to be auto-placed.
  - **Priority:** place people first by one field (value order from Fields).
  - **Then prefer** and **Balance:** tie-breakers and an even mix across fields.
  - **Targets:** minimum counts, e.g. "at least 2 aged 55+".
- **Call script.** Sections you can add, remove and reorder. Each has what to say, a note
  and routes. `[Square brackets]` stay as written for the caller to fill in.

Placeholders: `{pno}` `{date}` `{time}` `{deadline}` `{venue}` `{mrt}` `{incentive}`
`{study}` `{sender}` `{org}`

Settings are saved in `data/state.json` with everything else. Anything left blank falls
back to the default.

## CSV rules

- Required columns: `participant_no` (plain numbers: `1`, not `P01`) and `timeslot`.
- `timeslot`: one or more slots separated by `;`. Each needs a date and a start time,
  e.g. `Thu, 12 Nov, 10:00am–11:00am` or `2026-11-12 10:00`. The date and start time
  must match a slot in Settings → Schedule. With no year, the year of the matching
  schedule date is used.
- Optional: `submission_timestamp`.
- Every other column is kept, and you choose how to use it in Settings → Fields. The
  column name there must match the CSV header exactly. See `sample-data/signups.csv`
  (`age`, `device`, `eligible`, `priority_flag`, `channels`, `has_evidence`).
- Fields are read when you view the data, so changing Settings → Fields does not need a
  re-import.

## Files

- `server.js` serves the page, saves state, and handles uploads and exports.
- `shortlist.html` is the whole interface.
- `sample-data/signups.csv` is randomised sample data (P9990–P9999).
- `data/`, `uploads/` and `exports/` are created at runtime and are git-ignored.

## Adapt for a new study

Everything is in Settings: schedule, details, fields, criteria, call script and
messages. No code changes are needed.

- Set the schedule dates **before** importing your CSV, so timeslots with no year get
  the right one.
- Fresh start: delete `data/`, `exports/` and old `uploads/`.
