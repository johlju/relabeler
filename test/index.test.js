// Just used to Describe (What), Context (When), It (Should)
const context = describe

const fs = require('fs')
const expect = require('expect')
const path = require('path')

// Requiring probot allows us to mock out a app instance
const { Application } = require('probot')

// Requiring our app
const relabeler = require('..')

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

const {daysUntilClose, pulls, logger = console} = testConfig
const {only} = testConfig.pulls
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
  let app
  let github
  let configData

  beforeEach(() => {
    // Here we create an `Application` instance
    app = new Application()

    // Here we initialize the app
    app.load(relabeler)

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
        // getContent: jest.fn().mockReturnValue(Promise.resolve(configData))
        getContent: jest.fn().mockReturnValue(Promise.resolve(configData))
      }
    }

    // Passes the mocked out GitHub API into out app instance
    app.auth = () => Promise.resolve(github)
  })

  context('When pull request is opened', () => {
    context('When executing', () => {
      beforeAll(() => {
        let repositoryYamlConfig = readMockConfig('onPullRequestOpen.yml')

        // This is used by the GitHub API mock github.repos.getContent.
        configData = {
          data: {
            // This must be encoded in base64
            content: Buffer.from(repositoryYamlConfig).toString('base64')
          }
        }
      })

      it('Should set the correct label', async () => {
        await app.receive({
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
        await app.receive({
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
        // This is used by the GitHub API mock github.repos.getContent.
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
        await app.receive({
          name: 'pull_request.opened',
          payload: payload.pullRequest.openedAsOwner
        })

        expect(github.issues.addLabels).not.toHaveBeenCalled()
      })

      it('Should not write correct comment', async () => {
        await app.receive({
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
