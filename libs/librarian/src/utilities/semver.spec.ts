import { getCleanSemver } from '@jchpro/nest-librarian';

describe('semver.getCleanSemver', () => {

  it('should return semver with suffix removed', () => {
    expect(
      getCleanSemver('1.2.3-RC')
    ).toBe('1.2.3');
  });

});
