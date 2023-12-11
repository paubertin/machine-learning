import { Features } from "../../../common/features";
import { Drawing, Path, Point, Sample, TestingSample } from "../../../common/interfaces";
import { features } from "../../../common/js-objects/features";
import { minMax } from "../../../common/js-objects/minMax";
import { testing } from "../../../common/js-objects/testing";
import { training } from "../../../common/js-objects/training";
import { Utils } from "../../../common/utils";
import { Graphics } from "../../graphics";
import { createRow, handleClick } from "../../graphics/display";
import { math } from "../../math";
import { BaseComponent, Component } from "../../zen/component";
import { Ref } from "../../zen/decorators";
import { ChartComponent, ChartOptions } from "../chart/chart.component";
import { SketchPad } from "../sketchpad/sketchpad.component";


@Component({
  selector: 'viewer-component',
  templateUrl: 'components/viewer/viewer.component.html',
  styles: 'components/viewer/viewer.component.scss',
})
export class ViewerComponent extends BaseComponent {
  @Ref('container')
  public container!: HTMLDivElement;

  @Ref('predictedLabel')
  public predictedLabelContainer!: HTMLDivElement;

  @Ref('sketchpad')
  public sketchpad!: SketchPad;

  @Ref('chart')
  public chart!: ChartComponent;

  public handleClick = handleClick(this.shadow);

  public Utils = Utils;

  public chartOptions: ChartOptions = {
    size: 500,
    axesLabels: features.featureNames,
    styles: Graphics.generateImages(Utils.styles),
    transparency: 0.8,
    icon: 'image',
  };

  public samples = features.samples;

  public trainingSamples = training.samples as Sample[];
  public testingSamples = testing.samples as TestingSample[];

  public correctCount = 0;
  public totalCount = 0;

  protected override async onInit(_data?: Record<string, any>) {
    for (const testSample of this.testingSamples) {
      const { label } = this.classify(testSample.point);
      testSample.label = label;
      testSample.correct = testSample.label === testSample.truth;
      this.totalCount++;
      this.correctCount += testSample.correct ? 1 : 0;
    }

    const trainingGroups = Utils.groupBy(this.trainingSamples, 'studentId');
    for (let studentId in trainingGroups) {
      const studentSamples = trainingGroups[studentId];
      const studentName = studentSamples[0].studentName;
      await createRow(this.shadow, this.container, studentName, studentSamples, this.chart);
    }

    const subTitle = document.createElement('h2');
    subTitle.innerHTML = 'TESTING';
    this.container.appendChild(subTitle);

    const testingGroups = Utils.groupBy(this.testingSamples, 'studentId');
    for (let studentId in testingGroups) {
      const studentSamples = testingGroups[studentId];
      const studentName = studentSamples[0].studentName;
      await createRow(this.shadow, this.container, studentName, studentSamples, this.chart);
    }

    this.sketchpad.afterInit((component) => {
      component.style.display = 'none'
      component.style.cssText += 'outline: 10000px solid rgba(0,0,0,0.7);';
    });
  }

  public toggleInput () {
    if (this.sketchpad.style.display === 'none') {
      this.sketchpad.style.display = 'block';
      this.sketchpad.triggerUpdate();
    }
    else {
      this.sketchpad.style.display = 'none';
      this.chart.hideDynamicPoint();
    }
  }

  public onUpdate = (paths: Path[]) => {
    const functions = Features.inUse.map((f) => f.function);
    const point = functions.map((f) => f(paths)) as Point;
    Utils.normalizePoints([ point ], minMax);
    const { label, nearestSamples } = this.classify(point);
    this.predictedLabelContainer.innerHTML = `Is it a ${label} ?`;
    this.chart.showDynamicPoint(point, label, nearestSamples as any);
  }

  public classify(point: number[]) {
    const points = this.trainingSamples.map((s) => s.point) as Point[];
    const indices = math.getNearest(point, points, 10);
    const nearestSamples = indices.map((i) => this.trainingSamples[i]);
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

  public scrollToTop () {
    document.scrollingElement?.scrollIntoView();
  }

  public scrollToBottom () {
    document.scrollingElement?.scrollTo({ top: document.scrollingElement.scrollHeight });
  }

}