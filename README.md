# Assign Reviewer by Labels

This action assigns reviewers when the specified labels applied to pull request.  
Also, review request is cancelled when the specified labels are removed.

## Inputs

### token (required)

Usually set ${{ secret.GITHUB_TOKEN }}.  
Or set your personal access token.

### labels (required)

Labels as trigger when you want to assign reviewers.  
If multiple settings, triggers when all labels applied.  
When these labels removed, review request is cancelled.  
You should set JSON string.  
ex) `'[ "WFR", "ASAP" ]'`

### reviewers (required)

Reviewers you want to assign.  
If multiple settings, everyone is assigned.  
You should set JSON string.  
ex) `'[ "cat", "neko", "nyan" ]'`

## Outputs

### type

When reviewers are assgined, this value set `assign`.  
When review request is cancelled, this value set `remove`.

### skipped

If action was triggered but the reviewers did not change, this value set `true`.  
Otherwise, this value set `false`.

### url

HTML url for pull request.

## Example usage

```
name: assign reviewer by labels
on:
  pull_request:
    types:
      - unlabeled
      - labeled

jobs:
  assign_and_remove_job:
    runs-on: ubuntu-latest
    name: assign and remove
    steps:
      - name: Checkout
        uses: actions/checkout@v1
      - name: main
        id: reviewer
        uses: ./ # TODO
        with:
          token: "${{secrets.BOT_SECRET}}"
          labels: '["WFR"]'
          reviewers: '["buildsville","oder-bot"]'
      - name: output done
        if: steps.reviewer.outputs.skipped == 'false'
        run: |
          echo "process done"
          echo "type: ${{ steps.reviewer.outputs.type }}"
          echo "url: ${{ steps.reviewer.outputs.url }}"
      - name: output skipped
        if: steps.reviewer.outputs.skipped == 'true'
        run: |
          echo "process skipped"
          echo "type: ${{ steps.reviewer.outputs.type }}"
          echo "url: ${{ steps.reviewer.outputs.url }}"

```
