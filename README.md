# UDID-submit

A web application that helps you obtain the UDID (Unique Device Identifier) from iOS devices. This tool creates and serves a mobile configuration profile that, when installed on an iOS device, will send back the device's UDID and other relevant information.

## Features

- Generate and serve iOS mobile configuration profiles
- Collect device UDID, IMEI, ICCID, and other device information
- Clean and modern web interface
- Secure data handling
- Automatic HTTPS with Vercel deployment

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Insfra-tst/UDID-submit.git
cd UDID-submit
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Visit `http://localhost:3000` in your web browser

3. Follow the on-screen instructions:
   - Click the "Download Profile" button
   - Install the profile on your iOS device
   - View the device information on the success page

## Development

To run the server in development mode with auto-reload:
```bash
npm run dev
```

## Deployment

This application is configured for easy deployment on Vercel:

1. Fork this repository
2. Sign up on [Vercel](https://vercel.com)
3. Import your forked repository
4. Deploy with default settings

The application will be automatically deployed and available at your Vercel URL.

## Important Notes

- The server must be accessible from the iOS device for the profile installation to work
- If running locally, make sure both your computer and iOS device are on the same network
- For production use, HTTPS is automatically enabled when deployed on Vercel

## Security

This application only collects basic device information required for development purposes. No personal data is stored or transmitted beyond the initial request.

## License

MIT 
