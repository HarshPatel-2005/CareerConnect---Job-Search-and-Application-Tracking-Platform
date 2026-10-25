# Team Process

## Workflow

Our team follows an Agile workflow. Developers own their assigned features: they program, debug, and test them autonomously. When their work is ready, developers submit a Pull Request (PR) for review.

## Branching Strategy

We use a feature-branch workflow.

* **`main`**: Represents the stabel, production-ready state of the project.
* **`development`**: The active integration branch. All features are merged here and tested together before moving to the `main` branch.
* **Feature Branches**: Each new feature is developed in its own branch named `feature/<author>/<feature-name>`. These branches are created from the `development` branch and are merged back into `development`.

## Code Review Process

1. A developer opens a PR targeting the `development` branch.
2. Automated CI/CD checks (Jest tests) must pass.
3. At least one other team member must review the code, providing feedback and requesting changes if necessary.
4. The PR author addresses the feedback, making any necessary changes. Once approved, the PR is merged.

## Definition of Ready

A User Story or Task is considered "Ready" to be pulled into an active sprint when:

* The issue has a clear title and description.
* Acceptance criteria are defined and clear.
* It is assigned to a specific team member.
* Any necessary dependencies or blockers are identified and addressed.

## Definition of Done

A feature is considered "Done" and ready to be closed when:

* Code is fully implemented, and fulfills the acceptance criteria.
* Unit tests are written and passing locally.
* The code has been pushed to a feature branch and a PR has been opened for review.
* The PR has been reviewed and approved by at least one peer.
* The PR is merged into the `development` branch without conflicts.
