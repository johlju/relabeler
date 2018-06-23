// GraphQL query to get Node id for any resource, which is needed for mutations
const getResource = `
  query getResource($url: URI!) {
    resource(url: $url) {
      ... on Node {
        id
      }
    }
  }
`

// GraphQL query to add a comment
const addComment = `
  mutation comment($id: ID!, $body: String!) {
    addComment(input: {subjectId: $id, body: $body}) {
      clientMutationId
    }
  }
`

module.exports = (robot) => {
  // Your code here
  robot.log.debug('Yay, the app was loaded!')

  // For more information on building apps:
  // https://probot.github.io/docs/

  robot.on(['installation.created'], async context => {
    const action = context.payload.action
    robot.log.debug('installation event! Action: %s', action)

    robot.log.debug(context.payload.installation.repository_selection)
    robot.log.debug(context.payload.repositories)
  })

  robot.on(['integration_installation.created'], async context => {
    const action = context.payload.action
    robot.log.debug('integration_installation event! Action: %s', action)

    robot.log.debug(context.payload.installation.repository_selection)
    robot.log.debug(context.payload.repositories)
  })

  // 'pull_request.labeled', 'pull_request.unlabeled' (must handle state === 'open')
  // pull_request.synchronize, 'pull_request.reopened', 'pull_request.edited'
  robot.on(['pull_request.opened'], async context => {
    if (context.payload.pull_request.state === 'open') {
      const config = await loadConfig(context)
      robot.log.debug('Configuration: %s', JSON.stringify(config))

      const action = context.payload.action
      robot.log.debug('pull_request event! Action: %s', action)

      const isBot = context.isBot
      robot.log.debug('pull_request action was bot: %s', isBot)

      // https://developer.github.com/v4/reference/enum/commentauthorassociation/
      // "author_association": "NONE","OWNER",
      robot.log.debug('Association: %s', context.payload.pull_request.author_association)

      // https://developer.github.com/changes/2018-05-30-end-jean-grey-preview/
      // robot.log.debug('Global node ID: %s', context.payload.node_id)

      if (config.perform) {
        context.github.issues.createComment(context.issue({ body: 'hej' }))
      } else {
        robot.log.debug('dry-run: Would have written a comment to PR #%s', context.payload.number)
      }

      const label = 'needs review'

      if (config.perform) {
        context.github.issues.addLabels(context.issue({ labels: [label] }))
      } else {
        robot.log.debug('dry-run: Would have labeled PR #%s with a label \'%s\'', context.payload.number, label)
      }
    } else {
      robot.log.debug('Will not do any actions on closed pull request #%s.', context.payload.pull_request.number)
    }
  })

  robot.on(['pull_request.closed'], async context => {
    const config = await loadConfig(context)
    robot.log.debug('Configuration: %s', JSON.stringify(config))

    const action = context.payload.action
    robot.log.debug('pull_request event! Action: %s', action)

    const isBot = context.isBot
    robot.log.debug('pull_request action was bot: %s', isBot)

    // https://developer.github.com/v4/reference/enum/commentauthorassociation/
    // "author_association": "NONE","OWNER",
    robot.log.debug('Association: %s', context.payload.pull_request.author_association)

    // https://developer.github.com/changes/2018-05-30-end-jean-grey-preview/
    // robot.log.debug('Global node ID: %s', context.payload.node_id)

    if (config.perform) {
      // context.github.issues.createComment(context.issue({body: 'hej'}))
    } else {
      robot.log.debug('dry-run: Would have written a comment to PR #%s', context.payload.number)
    }

    const label = 'needs review'

    if (config.perform) {
      // context.github.issues.addLabels(context.issue({labels: [label]}))
    } else {
      robot.log.debug('dry-run: Would have labeled PR #%s with a label \'%s\'', context.payload.number, label)
    }
  })

  // 'issues.edited', 'issue_comment.deleted'
  robot.on(['issue_comment.created'], async context => {
    // TODO: only on opened PR's.
    if (context.payload.issue.state === 'open' && context.isBot === false) {
      // An issue was just opened.
      const action = context.payload.action
      robot.log.debug('issues event! Action: %s', action)

      robot.log.trace(context)

      // https://probot.github.io/docs/github-api/#graphql-api
      // Get the node id of the issue
      const { resource } = await context.github.query(getResource, {
        url: context.payload.issue.html_url
      })

      // Post a comment on the issue
      await context.github.query(addComment, {
        id: resource.id,
        body: 'Thanks for commenting on an issue!'
      })
    } else {
      robot.log.debug('Will not do any actions on closed issue or pull request (number #%s).', context.payload.issue.number)
    }
  })

  robot.on(['issues.opened'], async context => {
    // TODO: only on opened PR's.
    if (context.payload.issue.state === 'open') {
      // An issue was just opened.
      const action = context.payload.action
      robot.log.debug('issues event! Action: %s', action)

      const isBot = context.isBot
      robot.log.debug('issues action was bot: %s', isBot)

      robot.log.trace(context)

      // https://probot.github.io/docs/github-api/#graphql-api
      // Get the node id of the issue
      const { resource } = await context.github.query(getResource, {
        url: context.payload.issue.html_url
      })

      // Post a comment on the issue
      await context.github.query(addComment, {
        id: resource.id,
        body: 'Thanks for submitting an issue!'
      })
    } else {
      robot.log.debug('Will not do any actions on closed issue or pull request (number #%s).', context.payload.issue.number)
    }
  })

  robot.on(['status'], async context => {
    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    const isBot = context.isBot
    robot.log.debug('status action was bot: %s', isBot)

    // An issue was just opened.
    robot.log.debug('status event!')
    robot.log.trace(context)
  })

  async function loadConfig (context) {
    const repositoryConfig = await context.config('relabeler.yml')

    let config

    if (!repositoryConfig) {
      // Do not activate - do dry-run
      config = {
        perform: false
      }
    } else {
      config = {
        perform: true,
        ...repositoryConfig
      }
    }

    console.log(config)

    return config
  }
}
