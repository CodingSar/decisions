Feature: Set up a new project
  Setting up prepares the folder so coding agents there work with the app from the first session.

  Scenario: Set up connects the folder's terminal to the app
    Given I pick a new empty folder "shop"
    When I choose to set up a new project
    Then "shop/.mcp.json" configures the "decisions", "context7" and "tessl" servers
    And "shop/.claude/settings.json" enables the "mattpocock-skills" plugin
    And "shop/CLAUDE.md" tells agents to ask through "request_decision"

  Scenario: Set up keeps what the folder already has
    Given I pick a folder "shop" with its own CLAUDE.md and an MCP server "mine"
    When I choose to set up a new project
    And I choose to set up a new project
    Then "shop/.mcp.json" still configures the server "mine"
    And "shop/CLAUDE.md" starts with the original text and has one Decisions section

  Scenario: A missing interview plugin is explained
    Given the "claude" CLI is not found
    And I pick a new empty folder "shop"
    When I choose to set up a new project
    Then the terminal explains that "mattpocock-skills" could not be installed
