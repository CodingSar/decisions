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
