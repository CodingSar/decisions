Feature: Decisions touch Components
  An agent says which Components of the Groma model a Decision touches.

  Background:
    Given the Project "api-service" is open
    And its "groma/" has the Components "decision-store" and "feed-ui"

  Scenario: The tool lists valid Component ids
    When a Run starts
    Then the request_decision tool lists "decision-store" and "feed-ui"

  Scenario: Components are stored with the Decision
    When an agent requests a Decision touching "decision-store"
    Then its file records the component "decision-store"

  Scenario: Unknown ids are dropped
    When an agent requests a Decision touching "decision-store" and "nope"
    Then its file records only "decision-store"

  Scenario: Components are optional
    When an agent requests a Decision with no components
    Then it appears in the Feed

  Scenario: Overturn copies the Components
    Given D1 touches "decision-store"
    When I overturn D1
    Then the new Decision touches "decision-store"
