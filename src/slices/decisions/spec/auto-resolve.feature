Feature: Auto-resolve a Decision
  Out-of-Scope or timed-out Decisions proceed on the agent's recommendation.

  Background:
    Given the Project "api-service" is open
    And Run "R1" is running on the fake adapter

  Scenario: Out-of-Scope request
    Given I do not take "Dependencies" personally
    When an agent requests a "Dependencies" Decision recommending 1
    Then the agent receives 1 at once
    And the Feed has no card
    And ".decisions/D1.md" records "by: auto" with reason "out-of-scope"
    And Review lists D1 and its badge increases

  Scenario: In-Scope timeout
    Given I take "Security" personally with a 30m timeout
    When an agent requests a "Security" Decision and 30m pass
    Then the agent receives its recommendation
    And the card leaves the Feed
    And the file records reason "timeout"

  Scenario: Working on a card pauses all timers
    Given two pending Decisions with 30m timeouts
    When I open the comment box on one and 40m pass
    Then both are still pending
    When I press Esc
    Then the timers resume

  Scenario: Leaving an empty comment box resumes the timers
    Given a pending Decision with a timeout
    When I press C and then Cmd+1
    Then the timers resume

  Scenario: Closing the app leaves Decisions pending
    Given a pending Decision with a timeout
    When I close and relaunch the app
    Then the Decision is still pending and not Auto-resolved

  Scenario: Accept clears the badge
    Given Review has an unseen Auto-resolved Decision D1
    When I accept D1
    Then the Review badge decreases
    And History tags D1 "auto · accepted"

  Scenario: Empty Review and History say what lands there
    Then the Review says "Nothing to review. Auto-resolved Decisions land here."
    And the History says "No Decisions yet."


  Scenario: An informed action lands in Review
    When the agent informs "Pinned zod to 3.x" because "newer breaks the SDK"
    Then the Feed has no card
    And ".decisions/D1.md" records "by: auto" with reason "informed"
    And Review lists D1 and its badge increases

  Scenario: Informing is capped
    When the agent informs 21 times in a row
    Then the last inform is refused with "ask"
