Feature: Start a Run
  A Run is an orchestrator plus its subagents, shown in the terminal.

  Background:
    Given the Project "api-service" is open
    And the Agent Runtime is the fake adapter

  Scenario: An empty terminal offers a Run
    Then the terminal shows the placeholder "No Run yet"
    When I press the Run button in the terminal
    Then the terminal shows an orchestrator session
    And the sidebar lists Run "R1" as running

  Scenario: N on an empty terminal starts a Run
    When I focus the terminal pane and press "n"
    Then the terminal shows an orchestrator session
    And the sidebar lists Run "R1" as running

  Scenario: An idle Run shows a placeholder
    Given Run "R1" exists
    Then the terminal shows the placeholder "R1 not started"
    And no terminal is shown
    When I press the Run button in the terminal
    Then the terminal shows an orchestrator session

  Scenario: Start a Run
    When I create a new Run and press start
    Then the terminal shows an orchestrator session
    And the sidebar lists Run "R1" as running
    And the agent can call "request_decision"

  Scenario: Start is idempotent
    Given Run "R1" is running
    Then the start icon is disabled
    And the stop icon is enabled

  Scenario: Parallel Runs
    Given Run "R1" is running
    When I create a new Run and press start
    Then the sidebar lists "R1" and "R2" as running
    And the terminal shows "R2"

  Scenario: Switch Runs
    Given Runs "R1" and "R2" are running and "R2" is selected
    When I select "R1" in the sidebar
    Then the terminal shows "R1"

  Scenario: Rename a Run
    Given Run "R1" exists
    When I rename it to "Add MCP server"
    Then the sidebar and terminal header show "Add MCP server"

  Scenario: Stop a Run
    Given Run "R1" is running with a pending Decision
    When I press stop
    Then "R1" is marked stopped
    And its row reads "R1" with the tooltip "R1 · stopped"
    And the pending Decision stays in the Feed

  Scenario: Stopping a Run does not fail it
    Given Run "R1" is running
    When I press stop
    Then "R1" is marked stopped
    And "R1" never shows as failed

  Scenario: Stopped Run shows scrollback
    Given Run "R1" is stopped
    When I select it
    Then the terminal shows its scrollback read-only

  Scenario: Exiting the session ends the Run
    Given Run "R1" is running
    When I type "exit" in the terminal
    Then the terminal shows the placeholder "No Run yet"
    And the sidebar does not list "R1"

  Scenario: A new Run never reuses a live id
    Given Runs "R1" and "R2" are running and "R2" is selected
    When I select "R1" in the sidebar
    And I type "exit" in the terminal
    And I create a new Run and press start
    Then the sidebar lists "R2" and "R3" as running

  Scenario: Claude Code is missing
    Given the "claude" CLI is not found
    When I create a new Run and press start
    Then the terminal shows the error
    And the error says "Install Claude Code"
    And the Run is marked failed
