const Influx = require('influx');

function metricService() {
  const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'voc',
    schema: [
      {
        measurement: 'sensor',
        fields: {
          temperature: Influx.FieldType.FLOAT,
          pressure: Influx.FieldType.FLOAT,
          humidity: Influx.FieldType.FLOAT,
          resistance: Influx.FieldType.FLOAT,
          iaq: Influx.FieldType.FLOAT,
        },
        tags: ['accuracy']
      },
    ]
  });

  influx
    .getDatabaseNames()
    .then((names) => {
      if (!names.includes('voc')) { return influx.createDatabase('voc'); }
    })
    .catch(error => console.log({ error }));
  
  function add(accuracy, temperature, pressure, humidity, resistance, iaq) {
    influx.writePoints(
      [
        {
          measurement: 'voc',
          tags: {
            accuracy,
          },
          fields: {
            temperature,
            pressure,
            humidity,
            resistance,
            iaq,
          },
        },
      ],
      {
        database: 'sensor',
        precision: 's',
      },
    )
    .catch(error => {
      console.error(`Error saving data to InfluxDB! ${err.stack}`)
    });;
  }
  
  return {
    add,
  };
}

module.exports = metricService();