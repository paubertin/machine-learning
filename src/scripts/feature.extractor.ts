import fs from 'fs/promises';
import { CONSTANTS } from '../common/constants';
import { Features } from '../common/features';
import path from 'path';
import { Path, Point, Sample, TestingSample } from '../common/interfaces';
import { Utils } from '../common/utils';

async function extract() {
  console.log('Extracting features...');

  const samples: Required<Sample>[] = JSON.parse((await fs.readFile(CONSTANTS.samplesFile)).toString());

  for (let i = 0; i < samples.length; ++i) {
    const sample = samples[i];
    const paths: Path[] = JSON.parse((await fs.readFile(path.join(CONSTANTS.jsonDir, `${sample.id}.json`))).toString());

    const functions = Features.inUse.map((f) => f.function);

    sample.point = functions.map((f) => f(paths));
    Utils.printProgress(i, samples.length - 1);
  }

  const featureNames = Features.inUse.map((f) => f.name);

  console.log('Generating splits...');

  const trainingAmount = samples.length * 0.5;

  const training: Sample[] = [];
  const testing: Sample[] = [];

  for (let i = 0; i < samples.length; ++i) {
    if (i < trainingAmount) {
      training.push(samples[i]);
    }
    else {
      testing.push(samples[i]);
    }
  }

  const minMax = Utils.normalizePoints(training.map((s) => s.point as Point));
  Utils.normalizePoints(testing.map((s) => s.point as Point), minMax);

  await fs.writeFile(CONSTANTS.features, JSON.stringify({
    featureNames,
    samples: samples.map((s) => {
      return {
        point: s.point,
        label: s.label,
      };
    })
  }, undefined, 2));
  await fs.writeFile(CONSTANTS.featuresTs, `export const features = ${JSON.stringify({ featureNames, samples }, undefined, 2)};`);

  await fs.writeFile(CONSTANTS.training, JSON.stringify({
    featureNames,
    samples: training.map((s) => {
      return {
        point: s.point,
        label: s.label,
      };
    })
  }, undefined, 2));
  await fs.writeFile(CONSTANTS.trainingTs, `export const training = ${JSON.stringify({ featureNames, samples: training }, undefined, 2)};`);

  await fs.writeFile(CONSTANTS.testing, JSON.stringify({
    featureNames,
    samples: testing.map((s) => {
      return {
        point: s.point,
        label: s.label,
      };
    })
  }, undefined, 2));
  await fs.writeFile(CONSTANTS.testingTs, `export const testing = ${JSON.stringify({ featureNames, samples: testing }, undefined, 2)};`);


  await fs.writeFile(CONSTANTS.minMaxTs, `export const minMax = ${JSON.stringify(minMax, undefined, 2)};`);
  console.log('Done !');
}

void extract();