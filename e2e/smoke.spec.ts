import { expect, test } from '@playwright/test'

test('host creates a room and a participant joins from another session', async ({
  browser,
  page: hostPage,
}) => {
  await hostPage.goto('/')
  await hostPage.getByLabel('Your name').fill('Alex Host')
  await hostPage.getByRole('button', { name: 'Create room' }).click()

  await expect(hostPage.getByRole('heading', { name: 'You are in the room' })).toBeVisible()
  await expect(
    hostPage.getByRole('list', { name: 'Participants' }).getByText('Alex Host'),
  ).toBeVisible()
  await expect(hostPage).toHaveURL(/\/room\/[0-9a-f-]{36}$/)
  await expect(hostPage.getByRole('status')).toHaveText('Connected', {
    timeout: 15_000,
  })

  const participantNames = ['Sam Developer', 'Mira Engineer', 'Noah Backend']
  const participantContexts = await Promise.all(
    participantNames.map(() => browser.newContext()),
  )
  const participantPages = await Promise.all(
    participantContexts.map((context) => context.newPage()),
  )

  try {
    await Promise.all(
      participantPages.map(async (participantPage, index) => {
        await participantPage.goto(hostPage.url())
        await participantPage
          .getByLabel('Your name')
          .fill(participantNames[index] ?? '')
        await participantPage.getByRole('button', { name: 'Join room' }).click()
        await expect(participantPage.getByRole('status')).toHaveText('Connected', {
          timeout: 15_000,
        })
      }),
    )

    const hostParticipantList = hostPage.getByRole('list', { name: 'Participants' })
    await expect(hostParticipantList.getByRole('listitem')).toHaveCount(4)

    for (const participantName of ['Alex Host', ...participantNames]) {
      await expect(hostParticipantList.getByText(participantName)).toBeVisible()
    }

    await hostPage.reload()
    await expect(hostPage.getByRole('status')).toHaveText('Connected', {
      timeout: 15_000,
    })
    await expect(
      hostPage.getByRole('list', { name: 'Participants' }).getByRole('listitem'),
    ).toHaveCount(4)
  } finally {
    await Promise.all(participantContexts.map((context) => context.close()))
  }
})
