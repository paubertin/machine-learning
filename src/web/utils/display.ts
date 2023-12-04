import { Sample } from "../../common/interfaces";

export async function createRow (container: HTMLElement, studentName: string, samples: Sample[]) {
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
    sampleContainer.onclick = () => handleClick(sample, false);
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

function handleClick (sample: Sample, doScroll: boolean = true) {
  const elt = document.getElementById(`sample_${sample.id}`);
  let emphasized: boolean = false;
  if (elt?.classList.contains('emphasize')) {
    emphasized = true;
  }
  [...document.querySelectorAll('.emphasize')]
    .forEach((elt) => elt.classList.remove('emphasize'));
  if (emphasized) {
    return;
  }
  elt?.classList.add('emphasize');
  if (doScroll) {
    elt?.scrollIntoView({
      behavior: 'auto',
      block: 'center',
    })
  }
}