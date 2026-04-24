# Multi-CLI Integration Direction

## Goal

Support custom third-party API extraction while allowing multiple CLIs and tools to integrate through their native extension mechanisms.

## Architecture Rule

- external integrations may remain heterogeneous
- internal event processing should remain unified
- extraction should remain on the custom API path unless code explicitly reintroduces another runtime

## Integration categories

- hook-based hosts
- transcript-based hosts
- plugin-based hosts
- MCP-based compatibility hosts

## Internal invariants

All integrations should converge on:
- stable session identity
- stable platform source labeling
- shared worker session lifecycle routes
- shared observation storage semantics
- shared summary generation path

## Near-term implementation priority

1. keep `CustomApiAgent` as the main extraction path
2. avoid reintroducing provider-specific runtime forks
3. document host-native integration boundaries clearly
4. only unify external commands where it improves usability without hiding host differences
