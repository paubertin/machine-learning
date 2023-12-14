import { ILayer, INeuralNetwork } from "./interfaces";

export class Layer implements ILayer {
  public inputs: Array<number>;
  public outputs: Array<number>;
  public biases: Array<number>;
  public weights: Array<Array<number>>;

  public constructor (inputCount: number, outputCount: number) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);
    this.weights = [];
    for (let i = 0; i < inputCount; ++i) {
      this.weights[i] = new Array(outputCount);
    }

    Layer.randomize(this);
  }

  public static randomize (layer: Layer) {
    for (let i = 0; i < layer.inputs.length; i++) {
       for (let j = 0; j < layer.outputs.length; j++) {
        layer.weights[i][j] = Math.random() * 2 - 1;
       }
    }

    for (let i = 0; i < layer.biases.length; i++) {
      layer.biases[i] = Math.random() * 2 - 1;
    }
  }

  public feedForward(givenInputs: Array<number>) {
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < this.outputs.length; i++) {
       let sum = 0;
       for (let j = 0; j < this.inputs.length; j++) {
          sum += this.inputs[j] * this.weights[j][i];
       }

       this.outputs[i] = sum + this.biases[i];
    }

    return this.outputs;
 }

  static feedForward(givenInputs: Array<number>, layer: Layer) {
     for (let i = 0; i < layer.inputs.length; i++) {
      layer.inputs[i] = givenInputs[i];
     }

     for (let i = 0; i < layer.outputs.length; i++) {
        let sum = 0;
        for (let j = 0; j < layer.inputs.length; j++) {
           sum += layer.inputs[j] * layer.weights[j][i];
        }

        layer.outputs[i] = sum + layer.biases[i];
     }

     return layer.outputs;
  }
}



export class NeuralNetwork implements INeuralNetwork {

  public layers: Layer[];

  public constructor (neuronCounts: number[]) {
    this.layers = [];
    for (let i = 0; i < neuronCounts.length - 1; ++i) {
      this.layers.push(new Layer(neuronCounts[i], neuronCounts[i + 1]));
    }
  }

  public static from (layers: ILayer[]) {
    const neuronCounts: number[] = [];
    for (let i = 0; i < layers.length; ++i) {
      neuronCounts.push(layers[i].inputs.length);
    }
    neuronCounts.push(layers[layers.length - 1].outputs.length);
    const network = new NeuralNetwork(neuronCounts);
    for (let i = 0; i < layers.length; ++i) {
      network.layers[i].inputs = layers[i].inputs;
      network.layers[i].outputs = layers[i].outputs;
      network.layers[i].biases = layers[i].biases;
      network.layers[i].weights = layers[i].weights;
    }
    return network;
  }

  public feedForward (givenInputs: Array<number>) {
    let outputs = this.layers[0].feedForward(givenInputs);
    for (let i = 1; i < this.layers.length; i++) {
       outputs = this.layers[i].feedForward(outputs);
    }
    return outputs;
  }

  public static feedForward(givenInputs: Array<number>, network: NeuralNetwork) {
     let outputs = Layer.feedForward(givenInputs, network.layers[0]);
     for (let i = 1; i < network.layers.length; i++) {
        outputs = Layer.feedForward(outputs, network.layers[i]);
     }
     return outputs;
  }
}