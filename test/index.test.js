const nock = require('nock')

const expect = require('expect')

const fs = require('fs')
const path = require('path')

// Requiring probot allows us to mock out a app instance
const { Probot } = require('probot')

// Requiring our app implementation
const relabeler = require('..')

// Just used to Describe (What), Context (When), It (Should)
const context = describe

function readMockConfig (fileName) {
  let config

  try {
    const filePath = path.resolve(__dirname, 'configs', fileName)

    config = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.log(e)
  }

  return config
}

const testConfig = {
  pulls: {
    daysUntilClose: false,
    only: 'pulls'
  }
}

const { daysUntilClose, pulls, logger = console } = testConfig
const { only } = testConfig.pulls
console.log('testConfig.pulls.daysUntilClose', testConfig.pulls.daysUntilClose)
console.log('daysUntilClose', daysUntilClose)
console.log('only', only)
console.log('pulls', pulls)

if (daysUntilClose) {
  console.warn('CLOSE!!')
} else {
  logger.warn('DO NOT CLOSE!!')
}

console.log(testConfig)
// You can import your modules
// const index = require('../index')

console.log('env.dry_run', process.env.DRY_RUN)

// Create a fixtures folder in your test folder, then put any larger testing
// payloads in there.
const payload = {
  pullRequest: {
    openedAsOwner: require('./fixtures/pull_request.opened.owner'),
    openedAsFirstTimer: require('./fixtures/pull_request.opened.first_timer')
  }
}

describe('relabeler', () => {
  let probot
  let github
  let configData

  beforeEach(() => {
    // Here we create a Probot instance
    probot = new Probot({})

    // Load our app into probot
    const app = probot.load(relabeler)

    // just return a test token (för nock test "creates a passing check")
    app.app = () => 'test'

    // This is an easy way to mock out the GitHub API
    // mocks context.github*
    github = {
      issues: {
        createComment: jest.fn().mockReturnValue(Promise.resolve({
          // Whatever the GitHub API should return
        })),
        addLabels: jest.fn().mockReturnValue(Promise.resolve({
          // Whatever the GitHub API should return
        }))
      },
      repos: {
        // This is to mock that a config is loaded.
        // await context.config('relabeler.yml') is reding the key getContent.
        //
        // configData is set in the beforeAll()-block in each context.
        // getContents: jest.fn().mockReturnValue(Promise.resolve(configData))
        getContents: jest.fn().mockReturnValue(Promise.resolve(configData))
      }
    }

    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  test('creates a passing check', async () => {
    // Test that we correctly return a test token
    nock('https://api.github.com')
      .post('/app/installations/2/access_tokens')
      .reply(200, { token: 'test' })

    // // Test that a commented is posted
    // nock('https://api.github.com')
    //   .post('/repos/hiimbex/testing-things/issues/1/comments', (body) => {
    //     expect(body).toMatchObject(issueCreatedBody)
    //     return true
    //   })
    //   .reply(200)

    // // Receive a webhook event
    // await probot.receive({ name: 'issues', payload })
  })

  context('When pull request is opened', () => {
    context('When executing', () => {
      beforeAll(() => {
        const repositoryYamlConfig = readMockConfig('onPullRequestOpen.yml')

        // This is used by the GitHub API mock github.repos.getContents.
        configData = {
          data: {
            // This must be encoded in base64
            content: Buffer.from(repositoryYamlConfig).toString('base64')
          }
        }
      })

      it('Should set the correct label', async () => {
        await probot.receive({
          name: 'pull_request.opened',
          payload: payload.pullRequest.openedAsOwner
        })

        expect(github.issues.addLabels).toHaveBeenCalledWith({
          labels: ['needs review'],
          number: 11,
          owner: 'DummyOwner',
          repo: 'DebugApps'
        })
      })

      it('Should write correct comment', async () => {
        await probot.receive({
          name: 'pull_request.opened',
          payload: payload.pullRequest.openedAsOwner
        })

        expect(github.issues.createComment).toHaveBeenCalledWith({
          body: 'hej',
          number: 11,
          owner: 'DummyOwner',
          repo: 'DebugApps'
        })
      })
    })

    context('When on dry-run', () => {
      beforeAll(() => {
        // This is used by the GitHub API mock github.repos.getContents.
        configData = {
          data: {
            // This must be encoded in base64
            // TODO: There must be away to mock await context.config('relabeler.yml')
            //       instead of mocking that we are returning the below as the
            //       configuration.
            content: Buffer.from('perform: false').toString('base64')
          }
        }
      })

      it('Should not set the correct label', async () => {
        await probot.receive({
          name: 'pull_request.opened',
          payload: payload.pullRequest.openedAsOwner
        })

        expect(github.issues.addLabels).not.toHaveBeenCalled()
      })

      it('Should not write correct comment', async () => {
        await probot.receive({
          name: 'pull_request.opened',
          payload: payload.pullRequest.openedAsOwner
        })

        expect(github.issues.createComment).not.toHaveBeenCalled()
      })
    })
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
