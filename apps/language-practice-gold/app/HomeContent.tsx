'use client'

import { Container, Title, Text, Button, Paper, Group } from '@mantine/core'

interface HomeContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  } | null
  handleSignOut: () => Promise<void>
}

export function HomeContent({ user, handleSignOut }: HomeContentProps) {
  return (
    <Container size="lg" py="xl">
      <Paper shadow="sm" p="xl" withBorder>
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} mb="xs">
              Language Practice Gold
            </Title>
            <Text c="dimmed" size="lg">
              Welcome, {user?.name || 'User'}!
            </Text>
          </div>
          <form action={handleSignOut}>
            <Button type="submit" variant="light" color="gray">
              Sign Out
            </Button>
          </form>
        </Group>

        <div>
          <Text>Your authenticated content goes here.</Text>
        </div>
      </Paper>
    </Container>
  )
}

