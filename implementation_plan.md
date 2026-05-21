# Implementation Plan: System Revisions & New Features

This document outlines the proposed technical implementation for the extensive list of revisions requested for the CHTM Admin System. Given the sheer scale of the changes, the implementation is broken down into prioritized phases.

## User Review Required

> [!WARNING]
> This is a massive set of features spanning across frontend UI, state management, and backend database schema/logic (Supabase). We highly recommend tackling these in **Phases**. 
> Please review the phases below and let me know **which Phase you want to start with first**.

## Open Questions

> [!IMPORTANT]
> 1. **Database Schema:** We will need to update the Supabase database schema for things like System Logs, User Management (roles), and Housekeeping statuses. Do you have access to the Supabase dashboard to execute SQL migrations, or should we implement them via the Supabase JS client/migrations?
> 2. **Walk-In Booking:** Should the Walk-In Check-In module be a separate page or a Modal triggered from the Reservations page?
> 3. **Image Upload:** For adding a Room with an image, we'll need a Supabase Storage bucket. Does a bucket (e.g., `room-images`) already exist?
> 4. **Reporting Page:** Where should the "Data Entry of Reports" page be located? A new item in the Sidebar, or inside the Dashboard?

---

## Proposed Changes (Phases)

### Phase 1: Bug Fixes & Improvements
Let's start with quick wins and polishing existing features.

#### [MODIFY] `resources/js/app/components/modals/ReservationModal.tsx`
- Remove the "Reject" / "Decline" button and logic to simplify the workflow.
- Update UI to fix inconsistent amount formats (standardizing to a common currency format helper).
- Fix misleading "Children" labels.

#### [MODIFY] `resources/js/app/components/RoomModal.tsx`
- Remove "Maximum Guest" caps inputs/validation; retain only "Minimum Guest" capacity.

#### [MODIFY] `resources/js/app/services/booking.service.ts` & `useReservation.ts`
- Remove the `decline` booking logic entirely from hooks and services.

---

### Phase 2: Dashboard & Front Office Core Revisions

#### [MODIFY] `resources/js/Pages/Dashboard/Index.tsx`
- Fetch and display high-level statistics for all current and pending reservations.

#### [MODIFY] `resources/js/app/components/modals/ReservationModal.tsx`
- Add an "Edit Booking" mode allowing Front Office to change dates, room type, and guest info for existing bookings.
- Add strict validation to ensure "Selected Party" data exists before allowing booking completion.

#### [NEW] Walk-in Check-in Module (Component/Page TBD)
- Build a robust form for walk-in clients, integrating real-time date availability (Date API).

#### [NEW] Receipt Verification Modal
- Create a screen for Front Office to verify online payment receipts uploaded by guests. (Requires Supabase storage integration).

#### [MODIFY] `resources/js/app/components/RoomModal.tsx`
- Expand the "Add Room" form to include image upload (via Supabase Storage), a dynamic amenity tagging system, and base pricing inputs.

---

### Phase 3: Housekeeping Module

#### [NEW] `resources/js/Pages/Housekeeping/Index.tsx`
- Create a dedicated Housekeeping dashboard accessible only to users with the Housekeeping role.
- Display a unique Task List categorized by room type (Suite vs. Standard).
- Provide visual cues marking rooms as "Taken/Dirty" so they are unavailable for booking.

#### [NEW] Housekeeping Status Components
- Implement status toggles for "Make up room", "Do Not Disturb", and "Check-out".

#### [MODIFY] `resources/js/app/services/room.service.ts`
- Add tagging system API/RPC endpoints for Housekeeping to update room metadata (cleanliness, status).
- Add workflow logic to automatically flag a room as "Dirty" upon guest checkout (this may need a Postgres Trigger in Supabase or client-side side-effect).

---

### Phase 4: Super Admin, System Core & Reporting

#### [NEW] `resources/js/Pages/SystemLogs/Index.tsx`
- Build a UI to display a chronological list of all system actions (Who, What, When).

#### [NEW] `resources/js/Pages/Users/Index.tsx`
- Interface to manage user roles and access levels (Admin, Front Office, Housekeeping).

#### [MODIFY] System Logging Middleware / Hooks
- Create a wrapper for all Supabase mutating actions (Insert/Update/Delete) that automatically records the action to a `system_logs` table.

#### [NEW] Reporting UI
- Create a Table view for "Data Entry of Reports" with functional "Print Folio" and "Download PDF" buttons.

#### [MODIFY] Database Schema & Cleanups (Supabase SQL)
- Add RBAC policies to restrict "Delete" or "Access All" to Super Admin only.
- Enforce integer-only constraints for "Extra Beds" and other quantity fields directly in Postgres.

## Verification Plan
1. **Manual UI Verification**: Verify each new modal, page, and toggle works flawlessly in the browser.
2. **Access Control**: Test logging in as different roles (Admin, Front Office, Housekeeping) to ensure unauthorized views/actions are blocked.
3. **Database Integrity**: Verify that logs are successfully written to Supabase and that integer/cleanliness constraints are honored.
