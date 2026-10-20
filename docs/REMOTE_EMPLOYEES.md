# Remote employee workspaces

## Included departments

Sales, customer support, warehouse, logistics, finance, administration, procurement, marketing, people/HR, and technology each have a dedicated `/employee/:department` workspace. `/employee` lists the departments available to the signed-in account. These are internal task workspaces: instructions, assignment, priority, deadline, progress, blockers and the latest handoff note. They do not grant access to customer records, payment operations, HR records or the existing administrator consoles.

## Administrator setup

1. Publish the `EmployeeMembership` and `DepartmentTask` entity schemas and the `employee-workspace` backend function together with the frontend through the normal approved Base44 release workflow. Deployment has not been performed by this change.
2. The employee creates a normal application account. No accounts or invitations are automatically sent.
3. Open **Manage employees** at `/admin/employees`. Add the existing account email, departments, visibility and active status. The account keeps its normal user role.
4. Keep the default **My assigned tasks** scope unless team-wide visibility is needed. Department view permits reading the department queue; staff can still edit only their assigned tasks.
5. Create tasks in a department workspace and choose an active member of that department. Administrators can also reassign tasks from the task dialog.
6. Employees use **Remote team** in the account menu or mobile drawer, or open `/employee` directly. They can change their own task status and replace the latest handoff note.
7. Suspend access in employee management when needed. Every backend operation rechecks membership, so cached UI does not bypass revocation.

## Access controls

Both entities deny direct CRUD to non-administrators. The backend obtains the authenticated user itself and uses service-role entity access only after verifying membership. A caller cannot choose their actor, membership, role or assigned-user filter. Only administrators can configure members, assign tasks, or read the employee directory. Assignees must be active in the selected department. Duplicate membership records fail closed.

Existing admin tools remain admin-only. Remote employees work on explicitly assigned tasks and instructions; this change does not relax the authorization of finance, order, support or warehouse APIs. Do not put passwords, payment credentials or sensitive personnel information in a task.

## Limits and validation

Queues show up to 200 recent tasks and disclose truncation; totals apply to loaded tasks. The employee directory currently loads up to 500 members. Handoff notes store the latest update, not an immutable audit history. Concurrent edits use the backend's existing last-write behavior. Native Flutter employee screens and push notifications are outside this web workspace change.

Backend regression tests cover anonymous and customer rejection, assignment and department visibility, cross-department IDs, suspension, privilege escalation, actor spoofing, assignee validation, reassignment, dates, persistence failures, truncated lists and entity access rules. Browser visual verification is blocked in the current environment; perform a real-account smoke test with one administrator and two employees after staging publication.
