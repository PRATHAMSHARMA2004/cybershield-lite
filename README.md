🛡 CyberShield Lite

CyberShield Lite is a SaaS-style website security scanner that analyzes websites for common security vulnerabilities and provides actionable security recommendations.

Users can enter a website URL and receive a detailed security analysis including vulnerabilities, security score, and recommended fixes.

---

🚀 Features

• Website Security Scanner
• Phishing Detection
• Open Port Detection
• SSL Certificate Analysis
• Security Header Analysis
• Vulnerability Recommendations
• Security Score Calculation
• Security Advisor
• PDF Security Reports
• Scan History Dashboard

---

🏗 System Architecture

CyberShield Lite uses a 3-layer architecture.

User
↓
React Frontend Dashboard
↓
Node.js Backend API
↓
Python Security Scanner Engine

---

🖥 Frontend

Built with React.js

Provides:

• Security dashboard
• Scan results visualization
• Security score display
• Vulnerability list
• Security advisor panel
• PDF report download

---

⚙ Backend

Built with Node.js and Express

Handles:

• Authentication
• Scan request handling
• Communication with scanner engine
• Security score storage
• Report generation

---

🔍 Scanner Engine

Built with Python

Performs security checks including:

• Port scanning
• Security header analysis
• SSL certificate validation
• DNS checks
• Phishing detection
• Technology detection

---

🧠 Security Checks

The scanner checks for common vulnerabilities such as:

• Missing Content Security Policy
• Missing X-Frame-Options
• Missing HSTS
• Open Ports
• SSL Misconfiguration
• DNS Issues
• Phishing Indicators

Each scan generates:

• Vulnerability list
• Severity levels
• Security recommendations
• Overall security score

---

📊 Dashboard

The dashboard displays:

• Overall security score
• Detected vulnerabilities
• Security advisor suggestions
• Scan history
• SSL certificate information

---

📄 PDF Reports

CyberShield Lite generates downloadable security audit reports containing:

• Website security summary
• Vulnerability breakdown
• Severity levels
• Security recommendations
• SSL certificate details

---

🛠 Tech Stack

Frontend
React.js
TailwindCSS

Backend
Node.js
Express.js
MongoDB

Scanner Engine
Python
FastAPI

---

📦 Project Structure

cybershield-lite
│
├── frontend        # React dashboard
│
├── backend         # Node.js API
│
└── scanner         # Python security engine

---

⚡ Installation

Clone the repository

git clone https://github.com/PRATHAMSHARMA2004/cybershield-lite

Install frontend dependencies

cd frontend
npm install

Install backend dependencies

cd backend
npm install

Install scanner dependencies

cd scanner
pip install -r requirements.txt

---

📌 Future Improvements

• AI-based vulnerability detection
• Continuous monitoring system
• Automated remediation suggestions
• Security badge system for websites

---

👨‍💻 Author

Pratham Sharma

GitHub
https://github.com/PRATHAMSHARMA2004

LinkedIn
https://www.linkedin.com/in/pratham-sharma-3b1157240

---

⭐ Support

If you like this project, consider giving it a star ⭐ on GitHub.
