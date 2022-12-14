/*
> Description:
This is the main JS file which interacts with the bluetooth device classes and UI.
Vanilla JS was preferred but some bootstrap methods are easier to implement with JQuery.
> Web bluetooth documentation:
https://web.dev/bluetooth/
> Code example:
https://googlechrome.github.io/samples/web-bluetooth/read-characteristic-value-changed.html
> Other references:
Charts JS documentation: https://www.chartjs.org/docs/3.3.0/
Bootstrap documentation: https://getbootstrap.com/docs/5.0/getting-started/introduction/
Improving performance of charts: https://www.chartjs.org/docs/latest/general/performance.html
Data decimation (IMU): https://www.chartjs.org/docs/latest/configuration/decimation.html#decimation-algorithms
*/

/* UI HOOKS*/
// general
let toastDisconnection = document.getElementById('toastDisconnection');
let toastTitle = document.getElementById('toastTitle');
let toastMessage = document.getElementById('toastMessage');
// HR
let titleTextHR = document.getElementById('titleTextHR');
let statusTextHR = document.getElementById("statusTextHR");
let containerHR = document.getElementById("containerHR");
let zonesHR = document.getElementById("zonesHR");
// treadmill
let collapseTreadmill = document.getElementById('collapseTreadmill');
let selectedTreadmill = document.getElementById('selectedTreadmill');
let titleTextTreadmill = document.getElementById('titleTextTreadmill');
let statusTextTreadmill = document.getElementById("statusTextTreadmill");
let containerTreadmill = document.getElementById("containerTreadmill");
let speedTextTreadmill = document.getElementById('speedTextTreadmill');
let inclinationTextTreadmill = document.getElementById('inclinationTextTreadmill');
let selectionClickableFitnessMachine = document.getElementById('selectionClickableFitnessMachine');
// concept2 pm5
let selectedConcept2pm = document.getElementById('selectedConcept2pm');
let titleTextConcept2pm = document.getElementById('titleTextConcept2pm');
let statusTextConcept2pm = document.getElementById("statusTextConcept2pm");
let containerConcept2pm = document.getElementById("containerConcept2pm");
// imu
let titleTextIMU = document.getElementById('titleTextIMU');
let statusTextIMU = document.getElementById("statusTextIMU");
let containerIMU = document.getElementById("containerIMU");
let switchHR = document.getElementById("switchHR");
let switchSDK = document.getElementById("switchSDK");
// ble chars
let titleTextBle = document.getElementById('titleTextBle');
let statusTextBle = document.getElementById("statusTextBle");
// recording
let titleTextRecord = document.getElementById('titleTextRecord');
let statusTextRecord = document.getElementById('statusTextRecord');
let stopRecordingButton = document.getElementById('stopRecordingButton');
let settingsModal = document.getElementById('settingsModal');
let settingsDevices = document.getElementById('settingsDevices');
let saveSettingsButton = document.getElementById('saveSettingsButton');
let fileNameInput = document.getElementById('fileNameInput');
let durationInput = document.getElementById('durationInput')
let settingsButton = document.getElementById('settingsButton');

/* GLOBAL VARIABLES*/

// HR
let heartRateMeasurements = {};
// treadmill
let treadmillMeasurements = {};
// concept2 pm5
let concept2pmMeasurements = {};
// imu
let imuMeasurements = {};
let selectedIMUTabId;
// recording data
let fileName = null;
let duration = null;
let isRecording = false;
let recordingStartTime = null;
let recordingDuration = null;
let recordingDevicesNames = [];
let recordingDevicesObj = {};
// charts
let interval = 500; //miliseconds between updates of Charts and recording UI
let chartMaxTime = 1 * 60 * 1000 //range of charts x axis, in miliseconds
let nIntervId;
let currentImuActiveTab;
let currentConcept2pmActiveTab;
let currentTreadmillActiveTab;
// devices
let heartRateDevice = new HeartRateDevice();
let treadmillDevice = new TreadmillDevice();
let concept2pmDevice = new Concept2pmDevice();
let imuDevice = new ImuDevice();
let bleDevice = new BleDevice();

/* INITIAL UI SETTINGS*/

// HR
statusTextHR.textContent = "No HR sensor connected";
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
containerHR.style.display = "none";
// treadmill
statusTextTreadmill.textContent = "No treadmill connected";
titleTextTreadmill.textContent = "Scan for Bluetooth treadmill";
containerTreadmill.style.display = "none";
speedTextTreadmill.textContent = '0.0';
inclinationTextTreadmill.textContent = '0.0';
// concept2 pm5
statusTextConcept2pm.textContent = "No Concept2 PM connected";
titleTextConcept2pm.textContent = "Scan for Bluetooth Concept2 PM";
containerConcept2pm.style.display = "none";
// imu
statusTextIMU.textContent = "No IMU sensor connected";
titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
containerIMU.style.display = "none";
// ble chars
statusTextBle.textContent = "No BLE device connected";
titleTextBle.textContent = "Scan for Bluetooth devices";
// recording
statusTextRecord.textContent = "Not recording";
titleTextRecord.textContent = "Record and save data to .json file";

/* LISTENERS*/

// general
document.getElementById('resetChartsButton').addEventListener('click', function () {
  resetAllCharts();
});
// HR
document.getElementById('connectButtonHR').addEventListener('click', function () {
  heartRateDevice.connect()
    .catch(error => {
      statusTextHR.textContent = error.message;
      console.log(error);
    })
});
document.getElementById('disconnectButtonHR').addEventListener('click', function () {
  heartRateDevice.disconnect();
});
// treadmill
document.getElementById('connectButtonTreadmill').addEventListener('click', function () {
  treadmillDevice.connect()
    .catch(error => {
      statusTextTreadmill.textContent = error.message;
      console.log(error);
    })
});
document.getElementById('disconnectButtonTreadmill').addEventListener('click', function () {
  treadmillDevice.disconnect();
});
document.getElementById('startTreadmillButton').addEventListener('click', function () {
  treadmillDevice.changeTreadmillStatus('start')
    .catch(error => { console.log(error); });
});
document.getElementById('stopTreadmillButton').addEventListener('click', function () {
  treadmillDevice.changeTreadmillStatus('stop')
    .catch(error => { console.log(error); });
});
document.getElementById('speedUpButton').addEventListener('click', function () {
  currSpeed = treadmillMeasurements.FTMS.at(-1).speed;
  treadmillDevice.increaseSpeedStep(currSpeed, 0.1)
    .catch(error => { console.log(error); });
});
document.getElementById('speedDownButton').addEventListener('click', function () {
  currSpeed = treadmillMeasurements.FTMS.at(-1).speed;
  treadmillDevice.decreaseSpeedStep(currSpeed, 0.1)
    .catch(error => { console.log(error); });
});
document.getElementById('speedUp2Button').addEventListener('click', function () {
  currSpeed = treadmillMeasurements.FTMS.at(-1).speed;
  treadmillDevice.increaseSpeedStep(currSpeed, 1.0)
    .catch(error => { console.log(error); });
});
document.getElementById('speedDown2Button').addEventListener('click', function () {
  currSpeed = treadmillMeasurements.FTMS.at(-1).speed;
  treadmillDevice.decreaseSpeedStep(currSpeed, 1.0)
    .catch(error => { console.log(error); });
});
document.getElementById('inclinationUpButton').addEventListener('click', function () {
  currInclination = treadmillMeasurements.FTMS.at(-1).inclination;
  treadmillDevice.increaseInclinationStep(currInclination, 0.5)
    .catch(error => { console.log(error); });
});
document.getElementById('inclinationDownButton').addEventListener('click', function () {
  currInclination = treadmillMeasurements.FTMS.at(-1).inclination;
  treadmillDevice.decreaseInclinationStep(currInclination, 0.5)
    .catch(error => { console.log(error); });
});
document.getElementById('inclinationUp2Button').addEventListener('click', function () {
  currInclination = treadmillMeasurements.FTMS.at(-1).inclination;
  treadmillDevice.increaseInclinationStep(currInclination, 1.0)
    .catch(error => { console.log(error); });
});
document.getElementById('inclinationDown2Button').addEventListener('click', function () {
  currInclination = treadmillMeasurements.FTMS.at(-1).inclination;
  treadmillDevice.decreaseInclinationStep(currInclination, 1.0)
    .catch(error => { console.log(error); });
});
document.getElementById('headingTreadmill').addEventListener('click', function (event) {
  $('#collapseTreadmill').collapse('toggle');
});
selectionClickableFitnessMachine.addEventListener('click', function (e) {
  // prevent the fitness machine select to toggle the container state
  e.stopPropagation();
  $('.selectionClickableFitnessMachine').trigger('change');
});
selectionClickableFitnessMachine.addEventListener('change', function () {
  if (this.value == 0) {
    showTreadmillCanva();
  } else if (this.value == 1) { showConcept2pmCanva(); }
});
document.getElementById('pills-tab-treadmill').addEventListener('shown.bs.tab', function (e) {
  //update only the chart being shown to improve performance
  let tabId = e.target.id.slice(5, 11);
  if (tabId == 'chart') {
    try { chartTreadmill.update(); } catch (e) { }
    currentTreadmillActiveTab = 'tabId';
  } else { currentTreadmillActiveTab = 'default'; }
});
// concept2 pm5
document.getElementById('connectButtonConcept2pm').addEventListener('click', function () {
  concept2pmDevice.connect()
    .catch(error => {
      statusTextConcept2pm.textContent = error.message;
      console.log(error);
    })
});
document.getElementById('disconnectButtonConcept2pm').addEventListener('click', function () {
  concept2pmDevice.disconnect();
});
document.getElementById('startConcept2pmButton').addEventListener('click', function () {
  let setDistance = document.getElementById('selectionClickableDistance').value;
  concept2pmDevice.startWorkoutConcept2pm(setDistance);
});
document.getElementById('stopConcept2pmButton').addEventListener('click', function () {
  concept2pmDevice.resetConcept2pm();
});
document.getElementById('pills-tab-concept2pm').addEventListener('shown.bs.tab', function (e) {
  //update only the chart being shown to improve performance
  let tabId = e.target.id.slice(6, 11);
  if (tabId == 'chart') {
    try { chartConcept2pm.update(); } catch (e) { }
    currentConcept2pmActiveTab = 'tabId';
  } else { currentConcept2pmActiveTab = 'default'; }
});
// imu
document.getElementById('connectButtonIMU').addEventListener('click', function () {
  imuDevice.connect()
    .catch(error => {
      statusTextIMU.textContent = error.message;
      console.log(error);
    })
});
document.getElementById('disconnectButtonIMU').addEventListener('click', function () {
  imuDevice.disconnect();
});
let checkboxes = ['checkboxAcc', 'checkboxGyr', 'checkboxMag', 'checkboxPPG'];
checkboxes.forEach(function (myCheckbox) {
  // get the measurement settings when the measurement checkbox is selected
  let meas = myCheckbox.slice(8);
  document.getElementById(myCheckbox).addEventListener('click', function () {
    if (this.checked) { imuDevice.sendCommand(meas, 'get_measurement_settings', null); }
  });
});
switchSDK.addEventListener('change', function () {
  // model SDK state: can only be changed when no data is streaming
  if (switchSDK.checked) {
    imuDevice.sendCommand('SDK', 'start_measurement', null);
  } else { imuDevice.sendCommand('SDK', 'stop_measurement', null); }
  checkboxes.forEach(function (myCheckbox) {
    document.getElementById(myCheckbox).checked = false;
    $('#container' + myCheckbox.slice(8) + 'Settings').collapse("hide");
  });
});
let switches = ['switchAcc', 'switchGyr', 'switchMag', 'switchPPG'];
switches.forEach(function (mySwitch) {
  let meas = mySwitch.slice(6);
  document.getElementById(mySwitch).addEventListener('change', function () {
    if (this.checked) {
      // get the selected settings for the measurement and start streaming
      let requestedSettings = [], settingsSelects = [];
      settingsSelects = [meas + 'sample_rate', meas + 'resolution', meas + 'range', meas + 'channels'];
      settingsSelects.forEach(function (select) {
        requestedSettings.push(document.getElementById(select).value);
      });
      imuDevice.sendCommand(meas, 'start_measurement', requestedSettings);
      document.getElementById('checkbox' + meas).checked = true;
      document.getElementById('checkbox' + meas).disabled = true;
    } else {
      imuDevice.sendCommand(meas, 'stop_measurement', null);
      document.getElementById('checkbox' + meas).disabled = false;
    }
  });
});
switchHR.addEventListener('change', function () {
  // HR measurement does not interfere with SDK
  if (switchHR.checked) {
    imuDevice.findHeartRateCharacteristic();
    document.getElementById('checkboxHR').checked = true;
    document.getElementById('checkboxHR').disabled = true;
  } else {
    imuDevice.stopHeartRateCharacteristic();
    document.getElementById('checkboxHR').disabled = false;
  }
});
document.getElementById('selectionClickableImuAccChart').addEventListener('change', function () {
  switchRawAndCombined('Acc', parseInt(this.value));
});
document.getElementById('selectionClickableImuGyrChart').addEventListener('change', function () {
  switchRawAndCombined('Gyr', parseInt(this.value));
});
document.getElementById('pills-tab-imu').addEventListener('shown.bs.tab', function (e) {
  //update only the chart being shown to improve performance
  let measId = e.target.id.slice(-1);
  if (measId == 'A') { currentImuActiveTab = 'default' } else {
    let measType = imuDevice.measTypes[measId].value;
    currentImuActiveTab = measType;
    chartId = 'chart_' + measType;
    try { window[chartId].update(); } catch (e) { }
  }
});
// ble chars
document.getElementById('connectButtonBle').addEventListener('click', function () {
  let uuid = uuidInput.value;
  bleDevice.connect(uuid)
    .catch(error => {
      statusTextBle.textContent = error.message;
      console.log(error);
    })
});
document.getElementById('disconnectButtonBle').addEventListener('click', function () {
  bleDevice.disconnect();
});
// recording
stopRecordingButton.addEventListener('click', function () {
  stopRecording();
});
settingsModal.addEventListener('show.bs.modal', event => {
  updateSettingsModalContent();
})
saveSettingsButton.addEventListener('click', function () {
  saveSettingsAndRecord();
  $('#settingsModal').modal('hide');
});

/* SET UP CHARTS*/

function drawChartHR() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Heart rate (bpm)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: false,
      normalized: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          suggestedMax: 100,
          suggestedMin: 50,
          ticks: {
            callback: function (val) {
              return val.toFixed(0);
            },
            stepSize: 5
          },
          display: true,
          position: 'left',
          title: {
            text: 'Heart rate (bpm)',
            display: true,
          }
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Heart rate sensor', padding: {
            top: 5,
            bottom: 5
          }
        },
        legend: {
          position: 'bottom',
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  chartHR = new Chart(
    document.getElementById('canvasHR'),
    config
  );
}
function drawChartTreadmill() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Speed (km/h)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: 'Inclination (%)',
        backgroundColor: 'rgb(122, 99, 255)',
        borderColor: 'rgba(102, 99, 255, 0.2)',
        data: [],
        yAxisID: 'y2',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: false,
      normalized: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          ticks: {
            callback: function (val) {
              return val.toFixed(1);
            },
          },
          display: true,
          position: 'left',
          title: {
            text: 'Speed (km/h)',
            display: true,
          }
        },
        y2: {
          type: 'linear',
          ticks: {
            callback: function (val, index) {
              return val.toFixed(1);
            },
          },
          display: true,
          position: 'right',
          title: {
            text: 'Inclination (%)',
            display: true,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        title: {
          display: true,
          text: 'Treadmill', padding: {
            top: 5,
            bottom: 5
          }
        },
        legend: {
          position: 'bottom',
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  chartTreadmill = new Chart(
    document.getElementById('canvasTreadmill'),
    config
  );
}
function drawChartConcept2pm() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Stroke rate (spm)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: 'Pace (mm:ss/500m)',
        backgroundColor: 'rgb(122, 99, 255)',
        borderColor: 'rgba(102, 99, 255, 0.2)',
        data: [],
        yAxisID: 'y2',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: false,
      normalized: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            text: 'Stroke rate (spm)',
            display: true,
          }
        },
        y2: {
          type: 'linear',
          ticks: {
            callback: function (val, index) {
              return index % 2 === 0 ? new Date(val * 1000).toISOString().slice(14, 19) : '';
            },
          },
          display: true,
          position: 'right',
          title: {
            text: 'Pace (mm:ss/500m)',
            display: true,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        title: {
          display: true,
          text: 'Concept2 PM', padding: {
            top: 5,
            bottom: 5
          }
        },
        legend: {
          position: 'bottom',
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  chartConcept2pm = new Chart(
    document.getElementById('canvasConcept2pm'),
    config
  );
}
function drawChartIMU(measType, measId, numOfChannels, hasCombined) {
  const labels = [];
  const data = {
    labels: labels,
    datasets: []
  };
  const lineColors = {
    0: { backgroundColor: 'rgb(255, 99, 132)', borderColor: 'rgba(255, 99, 132, 0.2)' },
    1: { backgroundColor: 'rgb(122, 99, 255)', borderColor: 'rgba(102, 99, 255, 0.2)' },
    2: { backgroundColor: 'rgb(70, 233, 100)', borderColor: 'rgba(70, 233, 100, 0.2)' },
    3: { backgroundColor: 'rgb(255, 153, 51)', borderColor: 'rgba(255, 153, 51, 0.2)' },
  };
  const yMinMax = {
    HR: { min: 0, max: 220 },
    PPG: { min: -40000, max: 40000 },
    Acc: { min: -40, max: 40 },
    Gyr: { min: -2000, max: 2000 },
    Mag: { min: -50, max: 50 },
  };
  for (let i = 0; i < numOfChannels; i++) {
    data.datasets[i] = {
      label: measType + "_channel_" + i,
      backgroundColor: lineColors[i].backgroundColor,
      borderColor: lineColors[i].borderColor,
      data: [],
      yAxisID: 'y1',
      hidden: false,
    };
  }
  if (hasCombined) {
    data.datasets[data.datasets.length] = {
      label: measType + "_combined",
      backgroundColor: lineColors[0].backgroundColor,
      borderColor: lineColors[0].borderColor,
      data: [],
      yAxisID: 'y1',
      hidden: true,
    };
  }
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: false,
      normalized: true,
      events: [],
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          ticks: {
            callback: function (val) {
              return val.toFixed(1);
            },
          },
          display: true,
          position: 'left',
          min: yMinMax[measType].min,
          max: yMinMax[measType].max,
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        title: {
          display: true,
          text: 'IMU sensor', padding: {
            top: 5,
            bottom: 5
          }
        },
        legend: {
          position: 'bottom',
        },
        decimation: {
          enabled: true,
          algorithm: 'lttb',
          threshold: 1000,
        }
      },
      elements: {
        point: {
          radius: 2,
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  let chartId = "chartIMU_" + measType;
  let targetCtx = 'canvasIMU_' + measId;
  window[chartId] = new Chart(
    document.getElementById(targetCtx),
    config
  );
}
function resetAllCharts() {
  if (!isDeviceConnected()) {
    alert("No devices connected!");
    return;
  }
  try {
    removeAllData(chartHR);
    chartHR.reset();
  } catch (e) { };
  try {
    removeAllData(chartTreadmill);
    chartTreadmill.reset();
  } catch (e) { };
  try {
    removeAllData(chartConcept2pm);
    chartConcept2pm.reset();
  } catch (e) { };
  try {
    imuDevice.imuStreamList.forEach((measType) => {
      try {
        removeAllData(window["chartIMU_" + measType]);
        window["chartIMU_" + measType].reset();
      } catch (e) { };
    });
  } catch (e) { };
}

/* LOOP UPDATE UI INFO AND CHARTS*/

function startLoopUpdate() {
  if (!nIntervId) {
    nIntervId = setInterval(updateChartAndRecording, interval);
  }
}
function stopLoopUpdate() {
  clearInterval(nIntervId);
  nIntervId = null;
}
function updateChartAndRecording() {
  // part 0: stop loop if no device is connected
  if (!isDeviceConnected()) {
    stopLoopUpdate();
    return;
  }
  // part 1: update the recording UI
  if (isRecording) {
    prettyDuration = new Date(duration).toISOString().slice(11, 19);
    recordingDuration = Date.now() - recordingStartTime;
    prettyRecordingDuration = new Date(recordingDuration).toISOString().slice(11, 19);
    timeRemaining = duration - recordingDuration + 1000;
    prettyTimeRemaining = new Date(timeRemaining).toISOString().slice(11, 19);
    statusTextRecord.innerHTML = `Now recording:<br />${recordingDevicesNames.join(' <br /> ')}<br />Auto stop: ${prettyDuration}<br />Current duration: ${prettyRecordingDuration}<br />Time remaining: ${prettyTimeRemaining}`
    // automatic stop recording to preset autostop
    if (recordingDuration >= duration) {
      saveToFile();
      isRecording = false;
      statusTextRecord.textContent = "Not recording";
      titleTextRecord.textContent = "Record and save data to .json file";
      settingsButton.disabled = false;
      fileName = null;
      duration = null;
      recordingStartTime = null;
      setTimeout(resetAllCharts(), 1000);
    }
  }
  // part 2: update the charts
  if (heartRateDevice.device !== null) { try { chartHR.update(); } catch (e) { }; }
  // update only active tab to improve performance
  if (treadmillDevice.device !== null && currentTreadmillActiveTab !== 'default') {
    try { chartTreadmill.update(); } catch (e) { };
  }
  if (concept2pmDevice.device !== null && currentConcept2pmActiveTab !== 'default') {
    try { chartConcept2pm.update(); } catch (e) { };
  }
  if (imuDevice.device !== null && imuDevice.imuStreamList.length !== 0 && currentImuActiveTab !== 'default') {
    try { window["chartIMU_" + currentImuActiveTab].update(); } catch (e) { };
  }
}
function addData(chart, label, data) {
  // adds data to chart without updating it
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset, index) => { dataset.data.push(data[index]); });
  // display only data within the time range defined by chartMaxTime
  let minLabel = chart.data.labels.at(-1).getTime() - chartMaxTime;
  let counter = 0
  chart.data.labels.forEach((label) => {
    if (label < minLabel) {
      counter++;
    }
  });
  chart.data.labels.splice(0, counter);
  chart.data.datasets.forEach((dataset, index) => { dataset.data.splice(0, counter); });
  // reduce radius size when too many points are displayed
  if (chart.data.labels.length > 500) {
    chart.options.elements.point.radius = 0.5;
  }
}
function removeAllData(chart) {
  chart.data.labels = [];
  chart.data.datasets.forEach((dataset) => { dataset.data = []; });
  chart.update();
}
// show toast
function showToast(message, title) {
  toastMessage.textContent = message;
  toastTitle.textContent = title;
  var toast = new bootstrap.Toast(toastDisconnection);
  toast.show();
}

// HR
function updateDisconnectedHR(reason) {
  statusTextHR.textContent = "No HR sensor connected";
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  containerHR.style.display = "none";
  heartRateDevice = new HeartRateDevice();
  try{chartHR.destroy();}catch(e){}
  $('#connectButtonHR').removeClass('disabled');
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to HR sensor failed. Try again.", "Heart rate sensor");
      break;
    case 'lost_connection':
      showToast("Connection to HR sensor lost. Try again.", "Heart rate sensor");
      break;
    case 'disconnected':
      showToast("Disconnected from HR sensor.", "Heart rate sensor");
      break;
    default:
      return;
  }
}
function updateConnectedHR() {
  resetMeasurements(true, false, false, false);
  titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
  containerHR.style.display = "block";
  drawChartHR();
  $('#connectButtonHR').addClass('disabled');
}
function updateDataHR(measurementType, heartRateMeasurement) {
  statusTextHR.innerHTML = `> Heart rate: ${heartRateMeasurement.heartRate}bpm`;
  if (heartRateMeasurements[measurementType] == undefined) {
    heartRateMeasurements[measurementType] = [];
  }
  heartRateMeasurements[measurementType].push(heartRateMeasurement);
  let plotNewHR = heartRateMeasurement.heartRate;
  let plotNewData = [plotNewHR];
  let index = new Date(heartRateMeasurement.time);
  addData(chartHR, index, plotNewData);
}
// fitness machines
function showTreadmillCanva() {
  selectedConcept2pm.style.display = "none";
  selectedTreadmill.style.display = "block";
}
function showConcept2pmCanva() {
  selectedTreadmill.style.display = "none";
  selectedConcept2pm.style.display = "block";
}
// treadmill
function updateDisconnectedTreadmill(reason) {
  statusTextTreadmill.textContent = "No treadmill connected";
  titleTextTreadmill.textContent = "Scan for Bluetooth treadmill";
  containerTreadmill.style.display = "none";
  treadmillDevice = new TreadmillDevice();
  try{chartTreadmill.destroy();}catch(e){}
  $('#connectButtonTreadmill').removeClass('disabled');
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to Treadmill failed. Try again.", "Treadmill device");
      break;
    case 'lost_connection':
      showToast("Connection to Treadmill lost. Try again.", "Treadmill device");
      break;
    case 'disconnected':
      showToast("Disconnected from Treadmill.", "Treadmill device");
      break;
    default:
      return;
  }
}
function updateConnectedTredmill() {
  resetMeasurements(false, true, false, false);
  titleTextTreadmill.textContent = "Connected to: " + treadmillDevice.getDeviceName();
  containerTreadmill.style.display = "block";
  drawChartTreadmill();
  $('#connectButtonTreadmill').addClass('disabled');
}
function updateDataTreadmill(measurementType, treadmillMeasurement) {
  statusTextTreadmill.innerHTML = /*'&#x1F3C3;'*/ `> Speed: ${(treadmillMeasurement.speed < 10 ? '&nbsp;' : '')}${treadmillMeasurement.speed} km/h<br />> Inclination: ${(treadmillMeasurement.inclination < 0 ? '' : '&nbsp;')}${treadmillMeasurement.inclination} %`;
  speedTextTreadmill.textContent = treadmillMeasurement.speed;
  inclinationTextTreadmill.textContent = treadmillMeasurement.inclination;
  if (treadmillMeasurements[measurementType] == undefined) {
    treadmillMeasurements[measurementType] = [];
  }
  treadmillMeasurements[measurementType].push(treadmillMeasurement);  
  let plotNewSpeed = parseFloat(treadmillMeasurement.speed);
  let plotNewInclination = parseFloat(treadmillMeasurement.inclination);
  let plotNewData = [plotNewSpeed, plotNewInclination];
  let index = new Date(treadmillMeasurement.time);
  addData(chartTreadmill, index, plotNewData);
}
// concept2 pm5
function updateDisconnectedConcept2pm(reason) {
  statusTextConcept2pm.textContent = "No Concept2 PM connected";
  titleTextConcept2pm.textContent = "Scan for Bluetooth Concept2 PM";
  containerConcept2pm.style.display = "none";
  concept2pmDevice = new Concept2pmDevice();
  try{chartConcept2pm.destroy();}catch(e){}
  $('#connectButtonConcept2pm').removeClass('disabled');
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to Concept2 PM failed. Try again.", "Concept2 PM device");
      break;
    case 'lost_connection':
      showToast("Connection to Concept2 PM lost. Try again.", "Concept2 PM device");
      break;
    case 'disconnected':
      showToast("Disconnected from Concept2 PM.", "Concept2 PM device");
      break;
    default:
      return;
  }
}
function updateConnectedConcept2pm() {
  resetMeasurements(false, false, true, false);
  titleTextConcept2pm.textContent = "Connected to: " + concept2pmDevice.getDeviceName();
  containerConcept2pm.style.display = "block";
  drawChartConcept2pm();
  $('#connectButtonConcept2pm').addClass('disabled');
}
function updateDataConcept2pm(measurementType, concept2pmMeasurement) {
  // add measurement
  if (concept2pmMeasurements[measurementType] == undefined) {
    concept2pmMeasurements[measurementType] = [];
  }
  concept2pmMeasurements[measurementType].push(concept2pmMeasurement);
  // update UI
  let rowingState = (concept2pmMeasurements.general_status != undefined ? concept2pmMeasurements.general_status.at(-1).rowingState : undefined);
  let printPace = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).prettyCurrentPace : undefined);
  let printSpeed = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).speed : undefined);
  let printStrokeRate = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).strokeRate : undefined);
  let printDragFactor = (concept2pmMeasurements.general_status != undefined ? concept2pmMeasurements.general_status.at(-1).dragFactor : undefined);
  // the PM5 continues to send out data from previous active state even if the state is inactive => correct chart to 0
  if (rowingState == 1) {
    if (measurementType == 'additional_status_1') {
      let plotNewStroke = concept2pmMeasurement.strokeRate;
      let plotNewPace = concept2pmMeasurement.currentPace;
      let plotNewData = [plotNewStroke, plotNewPace];
      let index = new Date(concept2pmMeasurement.time);
      addData(chartConcept2pm, index, plotNewData);
    }
    statusTextConcept2pm.innerHTML = `ROWING STATE ACTIVE<br />> Pace: ${printPace}/500m<br />> Speed: ${printSpeed}m/s<br />> Stroke rate: ${printStrokeRate}spm<br />> Drag factor: ${printDragFactor}`;
  } else {
    if (measurementType == 'additional_status_1') {
      let plotNewData = [0.0, 0.0];
      let index = new Date(concept2pmMeasurement.time);
      addData(chartConcept2pm, index, plotNewData);
    }
    statusTextConcept2pm.innerHTML = `ROWING STATE INACTIVE<br />(displaying last state)<br />> Pace: ${printPace}/500m<br />> Speed: ${printSpeed}m/s<br />> Stroke rate: ${printStrokeRate}spm<br />> Drag factor: ${printDragFactor}`;
  }
}
// ble device
function updateDisconnectedBle(reason, error) {
  statusTextBle.textContent = "No BLE device connected";
  titleTextBle.textContent = "Scan for Bluetooth devices";
  $("#uuidInput").removeAttr('disabled');
  bleDevice = new BleDevice();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to BLE device failed. Try again.", "BLE device");
      break;
    case 'lost_connection':
      showToast("Connection to BLE device lost. Try again.", "BLE device");
      break;
    case 'disconnected':
      showToast("Disconnected from BLE device.", "BLE device");
      break;
    case 'invalid_uuid':
      showToast("Disconnected from BLE device.", "BLE device");
      statusTextBle.textContent = error.message;
      break;
    default:
      return;
  }
}
function updateConnectedBle(response) {
  statusTextBle.innerHTML = response;
  titleTextBle.textContent = "Connected to: " + bleDevice.getDeviceName();
}
// imu
function updateDisconnectedIMU(reason) {
  statusTextIMU.textContent = "No IMU sensor connected";
  titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
  //destroy charts and disable pills
  $('#pills-streams-imu-tab-A').trigger('click');
  containerIMU.style.display = "none";
  imuDevice.imuStreamList.forEach((measType) => {
    try {
      let chartId = "chartIMU_" + measType;
      window[chartId].destroy();
    } catch (e) { console.log(e) }
    try {
      let tabPillName = "#pills-chart-imu-tab-" + getKeyByPropValue(imuDevice.measTypes, measType, 'value');
      $(tabPillName).attr('disabled', 'disabled');
      $(tabPillName).addClass('disabled');
    } catch (e) { console.log(e) }
  });
  // turn off all checkboxes and switches
  let turnOffList = ['Acc', 'Gyr', 'Mag', 'PPG', 'HR'];
  turnOffList.forEach((type) => {
    $('#container' + type + 'Settings').collapse("hide");
    document.getElementById('checkbox' + type).checked = false;
    document.getElementById('checkbox' + type).disabled = false;
    document.getElementById('switch' + type).checked = false;
  });
  // turn on SDK switch
  $("#switchSDK").removeAttr('disabled');
  imuDevice = new ImuDevice();
  $('#connectButtonIMU').removeClass('disabled');
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to IMU sensor failed. Try again.", "IMU sensor");
      break;
    case 'lost_connection':
      showToast("Connection to IMU sensor lost. Try again.", "IMU sensor");
      break;
    case 'disconnected':
      showToast("Disconnected from IMU sensor.", "IMU sensor");
      break;
    default:
      return;
  }
}
function updateConnectedIMU() {
  resetMeasurements(false, false, false, true);
  statusTextIMU.innerHTML = `Subscribe to a data stream to receive data.`;
  titleTextIMU.textContent = "Connected to: " + imuDevice.getDeviceName();
  containerIMU.style.display = "block";
  $('#connectButtonIMU').addClass('disabled');
}
function updateImuSettings(measType, measId) {
  // updates the select options for the stream settings
  Object.values(imuDevice.settingTypes).forEach(settingValue => {
    let dropdownId = measType + settingValue;
    [...document.getElementById(dropdownId).options].forEach(o => o.remove())
    let settingList = imuDevice.measTypes[measId][settingValue];
    Object.values(settingList).forEach(setting => {
      var option = document.createElement("option");
      option.setAttribute("value", setting);
      var optionName = document.createTextNode(setting);
      option.appendChild(optionName);
      document.getElementById(dropdownId).appendChild(option);
    });
  });
}
function updateConnectedStreamIMU(measType, measId, numOfChannels) {
  statusTextIMU.innerHTML = `Receiving data types: ${imuDevice.imuStreamList}`;
  let tabPillName = "#pills-chart-imu-tab-" + measId;
  $(tabPillName).removeAttr('disabled');
  $(tabPillName).removeClass('disabled');
  if (measType != 'HR') { $("#switchSDK").attr('disabled', 'disabled'); }
  let hasCombined;
  (measType == 'Acc' || measType == 'Gyr') ? hasCombined = true : hasCombined = false;
  drawChartIMU(measType, measId, numOfChannels, hasCombined);
}
function updateDisconnectedStreamIMU(measType, measId) {
  let tabPillName = "#pills-chart-imu-tab-" + measId;
  $(tabPillName).attr('disabled', 'disabled');
  $(tabPillName).addClass('disabled');
  let chartId = "chartIMU_" + measType;
  window[chartId].destroy();
  if (imuDevice.imuStreamList.length == 0) {
    try { $("#switchSDK").removeAttr('disabled'); } catch (e) { };
    updateConnectedIMU();
  } else {
    statusTextIMU.innerHTML = `Receiving data types: ${imuDevice.imuStreamList}`;
    if (imuDevice.imuStreamList.length == 1 && imuDevice.imuStreamList[0] == 'HR') {
      try { $("#switchSDK").removeAttr('disabled'); } catch (e) { };
    } else {
      $("#switchSDK").attr('disabled', 'disabled');
    }
  }
}
function updateDataIMU(imuMeasurementArray) {
  let measType = imuMeasurementArray[0].measurementType;
  if (imuMeasurements[measType] == undefined) { imuMeasurements[measType] = []; }
  imuMeasurementArray.forEach(function (sample) { imuMeasurements[measType].push(sample); });
  let chartId = "chartIMU_" + measType;
  imuMeasurementArray.forEach((element) => {
    let measId = element.measurementId;
    let numOfChannels = imuDevice.currentSetting[measId].channels;
    let plotNewData = [];
    for (let i = 0; i < numOfChannels; i++) { plotNewData.push(element['channel_' + i]); }
    if (element.hasOwnProperty('combined')) { plotNewData.push(element['combined']); }
    let index = new Date(element.timeCorrected);
    addData(window[chartId], index, plotNewData);
  });
}
function switchRawAndCombined(measType, showCombined) {
  chartId = 'chartIMU_' + measType;
  if (showCombined) {
    for (let i = 0; i < window[chartId].data.datasets.length - 1; i++) { window[chartId].hide(i); }
    window[chartId].show(window[chartId].data.datasets.length - 1);
  } else {
    window[chartId].hide(window[chartId].data.datasets.length - 1);
    for (let i = 0; i < window[chartId].data.datasets.length - 1; i++) { window[chartId].show(i); }
  }
}

/* BLE DEVICE UTILS*/

function isDeviceConnected() {
  let deviceList = [];
  if (heartRateDevice.device !== null) {
    deviceList.push('HR sensor: ' + heartRateDevice.getDeviceName());
  }
  if (treadmillDevice.device !== null) {
    deviceList.push('Treadmill: ' + treadmillDevice.getDeviceName());
  }
  if (concept2pmDevice.device !== null) {
    deviceList.push('Concept2 PM: ' + concept2pmDevice.getDeviceName());
  }
  if (imuDevice.device !== null) {
    deviceList.push('IMU: ' + imuDevice.getDeviceName());
  }
  if (deviceList.length == 0) { return false; } else { return true; }
}
function resetMeasurements(heartRate, treadmill, concept2pm, imu) {
  if (treadmill) { treadmillMeasurements = {}; }
  if (heartRate) { heartRateMeasurements = {}; }
  if (concept2pm) { concept2pmMeasurements = {}; }
  if (imu) { imuMeasurements = {}; }
}

/* RECORDING DATA*/

function updateSettingsModalContent() {
  recordingDevicesNames = []; // list to display on the modal
  recordingDevicesObj = {}; // list to tell saveFile which measurement arrays to record
  if (heartRateDevice.device !== null) {
    recordingDevicesNames.push('HR sensor: ' + heartRateDevice.getDeviceName());
    recordingDevicesObj.hr = heartRateDevice.getDeviceName();
  }
  if (treadmillDevice.device !== null) {
    recordingDevicesNames.push('Treadmill: ' + treadmillDevice.getDeviceName());
    recordingDevicesObj.treadmill = treadmillDevice.getDeviceName();
  }
  if (concept2pmDevice.device !== null) {
    recordingDevicesNames.push('Concept2 PM: ' + concept2pmDevice.getDeviceName());
    recordingDevicesObj.concept2pm = concept2pmDevice.getDeviceName();
  }
  if (imuDevice.device !== null) {
    recordingDevicesNames.push('IMU sensor: ' + imuDevice.getDeviceName());
    recordingDevicesObj.imu = imuDevice.getDeviceName();
  }
  if (recordingDevicesNames.length !== 0) {
    settingsDevices.innerHTML = recordingDevicesNames.join(' <br /> ');
  } else { settingsDevices.innerHTML = "No devices connected"; }
  fileName = "experiment_" + Date.now();
  fileNameInput.value = fileName;
  duration = 60;
  durationInput.value = duration;
}
function saveSettingsAndRecord() {
  if (!isDeviceConnected()) {
    alert('No devices connected. Connect a device to record data.');
    return;
  } else {
    //validate and get filename and auto stop setting
    if (fileNameInput.value == "") {
      fileNameInput.value = fileName;
      return;
    } else if (fileNameInput.value.replace(/\s+/g, '').length == 0) {
      fileNameInput.value = fileName;
      return;
    }
    if (durationInput.value == "") {
      durationInput.value = duration;
      return;
    } else if ((!/\D/.test(durationInput.value)) && (durationInput.value > 0) && (durationInput.value < 300)) {
    } else {
      durationInput.value = duration;
      return;
    }
    fileName = fileNameInput.value;
    duration = durationInput.value;
    console.log('> Recording setting new filename: ', fileName);
    console.log('> Recording setting new duration: ', duration);
    startRecording();
  }
}
function startRecording() {
  if (fileName == null) { fileName = 'experiment_' + Date.now(); }
  if (duration == null) { duration = 60; }
  duration = duration * 60 * 1000 //miliseconds
  isRecording = true;
  recordingStartTime = Date.now();
  settingsButton.disabled = true;
  resetMeasurements(true, true, true, true);
  setTimeout(resetAllCharts(), 500);
  console.log('> Recording started');
}
function stopRecording() {
  if (isRecording) {
    isRecording = false;
    saveToFile();
    statusTextRecord.textContent = "Not recording";
    titleTextRecord.textContent = "Record and save data to .json file";
    settingsButton.disabled = false;
    fileName = null;
    duration = null;
    recordingStartTime = null;
    //setTimeout(resetAllCharts(), 1000);
    console.log('> Recording stopped');
  } else { showToast("Not recording!", "Record data"); }
}
function saveToFile() {
  var file;
  var properties = { type: 'application/json' }; // Specify the file's mime-type.
  let heartRateSensor = null;
  let treadmill = null;
  let concept2pm = null;
  let imu = null;
  let endTime = Date.now();
  let prettyRecordingStartTime = new Date(recordingStartTime).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
  let prettyRecordingEndTime = new Date(endTime).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
  let prettyPresetDuration = new Date(duration).toISOString().slice(11, 19);
  let prettyActualDuration = new Date(endTime - recordingStartTime + 1000).toISOString().slice(11, 19);
  let experiment = {
    fileName: fileName,
    devices: recordingDevicesObj,
    presetDuration: prettyPresetDuration,
    actualDuration: prettyActualDuration,
    startTime: prettyRecordingStartTime,
    endTime: prettyRecordingEndTime,
  };
  if (recordingDevicesObj.hasOwnProperty('hr')) {
    heartRateSensor = {
      device: recordingDevicesObj.hr,
      measurements: heartRateMeasurements,
    };
  }
  if (recordingDevicesObj.hasOwnProperty('treadmill')) {
    treadmill = {
      device: recordingDevicesObj.treadmill,
      measurements: treadmillMeasurements,
    };
  }
  if (recordingDevicesObj.hasOwnProperty('concept2pm')) {
    concept2pm = {
      device: recordingDevicesObj.concept2pm,
      measurements: concept2pmMeasurements,
    };
  }
  if (recordingDevicesObj.hasOwnProperty('imu')) {
    imu = {
      device: recordingDevicesObj.imu,
      measurements: imuMeasurements,
    };
  }
  var myObj = { experiment, heartRateSensor, treadmill, concept2pm, imu };
  var myJSON = JSON.stringify(myObj);
  try {
    var downloadFileName = fileName.replace(/\s+/g, '-') + ".json";
    file = new File(myJSON, downloadFileName, properties);
  } catch (e) { file = new Blob([myJSON], { type: "application/json" }); }
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  a.download = downloadFileName;
  a.click();
  showToast("File downloaded!", "Record data")
}