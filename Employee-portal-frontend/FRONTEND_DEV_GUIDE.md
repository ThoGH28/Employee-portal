# Frontend Development Guide

## Quick Commands

```bash
# Installation
npm install

# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run type-check      # Check TypeScript errors
npm run lint            # Run ESLint

# Production
npm run build           # Optimized build
npm run preview         # Preview built app

# Docker
docker build -t ep-frontend .
docker run -p 3000:80 ep-frontend
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with routing |
| `src/config.ts` | App configuration & constants |
| `src/config/queryClient.ts` | React Query setup |
| `vite.config.ts` | Build configuration |
| `tsconfig.json` | TypeScript configuration |
| `.env.development` | Dev environment variables |
| `nginx.conf` | Production server config |

## API Integration

### Backend Endpoints Expected

```
POST   /api/auth/login/                    # Login
GET    /api/auth/me/                       # Current user
PATCH  /api/auth/me/                       # Update profile
POST   /api/auth/change-password/          # Change password

GET    /api/employees/                     # List employees
GET    /api/employees/{id}/                # Get employee
GET    /api/employees/me/                  # Current employee

GET    /api/leaves/my-requests/            # User's leave requests
POST   /api/leaves/                        # Create leave request
GET    /api/leaves/balance/                # Leave balance

GET    /api/announcements/                 # List announcements
POST   /api/announcements/                 # Create announcement

POST   /api/chat/conversations/            # Create conversation
GET    /api/chat/conversations/            # List conversations
GET    /api/chat/conversations/{id}/messages/  # Get messages
POST   /api/chat/conversations/{id}/message/   # Send message

GET    /api/documents/                     # List documents
POST   /api/documents/upload/              # Upload document
GET    /api/documents/{id}/download/       # Download document
GET    /api/search/                        # Search documents
```

### Service Layer Example

```typescript
// src/shared/services/newService.ts
import api from './api'
import type { DataType } from '@/types'

export const newService = {
  getAll: () =>
    api.get<DataType[]>('/endpoint/'),

  getById: (id: string) =>
    api.get<DataType>(`/endpoint/${id}/`),

  create: (data: Partial<DataType>) =>
    api.post<DataType>('/endpoint/', data),

  update: (id: string, data: Partial<DataType>) =>
    api.patch<DataType>(`/endpoint/${id}/`, data),

  delete: (id: string) =>
    api.delete(`/endpoint/${id}/`),
}
```

### API Client Features

```typescript
import api from '@/services/api'

// Automatic JWT injection
api.get('/protected') // Adds Authorization header

// Error handling
try {
  await api.get('/endpoint')
} catch (error) {
  // 401 → redirect to login
  // Other errors → propagate
}

// Request/Response interceptors included
```

## Component Examples

### Page Component
```typescript
import { AppLayout } from '@/components/Layout'

export const MyPage: React.FC = () => {
  const sidebarItems = [
    { key: 'home', label: 'Home', icon: <HomeOutlined /> },
  ]

  return (
    <AppLayout sidebarItems={sidebarItems}>
      <h1>Page Title</h1>
    </AppLayout>
  )
}
```

### Data Fetching
```typescript
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export const MyComponent: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data'],
    queryFn: () => api.get('/endpoint').then(r => r.data),
  })

  if (isLoading) return <Spin />
  if (error) return <Alert type="error" message="Error" />

  return <div>{/* render data */}</div>
}
```

### Form Submission
```typescript
import { useMutation } from '@tanstack/react-query'
import api from '@/services/api'
import { message } from 'antd'

export const MyForm: React.FC = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/endpoint', data),
    onSuccess: () => message.success('Success!'),
    onError: () => message.error('Failed'),
  })

  return (
    <Form onFinish={mutate}>
      {/* form fields */}
    </Form>
  )
}
```

## Styling Guidelines

### CSS Modules
```css
/* Component.module.css */
.container {
  padding: 16px;
  background: white;
}

.title {
  font-size: 24px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .container {
    padding: 8px;
  }
}
```

### Ant Design Theming
Customize in `src/shared/styles/theme.ts`:
```typescript
export default {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
}
```

## Type Safety

### Define Component Props
```typescript
interface MyComponentProps {
  title: string
  count?: number
  onAction: (id: string) => void
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  count = 0,
  onAction,
}) => { ... }
```

### API Response Types
```typescript
// src/shared/types/index.ts
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

// Usage
const { data: user } = useQuery({
  queryFn: () => api.get<User>('/user'),
})
```

## State Management

### Global UI State (Zustand)
```typescript
import { useAuthStore } from '@/context/store'

export const MyComponent = () => {
  const { user, setUser } = useAuthStore()
  return <div>{user?.name}</div>
}
```

### Server State (React Query)
```typescript
const { data: items } = useQuery({
  queryKey: ['items'],
  queryFn: () => itemService.list(),
})
```

### Local Component State
```typescript
const [isOpen, setIsOpen] = useState(false)
```

## Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] No ESLint errors: `npm run lint`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Update API URL in `.env.production`
- [ ] Test in production build locally: `npm run preview`
- [ ] Test with actual backend
- [ ] Check browser console for errors
- [ ] Test all main user flows
- [ ] Verify images load correctly
- [ ] Check responsive design on mobile

## Performance Tips

1. **Code Splitting**
   - Automatic by Vite for routes
   - Manual with `React.lazy()`

2. **Image Optimization**
   - Use Ant Design `<Image />` component
   - Compress before upload

3. **Bundle Size**
   - Check: `npm run build`
   - Analyze: Add `rollup-plugin-visualizer`

4. **Caching**
   - Static assets: 365 days
   - HTML: no-cache
   - API: React Query 5-min

## Debugging Tips

### React DevTools
- Chrome extension for component inspection
- Profiler for performance analysis
- Check component props & state

### React Query DevTools
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Network Tab
- Monitor API calls
- Check headers & payloads
- Verify authentication token

### Console Errors
- Check browser console
- Look for 401/403 errors
- Verify API responses

## Maintenance

### Weekly
- Monitor error logs
- Check performance metrics
- Review new dependency updates

### Monthly
- Update dependencies: `npm update`
- Review bundle size
- Test compatibility

### Quarterly
- Major dependency updates
- Refactor code as needed
- Update documentation
