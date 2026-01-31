# Conversation Viewer - API and Usage Guide

## Overview
The Conversation Viewer allows you to retrieve and view full conversation transcripts between clients and agents across all channels (phone, email, chat).

## API Endpoints

### 1. Get Single Conversation
```http
GET /api/conversations/:interactionId
```
Returns full conversation details including transcript.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "customer": { "name": "...", "phone": "...", "email": "..." },
    "agent": { "name": "...", "email": "..." },
    "channel": "phone",
    "direction": "inbound",
    "summary": "...",
    "transcript": [
      {
        "speaker": "customer",
        "text": "Hello, I need help...",
        "timestamp": "2024-01-01T10:00:00Z"
      },
      {
        "speaker": "agent",
        "text": "Of course, how can I assist?",
        "timestamp": "2024-01-01T10:00:15Z"
      }
    ],
    "intent": "inquiry",
    "outcome": "positive",
    "keywords": ["help", "support"],
    "notes": "..."
  }
}
```

### 2. Get All Conversations for a Customer
```http
GET /api/conversations/customer/:customerId?page=1&limit=20&includeTranscript=true
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `includeTranscript` (optional, default: 'true')

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": { "name": "...", "phone": "...", "email": "..." },
    "conversations": [...],
    "pagination": {
      "total": 45,
      "page": 1,
      "pages": 3,
      "limit": 20
    }
  }
}
```

### 3. Get All Conversations for an Agent
```http
GET /api/conversations/agent/:agentId?page=1&limit=20&includeTranscript=true
```

Same structure as customer endpoint.

### 4. Get All Conversations (with filters)
```http
GET /api/conversations/all/list?channel=phone&dateFrom=2024-01-01&dateTo=2024-12-31
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)
- `channel` (optional: 'phone', 'email', 'chat')
- `dateFrom` (optional: ISO date string)
- `dateTo` (optional: ISO date string)
- `includeTranscript` (optional, default: 'false')

### 5. Search Conversations
```http
GET /api/conversations/search/query?q=refund&page=1&limit=20
```

Searches in summary, content, keywords, and notes.

**Query Parameters:**
- `q` (required: search query)
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

## Web Interface

### Access the Viewer

**For Agents:**
Navigate to: `/agent/conversations`

**For Admins:**
Navigate to: `/admin/conversations`

### Features

1. **View All Conversations**
   - Click "All Conversations" to see all interactions
   - Paginated display (20 per page)

2. **Filter by Customer**
   - Click "By Customer"
   - Enter Customer ID
   - Click "Fetch"

3. **Filter by Agent**
   - Click "By Agent"
   - Enter Agent ID
   - Click "Fetch"

4. **Search**
   - Use the search bar to find conversations by keywords
   - Searches across summary, content, keywords, and notes

5. **View Full Details**
   - Click any conversation card to see full details
   - View complete transcript with timestamps
   - See customer and agent information
   - View keywords, intent, outcome, and notes

## Usage Examples

### Example 1: Get all phone conversations from last week
```javascript
const response = await axios.get('/api/conversations/all/list', {
  params: {
    channel: 'phone',
    dateFrom: '2024-01-24',
    dateTo: '2024-01-31',
    includeTranscript: 'true'
  }
});
```

### Example 2: Get customer's conversation history
```javascript
const customerId = '65a1b2c3d4e5f6g7h8i9j0k1';
const response = await axios.get(`/api/conversations/customer/${customerId}`, {
  params: {
    page: 1,
    limit: 10,
    includeTranscript: 'true'
  }
});
```

### Example 3: Search for conversations about refunds
```javascript
const response = await axios.get('/api/conversations/search/query', {
  params: {
    q: 'refund',
    page: 1,
    limit: 20
  }
});
```

### Example 4: Get specific conversation with full transcript
```javascript
const interactionId = '65a1b2c3d4e5f6g7h8i9j0k1';
const response = await axios.get(`/api/conversations/${interactionId}`);

// Access transcript
const transcript = response.data.data.transcript;
transcript.forEach(message => {
  console.log(`${message.speaker}: ${message.text}`);
});
```

## Data Structure

### Transcript Format
Each transcript entry contains:
```javascript
{
  speaker: "customer" | "agent",
  text: "Message content",
  timestamp: "ISO date string"
}
```

### Conversation Metadata
- `channel`: 'phone', 'email', 'chat'
- `direction`: 'inbound', 'outbound'
- `intent`: 'purchase', 'inquiry', 'complaint', 'support', 'follow-up', 'unknown'
- `outcome`: 'pending', 'positive', 'neutral', 'negative', 'converted', etc.
- `keywords`: Array of relevant keywords discussed
- `summary`: Brief summary of the conversation
- `notes`: Additional agent notes

## Performance Tips

1. **Pagination**: Use reasonable limit values (10-50) for better performance
2. **Include Transcript**: Set `includeTranscript=false` when you only need metadata
3. **Search**: Be specific with search queries to reduce result set
4. **Date Filters**: Use date ranges to narrow down results

## Integration in Your App

To add a conversation viewer button to your agent dashboard:

```jsx
import { useNavigate } from 'react-router-dom';

function AgentDashboard() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/agent/conversations')}>
      📞 View Conversations
    </button>
  );
}
```

Or link to specific customer's conversations:
```jsx
<button onClick={() => navigate(`/agent/conversations?customerId=${customer._id}`)}>
  View Customer History
</button>
```

## Notes

- All conversation data is stored in the `Interaction` model
- Transcripts are automatically saved during WebRTC calls
- Search is case-insensitive
- Timestamps are in UTC
- All endpoints require authentication (except noted otherwise)
