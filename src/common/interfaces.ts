export type Path = [number, number][];

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
  point?: [ number, number ];
}