# Features

What the shortlist tool does, page by page. For setup and CSV rules, see the [README](README.md).

- [Schedule](#schedule)
- [Status](#status)
- [Full list](#full-list)
- [Save](#save)
- [Settings](#settings)
  - [Schedule and timeslots](#schedule-and-timeslots)
  - [Details](#details)
  - [Fields](#fields)
  - [Screening criteria](#screening-criteria)
  - [Call script](#call-script)
  - [Message copy](#message-copy)

## Schedule

An overview of your participants' availability, placement and status, on one grid of dates and timeslots.

- **Auto-place** fills empty slots for you, based on your [screening criteria](#screening-criteria) and your [scheduled timeslots](#schedule-and-timeslots).
  - It only moves people in New / unplaced who meet your required criteria.
  - You tick which slots to fill. Preferred slots go first and closed slots are never used.
  - Undo it with ↶ or Ctrl/Cmd+Z.
- **Drag and drop** participants into the slots they said they can make. Slots they are available for light up while you drag.
- **Parking lot** for undecided participants under Backups / not shortlisted, and a separate tray for Rejected / not available.
- **See progress at a glance** in the summary bar:
  - Confirmation progress, and how many are placed on each date against your aim.
  - Demographic mix, and whether your targets are met.
  - Checks for slot clashes and late slots.
- **Warnings on cards** when something needs a look: slot clash, first in line, not in their availability, late slot, does not meet a required criterion.
- **Edit availability** by clicking a participant number, for when they tell you a new time on the call.
- **Call script and screening criteria** open from the summary bar, so you can read them while you call.

## Status

Click the round icon on a participant to update their status. Some statuses give you a follow-up message to copy.

| Status | When to use it | Message to copy | Logs a time |
| --- | --- | --- | --- |
| Not contacted yet | The default for everyone. | None | No |
| Pending call | You called and they did not pick up. | Missed call | Yes. "Log call" records each attempt and shows "Last called". |
| Called | You spoke to them and they are suitable. | Holding, with their date, time and when you will reply | No |
| Pending confirmation | You have shortlisted them and are waiting for their yes. | Confirmation, with the venue | No |
| Confirmed | They replied yes. | None | No |
| Rejected | Not suitable or not available. They move to the Rejected tray. | Rejection | No |

- **Reply-by date** is set when you mark someone Called or Pending confirmation. It shows on their card as "Confirm by", and you can change it for that one person.
- **Add a note** to record anything from the call, such as a preferred time or a callback request. It shows on their card and in the full list.
- **Move to Backups** from the same menu, to park someone without rejecting them.
- Holding and confirmation messages need a slot first, because they include the date and time.

## Full list

Every participant in one table, with the screener answers you chose to show.

- **Filter** by the slots they are available for, and by any field you marked as a filter.
- **Group** by one or two fields, for example age, then device.
- **Same actions** as the schedule: set status, add notes and edit availability.

## Save

Everything autosaves to `data/state.json` on your machine. The save menu adds:

- **Copy shortlist** to quickly copy your confirmed participants as text, by date and time, to paste into a chat or calendar.
- **Import updated list** to add new sign-ups without deleting the previous ones.
  - Only new participant numbers are added. People already in the tool, and their status and notes, never change.
  - Each imported file is kept in `uploads/`.
  - **Remove personal data first.** Delete names, phone numbers, emails and any other identifying columns from the CSV before importing. The tool keeps every column it is given, and it only needs `participant_no` to match people.
- **Save CSV** (all, or confirmed only) to write a snapshot to `exports/`, with status, slot, reply-by date, last call time and notes.

## Settings

The Settings tab, beside Schedule and Full list, opens the settings page. Changes are a draft until you save, with Undo, and a prompt if you leave with unsaved changes.

### Schedule and timeslots

In the tool: Settings → Schedule (`#settings/schedule`)

- **Session timing:** session length, gap between sessions, the hours sessions run, an optional break, and an optional "late from" time. Timeslots are generated from these.
- **Dates:** one column per date. For each, choose whether Auto-place fills it by default and how many people to aim for.
- **Slot priority:** click a slot to set it.
  - Prefer: filled first.
  - Normal.
  - Avoid: used only when nothing else fits. Late slots start here.
  - Closed: never offered.
- **Safety checks:** removing or closing a slot that has someone in it warns you, then moves them back to New / unplaced. Sign-up timeslots that match no slot are listed.

### Details

In the tool: Settings → Details (`#settings/details`)

- Study name, sender, organisation, venue and incentive, typed once and reused in every message and the call script.
- Nearest MRT is optional. Untick it to leave that line out of the messages.

### Fields

In the tool: Settings → Fields (`#settings/fields`)

- **Match your own screener.** Add, rename, reorder or remove fields so they match your CSV columns.
- **Choose where each shows:** in the full list, on the cards, as a group-by option or as a filter.
- **Set the value order** for single-choice fields. The first value is the most preferred, and this order drives sorting and Auto-place.

### Screening criteria

In the tool: Settings → Criteria (`#settings/criteria`)

- **Required:** a field must have certain values for someone to be auto-placed.
- **Priority:** who gets placed first, using one field's value order.
- **Then prefer** and **Balance:** tie-breakers, and fields to keep an even mix across.
- **Targets:** minimum counts, for example at least 2 aged 55+. These show in the summary bar.
- **Notes:** free text shown in the Screening criteria popup.

### Call script

In the tool: Settings → Call script (`#settings/script`)

- Sections you can add, remove and reorder. Each has what to say, a note and routes ("if not suitable, do this").
- Details such as `{sender}` and `{study}` fill in automatically.

### Message copy

In the tool: Settings → Message copy (`#settings/messages`)

- **Four templates:** missed call, holding, confirmation and rejection, each with a live preview.
- **Placeholders** such as `{pno}`, `{date}` and `{time}` fill in per participant. They show in red while you edit, and an unknown one shows in orange.
- **Reply by:** how many days after the message you will reply, and at what time. It fills `{deadline}`.
