import type {
  hash as HashType,
  compare as CompareType,
} from 'bcrypt';

let hash: typeof HashType;
let compare: typeof CompareType;

try {
  const ns = require('bcrypt');
  hash = ns.hash;
  compare = ns.compare;
} catch (err) {
  console.error('Could not resolve `bcrypt` package, please run `npm i bcrypt`');
  throw err;
}

export {
  hash,
  compare
};
