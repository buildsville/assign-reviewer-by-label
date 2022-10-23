"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = require("@actions/core");
const github = require("@actions/github");
const defaultRemove = false;
const EmptyResult = {
    type: "",
    skipped: true,
    url: ""
};
function getConfig() {
    let token = core.getInput('token');
    let labelString = core.getInput('labels');
    let reviewerString = core.getInput('reviewers');
    let remove = toBoolean(core.getInput('remove-when-no-label')) || defaultRemove;
    let label = JSON.parse(labelString);
    let reviewer = JSON.parse(reviewerString);
    let conf = {
        token: token,
        labels: label,
        reviewers: reviewer,
        remove: remove
    };
    return conf;
}
function toBoolean(bool) {
    return bool.toLowerCase() === 'true';
}
function getLabels() {
    let pullRequest = github.context.payload.pull_request;
    if (pullRequest == undefined) {
        return [];
    }
    else {
        let bareLabels = pullRequest.labels;
        let labels = bareLabels.map(label => label.name);
        return labels;
    }
}
function getActionLabel() {
    let payload = github.context.payload;
    let action = payload.action;
    if (action != "labeled") {
        return "";
    }
    return payload.label.name;
}
function executable(needLabel, actionLabel) {
    if (needLabel.indexOf(actionLabel) != -1) {
        return true;
    }
    else {
        return false;
    }
}
function assignable(needLabel, currentLabel) {
    let filterdLabel = needLabel.filter(label => currentLabel.indexOf(label) != -1);
    if (filterdLabel.length == needLabel.length) {
        return true;
    }
    else {
        return false;
    }
}
function assginReviewers(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload = github.context.payload;
        let pullRequest = payload.pull_request;
        let repository = payload.repository;
        if (pullRequest == undefined || repository == undefined) {
            return EmptyResult;
        }
        let currentReviewers = getCurrentReviewers(payload);
        let prOwner = pullRequest.user.login;
        let filterdOwnerReviewers = filterOwner(conf.reviewers, prOwner);
        let reviewers = filterExist(filterdOwnerReviewers, currentReviewers);
        let url = getHtmlUrl(payload);
        if (reviewers.length != 0) {
            let client = github.getOctokit(core.getInput('token'));
            let repoOwner = repository.owner.login;
            let pullNumber = pullRequest.number;
            let repo = repository.name;
            yield client.rest.pulls.requestReviewers({
                owner: repoOwner,
                repo: repo,
                pull_number: pullNumber,
                reviewers: reviewers
            }).catch(e => core.setFailed(e.message));
            let result = {
                type: "assign",
                skipped: false,
                url: url
            };
            return result;
        }
        let result = {
            type: "assign",
            skipped: true,
            url: url
        };
        return result;
    });
}
function removeReviewers(conf) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload = github.context.payload;
        let pullRequest = payload.pull_request;
        let repository = payload.repository;
        if (pullRequest == undefined || repository == undefined) {
            return EmptyResult;
        }
        let currentReviewers = getCurrentReviewers(payload);
        let url = getHtmlUrl(payload);
        if (currentReviewers.length != 0) {
            let client = github.getOctokit(conf.token);
            let owner = repository.owner.login;
            let pullNumber = pullRequest.number;
            let repo = repository.name;
            yield client.rest.pulls.removeRequestedReviewers({
                owner: owner,
                pull_number: pullNumber,
                repo: repo,
                reviewers: currentReviewers
            }).catch(e => core.setFailed(e.message));
            let result = {
                type: "remove",
                skipped: false,
                url: url
            };
            return result;
        }
        let result = {
            type: "remove",
            skipped: true,
            url: url
        };
        return result;
    });
}
function getCurrentReviewers(payload) {
    if (payload.pull_request == undefined) {
        return [];
    }
    let bareCurrentReviewers = payload.pull_request.requested_reviewers;
    let currentReviewers = bareCurrentReviewers.map(exist => exist.login);
    return currentReviewers;
}
function getHtmlUrl(payload) {
    if (payload.pull_request == undefined) {
        return "";
    }
    if (payload.pull_request.html_url == undefined) {
        return "";
    }
    return payload.pull_request.html_url;
}
function filterOwner(reviewers, owner) {
    let filtered = reviewers.filter(reviewer => reviewer != owner);
    return filtered;
}
function filterExist(reviewers, exist) {
    let filtered = reviewers.filter(reviewer => exist.indexOf(reviewer) == -1);
    return filtered;
}
function setOutput(result) {
    core.setOutput("type", result.type);
    core.setOutput("url", result.url);
    core.setOutput("skipped", result.skipped.toString());
}
const conf = getConfig();
const labels = getLabels();
const actionLabel = getActionLabel();
if (executable(conf.labels, actionLabel) && assignable(conf.labels, labels)) {
    const result = assginReviewers(conf);
    result.then(function (res) {
        setOutput(res);
    });
}
else {
    if (conf.remove) {
        const result = removeReviewers(conf);
        result.then(function (res) {
            setOutput(res);
        });
    }
    else {
        setOutput(EmptyResult);
    }
}
