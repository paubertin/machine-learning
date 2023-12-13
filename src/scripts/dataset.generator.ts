import path from 'path';
import fs from 'fs/promises';
import { Render } from '../common/render';

import { createCanvas } from 'canvas';
import { CONSTANTS } from '../common/constants';
import { Utils } from '../common/utils';
import { exists } from './utils';
import { Sample, StudentData } from '../common/interfaces';
import { Features } from '../common/features';

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
  await fs.writeFile(CONSTANTS.samplesTs, `export const samples = ${JSON.stringify(samples, undefined, 2)};`);

  console.log('Done !');
}

async function generateImgFile (fileName: string, paths: any) {
  ctx.clearRect(0, 0, CONSTANTS.canvasWidth, CONSTANTS.canvasHeight);
  Render.paths(ctx, paths);

  /*
  const { hull } = Geometry.minimumBoundingBox(paths.flat());
  const roundness = Geometry.roundness(hull);
  const R = Math.floor(roundness**5 * 255);
  const G = 0;
  const B = Math.floor((1 - roundness**5) * 255);
  Render.path(ctx, [ ...hull, hull[0] ], `rgb(${R},${G},${B})`, 10);
  */

  const pixels = Features.getPixels(paths);
  const size = Math.sqrt(pixels.length);
  const imgData = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < pixels.length; ++i) {
    const alpha = pixels[i];
    const startIndex = i * 4;
    imgData.data[startIndex + 1] = 0;
    imgData.data[startIndex + 2] = 0;
    imgData.data[startIndex + 3] = alpha;
  }
  ctx.putImageData(imgData, 0, 0);

  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(fileName, buffer);
}

void generateDataset();
