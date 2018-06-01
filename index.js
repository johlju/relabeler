module.exports = (robot) => {
  // Your code here
  robot.log.debug('Yay, the app was loaded!')

  // For more information on building apps:
  // https://probot.github.io/docs/

  robot.on(['installation.created'], async context => {
    robot.log.debug('installation event!')

    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    robot.log.debug(context.payload.installation.repository_selection)
    robot.log.debug(context.payload.repositories)
  })

  robot.on(['integration_installation.created'], async context => {
    robot.log.debug('integration_installation event!')

    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    robot.log.debug(context.payload.installation.repository_selection)
    robot.log.debug(context.payload.repositories)
  })

  robot.on(['pull_request.opened', 'pull_request.closed'], async context => {
      robot.log.debug('pull_request event!')
    // https://developer.github.com/v4/reference/enum/commentauthorassociation/
    // "author_association": "NONE","OWNER",

    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    // An issue was just opened.
    robot.log.debug('Association: %s', context.payload.pull_request.author_association)

  })
  robot.on(['issues.opened', 'issues.edited', 'issue_comment.created', 'issue_comment.deleted'], async context => {
    // An issue was just opened.
    robot.log.debug('issues event!')

    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    //robot.log.debug(context)

  })

  robot.on(['status'], async context => {
    const action = context.payload.action
    robot.log.debug('Action: %s', action)

    // An issue was just opened.
    robot.log.debug('status event!')
    // robot.log.debug(context)
  })

}
