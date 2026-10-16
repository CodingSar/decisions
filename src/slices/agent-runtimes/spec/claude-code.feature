Feature: Claude Code Agent Runtime
  The adapter runs the real `claude` CLI. Opt-in smoke test: skipped unless the CLI is on PATH.

  Scenario: Claude Code starts an orchestrator
    Given the Project "api-service" is open
    And the Agent Runtime is Claude Code
    When I create a new Run and press start
    Then the sidebar lists Run "R1" as running
    And the terminal shows output

  Scenario: Claude Code is found through the login shell
    Given the Project "api-service" is open
    And "claude" is installed only on the login shell's PATH
    When I create a new Run and press start
    Then the sidebar lists Run "R1" as running
    And the terminal prints "fake claude"
