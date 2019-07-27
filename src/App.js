import React, { Component } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Axios from 'axios';
import './App.css';

class App extends Component {
  state = {
    baseCurrency: 'AED',
    csvFile: {},
    downloadFile: false,
    data: {},
    label: 'Browse Files'
  };

  currencyList = [
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
  ];

  onChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  onSubmit = async () => {
    try {
      const { baseCurrency, csvFile } = this.state;

      if (csvFile.name) {
        const fileType = csvFile.name.split('.')[1].toLowerCase();
        if (fileType !== 'csv') {
          toast(`Please select correct file type`);
          return;
        }
      } else {
        toast(`Please select a file`);
        return;
      }

      const formD = new FormData();

      formD.append('csvFile', csvFile);
      formD.append('baseCurrency', baseCurrency);

      const res = await Axios({
        method: 'POST',
        url: '/upload-csv',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        data: formD
      });

      const { data } = res.data;

      this.setState({ data, downloadFile: true });
      toast(`Your file is ready for download`);
    } catch (error) {
      const { data = 'Something went wrong' } = error.response;
      console.log(data.error);
      toast(data.error);
    }
  };

  downloadFile = () => {
    const { data } = this.state;

    var csv = 'Nonprofit,Total amount,Total Fee,Number of Donations\n';

    data.forEach(row => {
      row = `${row['Nonprofit']},${row['Total amount']},${row['Total Fee']},${
        row['Number of Donations']
      }`;
      csv += row;
      csv += '\n';
    });

    this.setState({ downloadFile: false });

    // console.log(csv);
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    hiddenElement.target = '_blank';
    hiddenElement.download = `result ${JSON.stringify(new Date()).slice(
      1,
      11
    )}.csv`;
    hiddenElement.click();
  };

  render() {
    const { downloadFile, label } = this.state;

    return (
      <>
        <ToastContainer autoClose={4000} />
        <div className="bgLayer" />
        <div className="main">
          <header>CSV Disbursement Report</header>
          <div className="form-field">
            <p>Base Currency</p>
            <select name="baseCurrency" onClick={this.onChange}>
              {this.currencyList.map((val, i) => {
                return (
                  <option value={val} key={val}>
                    {val}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-field">
            <p>Upload CSV</p>
            <label htmlFor="csvFile">{label}</label>
            <input
              type="file"
              name="csvFile"
              id="csvFile"
              onChange={e => {
                this.setState({
                  csvFile: e.target.files[0],
                  label: e.target.files[0].name
                });
              }}
            />
          </div>

          <button className="btn" onClick={this.onSubmit}>
            Submit
          </button>

          {downloadFile && (
            <button className="btn" onClick={this.downloadFile}>
              Download File
            </button>
          )}
        </div>
      </>
    );
  }
}

export default App;
