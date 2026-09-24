# Team Process

## Workflow

You own your feature: you program, debug, and test it autonomously, when you are ready submit a pull request for review.

Each feature should live in a branch under you name, see [Branching Strategy](#branching-strategy).

Only submit feature pull requests to the development branch. The development branch is where all features are integrated and tested before being merged into the main branch to avoid breaking the main branch. The development branch is deployed to a staging environment for testing.

Pull requests are reviewed by at least one other team member before being merged and must pass pre-written tests.

Once integration tests are complete, the development branch is merged into the main branch and deployed to production.

## Branching Strategy

Each new feature should be developed in a branch named after the feature and the author, for example: `feature/username/feature-name`. This allows for easy identification of who is working on what feature.

Once a feature is complete and ready for review, a pull request should be submitted to the development branch. The pull request should include a description of the feature, any relevant documentation, and any necessary tests.

## Code Review Process

Another team member will review a pull request and provide feedback. The author of the pull request is responsible for addressing the feedback and making any necessary changes. Once the reviewer is satisfied with the changes, they will approve the pull request, and it can be merged into the development branch.

## Definition of Ready & Done

* Ready: A feature is considered ready when it is close to being fully implemented, has been tested, and is *ready* for review. The feature should be documented. A *ready* feature may still not be entirely complete and may require additional work before it is considered *done*.
* Done: A feature is considered done when it has been fully implemented, tested, and reviewed. The feature should be documented, and any necessary changes should have been made based on feedback from the code review process. A *done* feature is ready to be merged into the main branch and deployed to production.
