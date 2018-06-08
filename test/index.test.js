// Just used to Describe (What), Context (When), It (Should)
const context = describe

const fs = require('fs');
const expect = require('expect')

// Requiring probot allows us to mock out a robot instance
const { createRobot } = require('probot')
// Requiring our app
const app = require('..')

function readMockConfig (fileName) {
  let config

  try {
    config = fs.readFileSync(__dirname + '/configs/' + fileName, 'utf8')
    //console.log(repoConfig)
  } catch (e) {
    console.log(e)
  }

  return config
}

// You can import your modules
// const index = require('../index')

// Create a fixtures folder in your test folder
// Then put any larger testing payloads in there
const payload = {
  pullRequest: {
    openedAsOwner: require('./fixtures/pull_request.opened.owner'),
    openedAsFirstTimer: require('./fixtures/pull_request.opened.first_timer')
  }
}

describe('relabeler', () => {
  let robot
  let github
  let configData

  beforeEach(() => {
    // Here we create a robot instance
    robot = createRobot()

    // Here we initialize the app on the robot instance
    app(robot)

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

    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github)
  })

  context('When pull request is opened', () => {
    context('When executing', () => {
      beforeAll(() => {
        let repoYamlConfig = readMockConfig('onPullRequestOpen.yml')

        configData = {
          data: {
            // This must be encoded in base64
            content: Buffer.from(repoYamlConfig).toString('base64')
          }
        }
      })

      it('Should set the correct label', async () => {
        await robot.receive(payload.pullRequest.openedAsOwner)
        expect(github.issues.addLabels).toHaveBeenCalledWith({
          labels: ['needs review'],
          number: 11,
          owner: 'johlju',
          repo: 'DebugApps'
        })
      })

      it('Should write correct comment', async () => {
        await robot.receive(payload.pullRequest.openedAsOwner)
        expect(github.issues.createComment).toHaveBeenCalledWith({
          body: 'hej',
          number: 11,
          owner: 'johlju',
          repo: 'DebugApps'
        })
      })
    })

    context('When on dry-run', () => {
      beforeAll(() => {
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
        await robot.receive(payload.pullRequest.openedAsOwner)

        expect(github.issues.addLabels).not.toHaveBeenCalled()
      })

      it('Should not write correct comment', async () => {
        await robot.receive(payload.pullRequest.openedAsOwner)

        expect(github.issues.createComment).not.toHaveBeenCalled()
      })
    })
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
