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
const jsObjects = '/home/scal/dev/machine-learning/src/common/js-objects';
const samplesJs = jsObjects + '/samples.js';
const featuresJs = jsObjects + '/features.js';
const trainingJs = jsObjects + '/training.js';
const testingJs = jsObjects + '/testing.js';
const minMaxJs = jsObjects + '/minMax.js';

export const CONSTANTS = {
  canvasWidth,
  canvasHeight,
  dataDir,
  rawDir,
  datasetDir,
  jsonDir,
  imgDir,
  samplesFile,
  jsObjects,
  samplesJs,
  features,
  featuresJs,
  minMaxJs,
  training,
  trainingJs,
  testing,
  testingJs,
};