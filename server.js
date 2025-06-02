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
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${req.get('host')}`
      : `${req.protocol}://${req.get('host')}`;

    console.log('Base URL for profile:', baseUrl);
    
    const profileConfig = {
      PayloadContent: [{
        PayloadContent: {
          URL: `${baseUrl}/collect`,
          DeviceAttributes: [
            'UDID',
            'IMEI',
            'ICCID',
            'VERSION',
            'PRODUCT'
          ]
        },
        PayloadOrganization: 'UDID Collector',
        PayloadDisplayName: 'Device UDID Profile',
        PayloadVersion: 1,
        PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
        PayloadIdentifier: 'com.udid.profile',
        PayloadDescription: 'This profile will help retrieve your device UDID',
        PayloadType: 'Profile Service',
        PayloadRemovalDisallowed: false
      }],
      PayloadDisplayName: 'Device UDID Profile',
      PayloadOrganization: 'UDID Collector',
      PayloadIdentifier: 'com.udid.profile',
      PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
      PayloadDescription: 'This profile will help retrieve your device UDID',
      PayloadVersion: 1,
      PayloadType: 'Configuration',
      PayloadRemovalDisallowed: false
    };

    console.log('Generated profile config:', profileConfig);

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
    console.log('Headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body type:', typeof req.body);
    console.log('Raw body:', req.body);

    if (!req.body) {
      console.error('No request body received');
      throw new Error('No data received');
    }

    let data;
    try {
      // If body is a Buffer, convert to string
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body.toString();
      console.log('Body string:', bodyString);
      data = plist.parse(bodyString);
      console.log('Parsed plist data:', data);
    } catch (parseError) {
      console.error('Error parsing plist:', parseError);
      throw new Error('Failed to parse device information');
    }

    if (!data || !data.UDID) {
      console.error('No UDID in parsed data:', data);
      throw new Error('No UDID found in device information');
    }

    const deviceInfo = {
      UDID: data.UDID || 'Not provided',
      IMEI: data.IMEI || 'Not provided',
      ICCID: data.ICCID || 'Not provided',
      VERSION: data.VERSION || 'Not provided',
      PRODUCT: data.PRODUCT || 'Not provided'
    };

    console.log('Final device info:', deviceInfo);
    res.render('success', { deviceInfo });
  } catch (error) {
    console.error('Error in /collect endpoint:', error);
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