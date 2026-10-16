Feature: Terminal
  The Run terminal looks like a native terminal (Ghostty) and is wired into the Run model.

  Background:
    Given the Project "api-service" is open
    And the Agent Runtime is the fake adapter

  Scenario: Terminal uses the app theme and font
    Given Run "R1" is running
    Then the terminal background is the app's deep tone
    And the terminal font is "JetBrains Mono"
    And the terminal renderer is webgl or dom

  Scenario: Switching Runs keeps each terminal
    Given Runs "R1" and "R2" are running and "R2" is selected
    When I select "R1" in the sidebar
    And I type "hello" in the terminal
    And I select "R2" in the sidebar
    And I select "R1" in the sidebar
    Then the terminal shows "R1" with "hello"
    And only 2 terminals were created

  Scenario: Fast output does not drop text
    Given Run "R1" is running
    When I type "flood" in the terminal
    Then the terminal ends with "FLOOD-END"
    And the Run was paused at least once
