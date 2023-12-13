import { CONSTANTS } from '../common/constants';
import { Utils } from '../common/utils';
import { KNN } from '../common/classifiers/knn';
import { createCanvas } from 'canvas';

import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Classifier } from '../common/interfaces';
import { MLP } from '../common/classifiers/mlp';
import { existsSync } from 'fs';

type KNNoptions = { type: 'knn', k: number };
type MLPoptions = { type: 'mlp' };
type Options = KNNoptions | MLPoptions;

async function classification(options: { type: 'mlp' }): Promise<void>
async function classification(options: { type: 'knn', k: number }): Promise<void>
async function classification(options: Options): Promise<void> {
  const { samples: trainingSamples } = JSON.parse((await readFile(CONSTANTS.training)).toString());

  let model: Classifier;
  if (options.type === 'knn') {
    console.log(`Running classification with ${options.k} nearest neigbhours...`);
    model = new KNN(trainingSamples, options.k!);
  }
  else {
    console.log(`Running classification with MLP...`);
    model = new MLP([trainingSamples[0].point.length, Utils.classes.length], Utils.classes);
    
    if (existsSync(CONSTANTS.model)) {
      (model as MLP).load(JSON.parse((await readFile(CONSTANTS.model)).toString()));
    }

    (model as MLP).fit(trainingSamples, 5000);

    await writeFile(CONSTANTS.model, JSON.stringify(model, undefined, 2));
    await writeFile(CONSTANTS.modelTs, `export const model = ${JSON.stringify(model, undefined, 2)};`);
  }

  const { samples: testingSamples } = JSON.parse((await readFile(CONSTANTS.testing)).toString());

  let totalCount = 0;
  let correctCount = 0;
  for (const sample of testingSamples) {
    const { label: predictedLabel } = model.predict(sample.point);
    correctCount += predictedLabel === sample.label ? 1 : 0;
    totalCount++;
  }

  console.log(`Accuracy: ${correctCount}/${totalCount} (${Utils.formatPercent(correctCount/totalCount)})`);

  console.log('Generating decision boundary...');

  const N = 100;
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
      while (point.length < trainingSamples[0].point.length) {
         point.push(0);
      }
      const { label } = model.predict(point);
      const color = Utils.styles[label].color;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    } 
  }

  const buffer = canvas.toBuffer('image/png');
  await writeFile(CONSTANTS.decisionBoundary, buffer);
  await writeFile(path.join(CONSTANTS.imgDir, 'decision_boundary.png'), buffer);
  console.log('Done !');
}

// args[2] --knn k / --mlp

async function evaluate () {
  const args = process.argv;
  const methodArg = args[2];
  if (methodArg === '--knn') {
    const options: KNNoptions = {
      type: 'knn',
      k:  args[3]
        ? parseInt(args[3])
        : 50,
    };
    options.type = 'knn';
    await classification(options);
  }
  else if (methodArg === '--mlp' || methodArg === undefined) {
    const options: MLPoptions = {
      type: 'mlp',
    };
    await classification(options);
  }
}

void evaluate();