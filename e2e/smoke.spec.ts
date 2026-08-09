import { expect, test } from '@playwright/test'

test('host creates a room and a participant joins from another session', async ({
  browser,
  page: hostPage,
}) => {
  await hostPage.goto('/')
  await hostPage.getByLabel('Your name').fill('Alex Host')
  await hostPage.getByRole('button', { name: 'Create room' }).click()

  await expect(hostPage.getByRole('heading', { name: 'You are in the room' })).toBeVisible()
  await expect(hostPage.getByText('Alex Host')).toBeVisible()
  await expect(hostPage).toHaveURL(/\/room\/[0-9a-f-]{36}$/)

  const participantContext = await browser.newContext()
  const participantPage = await participantContext.newPage()

  try {
    await participantPage.goto(hostPage.url())
    await participantPage.getByLabel('Your name').fill('Sam Developer')
    await participantPage.getByRole('button', { name: 'Join room' }).click()

    await expect(
      participantPage.getByRole('heading', { name: 'You are in the room' }),
    ).toBeVisible()
    await expect(participantPage.getByText('Sam Developer')).toBeVisible()
  } finally {
    await participantContext.close()
  }
})
