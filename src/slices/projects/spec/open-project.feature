Feature: Open a Project
  The human opens folders as Project tabs; each keeps its own Feed and Decisions.

  Scenario: Open an existing folder
    Given a folder "api-service" without git
    When I open the folder as a Project
    Then a Project tab "api-service" is focused
    And the folder contains ".decisions/"

  Scenario: Open a folder that already has Decisions
    Given a folder "api-service" with Decisions D1 pending and D2 Auto-resolved
    When I open the folder as a Project
    Then the Feed shows D1
    And the Review tab shows D2

  Scenario: Set up a new project
    Given I pick a new empty folder "shop"
    When I choose to set up a new project
    Then the terminal runs the grill-with-docs interview
    And a Project tab "shop" is focused

  Scenario: Open an already-open folder
    Given the Project "api-service" is open in a tab
    When I open the folder "api-service" again
    Then the existing tab is focused
    And only one tab "api-service" exists

  Scenario: Restart restores tabs
    Given Projects "api-service" and "shop" are open and "shop" is active
    When I relaunch the app
    Then tabs "api-service" and "shop" are open and "shop" is focused
    And no Run is running

  Scenario: Restart restores the Feed
    Given Projects "api-service" and "shop" are open and "shop" is active
    And "api-service" has a pending Decision from a stopped Run
    When I relaunch the app
    Then the "api-service" Feed shows the pending Decision

  Scenario: Remembered folder is gone
    Given the Project "old" was open and its folder is deleted
    When I relaunch the app
    Then the tab "old" is shown as unavailable with a close icon
    And its tooltip says the folder was not found
