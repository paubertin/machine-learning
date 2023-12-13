const canvasWidth = 400;
const canvasHeight = 400;

const dataDir = '/home/scal/dev/machine-learning/data';
const rawDir = dataDir + '/raw';
const datasetDir = dataDir + '/dataset';
const jsonDir = datasetDir + '/json';
const imgDir = datasetDir + '/img';
const samplesFile = datasetDir + '/samples.json';
const features = datasetDir + '/features.json';
const training = datasetDir + '/training.json';
const testing = datasetDir + '/testing.json';
const tsObjects = '/home/scal/dev/machine-learning/src/common/ts-objects';
const samplesTs = tsObjects + '/samples.ts';
const featuresTs = tsObjects + '/features.ts';
const trainingTs = tsObjects + '/training.ts';
const testingTs = tsObjects + '/testing.ts';
const minMaxTs = tsObjects + '/minMax.ts';
const modelTs = tsObjects + '/model.ts';
const modelsDir = dataDir + '/models';
const decisionBoundary = modelsDir + '/decision_boundary.png';
const model = modelsDir + '/model.json';

export const CONSTANTS = {
  canvasWidth,
  canvasHeight,
  dataDir,
  rawDir,
  datasetDir,
  jsonDir,
  imgDir,
  samplesFile,
  tsObjects,
  samplesTs,
  featuresTs,
  trainingTs,
  testingTs,
  minMaxTs,
  features,
  training,
  testing,
  decisionBoundary,
  model,
  modelTs,
};