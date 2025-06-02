const express = require('express');
const bodyParser = require('body-parser');
const plist = require('plist');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.raw({ type: 'application/x-apple-aspen-config' }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Home page route
app.get('/', (req, res) => {
  res.render('index');
});

// Generate and serve the mobile config profile
app.get('/profile', (req, res) => {
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
});

// Handle the device information submission
app.post('/collect', (req, res) => {
  try {
    const data = plist.parse(req.body.toString());
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
    res.render('error', { message: 'Error processing device information' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 