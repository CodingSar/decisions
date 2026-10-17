Feature: Decision map
  The Project's Groma model, colored by the Decisions that touch each Component.

  Background:
    Given the Project "api-service" is open
    And its "groma/" has the Container "main-process" with the Components "decision-store" and "decision-ipc"

  Scenario: The Overview shows one level at a time with its arrows
    Given "decision-ipc" uses "decision-store"
    Then the mini map shows "main-process" without its Components
    When I click "main-process" in the mini map
    Then the map shows only "decision-store" and "decision-ipc"
    And an arrow runs from "decision-ipc" to "decision-store"

  Scenario: Interactions nest Components inside their Container
    Given the Interactions view
    Then the mini map shows "main-process" containing "decision-store" and "decision-ipc"

  Scenario: A System shows its Containers with their Components
    Given "main-process" belongs to the System "svc"
    And the Interactions view
    Then the mini map shows "main-process" containing "decision-store" and "decision-ipc"

  Scenario: Interactions show arrows only for the hovered element
    Given "decision-ipc" uses "decision-store"
    And the Interactions view
    Then the mini map shows no arrows
    When I hover "decision-ipc" in the mini map
    Then an arrow runs from "decision-ipc" to "decision-store"
    And "decision-ipc" and "decision-store" stand out

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

  Scenario: A parent cycle still renders
    Given the Components "loop-a" and "loop-b" are each other's parent
    And a pending Decision touches "loop-a"
    Then the mini map shows "loop-a" glowing with count 1

  Scenario: Hover lists the Decisions
    Given a pending Decision D7 touches "decision-store"
    When I hover "decision-store" in the mini map
    Then D7 is listed

  Scenario: Hover list rows are readable
    Given a pending Decision D7 touches "decision-store"
    When I hover "decision-store" in the mini map
    Then the listed row shows "Which storage?" as plain text

  Scenario: Open the modal
    When I click the expand icon
    Then the Decision map modal covers the window
    And Escape closes it

  Scenario: The modal focuses a clicked Component
    Given a pending Decision D7 touches "decision-store"
    When I click "decision-store" in the mini map
    Then the modal opens with "decision-store" selected
    And the side panel lists D7

  Scenario: The map follows the model and Decisions live
    When an agent requests a Decision touching "decision-ipc"
    Then the mini map shows "decision-ipc" glowing

  Scenario: No Groma model
    Given the Project "bare" has no "groma/" folder
    Then the map says "No Decision map yet" with a build button
    When I click the build button
    Then a Run starts with a prompt to curate the architecture

  Scenario: The map appears once groma/ is written
    Given the Project "bare" has no "groma/" folder
    Then the map says "No Decision map yet" with a build button
    When "bare" gets a "groma/" with the Container "main-process" and the Components "decision-store" and "decision-ipc"
    Then the mini map shows "main-process" without its Components

  Scenario: An element without Decisions says so
    When I click "decision-ipc" in the mini map
    Then the modal opens with "decision-ipc" selected
    And the side panel says "No Decisions"

  Scenario: Open a pending Decision from the map
    Given a pending Decision D1 touches "decision-ipc"
    And a pending Decision D7 touches "decision-store"
    When I click "decision-store" in the mini map
    And I open D7 from the side panel
    Then the modal closes
    And the Feed view shows D7 focused

  Scenario: Open an answered Decision from the map
    Given an answered Decision from yesterday touches "decision-ipc"
    When I click "decision-ipc" in the mini map
    And I open D1 from the side panel
    Then the modal closes
    And the History view shows D1 focused

  Scenario: Map tabs show their shortcuts
    Then the mini map control "Overview" has the tooltip "Overview: one level, all its arrows (O)"
    And the mini map control "Interactions" has the tooltip "Interactions: nested, arrows on hover (I)"
    And the mini map control "Up" has the tooltip "Up: back to the parent level (Backspace)"

  Scenario: Keys switch the map view
    Given the mouse rests on the mini map
    When I press I
    Then the mini map shows "main-process" containing "decision-store" and "decision-ipc"
    When I press O
    Then the mini map shows "main-process" without its Components

  Scenario: Backspace goes up a level
    When I click "main-process" in the mini map
    Then the map shows only "decision-store" and "decision-ipc"
    When I press Backspace
    Then the mini map shows "main-process" without its Components

  Scenario: Keys act in the modal
    When I click the expand icon
    And I press I
    Then the mini map shows "main-process" containing "decision-store" and "decision-ipc"
