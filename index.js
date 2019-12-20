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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
var defaultRemove = false;
var EmptyResult = {
    type: "",
    skipped: true,
    url: ""
};
function getConfig() {
    var token = core.getInput('token');
    var labelString = core.getInput('labels');
    var reviewerString = core.getInput('reviewers');
    var remove = toBoolean(core.getInput('remove-when-no-label')) || defaultRemove;
    var label = JSON.parse(labelString);
    var reviewer = JSON.parse(reviewerString);
    var conf = {
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
    var pullRequest = github.context.payload.pull_request;
    if (pullRequest == undefined) {
        return [];
    }
    else {
        var bareLabels = pullRequest.labels;
        var labels_1 = bareLabels.map(function (label) { return label.name; });
        return labels_1;
    }
}
function getActionLabel() {
    var payload = github.context.payload;
    var action = payload.action;
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
    var filterdLabel = needLabel.filter(function (label) { return currentLabel.indexOf(label) != -1; });
    if (filterdLabel.length == needLabel.length) {
        return true;
    }
    else {
        return false;
    }
}
function assginReviewers(conf) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, pullRequest, repository, currentReviewers, prOwner, filterdOwnerReviewers, reviewers, url, client, repoOwner, pullNumber, repo, result_1, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = github.context.payload;
                    pullRequest = payload.pull_request;
                    repository = payload.repository;
                    if (pullRequest == undefined || repository == undefined) {
                        return [2 /*return*/, EmptyResult];
                    }
                    currentReviewers = getCurrentReviewers(payload);
                    prOwner = pullRequest.user.login;
                    filterdOwnerReviewers = filterOwner(conf.reviewers, prOwner);
                    reviewers = filterExist(filterdOwnerReviewers, currentReviewers);
                    url = getHtmlUrl(payload);
                    if (!(reviewers.length != 0)) return [3 /*break*/, 2];
                    client = new github.GitHub(conf.token);
                    repoOwner = repository.owner.login;
                    pullNumber = pullRequest.number;
                    repo = repository.name;
                    return [4 /*yield*/, client.pulls.createReviewRequest({
                            owner: repoOwner,
                            repo: repo,
                            pull_number: pullNumber,
                            reviewers: reviewers
                        })["catch"](function (e) { return core.setFailed(e.message); })];
                case 1:
                    _a.sent();
                    result_1 = {
                        type: "assign",
                        skipped: false,
                        url: url
                    };
                    return [2 /*return*/, result_1];
                case 2:
                    result = {
                        type: "assign",
                        skipped: true,
                        url: url
                    };
                    return [2 /*return*/, result];
            }
        });
    });
}
function removeReviewers(conf) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, pullRequest, repository, currentReviewers, url, client, owner, pullNumber, repo, result_2, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = github.context.payload;
                    pullRequest = payload.pull_request;
                    repository = payload.repository;
                    if (pullRequest == undefined || repository == undefined) {
                        return [2 /*return*/, EmptyResult];
                    }
                    currentReviewers = getCurrentReviewers(payload);
                    url = getHtmlUrl(payload);
                    if (!(currentReviewers.length != 0)) return [3 /*break*/, 2];
                    client = new github.GitHub(conf.token);
                    owner = repository.owner.login;
                    pullNumber = pullRequest.number;
                    repo = repository.name;
                    return [4 /*yield*/, client.pulls.deleteReviewRequest({
                            owner: owner,
                            pull_number: pullNumber,
                            repo: repo,
                            reviewers: currentReviewers
                        })["catch"](function (e) { return core.setFailed(e.message); })];
                case 1:
                    _a.sent();
                    result_2 = {
                        type: "remove",
                        skipped: false,
                        url: url
                    };
                    return [2 /*return*/, result_2];
                case 2:
                    result = {
                        type: "remove",
                        skipped: true,
                        url: url
                    };
                    return [2 /*return*/, result];
            }
        });
    });
}
function getCurrentReviewers(payload) {
    if (payload.pull_request == undefined) {
        return [];
    }
    var bareCurrentReviewers = payload.pull_request.requested_reviewers;
    var currentReviewers = bareCurrentReviewers.map(function (exist) { return exist.login; });
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
    var filtered = reviewers.filter(function (reviewer) { return reviewer != owner; });
    return filtered;
}
function filterExist(reviewers, exist) {
    var filtered = reviewers.filter(function (reviewer) { return exist.indexOf(reviewer) == -1; });
    return filtered;
}
function setOutput(result) {
    core.setOutput("type", result.type);
    core.setOutput("url", result.url);
    core.setOutput("skipped", result.skipped.toString());
}
var conf = getConfig();
var labels = getLabels();
var actionLabel = getActionLabel();
if (executable(conf.labels, actionLabel) && assignable(conf.labels, labels)) {
    var result = assginReviewers(conf);
    result.then(function (res) {
        setOutput(res);
    });
}
else {
    if (conf.remove) {
        var result = removeReviewers(conf);
        result.then(function (res) {
            setOutput(res);
        });
    }
    else {
        setOutput(EmptyResult);
    }
}
