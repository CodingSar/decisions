Feature: Review and ship with Git
  The human reads the diff of agent work, commits, and pushes.

  Background:
    Given the Project "api-service" is a git repository on branch "main"
    And "src/app.ts" has uncommitted changes

  Scenario: Changed files are listed
    Then the Git section lists "src/app.ts" under Changes

  Scenario: View a diff
    When I click "src/app.ts" in the Git section
    Then the Git view shows its diff

  Scenario: Stage, commit
    When I stage "src/app.ts"
    And I commit with the message "Add app"
    Then "src/app.ts" is no longer listed
    And the commit message is empty
    And the latest commit message is "Add app"

  Scenario: Commit needs staged files and a message
    Then the commit icon is disabled
    When I stage "src/app.ts"
    Then the commit icon is still disabled until I type a message

  Scenario: A failed commit keeps the message
    Given a pre-commit hook rejects commits
    When I stage "src/app.ts"
    And I commit with the message "Add app"
    Then an error strip shows git's message
    And the commit message is still "Add app"

  Scenario: Detached HEAD shows the short sha
    Given HEAD is detached
    Then the Git section shows the short sha as branch

  Scenario: Push and pull
    Given a remote exists
    When I commit and push
    Then the remote has my commit
    When the remote gets another commit and I pull
    Then my branch has it

  Scenario: Switch branch
    Given the branch "feature" exists
    When I switch to the branch "feature"
    Then the Git section shows branch "feature"

  Scenario: Branch switching is off while a Run is active
    Given the Run "R2" is running
    Then the branch switcher is disabled
    But stage, commit, push and pull are enabled
    And the banner says "Run R2 is active"

  Scenario: A failed push shows git's error
    Given the remote rejects pushes
    When I push
    Then an error strip shows git's message

  Scenario: Status follows files written by an agent
    When an agent edits "src/other.ts"
    Then the Git section lists "src/other.ts"

  Scenario: A folder without a repo offers init
    Given the Project "notes" is open and is not a git repository
    Then the Git icon is greyed
    When I click "git init"
    Then the Git section shows branch "main"
