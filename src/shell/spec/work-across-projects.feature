Feature: Work across Projects and Runs
  Focus follows the mouse; panes resize and hide; Projects have independent Feeds.

  Background:
    Given Projects "api-service" and "shop" are open

  Scenario: Switch Projects
    When I switch to "shop"
    Then I see the "shop" Feed, Runs and terminal

  Scenario: Background Project raises its badge
    Given "shop" is active
    When "api-service" receives a pending Decision
    Then the "api-service" tab badge increases

  Scenario: Hover focuses after 150 ms
    When the mouse rests on a Feed card for 150 ms
    Then the card shows the focus ring
    When the mouse moves onto the terminal for 150 ms
    Then the terminal has the focus ring and the card does not

  Scenario: Switch tabs by keyboard
    When I press Cmd+Shift+]
    Then the next Project tab is focused

  Scenario: Resize persists
    When I drag the terminal edge 100px wider
    And I relaunch the app
    Then the terminal is 100px wider

  Scenario: Hide and show a pane
    When I hide the sidebar with the minus icon
    Then an edge strip with an arrow remains
    When I click the arrow
    Then the sidebar returns

  Scenario: Close a tab with a running Run
    Given "shop" has a running Run
    When I close the "shop" tab
    Then a confirmation appears
    And confirming stops the Run and closes the tab
    And "shop" Decisions reappear when reopened

  Scenario: Close a tab with no active Run
    Given "api-service" has no running Run
    When I close the "api-service" tab
    Then it closes without confirmation
