# ConversaIQ

**Context-Aware Customer Intelligence & Agent Assist Platform**

A web-based agent intelligence platform that maintains customer context across interactions (email, chat, phone), enriches it with agent knowledge, categorizes customer potential, and provides active, context-aware assistance to agents.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.x-61dafb.svg)

## 🎯 Core Principles

- **Human-First Design**: AI/ML assists agents but never replaces them. The system suggests, agents decide.
- **Context Continuity**: Every interaction builds on previous ones. No customer repeats their story.
- **Explainable Intelligence**: Every score, suggestion, and recommendation comes with a clear "why."
- **Adaptive Learning**: Agent feedback continuously improves the system through human-in-the-loop patterns.

## ✨ Features

### 📊 Unified Customer Profile
- Cross-channel interaction history (phone, email, chat)
- Auto-detected keywords and preferences
- Intent tracking with confidence scores
- Customer potential scoring (High/Medium/Low/Spam)

### 🎯 Agent Assist Panel
- **Phone Calls**: Real-time talking points, objection handling, warnings
- **Email**: Suggested openers, follow-up lines, CTAs
- **Chat**: Quick replies, tone-matched responses

### 📞 Call Flow Integration
- Incoming call notifications with instant context
- Live assist panel during calls
- Post-call summary capture
- Automatic interaction logging

### 🧠 Intelligence Services
- Rule-based intent detection (upgradeable to ML)
- Weighted potential scoring with full explainability
- Context-aware recommendations
- Domain-specific keyword library

### 🔄 Human-in-the-Loop
- Agent keyword tagging
- Potential score correction
- Assist panel helpfulness feedback
- Training data collection for future ML

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, CSS3 |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO |
| Auth | Simple email-based (MVP) |

## 📁 Project Structure

```
ConversaIQ/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── call/       # Call-related components
│   │   │   ├── common/     # Shared components
│   │   │   ├── customer/   # Customer-related components
│   │   │   └── dashboard/  # Dashboard widgets
│   │   ├── context/        # React contexts (Auth, Socket)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── styles/         # CSS styles
│   │   └── utils/          # Utility functions
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routes
│   ├── services/           # Intelligence services
│   ├── socket/             # WebSocket handlers
│   ├── seed/               # Database seeding
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/conversaiq.git
   cd conversaiq
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI
   ```

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the servers**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

7. **Open the app**
   
   Navigate to `http://localhost:5173`

### Demo Accounts

After seeding, you can log in with:

| Name | Email |
|------|-------|
| Sarah Johnson | sarah@conversaiq.com |
| Michael Chen | michael@conversaiq.com |
| Emily Rodriguez | emily@conversaiq.com |

## 📡 API Endpoints

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer with context
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `POST /api/customers/:id/keywords` - Add keywords
- `PUT /api/customers/:id/feedback` - Submit feedback
- `GET /api/customers/:id/assist/:channel` - Get channel assist

### Call Events
- `POST /api/call-event` - Receive incoming call event
- `POST /api/call-event/:id/end` - End call
- `POST /api/call-event/:id/summary` - Submit call summary

### Interactions
- `GET /api/interactions/customer/:customerId` - Get timeline
- `POST /api/interactions` - Create interaction

### Keywords
- `GET /api/keywords` - Get keyword library
- `POST /api/keywords` - Suggest new keyword

### Agents
- `POST /api/agents/login` - Agent login

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `agent:join` | Client → Server | Agent joins their room |
| `call:incoming` | Server → Client | New incoming call notification |
| `call:ended` | Server → Client | Call ended, trigger summary |
| `customer:updated` | Server → Client | Customer profile changed |

## 🎨 Design System

The app uses a modern dark theme with:
- **Primary**: Purple gradient (#6366f1 → #4f46e5)
- **Accent**: Cyan (#06b6d4)
- **Glassmorphism** effects on cards
- **Micro-animations** for engagement
- **Color-coded potential levels**:
  - 🟢 High (Green)
  - 🟡 Medium (Amber)
  - ⚪ Low (Gray)
  - 🔴 Spam (Red)

## 🔮 Future Scope

### Phase 2 Features
- [ ] Python ML microservice for intent detection
- [ ] Advanced NLP for conversation analysis
- [ ] Predictive next-best-action
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Real telephony integration (Twilio)
- [ ] Email parsing integration

### Technical Improvements
- [ ] JWT authentication
- [ ] Role-based access control
- [ ] API rate limiting
- [ ] Caching layer (Redis)
- [ ] Comprehensive test suite

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for sales and support teams everywhere
- Inspired by the need for context-aware customer interactions
- Designed to augment, not replace, human intelligence
