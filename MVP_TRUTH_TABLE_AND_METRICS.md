# DreamDuo — MVP Truth Table, Positioning & Win Metrics

---

## A) MVP “Truth Table”

### Features: Done Now vs Planned Soon

| Feature | Status | Notes |
|--------|--------|------|
| **Hierarchical tasks (unlimited nesting)** | ✅ Done | Recursive subtasks, self-referential DB, no fixed depth |
| **Task-to-task dependencies** | ✅ Done | Add/remove dependencies, cycle detection (DFS) |
| **Real-time multi-device sync** | ✅ Done | WebSocket (Socket.IO), room-based broadcast |
| **List view** | ✅ Done | Collapsible hierarchy, drag-and-drop reorder |
| **Canvas / visual mapping** | ✅ Done | React Flow: draggable nodes, dependency edges, customization |
| **Calendar view** | ✅ Done | Tasks by date, day modals |
| **Dashboard & completion stats** | ✅ Done | Completion %, daily goal, weekly/monthly stats |
| **Streaks** | ✅ Done | Current streak + longest streak (consecutive days with all tasks completed) |
| **Categories & priorities** | ✅ Done | Tags, priority colors, filter by category/priority |
| **Auth (OAuth + email)** | ✅ Done | Supabase: Google, GitHub, Facebook + email/password |
| **Theme customization** | ✅ Done | Presets, custom colors, CSS variables |
| **Search & filters** | ✅ Done | Time scope, completion status, category, priority |
| **Offline support** | ❌ Not supported | Requires network; no local-first or service worker |
| **Native mobile app** | ❌ Planned later | Web-only for MVP; responsive CSS exists |
| **Time-to-plan tracking** | ❌ Planned later | No “minutes to plan a week” metric in-app yet |

### Limits (MVP)

| Limit | Detail |
|-------|--------|
| **Depth** | No max depth; hierarchy is unlimited (validated with 10-level and large-hierarchy tests). |
| **Dependencies** | No circular dependencies (enforced); no self-dependency. |
| **Offline** | No offline mode; real-time sync requires connection. |
| **Mobile** | Web responsive only; no native iOS/Android app. |
| **Profile image** | 5MB max upload (EditProfilePage). |
| **Auth** | Session via JWT in HTTP-only cookies; OAuth uses Supabase. |

---

## B) Positioning Sentence (1–2 lines)

**DreamDuo helps students manage complex goals with hierarchy + visual mapping + real-time sync, and stay consistent through lightweight gamified progress (streaks and completion stats).**

*(Alternative shorter: “DreamDuo is a task manager that combines unlimited hierarchy, dependency graphs, and a visual canvas with real-time sync and streak-based progress.”)*

---

## C) Win Metrics (pick 2–3 to claim)

Suggested metrics you can back with the current product:

1. **Streak continuity** — You already compute and display current streak and longest streak (consecutive days with all daily tasks completed). Easy to report and improve.
2. **Weekly task completion rate** — Dashboard has weekly stats (assigned vs completed per day); completion rate is derivable. Fits “did users finish what they planned this week?”
3. **Daily active use (DAU)** — Requires adding a simple “last active” or daily event log; backend can count distinct users per day. Good for engagement.

Optional later:

- **Day-7 / Day-30 retention** — Needs cohort + “first seen” and “active at D7/D30” definition; add once you have analytics or a small events table.
- **Time-to-plan a week (minutes)** — Would need a dedicated “planning mode” or start/end timestamps for “I’m planning my week” to measure; planned for later.

**Recommended to claim for MVP:**  
**Streak continuity**, **Weekly task completion rate**, and (if you add minimal logging) **DAU**.
