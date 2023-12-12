import { CONSTANTS } from '../common/constants';
import { Utils } from '../common/utils';
import { KNN } from '../common/classifiers/knn';
import { createCanvas } from 'canvas';

import fs from 'fs/promises';
import path from 'path';

async function classification(k?: number) {
  k = k ?? 50;
  console.log(`Running classification with ${k} nearest neigbhours...`);

  const { samples: trainingSamples } = JSON.parse((await fs.readFile(CONSTANTS.training)).toString());

  const kNN = new KNN(trainingSamples, k ?? 50);

  const { samples: testingSamples } = JSON.parse((await fs.readFile(CONSTANTS.testing)).toString());

  let totalCount = 0;
  let correctCount = 0;
  for (const sample of testingSamples) {
    const { label: predictedLabel } = kNN.predict(sample.point);
    correctCount += predictedLabel === sample.label ? 1 : 0;
    totalCount++;
  }

  console.log(`Accuracy: ${correctCount}/${totalCount} (${Utils.formatPercent(correctCount/totalCount)})`);

  console.log('Generating decision boundary...');

  const N = 1000;
  const canvas = createCanvas(N, N);

  const ctx = canvas.getContext('2d');

  let i = 1;
  for (let x = 0; x < canvas.width; ++x) {
    for (let y = 0; y < canvas.width; ++y) {
      Utils.printProgress(i++, N * N);
      const point = [
        x / canvas.width,
        1 - y / canvas.height,
      ];
      const { label } = kNN.predict(point);
      const color = Utils.styles[label].color;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    } 
  }

  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(CONSTANTS.decisionBoundary, buffer);
  await fs.writeFile(path.join(CONSTANTS.imgDir, 'decision_boundary.png'), buffer);
  console.log('Done !');
}

const args = process.argv;

void classification(args[2] ? parseInt(args[2]) : undefined);
