import { Features } from "../../../common/features";
import { Path, Point, Sample, TestingSample } from "../../../common/interfaces";
import { features } from "../../../common/ts-objects/features";
import { minMax } from "../../../common/ts-objects/minMax";
import { testing } from "../../../common/ts-objects/testing";
import { training } from "../../../common/ts-objects/training";
import { Utils } from "../../../common/utils";
import { Graphics } from "../../graphics";
import { createRow, handleClick } from "../../graphics/display";
import { BaseComponent, Component } from "../../zen/component";
import { Ref } from "../../zen/decorators";
import { ChartComponent, ChartOptions } from "../chart/chart.component";
import { SketchPad } from "../sketchpad/sketchpad.component";
import { KNN } from "../../../common/classifiers/knn";
import { Confusion, ConfusionOptions } from "../confusion/confusion.component";


@Component({
  selector: 'viewer-component',
  templateUrl: 'components/viewer/viewer.component.html',
  styles: 'components/viewer/viewer.component.scss',
})
export class ViewerComponent extends BaseComponent {
  @Ref('container')
  public container!: HTMLDivElement;

  @Ref('confusion')
  public confusion!: Confusion;

  @Ref('predictedLabel')
  public predictedLabelContainer!: HTMLDivElement;

  @Ref('sketchpad')
  public sketchpad!: SketchPad;

  @Ref('chart')
  public chart!: ChartComponent;

  public handleClick = handleClick(this.shadow);

  public Utils = Utils;

  public knn: KNN;

  public chartOptions: ChartOptions;

  public confusionOptions: ConfusionOptions;

  public samples = features.samples;

  public trainingSamples = training.samples as Sample[];
  public testingSamples = testing.samples as TestingSample[];

  public correctCount = 0;
  public totalCount = 0;

  public constructor () {
    super();
    this.knn = new KNN(this.trainingSamples, 50);
    const background = new Image();
    background.src='/decision_boundary.png';

    this.chartOptions = {
      size: 500,
      axesLabels: features.featureNames,
      styles: Graphics.generateImages(Utils.styles),
      transparency: 0.8,
      icon: 'image',
      background,
    };

    this.confusionOptions = this.chartOptions;
  }

  protected override async onInit(_data?: Record<string, any>) {
    for (const testSample of this.testingSamples) {
      testSample.truth = testSample.label;
      testSample.label = '?';
      const { label } = this.knn.predict(testSample.point);
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

    this.confusion.afterInit((component) => {
      component.style.display = 'none';
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

  public toggleOutput () {
    if (this.confusion.style.display === 'none') {
      this.confusion.style.display = 'block';
    }
    else {
      this.confusion.style.display = 'none';
    }
  }

  public onUpdate = (paths: Path[]) => {
    const functions = Features.inUse.map((f) => f.function);
    const point = functions.map((f) => f(paths)) as Point;
    Utils.normalizePoints([ point ], minMax);
    const { label, nearestSamples } = this.knn.predict(point);
    this.predictedLabelContainer.innerHTML = `Is it a ${label} ?`;
    this.chart.showDynamicPoint(point, label, nearestSamples as any);
  }

  public scrollToTop () {
    document.scrollingElement?.scrollIntoView();
  }

  public scrollToBottom () {
    document.scrollingElement?.scrollTo({ top: document.scrollingElement.scrollHeight });
  }

}