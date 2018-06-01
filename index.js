module.exports = (robot) => {
  // Your code here
  robot.log('Yay, the app was loaded!')

  // For more information on building apps:
  // https://probot.github.io/docs/

  robot.on(['installation.created'], async context => {
    robot.log.debug('Installation event!')

    const action = context.payload.action

    robot.log.debug(action)
    robot.log.debug(context.payload.installation.repository_selection)
    robot.log.debug(context.payload.repositories)
  })

  robot.on(['integration_installation.created'], async context => {
    robot.log.debug('integration_installation event!')
    robot.log(context.payload.repositories)
    robot.log(context.payload.installation.repository_selection)
  })

// To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/

  robot.on(['issues.opened', 'issues.edited', 'issue_comment.created', 'issue_comment.deleted'], async context => {
    // An issue was just opened.
    robot.log('Got an event!')
    robot.log(context)
  })

  robot.on(['status'], async context => {
    // An issue was just opened.
    robot.log('Got an event!')
    robot.log(context)
  })

}
