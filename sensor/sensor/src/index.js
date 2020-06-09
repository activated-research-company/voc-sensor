const SerialPort = require('serialport');
const Delimiter = require('@serialport/parser-delimiter');

const TOO_MANY_PORTS = 'Only one serial port can be active at a time.';

const portsAreValid = (ports) => {
  if (ports.length > 1) {
    console.error(TOO_MANY_PORTS);
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
    if (!portsAreValid(ports)) { return; }
    return ports[0];
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
          console.log(parseData(data));
        } catch (error) {
          console.error(`I could not parse voc json: ${error} w/ ${data.toString()}`);
          console.warn('I\'m going to try reconfigure the sensor for json output.');
          vocSensor.write('J');
        }
      }
    });

    vocSensor.open();
  });
