# Token Price Service Challenge

This project contains a Node.js/TypeScript/Nest.js application that implements a Token Price Service with intentional
anti-patterns and bugs for educational purposes.

## Challenge Overview

The candidate's task is to identify and fix the anti-patterns and bugs in the codebase. The application is a token price
service that:

1. Maintains information about various tokens (ETH, BTC, SOL, etc.) in a PostgreSQL database
2. Periodically updates token prices using a mock price service
3. Sends price change messages to Kafka before saving to the database

## What expected from you

1. Identify the issues in the codebase
2. Refactor the code to fix the issues
3. Explain your reasoning for each change
4. Demonstrate improved code quality and reliability

## Evaluation Criteria

1. Your ability to identify anti-patterns and bugs
2. The quality of your solutions
3. Your understanding of Node.js, TypeScript, and Nest.js best practices
4. Your ability to explain your reasoning
5. The overall improvement in code quality and reliability
