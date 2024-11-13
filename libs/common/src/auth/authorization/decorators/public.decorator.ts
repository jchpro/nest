import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC } from "../consts/metadata-keys";

/**
 * Marking controller / endpoint with this decorator switches off all authentication / authorization for it.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
