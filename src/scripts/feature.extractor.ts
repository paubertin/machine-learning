import fs from 'fs/promises';
import { CONSTANTS } from '../common/constants';
import { Features } from '../common/features';
import path from 'path';
import { Path, Sample } from '../common/interfaces';

async function extract() {
  console.log('Extracting features...');

  const samples: Sample[] = JSON.parse((await fs.readFile(CONSTANTS.samplesFile)).toString());

  for (const sample of samples) {
    const paths: Path[] = JSON.parse((await fs.readFile(path.join(CONSTANTS.jsonDir, `${sample.id}.json`))).toString());
    sample.point = [
      Features.getPathCount(paths),
      Features.getPointsCount(paths),
    ];
  }

  const featureNames = ['Path count', "Point count"];

  await fs.writeFile(CONSTANTS.features, JSON.stringify({
    featureNames,
    samples: samples.map((s) => {
      return {
        point: s.point,
        label: s.label,
      };
    })
  }));

  await fs.writeFile(CONSTANTS.featuresJs, `export const features = ${JSON.stringify({ featureNames, samples }, undefined, 2)};`);

  console.log('Done !');
}

void extract();