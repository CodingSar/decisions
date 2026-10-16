Feature: Sort the Feed
  The human chooses whether the oldest or newest pending Decision is listed first.

  Background:
    Given the Project "api-service" is open
    And Run "R1" is running on the fake adapter
    And I take "Architecture" personally

  Scenario: Toggling reverses card order
    Given Decisions D1 and D2 are pending
    Then the Feed lists D1 before D2
    When I toggle the Feed order
    Then the Feed lists D2 before D1
    When I press L
    Then D1 leaves the Feed
