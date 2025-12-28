'use client'

import { useState } from 'react'
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Paper, 
  Group, 
  Grid, 
  Textarea, 
  Divider,
  Stack
} from '@mantine/core'
import { Dropzone, type FileWithPath } from '@mantine/dropzone'
import { IconUpload, IconFile, IconX } from '@tabler/icons-react'
import { LoadingModal } from './components/LoadingModal'

interface HomeContentProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  } | null
  handleSignOut: () => Promise<void>
}

export function HomeContent({ user, handleSignOut }: HomeContentProps) {
  const [freeText, setFreeText] = useState('')
  const [file, setFile] = useState<FileWithPath | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [progressLog, setProgressLog] = useState<string[]>([])

  const handleFileDrop = (droppedFiles: FileWithPath[]) => {
    setFile(droppedFiles[0] || null)
  }

  const addProgressMessage = (message: string) => {
    setProgressLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const clearProgressLog = () => {
    setProgressLog([])
  }

  const processFreeText = async (text: string, onProgress: (message: string) => void) => {
    // Stub function - replace with actual implementation
    onProgress('Starting free text processing...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Analyzing text content...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Extracting vocabulary...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Processing complete!')
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const processFile = async (file: FileWithPath, onProgress: (message: string) => void) => {
    // Stub function - replace with actual implementation
    onProgress(`Starting file processing: ${file.name}`)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Reading file content...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Analyzing document...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Extracting vocabulary...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onProgress('Processing complete!')
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const handleUseFreeText = async () => {
    if (!freeText.trim()) return
    
    setIsLoading(true)
    setLoadingMessage('Processing free text...')
    clearProgressLog()
    
    try {
      await processFreeText(freeText, addProgressMessage)
    } catch (error) {
      addProgressMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  const handleUseFile = async () => {
    if (!file) return
    
    setIsLoading(true)
    setLoadingMessage('Processing file...')
    clearProgressLog()
    
    try {
      await processFile(file, addProgressMessage)
    } catch (error) {
      addProgressMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <>
      <LoadingModal
        opened={isLoading}
        loadingMessage={loadingMessage}
        progressLog={progressLog}
        onClearLog={clearProgressLog}
      />

      <Container size="lg" py="xl">
        <Paper shadow="sm" p="xl" withBorder>
        <Stack gap="md" mb="xl">
          <Group justify="space-between" align="center">
            <Title order={1}>
              Language Practice Gold
            </Title>
            <form action={handleSignOut}>
              <Button type="submit" variant="light" color="gray">
                Sign Out
              </Button>
            </form>
          </Group>
          <Text c="dimmed" size="lg">
            Welcome, {user?.name || 'User'}!
          </Text>
          <Text c="dimmed" size="sm">
            This is a tool that analyzes Korean vocabulary from textbooks, csv or free text, and generates interactive practice sheets.
          </Text>
        </Stack>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Title order={3}>Free Text Input</Title>
              <Textarea
                placeholder="Enter your text here..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                minRows={10}
                autosize
              />
              <Button 
                onClick={handleUseFreeText}
                fullWidth
                disabled={!freeText.trim()}
              >
                Use Free Text
              </Button>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 1 }} style={{ display: 'flex', justifyContent: 'center' }}>
            <Divider orientation="vertical" style={{ minHeight: '300px' }} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Title order={3}>File Upload</Title>
              <Dropzone
                onDrop={handleFileDrop}
                accept={['application/pdf', 'text/csv']}
                maxSize={10 * 1024 * 1024} // 10MB
                multiple={false}
              >
                <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                  <Dropzone.Accept>
                    <IconUpload size={52} stroke={1.5} />
                  </Dropzone.Accept>
                  <Dropzone.Reject>
                    <IconX size={52} stroke={1.5} />
                  </Dropzone.Reject>
                  <Dropzone.Idle>
                    <IconFile size={52} stroke={1.5} />
                  </Dropzone.Idle>

                  <div>
                    <Text size="xl" inline>
                      Drag files here or click to select
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                      PDF or CSV files up to 10MB
                    </Text>
                  </div>
                </Group>
              </Dropzone>

              {file && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Selected file:</Text>
                  <Text size="sm" c="dimmed">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Text>
                </Stack>
              )}

              <Button 
                onClick={handleUseFile}
                fullWidth
                disabled={!file}
              >
                Use File
              </Button>
            </Stack>
          </Grid.Col>
        </Grid>
      </Paper>
    </Container>
    </>
  )
}
