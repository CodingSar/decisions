Feature: Recent Projects
  Closed Projects are listed on the New project screen for quick reopening.

  Scenario: Closed Project reopens from Recent
    Given a folder "api-service" with Decisions D1 pending and D2 Auto-resolved
    And the Project "api-service" is open
    When I close the Project "api-service"
    Then Recent lists "api-service" with 1 pending
    When I click "api-service" under Recent
    Then a Project tab "api-service" is focused
