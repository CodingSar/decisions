Feature: Configure Decision Scopes
  Per Project, the human chooses which Scopes they take personally.

  Background:
    Given the Project "api-service" is open

  Scenario: A new Project takes every seeded Scope
    When I open the project settings
    Then all 11 seeded Scopes are marked mine
    And no timeout is set
    And a hint says "On: the agent waits for your Verdict"
    And the Add Scope field is titled "Add Scope"

  Scenario: Deselect a Scope
    When I toggle off "Dependencies"
    And an agent requests a "Dependencies" Decision
    Then it is Auto-resolved on the agent's recommendation
    And it is listed in Review

  Scenario: Add a Scope
    When I add the Scope "Accessibility"
    Then an agent can request an "Accessibility" Decision
    And it appears in the Feed

  Scenario: Delete a user-added Scope
    Given the Scope "Accessibility" has the answered Decision D4
    When I delete the Scope "Accessibility"
    Then D4 is unchanged
    And seeded Scopes offer no delete

  Scenario: Set a timeout
    When I set the timeout of "Security" to 30m
    Then ".decisions/config.json" records 30m for "Security"
    When I set the timeout of "Security" to 2h with Enter
    Then ".decisions/config.json" records 2h for "Security"

  Scenario: Invalid timeout is flagged
    When I set the timeout of "Security" to soon
    Then the timeout of "Security" still reads "soon" and is flagged invalid

  Scenario: Settings persist
    Given I toggled off "Performance"
    When I relaunch the app
    Then "Performance" is still not mine

  Scenario: Keys behind the Settings modal do nothing
    Given an agent requests a "Security" Decision
    And it appears in the Feed
    When I open the project settings
    And I press L
    And I press N
    Then no Verdict was sent and no Run was created

  Scenario: Unknown Scope counts as In-Scope
    When an agent requests a Decision with the Scope "Legal"
    Then it appears in the Feed
