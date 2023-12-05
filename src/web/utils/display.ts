import { Sample } from "../../common/interfaces";
import { Chart } from "../viewer/chart/chart";

export async function createRow(container: HTMLElement, studentName: string, samples: Sample[], chart: Chart) {
  const row = document.createElement('div');
  row.classList.add('row');
  container.appendChild(row);

  const rowLabel = document.createElement('div');
  rowLabel.innerHTML = studentName;
  rowLabel.classList.add('rowLabel');
  row.appendChild(rowLabel);

  for (let sample of samples) {
    const { id, label, studentId } = sample;

    const sampleContainer = document.createElement('div');
    sampleContainer.id = `sample_${id}`;
    sampleContainer.onclick = () => handleClick(chart, sample, false);
    sampleContainer.classList.add('sampleContainer');

    const sampleLabel = document.createElement('div');
    sampleLabel.innerHTML = label;
    sampleContainer.appendChild(sampleLabel);

    const img = document.createElement('img');
    img.setAttribute('loading', 'lazy');
    img.src = `/${id}.png`;
    img.classList.add('thumb');
    sampleContainer.appendChild(img);
    row.appendChild(sampleContainer);
  }
}

export function handleClick(chart: Chart, sample?: Required<Sample> | Sample, doScroll: boolean = true) {
  if (!sample) {
    [...document.querySelectorAll('.emphasize')].
      forEach((e) => e.classList.remove('emphasize'));
    return;
  }
  const el = document.getElementById(
    'sample_' + sample.id
  );
  if (el?.classList.contains("emphasize")) {
    el.classList.remove("emphasize");
    chart.selectSample(undefined);
    return;
  }
  [...document.querySelectorAll('.emphasize')].
    forEach((e) => e.classList.remove('emphasize'));
  el?.classList.add("emphasize");
  if (doScroll) {
    el?.scrollIntoView({
      behavior: 'auto',
      block: 'center'
    });
  }
  chart.selectSample(sample.id);
}