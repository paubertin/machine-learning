import { Classifier, Drawing, Point, Sample } from "../interfaces";
import { math } from "../math";

export class KNN implements Classifier {
  public constructor (public samples: Sample[], public k: number) {}

  public predict (point: number[]) {
    const points = this.samples.map((s) => s.point) as Point[];
    const indices = math.getNearest(point, points, this.k);
    const nearestSamples = indices.map((i) => this.samples[i]);
    const labels = nearestSamples.map((s) => s.label as keyof typeof Drawing);
    const counts: { [key: string]: number } = {};
    for (const label of labels) {
      counts[label] = counts[label] ? counts[label] + 1 : 1;
    }
    const max = Math.max(...Object.values(counts));
    const label = labels.find((l) => counts[l] === max)!;
    return {
      label,
      nearestSamples,
    };
  }
}