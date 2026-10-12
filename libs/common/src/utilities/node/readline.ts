import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export async function readlineQuestion(question: string,
                               opts?: {
                                 input: NodeJS.ReadStream,
                                 output: NodeJS.WriteStream,
                               }) {
  const input = opts?.input ?? stdin;
  const output = opts?.output ?? stdout;
  const rl = createInterface({ input, output });

  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}
