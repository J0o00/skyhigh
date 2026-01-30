# ConversaIQ API Documentation

> **Version**: v1  
> **Base URL**: `http://localhost:5000/api/v1`

## Overview

ConversaIQ provides a **frontend-agnostic REST API** for customer intelligence and agent assist. All endpoints return JSON with standardized response formats.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-31T00:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Endpoints

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/customers` | List all customers |
| `GET` | `/customers/:id` | Get customer by ID |
| `POST` | `/customers` | Create new customer |
| `PATCH` | `/customers/:id` | Update customer |
| `DELETE` | `/customers/:id` | Soft delete customer |
| `GET` | `/customers/:id/interactions` | Get customer history |
| `GET` | `/customers/:id/context` | Get full context for agents |

#### Create Customer
```bash
POST /api/v1/customers
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

---

### Interactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/interactions` | List interactions (with filters) |
| `GET` | `/interactions/:id` | Get interaction details |
| `POST` | `/interactions` | Ingest new interaction |

#### Ingest Interaction
```bash
POST /api/v1/interactions
Content-Type: application/json

{
  "channel": "email",          # email, phone, chat
  "direction": "inbound",      # inbound, outbound
  "content": "Message content",
  "customerEmail": "john@example.com"
}
```

---

### Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/calls/incoming` | Handle incoming call |
| `POST` | `/calls/summary` | Submit call summary |
| `GET` | `/calls/:id` | Get call details |

#### Incoming Call
```bash
POST /api/v1/calls/incoming
Content-Type: application/json

{
  "phone": "+1234567890",
  "agentId": "agent_id_here"
}
```

**Response includes**: Customer profile, previous interactions, agent assist suggestions.

---

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/agents` | List all agents |
| `GET` | `/agents/:id` | Get agent details |
| `POST` | `/agents` | Create agent |
| `GET` | `/agents/inbox` | Get agent inbox |
| `POST` | `/agents/reply` | Send reply to customer |
| `POST` | `/agents/keywords` | Tag customer with keywords |

#### Send Reply
```bash
POST /api/v1/agents/reply
Content-Type: application/json

{
  "customerId": "customer_id",
  "agentId": "agent_id",
  "channel": "email",
  "content": "Reply message"
}
```

---

### Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/intelligence/score/:customerId` | Get potential score |
| `GET` | `/intelligence/suggestions/:customerId` | Get agent suggestions |
| `GET` | `/intelligence/recommendations/:customerId` | Get action recommendations |
| `POST` | `/intelligence/analyze` | Analyze text for intent |

#### Analyze Text
```bash
POST /api/v1/intelligence/analyze
Content-Type: application/json

{
  "text": "I'm having issues with my order and need urgent help",
  "subject": "Order Problem"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "intent": "COMPLAINT",
    "urgency": "🔴 URGENT",
    "sentiment": "NEGATIVE",
    "keyPhrases": ["order", "issues", "urgent help"],
    "actionRequired": "⚡ Immediate Response Required"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `CUSTOMER_NOT_FOUND` | 404 | Customer not found |
| `DUPLICATE_ENTRY` | 409 | Record already exists |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Frontend Integration

### CORS
The API supports multiple origins. Configure via environment:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-app.com
```

### Connecting from Any Frontend
```javascript
// React, Vue, Angular, or vanilla JS
const API_BASE = 'http://localhost:5000/api/v1';

async function getCustomers() {
  const response = await fetch(`${API_BASE}/customers`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.customers;
  } else {
    throw new Error(result.error.message);
  }
}
```

---

## Mock Responses

For frontend development without backend, use these mock endpoints:

```bash
# Use tools like Requestly or MSW to intercept and mock
GET /api/v1/customers -> mock-customers.json
GET /api/v1/agents/inbox -> mock-inbox.json
```

Sample mock files are in `/server/mocks/` directory.
