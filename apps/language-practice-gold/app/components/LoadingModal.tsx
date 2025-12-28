'use client'

import { Modal, Loader, Text, Stack, Group, Button, Textarea } from '@mantine/core'

interface LoadingModalProps {
  opened: boolean
  loadingMessage: string
  progressLog: string[]
  onClearLog: () => void
}

export function LoadingModal({ opened, loadingMessage, progressLog, onClearLog }: LoadingModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {}}
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
      centered
      size="lg"
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Loader size="lg" />
            <Text size="lg" fw={500}>
              {loadingMessage}
            </Text>
          </Group>
          <Button 
            variant="light" 
            size="xs"
            onClick={onClearLog}
            disabled={progressLog.length === 0}
          >
            Clear
          </Button>
        </Group>
        
        <Textarea
          value={progressLog.join('\n')}
          readOnly
          placeholder="Progress messages will appear here..."
          minRows={10}
          autosize
          maxRows={20}
          styles={{
            input: {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }
          }}
        />
      </Stack>
    </Modal>
  )
}

