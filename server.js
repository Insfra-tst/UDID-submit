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
        PayloadType: 'com.apple.mgmt.External',
        PayloadVersion: 1,
        PayloadIdentifier: 'com.udid.profile.credentials',
        PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
        PayloadDisplayName: 'Device Information',
        PayloadDescription: 'This profile will help retrieve your device information',
        PayloadOrganization: 'UDID Collector',
        Challenge: '',
        URL: `${baseUrl}/collect`
      }],
      PayloadDisplayName: 'Device UDID Profile',
      PayloadDescription: 'This profile will help retrieve your device UDID',
      PayloadIdentifier: 'com.udid.profile',
      PayloadOrganization: 'UDID Collector',
      PayloadRemovalDisallowed: false,
      PayloadType: 'Configuration',
      PayloadUUID: 'BF620D67-2340-4CED-A0F6-50B3945E2314',
      PayloadVersion: 1
    };

    console.log('Generated profile config:', profileConfig);

    const plistXml = plist.build(profileConfig);
    console.log('Generated plist XML:', plistXml);
    
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
    console.log('Raw body length:', req.body ? req.body.length : 0);

    if (!req.body) {
      console.error('No request body received');
      throw new Error('No data received');
    }

    let data;
    try {
      // Handle different body formats
      if (Buffer.isBuffer(req.body)) {
        console.log('Body is Buffer');
        data = plist.parse(req.body.toString('utf8'));
      } else if (typeof req.body === 'string') {
        console.log('Body is String');
        data = plist.parse(req.body);
      } else if (typeof req.body === 'object') {
        console.log('Body is Object');
        data = req.body;
      } else {
        throw new Error('Unsupported body format');
      }
      
      console.log('Parsed data:', data);
    } catch (parseError) {
      console.error('Error parsing data:', parseError);
      throw new Error('Failed to parse device information');
    }

    // Extract UDID from different possible locations in the response
    const deviceInfo = {
      UDID: data.UDID || data.device_id || data.deviceId || data.udid || 'Not provided',
      IMEI: data.IMEI || data.imei || 'Not provided',
      ICCID: data.ICCID || data.iccid || 'Not provided',
      VERSION: data.VERSION || data.version || data.ProductVersion || 'Not provided',
      PRODUCT: data.PRODUCT || data.product || data.ProductName || 'Not provided'
    };

    console.log('Final device info:', deviceInfo);

    if (deviceInfo.UDID === 'Not provided') {
      console.log('Full response data for debugging:', JSON.stringify(data, null, 2));
    }

    res.format({
      'application/xml': () => {
        res.render('success', { deviceInfo });
      },
      'application/x-apple-aspen-config': () => {
        res.render('success', { deviceInfo });
      },
      'default': () => {
        res.render('success', { deviceInfo });
      }
    });
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