import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { http, Request, Response } from '@google-cloud/functions-framework';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { temporaryWriteSync } from 'tempy';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config();

let { PROJECT_ID, KEYS_FILE, LOCATION, DATASET_NAME, TABLE_NAME } = process.env;

if (!PROJECT_ID || !LOCATION || !DATASET_NAME || !TABLE_NAME) {
  throw new Error('Missing environment');
}

try {
  const keysPath = join(__dirname, '../keys.json');
  KEYS_FILE = KEYS_FILE || readFileSync(keysPath).toString();
} catch (e) {
  console.log('Error', e);
  throw new Error('Missing keys.json file');
}

const options = {
  keyFilename: temporaryWriteSync(KEYS_FILE),
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

http('main', async (req: Request, res: Response) => {
  const urls: Array<string> = (req.query?.url as Array<string>) || [];

  try {
    const fileResponses = await Promise.all(
      urls.map((url) => axios.get(url, { responseType: 'text' }))
    );

    await Promise.all(
      fileResponses.map((fileResponse, i) => {
        return bigquery
          .dataset(DATASET_NAME as string)
          .table(TABLE_NAME as string)
          .load(
            temporaryWriteSync(fileResponse.data.replaceAll(', ', ',')),
            metadata
          );
      })
    );
    res.status(200).json({
      mostSpeeches: await getMostSpeeches(),
      mostSecurity: await getMostSecurity(),
      leastWordy: await getLeastWordy(),
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: 'Failed', error: error.message });
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
};

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
};

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
};
