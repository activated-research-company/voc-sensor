const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');
const metricService = require('./metric-service/metric-service');

const throwTooManyPortsError = (numberOfPorts) => {
  throw new Error(`Only one serial port can be active at a time. There are currently ${numberOfPorts} active ports.`);
}

const portsAreValid = (ports) => {
  if (ports.length > 1) {
    throwTooManyPortsError(ports.length);
    return false;
  }
  return true;
}

const isConfigurationResponse = (data) => {
  return data.toString().includes('*** Config: Set output format to JSON.');
}

const parseData = (data) => {
  return JSON.parse(data);
}

SerialPort
  .list()
  .then((ports) => {
    const filteredPorts = ports.filter((port) => port.path !== '/dev/ttyAMA0');
    if (portsAreValid(filteredPorts)) { return filteredPorts[0]; }
  })
  .then((port) => {
    const vocSensor = new SerialPort(port.path, {
      baudRate: 115200,
      autoOpen: false,
    });
    const parser = vocSensor.pipe(new Delimiter({ delimiter: Buffer.from('\r\n')}));

    parser.on('data', (data) => {
      if (!isConfigurationResponse(data)) {
        try {
          const json = parseData(data);
          metricService.add(
            json.iaqAccuracy,
            json.temperature,
            json.pressure,
            json.humidity,
            json.gasResistance,
            json.IAQ,
          );
        } catch (error) {
          console.error(`I could not parse voc json: ${error} w/ ${data.toString()}`);
          console.warn('I\'m going to try reconfigure the sensor for json output.');
          vocSensor.write('J');
        }
      }
    });

    vocSensor.open();
  })
  .catch((error) => {
    console.error(error);
  });
