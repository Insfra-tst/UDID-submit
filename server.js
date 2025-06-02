const express = require('express');
const bodyParser = require('body-parser');
const plist = require('plist');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up middleware with error handling
app.use((err, req, res, next) => {
  console.error('Middleware Error:', err);
  next(err);
});

// Set up body parser with increased limit and error handling
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.raw({ 
  type: 'application/x-apple-aspen-config',
  limit: '10mb'
}));

// Set view engine and views path
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Home page route with error handling
app.get('/', (req, res, next) => {
  try {
    res.render('index');
  } catch (error) {
    console.error('Error rendering index:', error);
    next(error);
  }
});

// Generate and serve the mobile config profile
app.get('/profile', (req, res, next) => {
  try {
    const profileConfig = {
      PayloadContent: [{
        PayloadContent: {
          URL: `${req.protocol}://${req.get('host')}/collect`,
          DeviceAttributes: [
            'UDID',
            'IMEI',
            'ICCID',
            'VERSION',
            'PRODUCT'
          ]
        },
        PayloadOrganization: 'Your Organization',
        PayloadDisplayName: 'Device UDID Profile',
        PayloadVersion: 1,
        PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
        PayloadIdentifier: 'com.example.profile',
        PayloadDescription: 'This profile will help retrieve your device UDID',
        PayloadType: 'Profile Service'
      }],
      PayloadDisplayName: 'Device UDID Profile',
      PayloadOrganization: 'Your Organization',
      PayloadIdentifier: 'com.example.profile',
      PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
      PayloadDescription: 'This profile will help retrieve your device UDID',
      PayloadVersion: 1,
      PayloadType: 'Configuration'
    };

    const plistXml = plist.build(profileConfig);
    
    res.set('Content-Type', 'application/x-apple-aspen-config');
    res.set('Content-Disposition', 'attachment; filename="udid.mobileconfig"');
    res.send(plistXml);
  } catch (error) {
    console.error('Error generating profile:', error);
    next(error);
  }
});

// Handle the device information submission
app.post('/collect', (req, res, next) => {
  try {
    if (!req.body) {
      throw new Error('No data received');
    }

    const data = plist.parse(req.body.toString());
    console.log('Received device data:', data); // Add logging

    const deviceInfo = data.UDID ? {
      UDID: data.UDID,
      IMEI: data.IMEI,
      ICCID: data.ICCID,
      VERSION: data.VERSION,
      PRODUCT: data.PRODUCT
    } : null;

    if (deviceInfo) {
      res.render('success', { deviceInfo });
    } else {
      res.render('error', { message: 'No device information received' });
    }
  } catch (error) {
    console.error('Error processing device information:', error);
    next(error);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : err.message 
  });
});

// Start server with error handling
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
}); 