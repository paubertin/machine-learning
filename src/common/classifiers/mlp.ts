import { Classifier, Drawing, Sample } from "../interfaces";
import { NeuralNetwork } from "../network";

export class MLP implements Classifier {

  public network: NeuralNetwork;

  public constructor (public neuronCounts: number[], public classes: string[]) {
    this.network = new NeuralNetwork(neuronCounts);
  }

  public predict (point: number[]) {
    const output = this.network.feedForward(point);
    const max = Math.max(...output);
    const index = output.indexOf(max);
    const label = this.classes[index];
    return {
      label: label as keyof typeof Drawing,
    };
  }

  public fit (samples: Required<Sample>[], tries = 1000) {
    let bestNetwork = this.network;
    let bestAccuracy = this.evaluate(samples);
    for (let i = 0; i< tries; i++) {
      this.network = new NeuralNetwork(this.neuronCounts);
      const accuracy = this.evaluate(samples);
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestNetwork = this.network;
      }
    }
    this.network = bestNetwork;
    return this;
  }

  public evaluate (samples: Required<Sample>[]) {
    let correctCount = 0;
    for (const sample of samples) {
      const { label } = this.predict(sample.point);
      const truth = sample.label;
      correctCount += truth === label ? 1 : 0;
    }
    return correctCount / samples.length;
  }

  public load (jsonModel: { neuronCounts: number[], classes: string[], network: NeuralNetwork }) {
    this.neuronCounts = jsonModel.neuronCounts;
    this.classes = jsonModel.classes;
    this.network = NeuralNetwork.from(jsonModel.network.layers);
  }
}