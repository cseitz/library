
export type Thing = {
  id: string;
  name: string;
  description: string;
}

export const makeThing = (): Thing => {
  return {
    id: Math.random().toString(36).substring(2, 15),
    name: 'Thing',
    description: 'A thing',
  };
}
