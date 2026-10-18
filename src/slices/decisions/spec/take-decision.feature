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

  Scenario: Leaving an empty comment box resumes Verdict keys
    Given a pending Decision recommending 1
    When I press C and then Cmd+1
    And I press L
    Then the agent receives approval of 1

  Scenario: Esc anywhere cancels a draft left behind
    Given a pending Decision
    When I press C, type "wip" and press Cmd+1
    Then the comment box still holds "wip"
    When I press Esc
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

  Scenario: A Decision whose agent disconnected is marked
    Given a pending Decision
    When the agent disconnects
    Then the card is marked "Agent gone"
    When I press L
    Then the card leaves the Feed
    And ".decisions/D1.md" records the Verdict with "by: human"

  Scenario: A new Run is told the Verdicts its predecessor never received
    Given a pending Decision
    And the agent disconnects
    When I press L
    And Run "R2" is started
    Then the terminal of "R2" says "Unseen Verdicts: D1"
    And the terminal of "R2" says "Approved: 1"

  Scenario: A Verdict the agent received is not listed again
    Given a pending Decision
    When I press L
    And Run "R2" is started
    Then the terminal of "R2" says "Past Decisions are in .decisions/"
    And the terminal of "R2" does not say "Unseen Verdicts"

  Scenario: A soft ask does not block the agent
    When agent "orchestrator > api-agent" parks an "Architecture" Decision, recommending 1
    Then the agent immediately receives "Parked D1; proceed on option 1"
    And a card shows the Scope, the asking agent, the question and both options
    And the card is not marked "Agent gone"

  Scenario: A parked Decision is answered later
    When agent "orchestrator > api-agent" parks an "Architecture" Decision, recommending 1
    Then a card shows the Scope, the asking agent, the question and both options
    When I press 2
    Then the card leaves the Feed
    And ".decisions/D1.md" records the Verdict with "undelivered: true"
    And ".decisions/D1.md" records the Verdict with "Approved: 2"

  Scenario: The agent fetches a parked Decision's Verdict once
    When agent "orchestrator > api-agent" parks an "Architecture" Decision, recommending 1
    Then a card shows the Scope, the asking agent, the question and both options
    When I press 2
    Then the card leaves the Feed
    And checking Decisions as "R1" returns "Approved: 2"
    And checking Decisions as "R1" returns "No new Verdicts."

  Scenario: Another Run does not receive the Verdict
    When agent "orchestrator > api-agent" parks an "Architecture" Decision, recommending 1
    Then a card shows the Scope, the asking agent, the question and both options
    When Run "R2" is started
    And I press 2
    Then the card leaves the Feed
    And checking Decisions as "R2" returns "No new Verdicts."
    And checking Decisions as "R1" returns "Approved: 2"
