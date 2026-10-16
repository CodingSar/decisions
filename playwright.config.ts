import { defineConfig } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

// Widen `features` as each slice gets its steps; unimplemented .feature files stay out of the run.
const testDir = defineBddConfig({
  features: [
    'src/shell/spec/launch.feature',
    'src/shell/spec/work-across-projects.feature',
    'src/slices/projects/spec/open-project.feature',
    'src/slices/runs/spec/start-run.feature',
    'src/slices/runs/spec/terminal.feature',
    'src/slices/agent-runtimes/spec/claude-code.feature',
    'src/slices/decisions/spec/take-decision.feature',
    'src/slices/scopes/spec/configure-scopes.feature',
    'src/slices/decisions/spec/auto-resolve.feature',
    'src/slices/decisions/spec/overturn-decision.feature',
    'src/slices/decisions/spec/sort-feed.feature',
    'src/slices/decisions/spec/decision-components.feature',
    'src/slices/projects/spec/recent-projects.feature',
    'src/slices/files/spec/browse-files.feature',
    'src/slices/files/spec/edit-files.feature',
    'src/slices/architecture/spec/decision-map.feature',
  ],
  missingSteps: 'skip-scenario', // slices land one scenario at a time
  steps: ['src/**/spec/steps.ts', 'src/**/spec/steps-*.ts', 'src/shared/testing/fixtures.ts'],
})

export default defineConfig({ testDir, reporter: 'list' })
