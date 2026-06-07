self.addEventListener('push', function (event) {
  let data = { title: '', body: '', data: {} }
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    // ignore malformed payloads
  }

  const title = data.title || 'Denoisr'
  const options = {
    body: data.body || '',
    icon: '/favicon.svg',
    tag: data.data?.type === 'message' ? `conv-${data.data.conversationId}` : data.data?.type || 'default',
    data: data.data || {},
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const data = event.notification.data || {}
  let url = '/'

  switch (data.type) {
    case 'message':
    case 'connection':
      url = '/messages'
      break
    case 'job_status':
      url = '/applications'
      break
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
