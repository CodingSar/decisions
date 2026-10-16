Feature: Browse files
  The human reads Project files, Markdown rendered, from the sidebar tree.

  Background:
    Given the Project "api-service" is open
    And it contains "docs/use-cases.md" and "GLOSSARY.md"

  Scenario: The tree sits under Runs and respects .gitignore
    Given ".gitignore" lists "dist/"
    Then the Files section is directly under Runs
    And the tree shows "docs" and "GLOSSARY.md"
    And the tree hides "dist" and ".git"

  Scenario: Folders start closed, open on click and close again
    Then the tree hides "docs/use-cases.md"
    When I expand "docs"
    Then the tree shows "docs/use-cases.md"
    When I collapse "docs"
    Then the tree hides "docs/use-cases.md"

  Scenario: The Files section collapses and expands
    When I collapse the Files section
    Then the tree hides "GLOSSARY.md"
    When I expand the Files section
    Then the tree shows "GLOSSARY.md"

  Scenario: Open a Markdown file rendered
    When I click "docs/use-cases.md" in the tree
    Then the Files view shows it rendered
    And I can toggle to the source

  Scenario: A relative Markdown link opens that file
    Given "docs/use-cases.md" links to "../GLOSSARY.md"
    When I click the link
    Then the Files view shows "GLOSSARY.md"

  Scenario: A link to a missing file says not found
    Given "docs/use-cases.md" links to "./missing.md"
    When I click the link
    Then the Files view says "docs/missing.md not found"

  Scenario: An external link opens in the system browser
    Given "GLOSSARY.md" links to "https://example.com"
    When I click the link
    Then the system browser opens "https://example.com"

  Scenario: The tree follows files written by an agent
    When an agent creates "docs/new.md"
    And I expand "docs"
    Then the tree shows "docs/new.md"

  Scenario: .decisions is read-only
    When I open ".decisions/D1.md"
    Then the editor is read-only
    And there is no edit-anyway icon

  Scenario: A nested folder stays open after its parent is collapsed and reopened
    Given it contains "docs/deep/note.md"
    When I expand "docs"
    And I expand "deep"
    And I collapse "docs"
    And I expand "docs"
    Then the tree shows "docs/deep/note.md"
