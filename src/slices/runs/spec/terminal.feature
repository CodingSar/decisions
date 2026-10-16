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

  Scenario: Run shows waiting state
    Given Run "R1" is running
    When I type "wait" in the terminal
    Then the sidebar lists Run "R1" as waiting
    And the terminal header shows the waiting chip
    When I type "work" in the terminal
    Then the sidebar lists Run "R1" as running

  Scenario: Title names the Run
    Given Run "R1" is running
    When I type "title Fix tests" in the terminal
    Then the sidebar and terminal header show "Fix tests" running
    When I rename it to "Mine"
    And I type "title Other" in the terminal
    Then the sidebar and terminal header show "Mine" running

  Scenario: Progress shows under the header
    Given Run "R1" is running
    When I type "progress 40" in the terminal
    Then the terminal header shows 40% progress

  Scenario: Shift+Enter inserts a newline
    Given Run "R1" is running
    When I press "Shift+Enter" in the terminal
    Then the terminal shows the newline mark

  Scenario: Find in terminal
    Given Run "R1" is running
    When I type "needle" in the terminal
    And I press "ControlOrMeta+f" in the terminal
    And I search for "needle"
    Then the find bar shows "1/1"
    When I press Escape in the find bar
    Then the find bar is gone

  Scenario: Find icon opens search
    Given Run "R1" is running
    When I press the Find icon
    And I search for "haystack"
    Then the find bar shows "No matches"

  Scenario: Run shortcuts work from the terminal pane
    Given Run "R1" exists
    When I focus the terminal pane and press "n"
    Then the sidebar lists Run "R2" as idle
    When I focus the terminal pane and press "s"
    Then the sidebar lists Run "R2" as running
    When I focus the terminal pane and press "x"
    Then "R2" is marked stopped

  Scenario: Hide and show the terminal with the keyboard
    Given Run "R1" is running
    When I press "ControlOrMeta+j" in the terminal
    Then the terminal pane is hidden
    When I press "ControlOrMeta+j"
    Then the terminal shows "R1"

  Scenario: Jump from a Decision to its Run
    Given Runs "R1" and "R2" are running and "R2" is selected
    When I select "R1" in the sidebar
    And an agent of Run "R1" requests a Decision
    And I type "lines 200" in the terminal
    And I select "R2" in the sidebar
    And I press "Show in Run" on the card
    Then "R1" is selected in the sidebar
    And the terminal is scrolled so the Decision marker of "D1" is in view
