# Common Codecov Query Patterns

## Repository Coverage
```
"What's the overall coverage for owner/repo?"
"Show me coverage trends for owner/repo on main branch"
```

## File-Level Coverage
```
"Get coverage for src/index.ts in owner/repo"
"Which lines are uncovered in src/utils/helper.ts?"
```

## Commit Analysis
```
"Show coverage for commit abc123 in owner/repo"
"How did coverage change in the latest commit?"
```

## Pull Request Coverage
```
"What's the coverage impact of PR #123?"
"Show me which files lost coverage in PR #456"
```

## Comparative Analysis
```
"Compare coverage between main and feature-branch"
"Find files with coverage below 80% in owner/repo"
```

## Performance Tips

- **Use caching**: Default cache settings reduce API calls by 30-70%
- **Batch queries**: Ask multiple questions about the same commit/PR
- **Branch-specific queries**: Specify branches for faster lookups
