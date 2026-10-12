import * as Bcrypt from 'bcrypt';

export const hash = Bcrypt.hash;
export const compare = Bcrypt.compare;
