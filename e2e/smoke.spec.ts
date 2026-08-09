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
  await expect(hostPage.getByRole('region', { name: 'Host controls' })).toBeVisible()
  await expect(hostPage.getByText('Session phase: Lobby')).toBeVisible()

  const participantNames = ['Sam Developer', 'Mira Engineer', 'Noah Backend']
  const participantContexts = await Promise.all(
    participantNames.map(() => browser.newContext()),
  )
  const participantPages = await Promise.all(
    participantContexts.map((context) => context.newPage()),
  )

  try {
    await Promise.all(
      participantPages.slice(0, 2).map(async (participantPage, index) => {
        await participantPage.goto(hostPage.url())
        await participantPage
          .getByLabel('Your name')
          .fill(participantNames[index] ?? '')
        await participantPage.getByRole('button', { name: 'Join room' }).click()
        await expect(participantPage.getByRole('status')).toHaveText('Connected', {
          timeout: 15_000,
        })
        await expect(participantPage.getByText('Synchronized with host')).toBeVisible()
        await expect(
          participantPage.getByRole('region', { name: 'Host controls' }),
        ).toHaveCount(0)
      }),
    )

    const hostParticipantList = hostPage.getByRole('list', { name: 'Participants' })
    await expect(hostParticipantList.getByRole('listitem')).toHaveCount(3)

    for (const participantName of ['Alex Host', ...participantNames.slice(0, 2)]) {
      await expect(hostParticipantList.getByText(participantName)).toBeVisible()
    }

    await hostPage.reload()
    await expect(hostPage.getByRole('status')).toHaveText('Connected', {
      timeout: 15_000,
    })
    await expect(hostPage.getByRole('region', { name: 'Host controls' })).toBeVisible()
    await expect(hostPage.getByText('Session phase: Lobby')).toBeVisible()

    const lateParticipantPage = participantPages[2]
    await lateParticipantPage.goto(hostPage.url())
    await lateParticipantPage.getByLabel('Your name').fill(participantNames[2] ?? '')
    await lateParticipantPage.getByRole('button', { name: 'Join room' }).click()
    await expect(lateParticipantPage.getByRole('status')).toHaveText('Connected', {
      timeout: 15_000,
    })
    await expect(lateParticipantPage.getByText('Synchronized with host')).toBeVisible()
    await expect(lateParticipantPage.getByText('Session phase: Lobby')).toBeVisible()
    await expect(hostParticipantList.getByRole('listitem')).toHaveCount(4)

    await hostPage.close()
    await expect(participantPages[0].getByText('The host is offline.')).toBeVisible({
      timeout: 15_000,
    })
  } finally {
    await Promise.all(participantContexts.map((context) => context.close()))
  }
})
