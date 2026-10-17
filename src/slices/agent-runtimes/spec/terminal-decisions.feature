Feature: Decisions from the Project's own terminal
  A coding agent started outside the app, in a Project folder, raises Decisions in the app.

  Background:
    Given the Project "api-service" is open

  Scenario: A session in the Project folder raises a Decision
    When a coding agent in the folder "api-service" requests a Decision
    Then the Feed shows the Decision
    And the agent is blocked

  Scenario: A session in a subfolder belongs to the Project
    When a coding agent in the subfolder "src" of "api-service" requests a Decision
    Then the Feed shows the Decision

  Scenario: A folder that is not an open Project is refused
    When a coding agent in the folder "elsewhere" requests a Decision
    Then the agent is told to open the folder in the app
    And the Feed has no card
