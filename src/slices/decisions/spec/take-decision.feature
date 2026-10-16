Feature: Take a Decision
  In-Scope Decisions block the asking agent until the human gives a Verdict.

  Background:
    Given the Project "api-service" is open
    And Run "R1" is running on the fake adapter
    And I take "Architecture" personally

  Scenario: An In-Scope request appears in the Feed
    When agent "orchestrator > api-agent" requests an "Architecture" Decision with options 1 and 2, recommending 1
    Then a card shows the Scope, the asking agent, the question and both options
    And the recommended option is marked
    And option 1 offers "Choose option 1 (1)"
    And the agent is blocked
    And the tab badge increases

  Scenario: Like approves the recommendation
    Given a pending Decision recommending 1
    When I press L
    Then the agent receives approval of 1
    And the card leaves the Feed
    And ".decisions/D1.md" records the Verdict with "by: human"

  Scenario: Pick another option
    Given a pending Decision recommending 1
    When I press 2
    Then the agent receives approval of 2

  Scenario: Dislike rejects the recommendation
    Given a pending Decision recommending 1
    When I press D
    Then the agent receives "reject the recommendation completely"

  Scenario: Comment
    Given a pending Decision
    When I press C
    Then the comment box hints "Your direction · ↵ sends · Esc cancels"
    When I type "use plain files, no index" and press Enter
    Then the agent receives that direction

  Scenario: Cancel a comment
    Given a pending Decision
    When I press C and then Esc
    Then the Decision stays pending

  Scenario: Typing in a text field sends no Verdict
    Given a pending Decision recommending 1
    When I type "l" into the Run name field
    Then the agent is blocked
    And the Decision stays pending

  Scenario: Oldest first
    Given Decisions D1 and D2 are pending
    When I give a Verdict on D1
    Then D2 is focused

  Scenario: Only the focused card is full
    Given Decisions D1 and D2 are pending
    Then only D1 shows its actions

  Scenario: Pending card shows how long the agent has waited
    Given a pending Decision
    When 4 minutes pass
    Then the card shows "4m" waited

  Scenario: Empty Feed says where Decisions come from
    Then the Feed says "No pending Decisions. Start a Run and give it a task; its questions land here."

  Scenario: Answered Decision goes to History
    When I give a Verdict on a pending Decision
    Then it appears in History

  Scenario: Run stopped while blocked
    Given a Decision is pending and its Run is stopped
    When I give a Verdict
    Then ".decisions/D1.md" records it
    And the next Run is pointed at ".decisions/"
