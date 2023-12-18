import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import tempWrite from 'temp-write';
import functions from '@google-cloud/functions-framework';

let { PROJECT_ID, KEYS_FILE, LOCATION, DATASET_NAME, TABLE_NAME } =
  process.env;

const options = {
  keyFilename: tempWrite.sync(KEYS_FILE, `keys.csv`),
  projectId: PROJECT_ID,
};

const bigquery = new BigQuery(options);

const metadata = {
  sourceFormat: 'CSV',
  skipLeadingRows: 1,
  schema: {
    fields: [
      { name: 'Speaker', type: 'STRING' },
      { name: 'Topic', type: 'STRING' },
      { name: 'Date', type: 'DATE' },
      { name: 'Words', type: 'INTEGER' },
    ],
  },
  location: LOCATION,
};

functions.http('main', async (req, res) => {
  const urls = req.query.url || [];

  try {
    const fileResponses = await Promise.all(
      urls.map((url) => axios.get(url, { responseType: 'text' })),
    );

    await Promise.all(
      fileResponses.map((fileResponse, i) => {
        return bigquery
          .dataset(DATASET_NAME)
          .table(TABLE_NAME)
          .load(
            tempWrite.sync(fileResponse.data.replaceAll(', ', ','), `${i}.csv`),
            metadata,
          );
      }),
    );
    res.status(200).json({
      mostSpeeches: await getMostSpeeches(),
      mostSecurity: await getMostSecurity(),
      leastWordy: await getLeastWordy(),
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Failed', error: error.message })
  }
});

const getMostSpeeches = async () => {
  const query = `
    SELECT Speaker
    FROM \`${DATASET_NAME}.${TABLE_NAME}\`
    WHERE Date BETWEEN '2013-01-01' AND '2013-12-31'
    GROUP BY Speaker
    ORDER BY COUNT(*) DESC
    LIMIT 1;`;

  const options = {
    query,
    location: LOCATION,
  };
  const [rows] = await bigquery.query(options);
  return rows && rows.length > 0 ? rows[0].Speaker : null;
}

const getMostSecurity = async () => {
  const query = `
    SELECT Speaker
    FROM \`${DATASET_NAME}.${TABLE_NAME}\`
    WHERE Topic = 'Internal Security'
    GROUP BY Speaker
    ORDER BY COUNT(*) DESC
    LIMIT 1;`;

  const options = {
    query,
    location: LOCATION,
  };
  const [rows] = await bigquery.query(options);
  return rows && rows.length > 0 ? rows[0].Speaker : null;
}

const getLeastWordy = async () => {
  const query = `
    SELECT Speaker
    FROM \`${DATASET_NAME}.${TABLE_NAME}\`
    GROUP BY Speaker
    ORDER BY SUM(Words) ASC
    LIMIT 1;`;

  const options = {
    query,
    location: LOCATION,
  };
  const [rows] = await bigquery.query(options);
  return rows && rows.length > 0 ? rows[0].Speaker : null;
}