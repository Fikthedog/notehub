export type Lesson={id:string;title:string;topic:string;date:string;description:string;images:string[];curriculumLesson?:string|null;created_at?:string};
export const examples:Lesson[]=[
{id:'example-1',title:'A first look at derivatives',topic:'Calculus',curriculumLesson:'2.2',date:'2026-10-27',created_at:'2026-10-27T19:00:00Z',description:'From the slope of a line to the slope at a point. Example lesson — replace with your own board photos.',images:['/boards/derivatives.svg']}
];
