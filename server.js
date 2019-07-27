import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import multer from 'multer';
import csv from 'csvtojson';
import Axios from 'axios';

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}`);
  }
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'build')));

// CORS Middleware
app.use((req, res, next) => {
  // Enabling CORS
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization'
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).send({
        statusCode: 400,
        error: 'File missing'
      });
    }
    const { path, mimetype } = req.file;
    const { baseCurrency } = req.body;

    if (mimetype !== 'text/csv') {
      res.status(400).send({
        statusCode: 400,
        error: 'File format not supported'
      });
    }

    const currencyList = [
      'AED',
      'AUD',
      'CAD',
      'DKK',
      'EUR',
      'GBP',
      'HKD',
      'INR',
      'JPY',
      'MYR',
      'NOK',
      'QAR',
      'SGD',
      'USD'
    ].join(',');

    const exchangeData = await Axios({
      method: 'GET',
      url: `https://openexchangerates.org/api/latest.json`,
      headers: {
        Authorization: 'Token 8241684c10ba41069a6fe1a0a717bc86'
      },
      params: {
        symbols: currencyList
      }
    });

    const { rates } = exchangeData.data;

    const jsonObj = await csv().fromFile(path);

    let newData = {};

    const parsedObj = jsonObj.map((val, i) => {
      if (val['Donation Amount'] !== '') {
        const amt = val['Donation Amount'];
        const currency = val['Donation Currency'];
        let nonProfit = val['Nonprofit'];
        const oldFee = val['Fee'];

        let newDonation = 0;

        if (currency !== baseCurrency) {
          const baseRate = rates[baseCurrency];
          const currentRate = rates[currency];

          newDonation =
            parseInt(
              amt
                .split('.')[0]
                .split(',')
                .join('')
            ) *
            (currentRate / baseRate);
        }

        let tmp1 = newData[`${nonProfit}`] || undefined;

        if (tmp1) {
          const donation = tmp1['Total amount'];
          const fee = tmp1['Total Fee'];
          const count = tmp1['Number of Donations'];

          const newobj = {
            'Total amount': donation + newDonation,
            'Total Fee': fee + parseFloat(oldFee),
            'Number of Donations': count + 1,
            Nonprofit: nonProfit
          };

          newData = { ...newData, [nonProfit]: newobj };
        } else {
          const newobj = {
            'Total amount': newDonation,
            'Total Fee': parseFloat(oldFee),
            'Number of Donations': 1,
            Nonprofit: nonProfit
          };

          newData = { ...newData, [nonProfit]: newobj };
        }
      }
    });

    newData = Object.values(newData);
    res.status(200).send({
      statusCode: 200,
      message: 'Success',
      data: newData
    });
  } catch (error) {
    console.log(error || error.response);
    res.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error'
    });
    res.end();
  }
};

app.post('/upload-csv', upload.single('csvFile'), uploadCsv);

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = 8080;

app.listen(port, () => {
  console.log('Server is running at ' + port);
});
