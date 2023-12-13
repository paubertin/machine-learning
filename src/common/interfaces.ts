export type Point = [number, number];
export type Path = Point[];
export type Bounds = { top: number; left: number; right: number; bottom: number; };

export interface StudentData {
  student: string;
  session: number;
  drawings: {
    [key: string]: Path[];
  }
}

export interface Sample {
  id: number;
  label: string;
  studentName: string;
  studentId: number;
  point?: number[];
  correct?: boolean;
}

export interface TestingSample {
  id: number;
  label: string;
  truth: string;
  studentName: string;
  studentId: number;
  point: number[];
  correct?: boolean;
}

export enum Drawing {
  'car' = 'car',
  'fish' = 'fish',
  'house' = 'house',
  'tree' = 'tree',
  'bicycle' = 'bicycle',
  'guitar' = 'guitar',
  'pencil' = 'pencil',
  'clock' = 'clock',
  '?' = '?',
}

export interface ChartOptions {
  size: number;
  axesLabels: string[];
  styles: StylesWithImages;
  transparency?: number;
  icon: string;
  background?: HTMLImageElement;
}

export type Styles = Record<keyof typeof Drawing, { color: string; text: string; image?: HTMLImageElement }>;
export type StylesWithImages = Record<keyof typeof Drawing, { color: string; text: string; image: HTMLImageElement }>;

export interface Classifier {
  predict: (input: number[]) => { label: keyof typeof Drawing, nearestSamples?: Sample[] };
}