package main

import (
	"fmt"
	"os"
)

const version = "0.5.1"

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "init":
		cmdInit(os.Args[2:])
	case "inbox":
		cmdInbox(os.Args[2:])
	case "send":
		cmdSend(os.Args[2:])
	case "watch":
		cmdWatch(os.Args[2:])
	case "version", "--version", "-v":
		fmt.Printf("aurum-agent v%s\n", version)
	case "help", "--help", "-h":
		printUsage()
	default:
		fatalf("unknown command: %s\nRun 'aurum-agent help' for usage.", os.Args[1])
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "error: "+format+"\n", args...)
	os.Exit(1)
}

func printUsage() {
	fmt.Printf(`aurum-agent v%s — CLI for Aurum agent messaging

Usage:
  aurum-agent init   --address <addr> --key <api-key>    configure credentials
  aurum-agent inbox  [--since 2h] [--limit 50] [--json]  read inbox
  aurum-agent send   --to <email> --subject <text>        send a message
  aurum-agent watch  [--interval 30] [--json]             poll for new messages
  aurum-agent version                                      show version

Configuration (~/.aurum.json or env vars):
  AURUM_ADDRESS   agent address (e.g. monia.rafael@air7.fun)
  AURUM_API_KEY   API key from https://aurum.air7.fun/dashboard
  AURUM_API_URL   override API base URL

Examples:
  aurum-agent init --address monia.rafael@air7.fun --key ak_xxx
  aurum-agent inbox --since 1h --json
  aurum-agent send --to user@example.com --subject "Hello" --body "Hi there"
  echo "body" | aurum-agent send --to user@example.com --subject "Hi"
  aurum-agent watch --interval 60 --json | jq .

Install:
  curl -fsSL https://aurum.air7.fun/cli | sh
`, version)
}
