import path from 'path';
import fs from 'fs/promises';
import { Render } from '../common/render';

import { createCanvas } from 'canvas';
import { CONSTANTS } from '../common/constants';
import { Utils } from '../common/utils';
import { exists } from './utils';
import { Sample, StudentData } from '../common/interfaces';

const canvas = createCanvas(CONSTANTS.canvasWidth, CONSTANTS.canvasHeight);
const ctx = canvas.getContext('2d');

async function checkDirectories () {
  if (await exists(CONSTANTS.datasetDir)) {
    await fs.rm(CONSTANTS.datasetDir, { recursive: true, force: true });
  }
  await fs.mkdir(CONSTANTS.datasetDir);
  await fs.mkdir(CONSTANTS.jsonDir);
  await fs.mkdir(CONSTANTS.imgDir);
}

async function generateDataset () {

  await checkDirectories();
  console.log('Generating dataset...');

  const fileNames = await fs.readdir(CONSTANTS.rawDir);
  
  const samples: Sample[] = [];
  
  let id = 1;
  for (const fileName of fileNames) {
    const content = (await fs.readFile(path.join(CONSTANTS.rawDir, fileName))).toString();
    const { session, student, drawings } = (JSON.parse(content) as StudentData);
    for (let label in drawings) {
      samples.push({
        id,
        label,
        studentName: student,
        studentId: session,
      });

      const paths = drawings[label];
      await fs.writeFile(path.join(CONSTANTS.jsonDir, `${id}.json`), JSON.stringify(paths));

      await generateImgFile(path.join(CONSTANTS.imgDir, `${id}.png`), paths);

      Utils.printProgress(id, fileNames.length * 8);

      ++id;
    }
  }
  console.log('\n');

  await fs.writeFile(CONSTANTS.samplesFile, JSON.stringify(samples));
  await fs.writeFile(CONSTANTS.samplesJs, `export const samples = ${JSON.stringify(samples, undefined, 2)};`);

  console.log('Done !');
}

async function generateImgFile (fileName: string, paths: any) {
  ctx.clearRect(0, 0, CONSTANTS.canvasWidth, CONSTANTS.canvasHeight);
  Render.paths(ctx, paths);

  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(fileName, buffer);
}

void generateDataset();
