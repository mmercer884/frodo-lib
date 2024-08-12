/**
 * To record and update snapshots, you must perform 4 steps in order:
 *
 * 1. Record API responses & create/update snapshots
 *
 *    This step breaks down into 2 phases:
 *
 *    Phase 1: Record verify and get custom domains tests
 *    Phase 2: Record set custom domains tests
 *
 *    Because custom domain settings is a global singleton, get and set tests interfere
 *    with each other and have to be run in separate phases.
 *
 *    To record and create/update snapshots, you must call the test:record
 *    script and override all the connection state variables required
 *    to connect to the env to record from and also indicate the phase:
 *
 *    THESE TESTS ARE DESTRUCTIVE!!! DO NOT RUN AGAINST AN ENV WITH ACTIVE Custom Domains Settings!!!
 *
 *        FRODO_RECORD_PHASE=1 FRODO_HOST=frodo-dev npm run test:record EnvCustomDomainsApi
 *        FRODO_RECORD_PHASE=2 FRODO_HOST=frodo-dev npm run test:record EnvCustomDomainsApi
 *
 *    The above command assumes that you have a connection profile for
 *    'frodo-dev' on your development machine.
 *
 * 2. Update snapshots
 *
 *    After recording API responses, you must manually update/create snapshots
 *    by running:
 *
 *        FRODO_DEBUG=1 npm run test:update EnvCustomDomainsApi
 *
 * 3. Test your changes
 *
 *    If 1 and 2 didn't produce any errors, you are ready to run the tests in
 *    replay mode and make sure they all succeed as well:
 *
 *        npm run test:only EnvCustomDomainsApi
 *
 * Note: FRODO_DEBUG=1 is optional and enables debug logging for some output
 * in case things don't function as expected
 */
import * as EnvCustomDomainsApi from './EnvCustomDomainsApi';
import { autoSetupPolly } from '../../utils/AutoSetupPolly';
import { filterRecording } from '../../utils/PollyUtils';
import { state } from '../../index';
import { CustomDomains } from './EnvCustomDomainsApi';

const ctx = autoSetupPolly();

async function stageCookieDomains(domains: CustomDomains) {
  try {
    await EnvCustomDomainsApi.setCustomDomains({
      domains,
      state,
    });
  } catch (error) {
    console.debug('error staging custom domains', error);
  }
}

describe('EnvCustomDomainsApi', () => {
  const testDomain1 = 'frodo.mytestrun.com';
  const testDomain2 = 'frodo.mytest.run';
  const testDomain3 = 'frodo.doesnotexist.com';
  const empty: CustomDomains = {
    domains: [],
  };
  const testDomains: CustomDomains = {
    domains: [testDomain1, testDomain2],
  };
  // in recording mode, setup test data before recording
  beforeAll(async () => {
    if (
      process.env.FRODO_POLLY_MODE === 'record' &&
      process.env.FRODO_RECORD_PHASE === '1'
    ) {
      await Promise.allSettled([stageCookieDomains(testDomains)]);
    } else if (
      process.env.FRODO_POLLY_MODE === 'record' &&
      process.env.FRODO_RECORD_PHASE === '2'
    ) {
      await Promise.allSettled([stageCookieDomains(empty)]);
    }
  });
  // in recording mode, remove test data after recording
  afterAll(async () => {
    if (process.env.FRODO_POLLY_MODE === 'record') {
      await Promise.allSettled([stageCookieDomains(empty)]);
    }
  });
  beforeEach(async () => {
    if (process.env.FRODO_POLLY_MODE === 'record') {
      ctx.polly.server.any().on('beforePersist', (_req, recording) => {
        filterRecording(recording);
      });
    }
  });

  // Phase 1 - Get custom domains
  if (
    !process.env.FRODO_POLLY_MODE ||
    (process.env.FRODO_POLLY_MODE === 'record' &&
      process.env.FRODO_RECORD_PHASE === '1')
  ) {
    describe('verifyCNAME()', () => {
      test('0: Method is implemented', async () => {
        expect(EnvCustomDomainsApi.verifyCNAME).toBeDefined();
      });

      test(`1: Verify CNAME for custom domain ${testDomain1} - success`, async () => {
        const response = await EnvCustomDomainsApi.verifyCNAME({
          name: testDomain1,
          state,
        });
        expect(response).toMatchSnapshot();
      });

      test(`1: Verify CNAME for custom domain ${testDomain2} - success`, async () => {
        const response = await EnvCustomDomainsApi.verifyCNAME({
          name: testDomain2,
          state,
        });
        expect(response).toMatchSnapshot();
      });

      test(`1: Verify CNAME for custom domain ${testDomain3} - error`, async () => {
        try {
          await EnvCustomDomainsApi.verifyCNAME({
            name: testDomain3,
            state,
          });
          fail('request should have failed');
        } catch (error) {
          expect(error.response.data).toMatchSnapshot();
        }
      });
    });

    describe('getCustomDomains()', () => {
      test('0: Method is implemented', async () => {
        expect(EnvCustomDomainsApi.getCustomDomains).toBeDefined();
      });

      test('1: Get custom domains - success', async () => {
        const response = await EnvCustomDomainsApi.getCustomDomains({
          state,
        });
        expect(response).toMatchSnapshot();
      });
    });
  }

  // Phase 2 - Set custom domains
  if (
    !process.env.FRODO_POLLY_MODE ||
    (process.env.FRODO_POLLY_MODE === 'record' &&
      process.env.FRODO_RECORD_PHASE === '2')
  ) {
    describe('setCookieDomains()', () => {
      test('0: Method is implemented', async () => {
        expect(EnvCustomDomainsApi.setCustomDomains).toBeDefined();
      });

      test(`1: Set custom domains - success`, async () => {
        const response = await EnvCustomDomainsApi.setCustomDomains({
          domains: testDomains,
          state,
        });
        expect(response).toMatchSnapshot();
      });
    });
  }
});
