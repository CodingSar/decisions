Feature: Edit files
  The human may edit files, except while a Run is active.

  Background:
    Given the Project "api-service" is open
    And it contains "src/app.ts"

  Scenario: Edits save automatically
    When I open "src/app.ts"
    And I change it
    Then the file on disk has my change

  Scenario: Read-only while a Run is active
    Given the Run "R2" is running
    When I open "src/app.ts"
    Then the editor is read-only
    And a banner says "Run R2 is active"

  Scenario: Edit anyway
    Given the Run "R2" is running
    And I open "src/app.ts"
    When I click the edit-anyway icon
    Then the editor is editable

  Scenario: The lock lifts when the Run stops
    Given the Run "R2" is running
    And I open "src/app.ts"
    When I stop "R2"
    Then the editor is editable
    And the banner is gone

  Scenario: Edit anyway on a rendered file opens the source
    Given the Run "R2" is running
    And "docs/plan.md" is open rendered
    When I click the edit-anyway icon
    Then the editor is editable

  Scenario: Decisions files are read-only
    When I open ".decisions/D1.md"
    Then a banner says "Decisions files are read-only"
    And there is no edit-anyway icon
    And the editor is read-only

  Scenario: Markdown toggles to source for editing
    Given "docs/plan.md" is open rendered
    When I toggle to the source and change it
    Then the rendered view shows my change

  Scenario: Switching files quickly keeps each file's content on disk
    Given it contains "src/other.ts"
    When I open "src/app.ts"
    And I change it
    And I open "src/other.ts"
    Then the file on disk has my change
    And "src/other.ts" on disk is still empty
