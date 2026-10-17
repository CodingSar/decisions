Feature: Approve a Mock-up
  An agent proposes an impactful UI change as a Mock-up file; the human approves it in the Feed
  and marks what to change.

  Background:
    Given the Project "api-service" is open
    And Run "R1" is running on the fake adapter
    And I take "Ui" personally

  Scenario: An agent proposes a Mock-up
    Given the Project has a Mock-up "docs/mock/feed-sort-for-approval.html"
    When the agent requests a "Ui" Decision with that Mock-up
    Then the card shows the Mock-up thumbnail
    And the agent is blocked
    And ".decisions/D1.md" records "mockup: docs/mock/feed-sort-for-approval.html"

  Scenario: A Mock-up outside the convention is refused
    Given the Project has a Mock-up "docs/mock/feed-sort.html"
    When the agent requests a "Ui" Decision with that Mock-up
    Then the agent gets the error "mockup must be an existing file named *-for-approval.html"
    And the Feed says "No pending Decisions. Start a Run and give it a task; its questions land here."

  Scenario: Marks tell the agent what to change
    Given a pending Mock-up Decision
    When I press M
    Then the Inspector shows the Mock-up
    When I press X and click "Sort" in the Mock-up
    And I press N, click "Search" in the Mock-up and type "make it wider"
    And I drag "Save" onto "api-service" in the Mock-up
    Then the Inspector lists 3 Marks
    When I press D
    Then the agent receives "revise the mock-up" with the Marks
      | remove: button "Sort"                     |
      | note on input "Search": make it wider     |
      | move: button "Save" -> header "api-service" |

  Scenario: Approval promotes the file
    Given a pending Mock-up Decision
    When I press L
    Then the agent receives approval of 1
    And "docs/mock/feed-sort-approved.html" exists in the Project
    And "docs/mock/feed-sort-for-approval.html" is gone from the Project

  Scenario: Toggle shows the approved Mock-up
    Given the Project has an approved Mock-up "docs/mock/feed-sort-approved.html"
    And a pending Mock-up Decision
    When I press M
    Then the Inspector shows the Mock-up
    When I press T
    Then the Inspector shows the approved Mock-up
