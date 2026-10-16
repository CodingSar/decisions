Feature: Review and overturn
  Any non-superseded Decision can be overturned; the old one is Superseded once the new Verdict is saved.

  Background:
    Given the Project "api-service" is open
    And Auto-resolved Decision D5 chose 1 over 2

  Scenario: Overturn creates a linked pending Decision
    When I overturn D5 in Review
    Then a new pending Decision D6 with the same question and options opens with a comment box
    And D5 is still not superseded

  Scenario: Verdict completes the overturn
    Given I overturned D5 as D6
    When I pick 2 on D6
    Then D5 shows struck through with "superseded by D6"
    And ".decisions/D6.md" has "supersedes: D5"

  Scenario: Cancel leaves the old Decision
    Given I started overturning D5
    When I press Esc
    Then D5 is unchanged

  Scenario: Overturn a Decision I answered
    Given D3 was answered by me
    When I overturn D3 in History
    Then a linked pending Decision opens

  Scenario: Overturn an overturn
    Given D6 superseded D5
    When I overturn D6 as D8
    Then D6 is superseded by D8 and D8 is the active one

  Scenario: Superseded cannot be overturned
    Given D5 is Superseded
    Then D5 offers no overturn

  Scenario: Running agent is not interrupted
    Given the asking Run of D5 is still running
    When I complete an overturn
    Then the agent receives nothing
    And the next Run is pointed at ".decisions/"

  Scenario: History lists everything newest first
    Then History lists answered, Auto-resolved and Superseded Decisions newest first
