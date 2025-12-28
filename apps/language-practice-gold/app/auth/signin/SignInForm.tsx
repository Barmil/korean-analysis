'use client'

import { TextInput, PasswordInput, Button, Paper, Title, Alert, Stack } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

interface SignInFormProps {
  error?: string
  handleSubmit: (formData: FormData) => Promise<void>
}

export function SignInForm({ error, handleSubmit }: SignInFormProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}>
      <Paper shadow="md" p="xl" withBorder style={{ minWidth: 400 }}>
        <Stack gap="lg">
          <Title order={2}>Sign In</Title>

          {error && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title="Authentication Error"
              color="red"
            >
              {error}
            </Alert>
          )}

          <form action={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Username"
                name="username"
                placeholder="Enter your username"
                required
                autoComplete="username"
              />

              <PasswordInput
                label="Password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />

              <Button type="submit" fullWidth size="md">
                Sign In
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  )
}

