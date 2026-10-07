/* eslint-disable no-unused-expressions */
/* global describe it */

import { expect } from '@esm-bundle/chai';
import {
  getUniqueFilterValues,
  jobMatchesSelectedFilters,
  normalizeJobFilterValue,
  normalizeJobListingItem,
} from '../../../blocks/job-opportunities/job-opportunities.js';

const selectedFilters = (overrides = {}) => ({
  category: [],
  country: [],
  city: [],
  region: [],
  workmode: [],
  employmenttype: [],
  department: [],
  ...overrides,
});

describe('Job Opportunities', () => {
  it('keeps populated country and city filter values', () => {
    const job = normalizeJobListingItem({
      region: 'Europe',
      country: ' Switzerland ',
      city: ' Etoy ',
      workmode: 'On-site',
      employmenttype: 'Full-time',
      department: 'Research',
    });

    expect(job.country).to.equal('Switzerland');
    expect(job.city).to.equal('Etoy');
    expect(getUniqueFilterValues([job], 'country')).to.deep.equal(['Switzerland']);
    expect(getUniqueFilterValues([job], 'city')).to.deep.equal(['Etoy']);
  });

  it('treats empty, placeholder, and leaked label country/city values as missing', () => {
    const jobs = [
      normalizeJobListingItem({
        region: 'Middle East',
        country: '',
        city: '',
        workmode: 'Remote',
        employmenttype: 'Full-time',
      }),
      normalizeJobListingItem({
        region: 'Middle East',
        country: 'City',
        city: 'WorkMode',
        workmode: 'Remote',
        employmenttype: 'Full-time',
      }),
      normalizeJobListingItem({
        region: 'Middle East',
        country: 'undefined',
        city: 'null',
        workmode: 'Remote',
        employmenttype: 'Full-time',
      }),
    ];

    expect(jobs.every((job) => job.country === '')).to.be.true;
    expect(jobs.every((job) => job.city === '')).to.be.true;
    expect(getUniqueFilterValues(jobs, 'country')).to.deep.equal([]);
    expect(getUniqueFilterValues(jobs, 'city')).to.deep.equal([]);
    expect(getUniqueFilterValues(jobs, 'workmode')).to.deep.equal(['Remote']);
  });

  it('supports jobs with only country or only city populated', () => {
    const countryOnly = normalizeJobListingItem({
      country: 'Japan',
      city: '',
    });
    const cityOnly = normalizeJobListingItem({
      country: '',
      city: 'Tokyo',
    });

    expect(getUniqueFilterValues([countryOnly, cityOnly], 'country')).to.deep.equal(['Japan']);
    expect(getUniqueFilterValues([countryOnly, cityOnly], 'city')).to.deep.equal(['Tokyo']);
  });

  it('keeps remote jobs with empty geography visible unless geography filters are selected', () => {
    const remoteJob = normalizeJobListingItem({
      region: 'Middle East',
      country: '',
      city: '',
      workmode: 'Remote',
      employmenttype: 'Full-time',
      department: 'Sales',
    });

    expect(jobMatchesSelectedFilters(remoteJob, selectedFilters())).to.be.true;
    expect(jobMatchesSelectedFilters(remoteJob, selectedFilters({ workmode: ['Remote'] }))).to.be.true;
    expect(jobMatchesSelectedFilters(remoteJob, selectedFilters({ country: ['Switzerland'] }))).to.be.false;
    expect(jobMatchesSelectedFilters(remoteJob, selectedFilters({ city: ['Etoy'] }))).to.be.false;
  });

  it('does not treat numeric zero or string zero as real filter values', () => {
    expect(normalizeJobFilterValue(0)).to.equal('');
    expect(normalizeJobFilterValue('0')).to.equal('');
  });
});
