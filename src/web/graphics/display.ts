import { Sample } from "../../common/interfaces";
import { ChartComponent } from "../components/chart/chart.component";

export async function createRow(context: ShadowRoot, container: HTMLElement, studentName: string, samples: Sample[], chart: ChartComponent) {
  const row = document.createElement('div');
  row.classList.add('row');
  container.appendChild(row);

  const rowLabel = document.createElement('div');
  rowLabel.innerHTML = studentName;
  rowLabel.classList.add('rowLabel');
  row.appendChild(rowLabel);

  for (let sample of samples) {
    const { id, label, correct } = sample;

    const sampleContainer = document.createElement('div');
    sampleContainer.id = `sample_${id}`;
    sampleContainer.onclick = () => handleClick(context)(chart, sample, false);
    sampleContainer.classList.add('sampleContainer');

    const sampleLabel = document.createElement('div');
    sampleLabel.innerHTML = label;
    sampleContainer.appendChild(sampleLabel);
    if (correct) {
      sampleContainer.style.backgroundColor = 'lightgreen';
    }

    const img = document.createElement('img');
    img.setAttribute('loading', 'lazy');
    img.src = `/${id}.png`;
    img.classList.add('thumb');
    sampleContainer.appendChild(img);
    row.appendChild(sampleContainer);
  }
}

export function handleClick (context: ShadowRoot) {
  return (chart: ChartComponent, sample?: Required<Sample> | Sample, doScroll: boolean = true) => {
    if (!sample) {
      [...context.querySelectorAll('.emphasize')].
        forEach((e) => e.classList.remove('emphasize'));
      return;
    }
    const el = context.getElementById(
      'sample_' + sample.id
    );
    if (el?.classList.contains("emphasize")) {
      el.classList.remove("emphasize");
      chart.selectSample(undefined);
      return;
    }
    [...context.querySelectorAll('.emphasize')].
      forEach((e) => e.classList.remove('emphasize'));
    el?.classList.add("emphasize");
    if (doScroll) {
      el?.scrollIntoView({
        behavior: 'auto',
        block: 'center'
      });
    }
    chart.selectSample(sample as Required<Sample>);
  };
}
