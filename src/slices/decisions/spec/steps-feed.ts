import { When } from '../../../shared/testing/fixtures'

When('I type {string} into the Run name field', async ({ page }, text: string) => {
  await page.getByRole('button', { name: 'Rename Run' }).click()
  await page.getByRole('textbox', { name: 'Run name' }).press(text)
})
