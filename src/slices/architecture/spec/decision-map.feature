Feature: Decision map
  The Project's Groma model, colored by the Decisions that touch each Component.

  Background:
    Given the Project "api-service" is open
    And its "groma/" has the Container "main-process" with the Components "decision-store" and "decision-ipc"

  Scenario: Pending Decisions glow with a count
    Given a pending Decision touches "decision-store"
    Then the mini map shows "decision-store" glowing with count 1

  Scenario: Counts roll up to the parent
    Given a pending Decision touches "decision-store"
    Then the mini map shows "main-process" glowing with count 1

  Scenario: Recent answers tint
    Given an answered Decision from yesterday touches "decision-ipc"
    Then the mini map shows "decision-ipc" tinted
    And it has no count

  Scenario: Old answers are neutral
    Given an answered Decision from 8 days ago touches "decision-ipc"
    Then the mini map shows "decision-ipc" neutral

  Scenario: Superseded Decisions do not count
    Given the Decision D1 touches "decision-store" and is Superseded
    Then the mini map shows "decision-store" neutral

  Scenario: Decisions without components do not appear
    Given a pending Decision touches no Component
    Then no Component glows

  Scenario: Hover lists the Decisions
    Given a pending Decision D7 touches "decision-store"
    When I hover "decision-store" in the mini map
    Then D7 is listed

  Scenario: Open the modal
    When I click the expand icon
    Then the Decision map modal covers the window
    And Escape closes it

  Scenario: The modal focuses a clicked Component
    Given a pending Decision D7 touches "decision-store"
    When I click "decision-store" in the mini map
    Then the modal opens with "decision-store" selected
    And the side panel lists D7

  Scenario: Drill into a container
    When I click "main-process" in the mini map
    Then the map shows "decision-store" and "decision-ipc"

  Scenario: The map follows the model and Decisions live
    When an agent requests a Decision touching "decision-ipc"
    Then the mini map shows "decision-ipc" glowing

  Scenario: No Groma model
    Given the Project "bare" has no "groma/" folder
    Then the map shows an empty state with a curate button
    When I click the curate button
    Then a Run starts with a prompt to curate the architecture
