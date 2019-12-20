import * as core from '@actions/core'
import * as github from '@actions/github'
import { WebhookPayload } from '@actions/github/lib/interfaces'

type Labels = string[]
type Reviewers = string[]

type Config = {
    token: string
    labels: Labels
    reviewers: Reviewers
    remove: boolean
}

type OriginalLabel = {
    name: string
}

type RequestedReviewers = {
    login: string
}

type Result = {
    type: string
    skipped: boolean
    url: string
}

const defaultRemove:boolean = false

const EmptyResult: Result = {
    type: "",
    skipped: true,
    url: ""
}

function getConfig():Config {
    let token: string = core.getInput('token')
    let labelString: string = core.getInput('labels')
    let reviewerString: string = core.getInput('reviewers')
    let remove:boolean = toBoolean(core.getInput('remove-when-no-label')) || defaultRemove
    let label: Labels = JSON.parse(labelString) as Labels
    let reviewer: Reviewers = JSON.parse(reviewerString) as Reviewers
    let conf: Config = {
        token: token,
        labels: label,
        reviewers: reviewer,
        remove: remove
    }
    return conf
}

function toBoolean (bool: string) {
    return bool.toLowerCase() === 'true';
}

function getLabels():Labels {
    let pullRequest = github.context.payload.pull_request
    if (pullRequest == undefined) {
        return []
    } else {
        let bareLabels = pullRequest.labels as Array<OriginalLabel>
        let labels = bareLabels.map(
            label => label.name
        )
        return labels
    }
}

function getActionLabel():string{
    let payload = github.context.payload
    let action = payload.action
    if ( action != "labeled" ) {
        return ""
    }
    return payload.label.name
}

function executable(needLabel:Labels,actionLabel:string):boolean {
    if (needLabel.indexOf(actionLabel) != -1) {
        return true
    } else {
        return false
    }
}

function assignable(needLabel:Labels,currentLabel:Labels):boolean {
    let filterdLabel: Labels = needLabel.filter(
        label => currentLabel.indexOf(label) != -1
    )
    if ( filterdLabel.length == needLabel.length ){
        return true
    } else {
        return false
    }
}

async function assginReviewers(conf: Config):Promise<Result> {
    let payload = github.context.payload
    let pullRequest = payload.pull_request 
    let repository = payload.repository
    if ( pullRequest == undefined || repository == undefined ) {
        return EmptyResult
    }
    let currentReviewers = getCurrentReviewers(payload)
    let prOwner = pullRequest.user.login
    let filterdOwnerReviewers:Reviewers = filterOwner(conf.reviewers, prOwner)
    let reviewers = filterExist(filterdOwnerReviewers, currentReviewers)
    let url = getHtmlUrl(payload)

    if (reviewers.length != 0) {
        let client = new github.GitHub(conf.token)
        let repoOwner = repository.owner.login
        let pullNumber = pullRequest.number
        let repo = repository.name
        await client.pulls.createReviewRequest({
            owner: repoOwner,
            repo: repo,
            pull_number: pullNumber,
            reviewers: reviewers
        }).catch(
            e => core.setFailed(e.message)
        )
        let result: Result = {
            type: "assign",
            skipped: false,
            url: url
        } 
        return result
    }
    let result: Result = {
        type: "assign",
        skipped: true,
        url: url
    } 
    return result
}

async function removeReviewers(conf: Config):Promise<Result> {
    let payload = github.context.payload
    let pullRequest = payload.pull_request 
    let repository = payload.repository
    if ( pullRequest == undefined || repository == undefined ) {
        return EmptyResult
    }
    let currentReviewers = getCurrentReviewers(payload)
    let url = getHtmlUrl(payload)

    if ( currentReviewers.length != 0 ) {
        let client = new github.GitHub(conf.token)
        let owner = repository.owner.login
        let pullNumber = pullRequest.number
        let repo = repository.name
        await client.pulls.deleteReviewRequest({
            owner: owner,
            pull_number: pullNumber,
            repo: repo,
            reviewers: currentReviewers
        }).catch(
            e => core.setFailed(e.message)
        )
        let result: Result = {
            type: "remove",
            skipped: false,
            url: url
        } 
        return result
    }
    let result: Result = {
        type: "remove",
        skipped: true,
        url: url
    } 
    return result
}

function getCurrentReviewers(payload: WebhookPayload):Reviewers {
    if (payload.pull_request == undefined) {
        return []
    }
    let bareCurrentReviewers = payload.pull_request.requested_reviewers as Array<RequestedReviewers>
    let currentReviewers: Reviewers = bareCurrentReviewers.map(
        exist => exist.login
    )
    return  currentReviewers
}

function getHtmlUrl(payload: WebhookPayload):string {
    if ( payload.pull_request == undefined ) {
        return ""
    }
    if (payload.pull_request.html_url == undefined) {
        return ""
    }
    return payload.pull_request.html_url
}

function filterOwner(reviewers: Reviewers, owner: string):Reviewers {
    let filtered: Reviewers = reviewers.filter(
        reviewer => reviewer != owner
    )
    return filtered
}

function filterExist(reviewers: Reviewers, exist: Reviewers):Reviewers {
    let filtered: Reviewers = reviewers.filter(
        reviewer => exist.indexOf(reviewer) == -1
    )
    return filtered
}

function setOutput(result:Result) {
    core.setOutput("type",result.type)
    core.setOutput("url",result.url)
    core.setOutput("skipped",result.skipped.toString())
}

const conf = getConfig()
const labels = getLabels()
const actionLabel = getActionLabel()
if ( executable(conf.labels, actionLabel) && assignable(conf.labels, labels) ) {
    const result:Promise<Result> = assginReviewers(conf)
    result.then(function(res){
        setOutput(res)
    })
} else {
    if ( conf.remove ) {
        const result:Promise<Result> = removeReviewers(conf)
        result.then(function(res){
            setOutput(res)
        })
    } else {
        setOutput(EmptyResult)
    }
}
