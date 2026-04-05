# AI Usage Statement — DreamDuo Capstone Project

**Student:** Alhassan Ahmed  
**Project:** DreamDuo — Full-Stack Task Management & Productivity Application  
**Course:** Computer Science Capstone  
**Date:** April 4, 2026

---

## 1. Purpose of This Documentation

This document is submitted in response to the professor's explicit request to clearly outline all parts completed with AI assistance, with a detailed description that differentiates my contributions from AI contributions.

**What I built:**  
DreamDuo is a full-stack productivity application featuring hierarchical task management, an interactive canvas/mind-map view, a calendar view, a dashboard with analytics, real-time multi-device synchronization via WebSockets, OAuth and JWT-based authentication, custom theming with accessibility presets, a Progressive Web App (PWA) layer, and a companion Chrome Extension (Manifest V3) for Toggl-style time tracking. The backend is built on Flask/Python with SQLAlchemy and PostgreSQL; the frontend is React 18 + TypeScript + Chakra UI + Vite.

**How AI was used:**  
AI (Cursor/Claude) was used as an engineering assistant — similar to working with a senior developer — to accelerate implementation, debug problems, and help write documentation. The product vision, feature decisions, architecture choices, iteration direction, and final integration were driven by me. AI did not conceive the product; it helped me build what I designed.

---

## 2. Chronological Log of All AI Interactions

The following interactions were identified from the full conversation history, sorted chronologically.

### February 26, 2026

**Session 1 — Product Strategy: Jobs to Be Done Analysis**  
[Business Analysis Chat](005f0742-db83-4f09-9522-9e57f3911168)

> *My Request:* "Thinking from a business perspective and PM perspective, what do you think are the Jobs to be Done achieved by this project... dissect them into Functional JTBD Candidates and Emotional JTBD (This is your real moat)."

I asked AI to apply the Jobs to Be Done (JTBD) framework to DreamDuo to help me think through product-market fit and articulate the emotional and functional value of the app. I provided the product concept; AI applied the framework analytically and reflected it back in structured categories.

---

**Session 2 — Product Positioning & MVP Truth Table**  
[MVP Metrics Chat](856d9780-3ffa-44f7-845d-ca7041bd57e2)

> *My Request:* "I need the following: A) Your MVP truth table — which features are done now vs planned soon, any limits... B) Your positioning sentence... C) Your win metrics — Day-7/Day-30 retention, DAU, weekly task completion."

I asked AI to help me articulate the MVP state and positioning for DreamDuo. I provided the feature inventory; AI helped structure it into the truth table format and drafted the positioning sentence. I reviewed and approved the final framing.

---

**Session 3 — Capstone Skill & Documentation Work**  
[Capstone Documentation Chat](c355b2dd-5ca2-4881-9f54-de6d041dc081)

> *My Requests:*
> 1. Creating a "Capstone Finalizer" skill with my stylistic and academic guidelines
> 2. Applying the finalizer to a rough draft of my competitive analysis section
> 3. Merging the competitive analysis with the outdated business part from a prior semester
> 4. Integrating the feasibility analysis into the consolidated business document

I directed all document structure decisions. AI's role was to organize, polish, and merge documents under my explicit instructions. The strategic analysis content (market sizing, competitive gaps, product positioning, user research interpretation) was my intellectual work; AI applied structure, transitions, and academic tone.

---

### March 1, 2026

**Session 4 — Habits of Communication (HC) Analysis**  
[HC Analysis Chat](f1072064-dc4f-477e-9663-fd9c333c1c61)

> *My Requests:*
> 1. Analyze how I applied the `#audience` HC in my project — but using frontend code, not documentation
> 2. Analyze how I applied the `#communicationdesign` HC — apply principles of perception/cognition in UI/UX

I asked AI to locate evidence from my actual application code of how I tailored communication design to my primary user segment (overwhelmed high-agency students managing complex goals). I defined the user segment and the HC requirements; AI searched the codebase and identified concrete code evidence. I then used this evidence in my Capstone HC reflection.

---

### March 18, 2026

**Session 5 — Chrome Extension: Initial Design & First Implementation**  
[Chrome Extension Initial Chat](c52f8fcc-463f-4f19-bb3a-bfc54eb211e9)

> *My Requests:*
> 1. "I would like you to create a chrome integration for your app that tracks time spent on the various tasks logged on the dashboard you have built."
> 2. "Where do we create the popup browser extension to start the timer?"
> 3. Implementation via the generated plan
> 4. Smoke test: "Let's smoke test to check if everything is working correctly"
> 5. Debugging: "Let's run the backend and the frontend to audit if the updates are running correctly"

This was the first Chrome Extension design session. I defined the requirement: a browser extension for time tracking connected to the existing DreamDuo backend. AI architected the extension structure (Manifest V3, popup/background/utils), proposed the Bearer token authentication approach to solve the cross-origin SameSite cookie problem, implemented the initial extension code, and helped debug startup issues. I directed the feature scope and approved the architecture before implementation.

---

**Session 6 — Comprehensive README Creation**  
[README Chat](3bd1cd39-4184-4dcf-96ec-1d63354731bc)

> *My Requests:*
> 1. "We want to create a comprehensive README file for DreamDuo explaining its main features and how to run it and install it in steps so that anyone can install it and run it locally."
> 2. "Are there any missing dependencies in requirements or package.json?"

I requested a production-quality README that any developer could follow. AI generated the full README (now at `DreamDuo/README.md`) including the feature list, tech stack table, step-by-step installation guide for backend and frontend, Chrome extension setup instructions, environment variable reference, troubleshooting guide, and architecture overview. I reviewed and approved the content. AI also audited both `requirements.txt` and `package.json` for missing dependencies.

---

### March 22, 2026

**Session 7 — Gemini CLI Prompt Engineering (Non-DreamDuo)**  
[Prompt Engineering Chat](b62f2ee3-2abb-4b96-bbe6-3d38a67d0d8b)

> *My Requests:* Craft prompts for Gemini CLI for external business analysis tasks (airline geo expansion analysis, workforce analysis, TAM/SAM estimation for a toy company)

This session was unrelated to DreamDuo development. It involved crafting analytical prompts for a separate business analytics use case with Gemini CLI and was not part of the DreamDuo project scope.

---

### April 4, 2026

**Session 8 — Chrome Extension: Full Polish & Toggl-Style Redesign**  
[Chrome Extension Polish Chat](afae8035-5d34-4eab-a682-cfce01ca1ed7)

> *My Requests:*
> 1. Full audit of Chrome extension and DreamDuo codebase by a senior engineer
> 2. "There is a lot of mixing. The dashboard now is replaced in task completion with task elapsed time. Also the extension doesn't distinguish between stop and pause — I don't see the distinction. Also the task cards don't show the elapsed time on each task. We need to check this and make it something like Toggl Tracker."
> 3. Toggl-style polish plan implementation
> 4. "Can we modify the theme in the tracker to match the theme in the application?"
> 5. "The theme we choose from the theme selector in the application is not passed to the extension."
> 6. App logo update: "Can we change the application logo in the web tab and everywhere to be this [new icon]"
> 7. README update
> 8. Git commit and push

This was the largest and most technically complex session. Key decisions I made:
- I identified the UI problem (no visual distinction between Pause and Stop)
- I specified the Toggl model as the reference design
- I required theme synchronization between the web app and extension
- I caught that task cards were not showing elapsed time
- I supplied the new application logo asset

AI's role: Implemented the plan end-to-end — Toggl-style amber/red button distinction, elapsed time on task cards, theme variable passing from app to extension via the `/api/user/profile` endpoint, `chrome.storage` persistence of theme state, dual JWT authentication debugging (SameSite cookie fallback to Bearer token), and README/git operations.

---

**Session 9 — Bug Fixes: Image Loading & Language**  
[Bug Fix Chat](ae7eeaa4-713b-4d01-bf21-d4dc037cafec)

> *My Request:* "Fix the images loading for the categories representation in the tasks and the calendar view. Also, modify the daily status from AOT lingo to Normal day-to-day lingo."

I identified two bugs: broken emoji/image rendering for task categories and overly themed language in the daily status display (Attack on Titan references being shown to general users). AI located and patched both. The decision to remove the AOT language from the default status was mine.

---

**Session 10 — Chrome Extension: Academic Documentation & Gap Analysis**  
[Extension Documentation Chat](c8f0b9d2-5eb5-4e2f-a532-53829bce5dd0)

> *My Requests:*
> 1. "I'm preparing my final Capstone submission and need to document the Chrome extension I built for DreamDuo in a rigorous academic/professional way. Please analyze the extension codebase and generate a detailed implementation report strictly based on what is actually built."
> 2. "Any gaps you find in the implementation that needs fixing?"
> 3. "Can you make the application point to both localhost and to the deployed URL 'https://dreamduo.netlify.app/'?"
> 4. "Update the README file please."

I requested honest, codebase-grounded documentation (explicitly asking AI not to invent features). AI produced the implementation report, identified gaps (missing PNG assets, hardcoded localhost URL), fixed the URL configuration to support both local and production endpoints, and updated the README. Gap identification was done by AI; the decision to fix vs. defer each gap was mine.

---

**Session 11 — Comprehensive Unit Testing Suite**  
[Unit Testing Chat](91c18aed-9801-43aa-9127-680768eed81b)

> *My Requests:*
> 1. "I need to make a comprehensive plan to update the unit testing to test all the components of the project and make a README explaining how everything is tested... then we need to run the unit tests to check that everything is tested correctly."
> 2. "Implement the plan as specified."
> 3. "Push to git."

I specified that comprehensive testing coverage was required across all backend components. AI generated the test plan and implemented 8 test files covering auth, tasks, dependencies, tags, time tracking, user management, task utilities, and WebSocket events. AI also wrote the `testing/README.md` explaining the test logic and coverage. I ran and verified the tests before pushing.

---

**Session 12 — CS162 Learning Outcome Evidence**  
[CS162 LO Evidence Chat](94c6b458-1e9c-4e1a-a376-dbc0346f3609)

> *My Requests:*
> 1. "Inspect the full codebase and collect concrete evidence for CS162 learning outcomes: #cs162-sql, #cs162-testing, #cs162-webstandards."
> 2. "Perform a rigor audit: remove weak/speculative claims, strengthen citations with exact file paths and function names, convert strongest items into polished academic footnotes, rank evidence by strength."

I defined the learning outcomes to evidence and the required academic rigor level. AI searched the codebase to locate specific code artifacts (SQL queries, test assertions, HTTP standards usage) that constitute evidence for each LO. I then incorporated these into my Capstone report.

---

**Session 13 — OAuth Debugging (Supabase)**  
[OAuth Debugging Chat](045f20dd-da03-432f-b359-765c9a7dd78d)

> *My Requests:*
> 1. "Why does logging in with Google or any 3rd party cause this? 'DNS_PROBE_FINISHED_NXDOMAIN'" 
> 2. Troubleshooting Supabase configuration, new project API keys, OAuth provider enabling

I encountered a production OAuth failure when the original Supabase project became unreachable. I diagnosed that the Supabase URL in the environment was outdated and initiated a new Supabase project. AI helped interpret the DNS error, identified the root cause (stale project URL), and guided the reconfiguration of environment variables. The decision to migrate to a new Supabase project was mine.

---

**Session 14 — README Remote Push**  
[README Push Chat](f01795bf-45f9-42cf-9335-1dced5eedb5a)

> *My Request:* "Why is the project README file not updated in the remote repo?"

Brief troubleshooting session. I noticed the README updates were not reflected on GitHub. AI diagnosed the git state and executed the push.

---

## 3. Categorized AI Contributions

### 3.1 AI-Assisted Planning

| Planning Area | What I Provided | What AI Contributed |
|---|---|---|
| JTBD Analysis | The product concept and user segments | Applied JTBD framework; organized Functional vs. Emotional JTBD |
| MVP Truth Table | List of all features and their completion state | Formatted into truth table; suggested positioning language |
| Chrome Extension Architecture | Requirement: "time tracking extension connected to my app" | Proposed MV3 structure, popup/background/utils separation, Bearer token auth pattern |
| Testing Plan | Requirement: comprehensive coverage across all components | Generated test plan broken down by component, edge cases, test logic |
| Toggl-Style Extension UX | Identified the problem ("I don't see the distinction between stop and pause") | Proposed Toggl-style visual pattern (amber pause / red stop) as solution |

### 3.2 AI-Assisted Implementation

| Implementation Area | What I Provided | What AI Contributed |
|---|---|---|
| Chrome Extension (initial) | Requirement + architecture approval | Implemented `manifest.json`, `popup/`, `background/service-worker.js`, `utils/api.js` |
| Dual JWT Auth (cookies + Bearer) | Identified the SameSite/cross-origin problem in production | Designed and implemented the `/api/auth/extension-token` exchange endpoint |
| Theme Sync (app → extension) | Identified that theme was not passed to extension | Implemented theme variable propagation via profile API + `chrome.storage.local` |
| Toggl-style UI polish | Specified Toggl as the reference; identified the visual problems | Implemented amber pause / red stop buttons, per-task elapsed time display |
| Offline queue | Part of extension polish requirements | Implemented `chrome.storage.local` queue with automatic retry on reconnect |
| Unit test implementation | Defined scope and coverage requirements | Wrote 8 test files for `test_auth.py`, `test_tasks.py`, `test_dependencies.py`, `test_tags.py`, `test_time.py`, `test_user.py`, `test_task_utils.py`, `test_websocket.py` |
| Bug fixes (images, AOT language) | Identified both bugs and made the call to remove AOT lingo from default state | Located and patched the broken emoji rendering and status language |
| Multi-URL support (localhost + Netlify) | Required the app to support both local and production targets | Modified the API URL config to fall back between endpoints |

### 3.3 AI-Assisted Documentation

| Documentation Area | What I Provided | What AI Contributed |
|---|---|---|
| Main README (`DreamDuo/README.md`) | Direction: "explain features, step-by-step install for anyone" | Wrote the full 756-line README including architecture diagrams |
| Chrome Extension README | Direction: academic/professional, no invented features | Generated the implementation report and extension-specific README |
| Testing README (`server/testing/README.md`) | Direction: explain logic, coverage, and how to run | Wrote the testing documentation |
| Competitive Analysis Section | Draft content and strategic analysis | Polished structure, academic tone, transitions, removed duplicate content |
| Business Plan Update | Prior semester business part + new competitive/feasibility analyses | Merged and reorganized documents, removed redundancies |
| CS162 Learning Outcome Footnotes | Defined the LO requirements and rigor standard | Searched codebase, extracted specific code evidence, wrote academic footnotes |

### 3.4 AI-Assisted Analysis

| Analysis Area | What I Provided | What AI Contributed |
|---|---|---|
| JTBD / Product Positioning | Product concept, user segment definitions | Applied PM frameworks; generated Functional + Emotional JTBD breakdown |
| HC `#audience` Evidence | Requirement: find code-level evidence, not documentation | Searched frontend code for audience-tailored design patterns |
| HC `#communicationdesign` Evidence | Definition of my primary user segment | Identified perception/cognition principles applied in the UI |
| Implementation Gap Analysis | Running extension codebase | Identified missing PNG assets, hardcoded URL, WebSocket gap |
| Dependency Audit | Request: "are there any missing dependencies?" | Audited `requirements.txt` and `package.json` for gaps |

---

## 4. My Human Contributions

The following elements represent my original intellectual work, decisions, and judgment throughout the project.

### 4.1 Product Vision & Core Design Decisions

- **Conceived DreamDuo** as a full-stack productivity app combining hierarchical task management with visual/mind-map exploration, not a common combination in student-focused tools
- **Defined the primary user segment**: "Overwhelmed High-Agency Students" managing complex, multi-layer goals with motivational volatility — this segment definition drove every major design decision
- **Chose the tech stack**: React 18 + TypeScript (frontend), Flask/Python (backend), Chakra UI, React Flow for canvas, Socket.IO for real-time — all chosen before AI interactions
- **Designed the data model**: self-referential `Task` model with `parent_id` for unlimited nesting, the `TimeLog` model, the `Category` model — conceived and specified by me
- **Required DFS cycle detection** for task dependencies — I identified this as a correctness requirement before implementation
- **Chose Supabase for OAuth** — my decision to integrate Google, GitHub, and Facebook social login
- **Chose PostgreSQL + SQLite dual support** — my architectural decision for prod/dev flexibility

### 4.2 Feature Specification & Iteration

- **Required the Chrome Extension** as a distinct deliverable after recognizing that in-browser time tracking felt disruptive. This was my response to professor feedback about making DreamDuo's time tracking more like professional tools (Toggl, Clockify)
- **Identified the Pause/Stop UX failure** in the original extension and specified the Toggl model as the solution — "I don't see the distinction"
- **Identified the theme sync gap** between app and extension — noticed themes I selected in the web app had no effect in the extension popup
- **Required accessibility themes** (High Contrast, Deuteranopia, Protanopia, Tritanopia, Low Vision, Dyslexia-Friendly) — my decision to prioritize inclusive design
- **Required the Attack on Titan (AOT) theme** as a cultural/customization layer — and then made the decision to remove AOT lingo from the *default* daily status when it was inappropriate for general users
- **Required the canvas/mind-map view** — ReactFlow integration was my feature decision to provide a non-linear visual mode for complex tasks
- **Required real-time sync** — Socket.IO integration was my requirement; I specified room-based isolation as the design principle
- **Defined the offline resilience requirement** — "failed API calls should queue and retry" was my stated requirement before AI proposed the `chrome.storage.local` implementation

### 4.3 Architecture & Integration Decisions

- **Approved or modified every architectural proposal** before implementation — AI always planned first; I reviewed and approved (or changed) the plan before code was written
- **Identified the SameSite cookie / cross-origin problem** as the root cause of extension auth failures before AI proposed the Bearer token solution
- **Decided to implement dual auth** (cookies for web app + Bearer for extension) rather than a simpler but less flexible alternative
- **Decided to support both localhost and Netlify** as target URLs in the extension — my deployment decision
- **Chose Netlify for frontend deployment and Render.com for backend** — my infrastructure decisions

### 4.4 Testing & Quality Decisions

- **Required comprehensive unit test coverage** across all components — this was my quality standard
- **Ran and verified all tests** before approving the git push
- **Identified that the OAuth redirect was pointing to the wrong Supabase project** — diagnosed this from the DNS error message before AI confirmed it

### 4.5 Academic & Documentation Decisions

- **Wrote the rough drafts** of all Capstone documentation sections (competitive analysis, feasibility analysis, business plan); AI polished and structured them
- **Defined the rigor standard** for academic footnotes ("remove weak or speculative claims, strengthen with exact file paths")
- **Selected which HC evidence was strong enough** to include in the Capstone reflection
- **Defined the JTBD framing** as the right framework for the business analysis section

---

## 5. AI vs. Human Contribution Table

| Area | Human Contribution | AI Contribution |
|---|---|---|
| **Product Concept** | Conceived DreamDuo; defined the "Overwhelmed High-Agency Student" segment | Helped articulate JTBD, positioning statements, win metrics |
| **Tech Stack Selection** | Chose React, Flask, Chakra UI, React Flow, Socket.IO, Supabase | No role — stack was decided before AI interactions |
| **Data Model Design** | Designed self-referential Task model, TimeLog model, Category model | Implemented models per specification |
| **Chrome Extension Requirement** | Defined the requirement and scope after professor feedback | Designed MV3 architecture, implemented popup/background/utils |
| **Extension Auth (Dual JWT)** | Identified the SameSite cross-origin problem | Designed and implemented the cookie-to-Bearer token exchange endpoint |
| **Toggl-Style UX** | Identified Pause/Stop visual ambiguity; specified Toggl as reference | Implemented amber/red button distinction, badge states |
| **Theme Synchronization** | Identified gap; required extension to match app theme | Implemented theme variable passing via profile API + chrome.storage |
| **Task Elapsed Time on Cards** | Identified missing feature on task cards | Implemented elapsed time display component |
| **Accessibility Themes** | Required 8 accessibility theme presets as a design priority | Helped implement CSS variable theming system |
| **Canvas / Mind Map View** | Required React Flow integration; defined the use case | Implemented node/edge components per specification |
| **Real-Time Sync** | Required Socket.IO; specified room-based user isolation | Implemented socket event handlers and broadcast logic |
| **Offline Queue** | Stated requirement ("failed calls should queue and retry") | Implemented chrome.storage queue with retry logic |
| **README** | Directed: "explain everything so anyone can run it" | Wrote the full 756-line README and testing README |
| **Unit Tests** | Required comprehensive coverage; verified tests before pushing | Generated 8 test files covering all backend components |
| **Competitive Analysis** | Wrote the rough strategic analysis and market research | Polished, structured, merged with prior semester work |
| **Business Plan** | Provided prior semester draft + new research | Merged documents, removed redundancies, applied academic tone |
| **CS162 LO Evidence** | Defined the LO requirements and rigor standard | Searched codebase, extracted code-level evidence, wrote footnotes |
| **Bug Fixes (images, language)** | Identified both bugs; decided to remove AOT lingo from default | Located and patched broken rendering and text |
| **OAuth Debugging** | Diagnosed old Supabase URL; decided to create new project | Confirmed root cause; guided reconfiguration steps |
| **Git / Deployment** | Made all deployment infrastructure decisions | Executed git commands; pushed on instruction |

---

## 6. Final AI Usage Statement

### DreamDuo — Capstone AI Usage Statement

Throughout the development of DreamDuo, I used AI coding assistants (specifically Cursor/Claude) as an engineering acceleration tool — comparable to working with a knowledgeable pair programmer or technical consultant. The following statement accurately describes the nature of that collaboration.

**The product was my design.** I conceived DreamDuo's core value proposition independently: a task management application that combines structural depth (hierarchical tasks, dependencies) with visual exploration (canvas/mind-map) and motivational continuity (real-time sync, theming, gamification potential). The product's primary user segment — "Overwhelmed High-Agency Students" — was defined by me and shaped every feature decision. Neither the concept nor the target user was suggested by AI.

**Architecture decisions were mine.** I selected the full technology stack (React 18 + TypeScript, Flask/Python, Chakra UI, React Flow, Socket.IO, Supabase) before significant AI interactions. I specified the data model structure, the dual-database strategy (SQLite for development, PostgreSQL for production), the room-based Socket.IO isolation pattern, and the dual JWT authentication design (HTTP-only cookies for the web app, Bearer tokens for the Chrome Extension). When AI proposed solutions, I evaluated, modified, and approved them before any code was written.

**Feature scope was driven by me.** The Chrome Extension was my requirement, introduced after recognizing that Toggl-style time tracking would make DreamDuo competitive with professional productivity tools. When the initial extension's UX was inadequate — specifically, the inability to visually distinguish Pause from Stop — I identified the failure and specified the Toggl model as the target. I identified the theme synchronization gap between the web app and extension. I required comprehensive accessibility themes as an inclusive design priority.

**AI was used for implementation, documentation, and analysis — not origination.** In the sessions documented above, AI's primary role was to implement plans I had approved, write documentation I had scoped, search the codebase for evidence I had defined, debug problems I had identified, and polish documents I had drafted. In every significant case, the direction came from me and the execution was assisted by AI.

**I verified everything.** Before each git push, I ran the application, verified the UI behavior, and confirmed the test suite passed. I read every documentation section AI generated and edited it for accuracy. I caught errors AI made (wrong URL in extension config, theme not passing to extension) and directed corrections.

**Collaboration was iterative, not passive.** A single outcome often required multiple rounds: I would request a feature, test it, identify what was wrong, specify the fix, test again, and only then approve. The Toggl-style extension polish, theme synchronization, and dashboard integration each went through multiple iterations with me directing every correction.

In summary: DreamDuo is my project. AI helped me build it faster and write about it more precisely. The vision, the decisions, the requirements, and the judgment were mine throughout.

---

## 7. AI Tools Used

| Tool | Use Case |
|---|---|
| Cursor (Claude/claude-4-sonnet) | Primary engineering assistant — code implementation, debugging, documentation |
| Gemini CLI | External business analysis prompting (non-DreamDuo tasks only) |

---

## 8. What AI Did NOT Do

To be fully transparent, the following were entirely human work with no AI involvement:

- The initial project concept and problem framing
- The user research and identification of the primary user segment
- Technology selection decisions
- The foundational backend models (Task, TimeLog, Category, User) — designed before AI sessions
- The decision to add an accessible/inclusive theming system
- The decision to support OAuth (Google, GitHub, Facebook)
- The decision to use React Flow for the canvas view
- The decision to add real-time sync via Socket.IO
- The Canvas/Mind Map view's conceptual design
- All testing verification and approval decisions
- All deployment infrastructure choices (Netlify, Render.com)
- The decision to pursue Chrome Web Store compatibility
- The learning outcome reflections and HC evidence selection in the Capstone report

---

*This statement was prepared on April 4, 2026, for submission with the DreamDuo Capstone project. All AI interactions referenced above are documented in the conversation logs stored in the Cursor project history.*
